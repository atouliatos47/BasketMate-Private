// ===================================================
// js/household-flow.js — Household creation and joining
// ===================================================
Object.assign(App, {

    showHouseholdSetup() {
        const splash = document.getElementById('splashScreen');
        if (splash) { splash.classList.add('fade-out'); setTimeout(() => { splash.style.display = 'none'; }, 600); }

        const overlay = document.getElementById('modalOverlay');
        const modal = document.getElementById('modal');

        modal.innerHTML = `
            <div style="text-align:center;padding:8px 0 16px;">
                <div style="font-size:48px;margin-bottom:12px;">🛒</div>
                <h2 style="margin:0 0 6px;font-size:22px;color:#1a1a2e;">${t('welcomeToBasketMate')}</h2>
                <p style="color:#6b7280;font-size:14px;margin:0 0 24px;">${t('createOrJoin').replace('\n', '<br>')}</p>
                <button onclick="App.createHousehold()" style="width:100%;padding:14px;background:#005EA5;color:white;border:none;border-radius:12px;font-size:16px;font-weight:700;cursor:pointer;margin-bottom:12px;">
                    ${t('createNewHousehold')}
                </button>
                <div style="position:relative;margin-bottom:12px;">
                    <div style="height:1px;background:#e5e7eb;"></div>
                    <span style="position:absolute;top:-10px;left:50%;transform:translateX(-50%);background:white;padding:0 12px;color:#9ca3af;font-size:13px;">${t('or')}</span>
                </div>
                <div style="display:flex;gap:8px;">
                    <input type="text" id="joinCodeInput" placeholder="${t('enterHouseholdCode')}" maxlength="6"
                        style="flex:1;padding:13px 14px;border:1.5px solid #e5e7eb;border-radius:12px;font-size:16px;text-transform:uppercase;letter-spacing:2px;outline:none;text-align:center;"
                        oninput="this.value=this.value.toUpperCase()">
                    <button onclick="App.joinHousehold()" style="padding:13px 18px;background:#16a34a;color:white;border:none;border-radius:12px;font-size:15px;font-weight:700;cursor:pointer;">${t('join')}</button>
                </div>
                <p id="householdError" style="color:#dc2626;font-size:13px;margin:8px 0 0;display:none;"></p>
            </div>`;
        overlay.classList.add('show');
        overlay.onclick = null;
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
            console.error('Create household failed:', e);
            Utils.showToast('Failed to create household', true);
            const btn = document.querySelector('#modal button');
            if (btn) {
                btn.disabled = false;
                btn.textContent = t('createNewHousehold');
            }
        }
    },

    showHouseholdCode(code) {
        document.getElementById('modal').innerHTML = `
            <div style="text-align:center;padding:8px 0 16px;">
                <div style="font-size:48px;margin-bottom:12px;">🏠</div>
                <h2 style="margin:0 0 6px;font-size:22px;color:#1a1a2e;">${t('yourHouseholdCode')}</h2>
                <p style="color:#6b7280;font-size:14px;margin:0 0 20px;">${t('shareCode')}</p>
                <div style="background:#f0f9ff;border:2px solid #005EA5;border-radius:16px;padding:20px;margin-bottom:20px;">
                    <div style="font-size:36px;font-weight:900;letter-spacing:8px;color:#005EA5;font-family:monospace;">${code}</div>
                </div>
                <button onclick="App.showNameSetup()" style="width:100%;padding:14px;background:#005EA5;color:white;border:none;border-radius:12px;font-size:16px;font-weight:700;cursor:pointer;">${t('next')}</button>
            </div>`;
    },

    showNameSetup() {
        document.getElementById('modal').innerHTML = `
            <div style="text-align:center;padding:8px 0 16px;">
                <div style="font-size:48px;margin-bottom:12px;">👤</div>
                <h2 style="margin:0 0 6px;font-size:22px;color:#1a1a2e;">${t('whatsYourName')}</h2>
                <p style="color:#6b7280;font-size:14px;margin:0 0 20px;">${t('nameSoFamily')}</p>
                <input type="text" id="memberNameInput" placeholder="${t('namePlaceholder')}" maxlength="20"
                    style="width:100%;padding:14px;border:1.5px solid #e5e7eb;border-radius:12px;font-size:18px;outline:none;text-align:center;margin-bottom:16px;box-sizing:border-box;">
                <p id="nameError" style="color:#dc2626;font-size:13px;margin:0 0 12px;display:none;">Please enter your name.</p>
                <button onclick="App.saveMemberName()" style="width:100%;padding:14px;background:#005EA5;color:white;border:none;border-radius:12px;font-size:16px;font-weight:700;cursor:pointer;">${t('letsGo')}</button>
            </div>`;
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
            Utils.showToast('Joined household! 🏠');
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
        overlay.addEventListener('click', (e) => { if (e.target === overlay) Utils.closeModal(); });

        API.connectSSE();
        API.startKeepAlive();
        setTimeout(() => this.setupPushNotifications(), 6000);
    }
});