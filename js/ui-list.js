// ===================================================
// js/ui-list.js — Shopping list rendering
// ===================================================
Object.assign(UI, {

    renderList() {
        const container = document.getElementById('listContainer');
        if (!container) return;

        const items = API.storeItems;
        if (!items.length) {
            container.innerHTML = `<div class="empty-state"><div class="empty-icon">🛒</div><p>${t('listIsEmptyMsg')}</p><p class="empty-sub">${t('tapAisleMsg')}</p></div>`;
            this.renderStats();
            return;
        }

        const grouped = {};
        const noAisle = [];
        items.forEach(item => {
            if (!item.aisleId) { noAisle.push(item); return; }
            if (!grouped[item.aisleId]) grouped[item.aisleId] = [];
            grouped[item.aisleId].push(item);
        });

        const sortedAisles = API.storeAisles.filter(a => grouped[a.id]).sort((a, b) => a.sortOrder - b.sortOrder);

        let html = '';
        sortedAisles.forEach(aisle => {
            html += `<div class="aisle-group">
                <div class="aisle-group-header"><span>🏪</span><span>${Utils.escapeHtml(aisle.name)}</span><span class="aisle-group-count">${grouped[aisle.id].length}</span></div>
                ${grouped[aisle.id].sort((a,b) => a.name.localeCompare(b.name)).map(item => this.renderItem(item)).join('')}
            </div>`;
        });

        if (noAisle.length) {
            html += `<div class="aisle-group">
                <div class="aisle-group-header"><span>📦</span><span>Other</span><span class="aisle-group-count">${noAisle.length}</span></div>
                ${noAisle.sort((a,b) => a.name.localeCompare(b.name)).map(item => this.renderItem(item)).join('')}
            </div>`;
        }

        container.innerHTML = html;
        this.renderStats();
    },

    renderItem(item) {
        return `<div class="item-card ${item.isChecked ? 'checked' : ''}">
            <div class="checkbox ${item.isChecked ? 'checked' : ''}" onclick="UI.handleCheck(${item.id})">${item.isChecked ? '✓' : ''}</div>
            <div class="item-name ${item.isChecked ? 'crossed' : ''}" onclick="UI.handleCheck(${item.id})">${Utils.escapeHtml(item.name)}</div>
            ${item.quantity > 1 ? `<span class="qty-badge">x${item.quantity}</span>` : ''}
            <button class="del-btn" onclick="UI.handleDelete(${item.id})">🗑</button>
        </div>`;
    },

    renderStats() {
        const total = API.storeItems.length;
        const checked = API.storeItems.filter(i => i.isChecked).length;
        const el = document.getElementById('statsBar');
        if (el) el.textContent = total === 0 ? t('listIsEmpty') : `${checked} of ${total} collected`;
    }
};