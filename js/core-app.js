// ===================================================
// js/core-app.js — Core initialization and setup
// ===================================================
const App = {
    wakeLock: null,

    async requestWakeLock() {
        try {
            if (screen.orientation && screen.orientation.lock) {
                await screen.orientation.lock('portrait').catch(() => {});
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
                this.applyTranslations();
                API.connectSSE();
                API.startKeepAlive();
                setTimeout(() => this.setupPushNotifications(), 6000);
            }
        } else {
            setTimeout(() => this.showLanguageFirst(), 2200);
        }
    },

    applyTranslations() {
        const labels = {
            'navLabelMyCode': 'myCode',
            'navLabelAddStore': 'addStore',
            'navLabelMyList': 'myList',
            'navLabelMyList2': 'myList',
            'navLabelMyList3': 'myList',
            'navLabelAddProduct': 'addProduct',
            'aislesHeader': 'aisles',
            'aislesSubHeader': 'tapAisleToAdd',
            'tabListLabel': 'list',
            'tabFavsLabel': 'favourites',
        };
        Object.entries(labels).forEach(([id, key]) => {
            const el = document.getElementById(id);
            if (el) el.textContent = t(key);
        });

        const aislesHeader = document.getElementById('aislesHeader');
        if (aislesHeader) aislesHeader.innerHTML = '🏪 ' + t('aisles');

        const shopLabel = document.getElementById('shoppingModeLabel');
        if (shopLabel) shopLabel.textContent = t('shoppingList');
        const homeSub = document.querySelector('.home-sub');
        if (homeSub) homeSub.textContent = t('whereShoppingToday');
        const settingsTitle = document.querySelector('.settings-title');
        if (settingsTitle) settingsTitle.textContent = t('settings');
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
            <button onclick="App.pickLanguage('${l.code}')" id="langpick-${l.code}"
                style="display:flex;align-items:center;gap:12px;padding:14px 16px;border:2px solid #e5e7eb;border-radius:12px;background:white;font-size:16px;cursor:pointer;text-align:left;width:100%;margin-bottom:8px;">
                <span style="font-size:28px;">${l.flag}</span>
                <span style="font-weight:600;color:#1a1a2e;">${l.name}</span>
            </button>
        `).join('');

        modal.innerHTML = `
            <div style="text-align:center;padding:8px 0 16px;">
                <div style="font-size:48px;margin-bottom:12px;">🌍</div>
                <h2 style="margin:0 0 6px;font-size:22px;color:#1a1a2e;">Choose Your Language</h2>
                <p style="color:#6b7280;font-size:14px;margin:0 0 20px;">Select your preferred language to continue.</p>
                <div style="text-align:left;">
                    ${langOptions}
                </div>
            </div>`;
        overlay.classList.add('show');
        overlay.onclick = null;
    },

    pickLanguage(code) {
        localStorage.setItem('bm_language', code);
        window.dispatchEvent(new Event('languageChanged'));
        document.body.dir = code === 'ur' ? 'rtl' : 'ltr';
        App.applyTranslations();

        const overlay = document.getElementById('modalOverlay');
        overlay.classList.remove('show');

        if (API.householdId) {
            API.connectSSE();
            API.startKeepAlive();
            setTimeout(() => App.setupPushNotifications(), 6000);
        } else {
            setTimeout(() => App.showHouseholdSetup(), 300);
        }
    }
};