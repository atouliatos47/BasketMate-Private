// ===================================================
// settings.js — Settings panel (PRIVATE BUILD)
// ===================================================
Object.assign(App, {

    showSettings() {
        const panel = document.getElementById('settingsPanel');
        const overlay = document.getElementById('settingsOverlay');

        const nameSub = document.getElementById('currentNameSub');
        if (nameSub) nameSub.textContent = t('signedInAs', API.memberName);

        const silent = localStorage.getItem('bm_silent') === 'true';
        const toggle = document.getElementById('silentModeToggle');
        const thumb = document.getElementById('silentModeThumb');
        const silentSub = document.getElementById('silentModeSub');
        if (toggle) toggle.style.background = silent ? '#005EA5' : '#e5e7eb';
        if (thumb) thumb.style.left = silent ? '22px' : '2px';
        if (silentSub) silentSub.textContent = silent ? t('soundsMuted') : t('muteSounds');

        const langSub = document.getElementById('currentLanguageSub');
        if (langSub) {
            const langCode = localStorage.getItem('bm_language') || 'en';
            const found = LANGUAGES.find(l => l.code === langCode);
            if (found) langSub.textContent = `${found.name} ${found.flag}`;
        }

        // Show "Private Version" in the upgrade row
        const upgradeTitle = document.getElementById('upgradeSettingsTitle');
        const upgradeSub   = document.getElementById('upgradeSettingsSub');
        const upgradeItem  = document.getElementById('upgradeSettingsItem');
        if (upgradeTitle) upgradeTitle.textContent = '🏠 Private Version';
        if (upgradeSub)   upgradeSub.textContent   = 'Full access — AtStudios private build';
        if (upgradeItem)  upgradeItem.onclick       = null;

        this.translateSettingsPanel();

        panel.classList.add('open');
        overlay.classList.add('open');
    },

    translateSettingsPanel() {
        const setText = (id, key) => {
            const el = document.getElementById(id);
            if (el) el.textContent = t(key);
        };

        setText('settingsTitleText', 'settings');
        setText('settingsMyCodeTitle', 'myHouseholdCode');
        setText('settingsMyCodeSub', 'shareWithFamily');
        setText('settingsChangeNameTitle', 'changeMyName');
        setText('settingsJoinTitle', 'joinAHousehold');
        setText('settingsJoinSub', 'enterPartnerCode');
        setText('settingsSilentTitle', 'silentMode');
        setText('settingsLanguageTitle', 'Language');
        setText('settingsHelpTitle', 'howToUse');
        setText('settingsHelpSub', 'tipsGuide');

        // Always show private version label
        const upgradeTitle = document.getElementById('upgradeSettingsTitle');
        const upgradeSub   = document.getElementById('upgradeSettingsSub');
        if (upgradeTitle) upgradeTitle.textContent = '🏠 Private Version';
        if (upgradeSub)   upgradeSub.textContent   = 'Full access — AtStudios private build';

        const footer = document.querySelector('.settings-footer');
        if (footer) {
            footer.innerHTML = `BasketMate v1.0 — Private<br><span style="opacity:0.7">by AtStudios</span>`;
        }
    },

    closeSettings() {
        const panel = document.getElementById('settingsPanel');
        const overlay = document.getElementById('settingsOverlay');
        if (panel) panel.classList.remove('open');
        if (overlay) overlay.classList.remove('open');
    },

    showMyCode() {
        this.closeSettings();
        const modal = document.getElementById('modal');
        const overlay = document.getElementById('modalOverlay');
        const code = API.householdCode || '------';

        modal.innerHTML = `
            <div style="text-align:center;padding:8px 0 16px;">
                <div style="font-size:48px;margin-bottom:12px;">🏠</div>
                <h3>${t('myHouseholdCode')}</h3>
                <p class="modal-sub">${t('shareWithFamily')}</p>
                <div style="background:#f0f9ff;border:2px solid #005EA5;border-radius:16px;padding:20px;margin:20px 0;">
                    <div style="font-size:36px;font-weight:900;letter-spacing:8px;color:#005EA5;font-family:monospace;">${code}</div>
                </div>
                <button onclick="Utils.closeModal()" style="width:100%;padding:14px;background:#005EA5;color:white;border:none;border-radius:12px;font-size:16px;font-weight:700;cursor:pointer;">OK</button>
            </div>`;
        overlay.classList.add('show');
    },

    showChangeName() {
        this.closeSettings();
        const modal = document.getElementById('modal');
        const overlay = document.getElementById('modalOverlay');

        modal.innerHTML = `
            <div style="text-align:center;padding:8px 0 16px;">
                <div style="font-size:48px;margin-bottom:12px;">👤</div>
                <h3>${t('changeMyName')}</h3>
                <input type="text" id="changeNameInput" value="${Utils.escapeHtml(API.memberName)}" maxlength="20"
                    style="width:100%;padding:14px;border:1.5px solid #e5e7eb;border-radius:12px;font-size:18px;outline:none;text-align:center;margin-bottom:16px;box-sizing:border-box;"
                    onkeypress="if(event.key==='Enter') App.saveChangedName()">
                <div class="modal-actions">
                    <button class="modal-btn cancel" onclick="Utils.closeModal()">${t('cancel')}</button>
                    <button class="modal-btn confirm" onclick="App.saveChangedName()">${t('save') || 'Save'}</button>
                </div>
            </div>`;
        overlay.classList.add('show');

        setTimeout(() => {
            const input = document.getElementById('changeNameInput');
            if (input) { input.focus(); input.select(); }
        }, 100);
    },

    saveChangedName() {
        const input = document.getElementById('changeNameInput');
        const name = input.value.trim();
        if (!name) { Utils.shakeElement(input); return; }
        localStorage.setItem('bm_member_name', name);
        API.memberName = name;
        Utils.closeModal();
        Utils.showToast(t('nameUpdated', name));
    },

    showSwitchHousehold() {
        this.closeSettings();
        const modal = document.getElementById('modal');
        const overlay = document.getElementById('modalOverlay');

        modal.innerHTML = `
            <div style="text-align:center;padding:8px 0 16px;">
                <div style="font-size:48px;margin-bottom:12px;">🏠</div>
                <h3>${t('joinAHousehold')}</h3>
                <p class="modal-sub">${t('enterPartnerCode')}</p>
                <div style="display:flex;gap:8px;margin-top:16px;">
                    <input type="text" id="switchCodeInput" placeholder="${t('enterHouseholdCode')}" maxlength="6"
                        style="flex:1;padding:13px 14px;border:1.5px solid #e5e7eb;border-radius:12px;font-size:16px;text-transform:uppercase;letter-spacing:2px;outline:none;text-align:center;"
                        oninput="this.value=this.value.toUpperCase()">
                    <button onclick="App.confirmSwitchHousehold()" style="padding:13px 18px;background:#16a34a;color:white;border:none;border-radius:12px;font-size:15px;font-weight:700;cursor:pointer;">${t('join')}</button>
                </div>
                <p id="switchError" style="color:#dc2626;font-size:13px;margin:8px 0 0;display:none;"></p>
                <div class="modal-actions">
                    <button class="modal-btn cancel" onclick="Utils.closeModal()">${t('cancel')}</button>
                </div>
            </div>`;
        overlay.classList.add('show');
        setTimeout(() => document.getElementById('switchCodeInput')?.focus(), 100);
    },

    async confirmSwitchHousehold() {
        const input = document.getElementById('switchCodeInput');
        const error = document.getElementById('switchError');
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
            Utils.closeModal();
            Utils.showToast(t('switchedHousehold'));
            if (API.eventSource) { API.eventSource.close(); API.eventSource = null; }
            API.connectSSE();
        } catch (e) {
            input.disabled = false;
            input.style.borderColor = '#dc2626';
            error.textContent = 'Household not found. Check the code and try again.';
            error.style.display = 'block';
        }
    },

    toggleSilentMode() {
        const current = localStorage.getItem('bm_silent') === 'true';
        const newVal = !current;
        localStorage.setItem('bm_silent', newVal);

        const toggle = document.getElementById('silentModeToggle');
        const thumb = document.getElementById('silentModeThumb');
        const silentSub = document.getElementById('silentModeSub');

        if (toggle) toggle.style.background = newVal ? '#005EA5' : '#e5e7eb';
        if (thumb) thumb.style.left = newVal ? '22px' : '2px';
        if (silentSub) silentSub.textContent = newVal ? t('soundsMuted') : t('muteSounds');

        Utils.showToast(newVal ? t('silentOn') : t('silentOff'));
    },

    showLanguageSelector() {
        this.closeSettings();
        const modal = document.getElementById('modal');
        const overlay = document.getElementById('modalOverlay');
        const currentLang = localStorage.getItem('bm_language') || 'en';

        const langOptions = LANGUAGES.map(l => `
            <button onclick="App.changeLanguage('${l.code}')"
                style="display:flex;align-items:center;gap:12px;padding:14px 16px;border:2px solid ${l.code === currentLang ? '#005EA5' : '#e5e7eb'};border-radius:12px;background:${l.code === currentLang ? '#f0f9ff' : 'white'};font-size:16px;cursor:pointer;text-align:left;width:100%;margin-bottom:8px;">
                <span style="font-size:28px;">${l.flag}</span>
                <span style="font-weight:600;color:#1a1a2e;">${l.name}</span>
                ${l.code === currentLang ? '<span style="margin-left:auto;color:#005EA5;font-weight:700;">✓</span>' : ''}
            </button>
        `).join('');

        modal.innerHTML = `
            <div style="padding:8px 0 16px;">
                <div style="text-align:center;font-size:48px;margin-bottom:12px;">🌍</div>
                <h3 style="text-align:center;margin:0 0 16px;">Language</h3>
                ${langOptions}
                <button class="modal-btn cancel" onclick="Utils.closeModal()" style="width:100%;margin-top:8px;">${t('cancel')}</button>
            </div>`;
        overlay.classList.add('show');
    },

    changeLanguage(code) {
        localStorage.setItem('bm_language', code);
        document.body.dir = code === 'ur' ? 'rtl' : 'ltr';
        App.applyTranslations();
        UI.renderHome();
        if (API.currentStoreId) {
            UI.renderAisles();
            UI.renderList();
        }
        Utils.closeModal();
        setTimeout(() => { this.showSettings(); }, 80);
    },

    showHelp() {
        this.closeSettings();
        const modal = document.getElementById('modal');
        const overlay = document.getElementById('modalOverlay');

        modal.innerHTML = `
            <h3 style="margin-bottom:20px;">${t('howToUse')}</h3>
            <div style="margin-top:8px; font-size:15px; line-height:1.6; color:#374151;">
                <div style="display:flex; gap:12px; margin-bottom:16px;">
                    <div style="font-size:24px; flex-shrink:0;">🏪</div>
                    <div><strong>Choose a Store</strong><br><span style="color:#6b7280;">Tap a store on the home screen to open its shopping list.</span></div>
                </div>
                <div style="display:flex; gap:12px; margin-bottom:16px;">
                    <div style="font-size:24px; flex-shrink:0;">🗂️</div>
                    <div><strong>Add Items</strong><br><span style="color:#6b7280;">Tap an aisle, then tap products to add them to your list.</span></div>
                </div>
                <div style="display:flex; gap:12px; margin-bottom:16px;">
                    <div style="font-size:24px; flex-shrink:0;">⭐</div>
                    <div><strong>Favourites</strong><br><span style="color:#6b7280;">Tap the star next to any product to save it for quick access later.</span></div>
                </div>
                <div style="display:flex; gap:12px; margin-bottom:16px;">
                    <div style="font-size:24px; flex-shrink:0;">🛒</div>
                    <div><strong>Shopping Mode</strong><br><span style="color:#6b7280;">Tap the cart icon at the bottom to enter shopping mode.</span></div>
                </div>
                <div style="display:flex; gap:12px; margin-bottom:20px;">
                    <div style="font-size:24px; flex-shrink:0;">🔄</div>
                    <div><strong>Reorder Aisles</strong><br><span style="color:#6b7280;">Long-press an aisle and drag it to reorder.</span></div>
                </div>
            </div>
            <div class="modal-actions">
                <button class="modal-btn cancel" onclick="Utils.closeModal()">${t('cancel')}</button>
            </div>`;
        overlay.classList.add('show');
    },

    showUpgradePrompt() {
        // Private build — no upgrade needed
        Utils.showToast('🏠 Private build — full access!');
    },
});
