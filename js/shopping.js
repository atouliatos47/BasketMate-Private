// ===================================================
// shopping.js — Shopping mode, toggle items
// ===================================================


Object.assign(App || window, {

    enterShoppingMode() {
        const overlay = document.getElementById('shoppingModeOverlay');
        if (!overlay) return;
        overlay.classList.remove('hidden');

        document.getElementById('navAislePanel').classList.add('hidden');
        document.getElementById('navStoreScreen').classList.add('hidden');
        document.getElementById('navHomeScreen').classList.add('hidden');
        document.getElementById('navShoppingMode').classList.remove('hidden');

        document.getElementById('aislePanelOverlay').classList.remove('show');

        if (UI) UI.renderShoppingModeList();
    },

    closeShoppingMode() {
        const overlay = document.getElementById('shoppingModeOverlay');
        if (overlay) overlay.classList.add('hidden');

        document.getElementById('navShoppingMode').classList.add('hidden');
        if (UI && UI.currentAislePanel) {
            document.getElementById('navAislePanel').classList.remove('hidden');
        } else if (API.currentStoreId) {
            document.getElementById('navStoreScreen').classList.remove('hidden');
        }
    },

    renderShoppingModeList() {
        const container = document.getElementById('shoppingModeList');
        if (!container) return;

        const allItems = API.items.filter(i => !i.isChecked);
        const stats = document.getElementById('shoppingModeStats');
        if (stats) stats.textContent = `${allItems.length} item${allItems.length !== 1 ? 's' : ''}`;

        if (!allItems.length) {
            container.innerHTML = `<div style="text-align:center;padding:40px 20px;color:#9ca3af;">
                <div style="font-size:48px;margin-bottom:12px;">✅</div>
                <p>All done! Your list is empty.</p>
            </div>`;
            return;
        }

        // Your existing rendering logic...
        // (keep the rest of your renderShoppingModeList and renderShopItem as they are)
    },

    renderShopItem(item) {
        return `<div class="shop-item ${item.isChecked ? 'checked' : ''}" onclick="App.toggleShopItem(${item.id})">
            <span class="shop-item-name ${item.isChecked ? 'crossed' : ''}">${Utils.escapeHtml(item.name)}</span>
            ${item.quantity > 1 ? `<span class="shop-qty-badge">x${item.quantity}</span>` : ''}
            ${item.isChecked ? '<span class="shop-done-badge">✓</span>' : ''}
        </div>`;
    },

    playPing() {
        if (localStorage.getItem('bm_silent') === 'true') return;
        // your existing ping code...
    },

    async toggleShopItem(id) {
        // your existing toggle logic...
    }
});