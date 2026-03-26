// ===================================================
// api.js — Fixed & Improved
// ===================================================
const API = {
    stores: [],
    aisles: [],
    items: [],
    favourites: [],
    currentStoreId: null,
    householdId: null,
    householdCode: null,
    memberName: 'Someone',
    eventSource: null,
    isPremium: false,
    trialStartedAt: null,

    get isTrialActive() {
        if (this.isPremium) return true;
        if (!this.trialStartedAt) return false;
        const trialEnd = new Date(this.trialStartedAt).getTime() + (15 * 24 * 60 * 60 * 1000);
        return Date.now() < trialEnd;
    },

    get trialDaysLeft() {
        if (!this.trialStartedAt) return 0;
        const trialEnd = new Date(this.trialStartedAt).getTime() + (15 * 24 * 60 * 60 * 1000);
        return Math.max(0, Math.ceil((trialEnd - Date.now()) / (24 * 60 * 60 * 1000)));
    },

    get hasFullAccess() {
        return this.isPremium || this.isTrialActive;
    },

    get storeAisles() {
        return this.aisles.filter(a => a.storeId === this.currentStoreId);
    },

    get storeItems() {
        return this.items.filter(i => i.storeId === this.currentStoreId);
    },

    get storeFavourites() {
        return this.favourites.filter(f => f.store_id === this.currentStoreId);
    },

    // ===== HOUSEHOLD =====
    async createHousehold() {
        try {
            console.log('Creating new household...');

            const r = await fetch('/households/create', { 
                method: 'POST',
                headers: { 'Content-Type': 'application/json' }
            });

            if (!r.ok) {
                const errorText = await r.text();
                console.error('Create household failed:', r.status, errorText);
                throw new Error(`Failed to create household: ${r.status}`);
            }

            const data = await r.json();

            if (!data.id || !data.code) {
                throw new Error('Invalid response from server');
            }

            this.householdId = data.id;
            this.householdCode = data.code;

            // Save to localStorage
            localStorage.setItem('bm_household_id', data.id);
            localStorage.setItem('bm_household_code', data.code);

            // Start trial
            const trialStart = new Date().toISOString();
            localStorage.setItem('bm_trial_started', trialStart);
            this.trialStartedAt = trialStart;

            console.log(`✅ Household created successfully. ID: ${data.id}, Code: ${data.code}`);

            return data;

        } catch (e) {
            console.error('createHousehold error:', e);
            throw e; // Let the caller (App.createHousehold) handle the UI error
        }
    },

    async joinHousehold(code) {
        try {
            console.log(`Attempting to join household with code: ${code}`);

            const r = await fetch('/households/join', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ code: code.trim().toUpperCase() })
            });

            if (!r.ok) {
                const errorText = await r.text().catch(() => 'No error details');
                console.error('Join failed:', r.status, errorText);
                throw new Error('Household not found');
            }

            const data = await r.json();

            if (!data.id || !data.code) {
                throw new Error('Invalid response from server');
            }

            this.householdId = data.id;
            this.householdCode = data.code;

            localStorage.setItem('bm_household_id', data.id);
            localStorage.setItem('bm_household_code', data.code);

            console.log(`✅ Successfully joined household. ID: ${data.id}, Code: ${data.code}`);

            return data;

        } catch (e) {
            console.error('joinHousehold error:', e);
            throw e;
        }
    },

    loadHousehold() {
        const id   = localStorage.getItem('bm_household_id');
        const code = localStorage.getItem('bm_household_code');
        if (id && code) {
            this.householdId   = parseInt(id);
            this.householdCode = code;
            console.log(`Loaded existing household: ${this.householdId}`);
            return true;
        }
        return false;
    },

    // ===== SSE ===== (unchanged - kept as is for now)
    connectSSE() {
        if (this.eventSource) {
            this.eventSource.close();
            this.eventSource = null;
        }
        if (!this.householdId) {
            console.warn('No householdId — cannot connect SSE');
            return;
        }
        console.log('Connecting SSE for household', this.householdId);
        this.eventSource = new EventSource(`/events?householdId=${this.householdId}`);

        this.eventSource.addEventListener('init', (e) => {
            const data = JSON.parse(e.data);
            this.stores     = data.stores || [];
            this.aisles     = data.aisles || [];
            this.items      = data.items || [];
            this.favourites = data.favourites || [];
            this.isPremium  = data.isPremium || false;
            this.trialStartedAt = data.trialStartedAt || localStorage.getItem('bm_trial_started');

            console.log('SSE Init received:', this.stores.length, 'stores,', this.aisles.length, 'aisles,', this.items.length, 'items');

            if (!this.hasFullAccess) this.applyFreeTierRestrictions();

            UI.renderHome();
            UI.renderTrialBanner();

            const badge = document.getElementById('connectionBadge');
            if (badge) badge.textContent = '● Live';
        });

        // ... (rest of your SSE listeners remain the same - newStore, deleteStore, newItem, etc.)
        // I kept them unchanged to avoid breaking anything

        this.eventSource.addEventListener('newStore', (e) => {
            this.stores.push(JSON.parse(e.data));
            UI.renderHome();
        });

        this.eventSource.addEventListener('deleteStore', (e) => {
            const { id } = JSON.parse(e.data);
            this.stores = this.stores.filter(s => s.id !== id);
            this.aisles = this.aisles.filter(a => a.storeId !== id);
            this.items  = this.items.filter(i => i.storeId !== id);
            UI.renderHome();
        });

        this.eventSource.addEventListener('newAisle', (e) => {
            const aisle = JSON.parse(e.data);
            this.aisles.push(aisle);
            if (aisle.storeId === this.currentStoreId) UI.renderAisles();
        });

        this.eventSource.addEventListener('updateAisle', (e) => {
            const aisle = JSON.parse(e.data);
            const idx = this.aisles.findIndex(a => a.id === aisle.id);
            if (idx !== -1) this.aisles[idx] = aisle;
            if (aisle.storeId === this.currentStoreId) UI.renderAisles();
        });

        this.eventSource.addEventListener('deleteAisle', (e) => {
            const { id } = JSON.parse(e.data);
            this.aisles = this.aisles.filter(a => a.id !== id);
            UI.renderAisles();
        });

        this.eventSource.addEventListener('newItem', (e) => {
            const item = JSON.parse(e.data);
            this.items.push(item);
            if (item.storeId === this.currentStoreId) UI.renderList();
            UI.renderHome();

            const shoppingMode = document.getElementById('shoppingModeOverlay');
            const isShoppingModeOpen = shoppingMode && !shoppingMode.classList.contains('hidden');
            if (isShoppingModeOpen && item.addedBy && item.addedBy !== this.memberName) {
                const store = this.stores.find(s => s.id === item.storeId);
                const storeName = store ? store.name : 'the list';
                App.showItemAlert(item.addedBy, item.name, storeName);
                App.renderShoppingModeList();
            }
        });

        this.eventSource.addEventListener('updateItem', (e) => {
            const item = JSON.parse(e.data);
            const idx = this.items.findIndex(i => i.id === item.id);
            if (idx !== -1) this.items[idx] = item;
            if (item.storeId === this.currentStoreId) UI.renderList();
        });

        this.eventSource.addEventListener('deleteItem', (e) => {
            const { id } = JSON.parse(e.data);
            this.items = this.items.filter(i => i.id !== id);
            UI.renderList();
            UI.renderHome();
            if (document.getElementById('shoppingModeOverlay') &&
                !document.getElementById('shoppingModeOverlay').classList.contains('hidden')) {
                App.renderShoppingModeList();
            }
        });

        this.eventSource.addEventListener('newFavourite', (e) => {
            const fav = JSON.parse(e.data);
            if (fav && !this.favourites.find(f => f.store_id === fav.store_id && f.name === fav.name)) {
                this.favourites.push(fav);
            }
            if (UI.currentAislePanel) UI.renderAislePanelProducts(UI.currentAislePanel);
            UI.renderFavourites();
        });

        this.eventSource.addEventListener('deleteFavourite', (e) => {
            const { storeId, name } = JSON.parse(e.data);
            this.favourites = this.favourites.filter(f => !(f.store_id === storeId && f.name === name));
            if (UI.currentAislePanel) UI.renderAislePanelProducts(UI.currentAislePanel);
            UI.renderFavourites();
        });

        this.eventSource.addEventListener('premiumUpgraded', (e) => {
            this.isPremium = true;
            UI.renderHome();
            UI.renderTrialBanner();
            Utils.showToast('🎉 Welcome to BasketMate Family!');
        });

        this.eventSource.onerror = () => {
            const badge = document.getElementById('connectionBadge');
            if (badge) { 
                badge.textContent = '○ Offline'; 
                badge.style.color = 'rgba(255,255,255,0.5)'; 
            }
            this.eventSource.close();
            this.eventSource = null;

            const delay = Math.min(3000 * (this._reconnectCount || 1), 30000);
            this._reconnectCount = (this._reconnectCount || 1) + 1;
            this._reconnectTimer = setTimeout(() => this.connectSSE(), delay);
        };

        this.eventSource.onopen = () => {
            const badge = document.getElementById('connectionBadge');
            if (badge) { 
                badge.textContent = '● Live'; 
                badge.style.color = ''; 
            }
            this._reconnectCount = 1;
            clearTimeout(this._reconnectTimer);
        };
    },

    // ===== STORE METHODS =====
    async addStore(data) {
        const r = await fetch('/stores', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });
        if (!r.ok) throw new Error('Failed to add store');
        return await r.json();
    },

    async deleteStore(id) {
        const r = await fetch(`/stores/${id}/delete`, { method: 'POST' });
        if (!r.ok) throw new Error('Failed to delete store');
        return await r.json();
    },

    // ... (the rest of your methods - addAisle, addFavourite, reorderAisles, etc. - remain unchanged)

    async addAisle(name) {
        const r = await fetch('/aisles', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name, storeId: this.currentStoreId, householdId: this.householdId })
        });
        if (!r.ok) throw new Error('Failed to add aisle');
        return await r.json();
    },

    async addFavourite(name, aisleId) {
        const r = await fetch('/favourites', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name, aisleId, storeId: this.currentStoreId, householdId: this.householdId })
        });
        if (!r.ok) throw new Error('Failed to add favourite');
        return await r.json();
    },

    async removeFavourite(name) {
        const r = await fetch('/favourites/delete', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name, storeId: this.currentStoreId, householdId: this.householdId })
        });
        if (!r.ok) throw new Error('Failed to remove favourite');
        return await r.json();
    },

    async reorderAisles(order) {
        const r = await fetch('/aisles/reorder', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ order, householdId: this.householdId })
        });
        if (!r.ok) throw new Error('Failed to reorder aisles');
        return await r.json();
    },

    async deleteAisle(id) {
        const r = await fetch(`/aisles/${id}/delete`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ householdId: this.householdId })
        });
        if (!r.ok) throw new Error('Failed to delete aisle');
        return await r.json();
    },

    async addProduct(aisleId, name) {
        const r = await fetch(`/aisles/${aisleId}/products`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name, householdId: this.householdId })
        });
        if (!r.ok) throw new Error('Failed to add product');
        return await r.json();
    },

    async deleteProduct(aisleId, name) {
        const r = await fetch(`/aisles/${aisleId}/products/delete`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name, householdId: this.householdId })
        });
        if (!r.ok) throw new Error('Failed to delete product');
        return await r.json();
    },

    async addItem(data) {
        const r = await fetch('/items', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ ...data, storeId: this.currentStoreId, householdId: this.householdId, addedBy: this.memberName })
        });
        if (!r.ok) throw new Error('Failed to add item');
        return await r.json();
    },

    async toggleCheck(id) {
        const r = await fetch(`/items/${id}/check`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ householdId: this.householdId })
        });
        if (!r.ok && r.status !== 404) throw new Error('Failed to toggle check');
        return r.status === 404 ? null : await r.json();
    },

    async deleteItem(id) {
        const r = await fetch(`/items/${id}/delete`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ householdId: this.householdId })
        });
        if (!r.ok && r.status !== 404) throw new Error('Failed to delete item');
        return r.status === 404 ? { success: true } : await r.json();
    },

    async clearChecked() {
        const r = await fetch('/items/clear-checked', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ storeId: this.currentStoreId, householdId: this.householdId })
        });
        if (!r.ok) throw new Error('Failed to clear checked');
        return await r.json();
    },

    applyFreeTierRestrictions() {
        const FREE_STORES = ['tesco', 'asda', 'lidl'];
        const FREE_AISLE_LIMIT = 5;
        const FREE_PRODUCT_LIMIT = 8;

        const allowedStores = this.stores.filter(s => FREE_STORES.includes(s.name.toLowerCase()));
        const allowedStoreIds = allowedStores.map(s => s.id);

        if (allowedStores.length === 0) {
            this.stores = this.stores.slice(0, 3);
        } else {
            this.stores = allowedStores;
        }

        const aislesByStore = {};
        this.aisles.forEach(a => {
            if (!allowedStoreIds.includes(a.storeId)) return;
            if (!aislesByStore[a.storeId]) aislesByStore[a.storeId] = [];
            if (aislesByStore[a.storeId].length < FREE_AISLE_LIMIT) {
                aislesByStore[a.storeId].push(a);
            }
        });
        this.aisles = Object.values(aislesByStore).flat();

        this.aisles = this.aisles.map(a => ({
            ...a,
            products: (a.products || []).slice(0, FREE_PRODUCT_LIMIT)
        }));

        this.items = this.items.filter(i => allowedStoreIds.includes(i.storeId));

        console.log('Free tier applied:', this.stores.length, 'stores,', this.aisles.length, 'aisles');
    },

    async verifyPurchase(purchaseToken) {
        const r = await fetch('/purchase/verify', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ householdId: this.householdId, purchaseToken })
        });
        if (!r.ok) throw new Error('Purchase verification failed');
        return await r.json();
    },

    startKeepAlive() {
        setInterval(() => {
            if (this.householdId) {
                fetch(`/items?householdId=${this.householdId}`).catch(() => {});
            }
        }, 10 * 60 * 1000);
    }
};