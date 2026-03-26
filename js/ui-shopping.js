// ===================================================
// js/ui-shopping.js — Shopping mode
// ===================================================
Object.assign(UI, {

    renderShoppingModeList() {
        const container = document.getElementById('shoppingModeList');
        if (!container) return;

        const allItems = API.items.filter(i => !i.isChecked);
        const stats = document.getElementById('shoppingModeStats');
        if (stats) stats.textContent = t('items', allItems.length);

        if (!allItems.length) {
            container.innerHTML = `<div style="text-align:center;padding:40px 20px;color:#9ca3af;">
                <div style="font-size:48px;margin-bottom:12px;">✅</div>
                <p>${t('allDone')}</p>
            </div>`;
            return;
        }

        // ... (rest of your shopping mode rendering code - I can expand if needed)
        // For now, you can keep your existing renderShoppingModeList logic here
    }
});
