// ===================================================
// js/ui-home.js — Home screen (Store grid)
// ===================================================
const UI = {
    currentAislePanel: null,
    lastAislePanel: null,

    // ===== HOME SCREEN =====
    logoFallback(storeId, initials, color) {
        const el = document.getElementById('avatar-' + storeId);
        if (el) {
            el.style.background = color;
            el.innerHTML = `<span class="store-card-initials">${initials}</span>`;
        }
    },

    getStoreLogo(name) {
        const logos = {
            'tesco': 'tesco.com',
            'iceland': 'iceland.co.uk',
            'lidl': 'lidl.co.uk',
            "sainsbury's": 'sainsburys.co.uk',
            'sainsburys': 'sainsburys.co.uk',
            'b&m': 'bmstores.co.uk',
            'aldi': 'aldi.co.uk',
            'morrisons': 'morrisons.com',
            'marks & spencer': 'marksandspencer.com',
            'm&s': 'marksandspencer.com',
            'asda': 'asda.com',
            'co-op': 'co-operative.coop',
            'coop': 'co-operative.coop',
        };
        return logos[name.toLowerCase()] || null;
    },

    renderHome() {
        const container = document.getElementById('storeGrid');
        if (!container) return;

        const stores = API.stores.sort((a, b) => a.sortOrder - b.sortOrder);

        container.innerHTML = stores.map(store => {
            const itemCount = API.items.filter(i => i.storeId === store.id && !i.isChecked).length;
            const initials = store.name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0,2);
            const logoDomain = this.getStoreLogo(store.name);

            const avatarHtml = logoDomain
                ? `<div class="store-card-avatar store-card-avatar-logo" id="avatar-${store.id}">
                       <img src="https://www.google.com/s2/favicons?domain=${logoDomain}&sz=128"
                           alt="${Utils.escapeHtml(store.name)}"
                           onerror="UI.logoFallback(${store.id},'${initials}','${store.color}')"
                           style="width:40px;height:40px;object-fit:contain;opacity:1;border-radius:6px;">
                   </div>`
                : `<div class="store-card-avatar" style="background:${store.color};">
                       <span class="store-card-initials">${initials}</span>
                   </div>`;

            return `
                <div class="store-card-wrapper">
                    <div class="store-card" onclick="App.enterStore(${store.id})" style="--card-color: ${store.color};">
                        <div class="store-card-accent" style="background:${store.color};"></div>
                        <div class="store-card-body">
                            ${avatarHtml}
                            <div class="store-card-info">
                                <div class="store-card-name">${Utils.escapeHtml(store.name)}</div>
                                <div class="store-card-status ${itemCount ? 'has-items' : ''}">
                                    ${itemCount ? t('itemsInList', itemCount) : t('listIsEmpty')}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>`;
        }).join('');
    }
};