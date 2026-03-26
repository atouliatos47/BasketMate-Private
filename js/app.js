// ===================================================
// app.js — Core: init, splash, household, push
// ===================================================

const App = {
    wakeLock: null,

    async requestWakeLock() {
        try {
            if (screen.orientation && screen.orientation.lock) {
                await screen.orientation.lock('portrait').catch(() => { });
            }
            if ('wakeLock' in navigator) {
                this.wakeLock = await navigator.wakeLock.request('screen');
                console.log('Screen wake lock active');
                if (!this._wakeLockListenerAdded) {
                    this._wakeLockListenerAdded = true;
                    document.addEventListener('visibilitychange', async () => {
                        if (document.visibilityState === 'visible' && this.wakeLock === null) {
                            await this.requestWakeLock();
                        }
                    });
                }
            }
        } catch (e) { console.log('Wake lock not available:', e); }
    },

    async releaseWakeLock() {
        try {
            if (screen.orientation && screen.orientation.unlock) screen.orientation.unlock();
            if (this.wakeLock) {
                await this.wakeLock.release();
                this.wakeLock = null;
            }
        } catch (e) { console.log('Wake lock release error:', e); }
    },

    init() {
        console.log('BasketMate initializing...');
        this.setupEventListeners();
        this.showSplash();

        const hasHousehold = API.loadHousehold();
        const hasLanguage = !!localStorage.getItem('bm_language');

        if (hasHousehold) {
            API.memberName = localStorage.getItem('bm_member_name') || 'Someone';
            setTimeout(() => {
                const splash = document.getElementById('splashScreen');
                if (splash) { 
                    splash.classList.add('fade-out'); 
                    setTimeout(() => { splash.style.display = 'none'; }, 600); 
                }
            }, 1800);

            if (!hasLanguage) {
                setTimeout(() => this.showLanguageFirst(), 2200);
            } else {
                i18n.applyTranslations();
                API.connectSSE();
                API.startKeepAlive();
                setTimeout(() => this.setupPushNotifications(), 4000);
            }
        } else {
            setTimeout(() => this.showLanguageFirst(), 2200);
        }
    },

    applyTranslations() {
        // This is now handled globally by i18n/core.js
        // But we keep this for backward compatibility and dynamic elements
        i18n.applyTranslations();
    },

    showSplash() {
        const splash = document.getElementById('splashScreen');
        const storesContainer = document.getElementById('splashStores');
        if (!splash) return;

        const stores = [
            { name: 'Tesco', color: '#005EA5', domain: 'tesco.com' },
            { name: 'Iceland', color: '#D61F26', domain: 'iceland.co.uk' },
            { name: 'Lidl', color: '#0050AA', domain: 'lidl.co.uk' },
            { name: "Sainsbury's", color: '#F47920', domain: 'sainsburys.co.uk' },
            { name: 'B&M', color: '#6B2D8B', domain: 'bmstores.co.uk' },
            { name: 'Asda', color: '#78BE20', domain: 'asda.com' },
            { name: 'Morrisons', color: '#00AA4F', domain: 'morrisons.com' },
            { name: 'M&S', color: '#000000', domain: 'marksandspencer.com' },
            { name: 'Aldi', color: '#003082', domain: 'aldi.co.uk' },
            { name: 'Co-op', color: '#00B1A9', domain: 'coop.co.uk' },
        ];

        storesContainer.innerHTML = stores.map((store, i) => {
            const initials = store.name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);
            return `<div class="splash-store" style="animation-delay:${0.4 + i * 0.12}s">
                <div class="splash-store-avatar" id="splash-avatar-${i}" style="background:white;">
                    <img src="https://www.google.com/s2/favicons?domain=${store.domain}&sz=128" alt="${store.name}"
                        data-idx="${i}" data-color="${store.color}" data-initials="${initials}"
                        onerror="var el=document.getElementById('splash-avatar-'+this.dataset.idx);el.style.background=this.dataset.color;el.innerHTML=this.dataset.initials;"
                        style="width:36px;height:36px;object-fit:contain;border-radius:4px;">
                </div>
                <span class="splash-store-name">${store.name}</span>
            </div>`;
        }).join('');
    },

    showLanguageFirst() {
        if (localStorage.getItem('bm_language')) {
            this.showHouseholdSetup();
            return;
        }

        const splash = document.getElementById('splashScreen');
        if (splash) { 
            splash.classList.add('fade-out'); 
            setTimeout(() => { splash.style.display = 'none'; }, 600); 
        }

        const overlay = document.getElementById('modalOverlay');
        const modal = document.getElementById('modal');

        const langOptions = LANGUAGES.map(l => `
            <button onclick="App.pickLanguage('${l.code}')" 
                style="display:flex;align-items:center;gap:12px;padding:14px 16px;border:2px solid #e5e7eb;border-radius:12px;background:white;font-size:16px;cursor:pointer;text-align:left;width:100%;margin-bottom:8px;">
                <span style="font-size:28px;">${l.flag}</span>
                <span style="font-weight:600;color:#1a1a2e;">${l.name}</span>
            </button>
        `).join('');

        modal.innerHTML = `
            <div style="text-align:center;padding:8px 0 16px;">
                <div style="font-size:48px;margin-bottom:12px;">🌍</div>
                <h2 style="margin:0 0 6px;font-size:22px;color:#1a1a2e;" data-i18n="language">Choose Your Language</h2>
                <p style="color:#6b7280;font-size:14px;margin:0 0 20px;" data-i18n="selectLanguage">Select your preferred language to continue.</p>
                <div style="text-align:left;">
                    ${langOptions}
                </div>
            </div>`;
        overlay.classList.add('show');
        i18n.applyTranslations();
    },

    pickLanguage(code) {
        localStorage.setItem('bm_language', code);
        document.body.dir = code === 'ur' ? 'rtl' : 'ltr';
        i18n.applyTranslations();
        const overlay = document.getElementById('modalOverlay');
        overlay.classList.remove('show');

        if (API.householdId) {
            API.connectSSE();
            API.startKeepAlive();
            setTimeout(() => this.setupPushNotifications(), 3000);
        } else {
            setTimeout(() => this.showHouseholdSetup(), 200);
        }
    },

    showHouseholdSetup() {
        const splash = document.getElementById('splashScreen');
        if (splash) { 
            splash.classList.add('fade-out'); 
            setTimeout(() => { splash.style.display = 'none'; }, 600); 
        }

        const overlay = document.getElementById('modalOverlay');
        const modal = document.getElementById('modal');

        modal.innerHTML = `
            <div style="text-align:center;padding:8px 0 16px;">
                <div style="font-size:48px;margin-bottom:12px;">🛒</div>
                <h2 data-i18n="welcomeToBasketMate">Welcome to BasketMate</h2>
                <p data-i18n="welcomeSubtitle">Create a household to get started, or join an existing one with a code.</p>
                
                <button onclick="App.createHousehold()" style="width:100%;padding:14px;background:#005EA5;color:white;border:none;border-radius:12px;font-size:16px;font-weight:700;cursor:pointer;margin-bottom:12px;">
                    <span data-i18n="createNewHousehold">Create New Household</span>
                </button>
                
                <div style="position:relative;margin:20px 0;">
                    <div style="height:1px;background:#e5e7eb;"></div>
                    <span style="position:absolute;top:-10px;left:50%;transform:translateX(-50%);background:white;padding:0 12px;color:#9ca3af;font-size:13px;" data-i18n="or">or</span>
                </div>
                
                <div style="display:flex;gap:8px;">
                    <input type="text" id="joinCodeInput" placeholder="${t('enterHouseholdCode')}" maxlength="6"
                        style="flex:1;padding:13px 14px;border:1.5px solid #e5e7eb;border-radius:12px;font-size:16px;text-transform:uppercase;letter-spacing:2px;outline:none;text-align:center;">
                    <button onclick="App.joinHousehold()" style="padding:13px 24px;background:#16a34a;color:white;border:none;border-radius:12px;font-size:15px;font-weight:700;cursor:pointer;" data-i18n="join">Join</button>
                </div>
                <p id="householdError" style="color:#dc2626;font-size:13px;margin:8px 0 0;display:none;"></p>
            </div>`;
        overlay.classList.add('show');
        i18n.applyTranslations();
    },

    async createHousehold() {
        try {
            const btn = document.querySelector('#modal button');
            if (btn) {
                btn.disabled = true;
                btn.textContent = t('creating') || 'Creating...';
            }

            const data = await API.createHousehold();
            this.showHouseholdCode(data.code);
        } catch (e) {
            Utils.showToast(t('failedToCreateHousehold') || 'Failed to create household', true);
            const btn = document.querySelector('#modal button');
            if (btn) {
                btn.disabled = false;
                btn.textContent = t('createNewHousehold');
            }
        }
    },

    showHouseholdCode(code) {
        const modal = document.getElementById('modal');
        modal.innerHTML = `
            <div style="text-align:center;padding:8px 0 16px;">
                <div style="font-size:48px;margin-bottom:12px;">🏠</div>
                <h2 data-i18n="yourHouseholdCode">Your Household Code</h2>
                <p data-i18n="shareCode">Share this with family to join your list.</p>
                <div style="background:#f0f9ff;border:2px solid #005EA5;border-radius:16px;padding:20px;margin-bottom:20px;">
                    <div style="font-size:36px;font-weight:900;letter-spacing:8px;color:#005EA5;font-family:monospace;">${code}</div>
                </div>
                <button onclick="App.showNameSetup()" style="width:100%;padding:14px;background:#005EA5;color:white;border:none;border-radius:12px;font-size:16px;font-weight:700;cursor:pointer;" data-i18n="next">Next</button>
            </div>`;
        i18n.applyTranslations();
    },

    showNameSetup() {
        const modal = document.getElementById('modal');
        modal.innerHTML = `
            <div style="text-align:center;padding:8px 0 16px;">
                <div style="font-size:48px;margin-bottom:12px;">👤</div>
                <h2 data-i18n="whatsYourName">What's your name?</h2>
                <p data-i18n="nameSoFamily">So your family knows who added items.</p>
                <input type="text" id="memberNameInput" placeholder="${t('namePlaceholder')}" maxlength="20"
                    style="width:100%;padding:14px;border:1.5px solid #e5e7eb;border-radius:12px;font-size:18px;outline:none;text-align:center;margin-bottom:16px;box-sizing:border-box;">
                <p id="nameError" style="color:#dc2626;font-size:13px;margin:0 0 12px;display:none;">Please enter your name.</p>
                <button onclick="App.saveMemberName()" style="width:100%;padding:14px;background:#005EA5;color:white;border:none;border-radius:12px;font-size:16px;font-weight:700;cursor:pointer;" data-i18n="letsGo">Let's Go! 🛒</button>
            </div>`;
        i18n.applyTranslations();
        setTimeout(() => document.getElementById('memberNameInput')?.focus(), 100);
    },

    saveMemberName() {
        const input = document.getElementById('memberNameInput');
        const name = input.value.trim();
        if (!name) {
            document.getElementById('nameError').style.display = 'block';
            input.style.borderColor = '#dc2626';
            return;
        }
        localStorage.setItem('bm_member_name', name);
        API.memberName = name;
        this.startApp();
    },

    async joinHousehold() {
        const input = document.getElementById('joinCodeInput');
        const error = document.getElementById('householdError');
        const code = input.value.trim().toUpperCase();
        if (code.length < 6) {
            input.style.borderColor = '#dc2626';
            error.textContent = 'Please enter a 6-character code.';
            error.style.display = 'block';
            return;
        }
        try {
            input.disabled = true;
            error.style.display = 'none';
            await API.joinHousehold(code);
            Utils.showToast(t('joinedHousehold') || 'Joined household! 🏠');
            this.showNameSetup();
        } catch (e) {
            input.disabled = false;
            input.style.borderColor = '#dc2626';
            error.textContent = 'Household not found. Check the code and try again.';
            error.style.display = 'block';
        }
    },

    startApp() {
        const overlay = document.getElementById('modalOverlay');
        overlay.classList.remove('show');
        API.connectSSE();
        API.startKeepAlive();
        setTimeout(() => this.setupPushNotifications(), 3000);
        i18n.applyTranslations();
    },

    async setupPushNotifications() {
        if (!('Notification' in window) || !('serviceWorker' in navigator)) return;
        if (Notification.permission === 'denied') return;
        try {
            const permission = await Notification.requestPermission();
            if (permission !== 'granted') return;
            const reg = await navigator.serviceWorker.ready;
            const r = await fetch('/push/vapid-key');
            const { publicKey } = await r.json();
            const subscription = await reg.pushManager.subscribe({ 
                userVisibleOnly: true, 
                applicationServerKey: this.urlBase64ToUint8Array(publicKey) 
            });
            await fetch('/push/subscribe', { 
                method: 'POST', 
                headers: { 'Content-Type': 'application/json' }, 
                body: JSON.stringify({ subscription, householdId: API.householdId }) 
            });
            console.log('Push notifications enabled!');
        } catch (e) { 
            console.log('Push setup failed:', e); 
        }
    },

    urlBase64ToUint8Array(base64String) {
        const padding = '='.repeat((4 - base64String.length % 4) % 4);
        const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
        const rawData = window.atob(base64);
        return new Uint8Array([...rawData].map(c => c.charCodeAt(0)));
    },

    setupEventListeners() {
        const overlay = document.getElementById('modalOverlay');
        if (overlay) {
            overlay.addEventListener('click', (e) => {
                if (e.target === overlay) Utils.closeModal();
            });
        }
    },

    // ==================== HELP & UPGRADE SCREENS (Fixed) ====================

    showHelp() {
        const modal = document.getElementById('modal');
        modal.innerHTML = `
            <div class="help-modal">
                <h2 data-i18n="howToUseTitle">How to Use BasketMate</h2>
                
                <div class="help-item">
                    <span class="help-icon">🏪</span>
                    <div>
                        <strong data-i18n="chooseAStore">Choose a Store</strong>
                        <p data-i18n="chooseAStoreDesc">Tap a store on the home screen to open its shopping list.</p>
                    </div>
                </div>

                <div class="help-item">
                    <span class="help-icon">📦</span>
                    <div>
                        <strong data-i18n="addItems">Add Items</strong>
                        <p data-i18n="addItemsDesc">Tap an aisle, then tap products to add them to your list.</p>
                    </div>
                </div>

                <div class="help-item">
                    <span class="help-icon">⭐</span>
                    <div>
                        <strong data-i18n="favouritesHelp">Favourites</strong>
                        <p data-i18n="favouritesHelpDesc">Tap the star next to any product to save it for quick access later.</p>
                    </div>
                </div>

                <div class="help-item">
                    <span class="help-icon">🛒</span>
                    <div>
                        <strong data-i18n="shoppingMode">Shopping Mode</strong>
                        <p data-i18n="shoppingModeDesc">Tap the cart icon at the bottom to enter shopping mode — tap items to check them off as you shop.</p>
                    </div>
                </div>

                <div class="help-item">
                    <span class="help-icon">🔄</span>
                    <div>
                        <strong data-i18n="reorderAisles">Reorder Aisles</strong>
                        <p data-i18n="reorderAislesDesc">Long-press an aisle and drag it up or down</p>
                    </div>
                </div>

                <button onclick="Utils.closeModal()" style="width:100%;margin-top:20px;" data-i18n="close">Close</button>
            </div>`;
        document.getElementById('modalOverlay').classList.add('show');
        i18n.applyTranslations();
    },

    showUpgradePrompt() {
        const modal = document.getElementById('modal');
        modal.innerHTML = `
            <div class="upgrade-modal" style="text-align:center;">
                <div style="font-size:60px;margin:20px 0;">⭐</div>
                <h2 data-i18n="upgradeTitle">Upgrade to BasketMate Family</h2>
                <p data-i18n="upgradeDescription">Unlock unlimited stores, aisles, and products.</p>
                <p class="price" data-i18n="upgradePrice">One-time payment of £2.99</p>
                
                <button onclick="App.upgradeNow()" class="upgrade-btn" style="width:100%;margin:15px 0;" data-i18n="upgradeNow">
                    Upgrade Now (£2.99)
                </button>
                <button onclick="Utils.closeModal()" class="later-btn" style="width:100%;" data-i18n="maybeLater">
                    Maybe Later
                </button>
            </div>`;
        document.getElementById('modalOverlay').classList.add('show');
        i18n.applyTranslations();
    },

    // Placeholder - implement actual upgrade logic later
    upgradeNow() {
        Utils.showToast("Upgrade flow coming soon...", true);
        Utils.closeModal();
    },

    smartHome() {
        const aislePanel = document.getElementById('aislePanelOverlay');
        if (aislePanel && aislePanel.classList.contains('show')) { 
            UI.closeAislePanel(); 
            return; 
        }
        const shopMode = document.getElementById('shoppingModeOverlay');
        if (shopMode && !shopMode.classList.contains('hidden')) {
            this.closeShoppingMode();
            return;
        }
        if (API.currentStoreId) { 
            this.goHome(); 
            return; 
        }
    },

    showItemAlert(addedBy, itemName, storeName) {
        const modal = document.getElementById('modal');
        const overlay = document.getElementById('modalOverlay');
        modal.innerHTML = `
            <div style="text-align:center;padding:8px 0 16px;">
                <div style="font-size:48px;margin-bottom:12px;">🛒</div>
                <h3 style="margin:0 0 8px;font-size:20px;color:#1a1a2e;">${Utils.escapeHtml(addedBy)} added something!</h3>
                <p style="color:#6b7280;font-size:16px;margin:0 0 20px;">
                    <strong style="color:#005EA5;">${Utils.escapeHtml(itemName)}</strong> was added to <strong>${Utils.escapeHtml(storeName)}</strong>
                </p>
                <button onclick="Utils.closeModal()" style="width:100%;padding:14px;background:#005EA5;color:white;border:none;border-radius:12px;font-size:16px;font-weight:700;cursor:pointer;">OK</button>
            </div>`;
        overlay.classList.add('show');
    },

    darken(hex) {
        const n = parseInt(hex.slice(1), 16);
        const r = Math.max(0, (n >> 16) - 30);
        const g = Math.max(0, ((n >> 8) & 0xff) - 30);
        const b = Math.max(0, (n & 0xff) - 30);
        return `#${((r << 16) | (g << 8) | b).toString(16).padStart(6, '0')}`;
    }
};

document.addEventListener('DOMContentLoaded', () => App.init());