// ===================================================
// js/ui-store.js — Store screen, aisles, aisle panel
// ===================================================
Object.assign(UI, {

    // ===== AISLES =====
    renderAisles() {
        const container = document.getElementById('aislesContainer');
        if (!container) return;

        const aisles = API.storeAisles;
        const aislesHtml = aisles.length
            ? aisles.sort((a, b) => a.sortOrder - b.sortOrder).map(a => this.renderAisleCard(a)).join('')
            : `<div class="empty-state"><div class="empty-icon">🏪</div><p>No aisles yet!</p><p class="empty-sub">Tap + Add Aisle below.</p></div>`;

        container.innerHTML = `${aislesHtml}<button class="add-aisle-btn" onclick="UI.showAddAisle()">＋ ${t('addAisle')}</button>`;
        this.initSortable(container);
    },

    renderAisleCard(aisle) {
        const products = aisle.products || [];
        const inListCount = products.filter(name =>
            API.storeItems.some(i => i.name.toLowerCase() === name.toLowerCase() && !i.isChecked)
        ).length;

        return `
            <div class="aisle-card" data-aisle-id="${aisle.id}" onclick="UI.openAislePanel(${aisle.id})">
                <div class="aisle-card-header">
                    <div class="aisle-card-meta">
                        <span class="aisle-card-name">${Utils.escapeHtml(translateAisleName(aisle.name))}</span>
                        <span class="aisle-card-count">${products.length ? t('productsCount', products.length) : t('noProducts')}</span>
                        ${inListCount ? `<span class="aisle-in-list-count">✓ ${inListCount} in list</span>` : ''}
                    </div>
                    <button class="aisle-delete-btn" onclick="event.stopPropagation(); UI.confirmDeleteAisle(${aisle.id})">🗑</button>
                    <span class="aisle-card-arrow">›</span>
                </div>
            </div>`;
    },

    // ===== AISLE PANEL =====
    openAislePanel(aisleId) {
        const aisle = API.storeAisles.find(a => a.id === aisleId);
        if (!aisle) return;

        this.currentAislePanel = aisleId;
        this.lastAislePanel = aisleId;

        document.getElementById('aislePanelTitle').textContent = translateAisleName(aisle.name);
        this.renderAislePanelProducts(aisleId);

        document.getElementById('aislePanelOverlay').classList.add('show');
        document.getElementById('navStoreScreen').classList.add('hidden');
        document.getElementById('navAislePanel').classList.remove('hidden');
    },

    closeAislePanel() {
        this.currentAislePanel = null;
        document.getElementById('aislePanelOverlay').classList.remove('show');
        document.getElementById('navAislePanel').classList.add('hidden');
        document.getElementById('navStoreScreen').classList.remove('hidden');
    },

    renderAislePanelProducts(aisleId) {
        const aisle = API.storeAisles.find(a => a.id === aisleId);
        const container = document.getElementById('aislePanelProducts');
        if (!aisle || !container) return;

        const products = aisle.products || [];
        const favNames = API.storeFavourites.map(f => f.name.toLowerCase());

        const chipsHtml = products.length ? products.map(name => {
            const listItem = API.storeItems.find(i => i.name.toLowerCase() === name.toLowerCase() && !i.isChecked);
            const inList = !!listItem;
            const qty = listItem ? listItem.quantity : 0;
            const isFav = favNames.includes(name.toLowerCase());

            return `
                <div class="panel-chip-wrapper">
                    <button class="chip-fav-btn ${isFav ? 'active' : ''}"
                        onclick="UI.toggleFavourite('${name.replace(/'/g, "\\'")}', ${aisleId}, this)">⭐</button>
                    <div class="panel-chip ${inList ? 'in-list' : ''}"
                        onclick="UI.handlePanelProductTap('${name.replace(/'/g, "\\'")}', ${aisleId}, this)"
                        data-name="${name.replace(/"/g, '&quot;')}">
                        <span class="panel-chip-name">${Utils.escapeHtml(name)}</span>
                        <span class="panel-chip-badge ${inList ? 'in' : 'add'}">${inList ? t('inList') + (qty > 1 ? ' x' + qty : '') : t('add')}</span>
                    </div>
                    <button class="chip-delete-btn" onclick="UI.deleteProduct(${aisleId}, '${name.replace(/'/g, "\\'")}')">🗑</button>
                </div>`;
        }).join('') : `<div class="empty-state"><div class="empty-icon">📦</div><p>No products yet</p><p class="empty-sub">Use the box below to add your first product.</p></div>`;

        container.innerHTML = chipsHtml;
    }
};
