// ===================================================
// settings.js — Settings panel
// ===================================================

Object.assign(App, {

    showSettings() {
        const panel = document.getElementById('settingsPanel');
        const overlay = document.getElementById('settingsOverlay');
        if (!panel || !overlay) return;

        const nameSub = document.getElementById('currentNameSub');
        if (nameSub) nameSub.textContent = `Signed in as ${API.memberName || 'User'}`;

        const isSilent = localStorage.getItem('bm_silent') === 'true';
        const toggle = document.getElementById('silentModeToggle');
        const thumb = document.getElementById('silentModeThumb');
        const sub = document.getElementById('silentModeSub');
        if (toggle) toggle.style.background = isSilent ? '#005EA5' : '#e5e7eb';
        if (thumb) thumb.style.left = isSilent ? '22px' : '2px';
        if (sub) sub.textContent = isSilent ? 'Sounds are muted' : 'Mute item ping sounds';

        panel.classList.add('open');
        overlay.classList.add('open');
    },

    closeSettings() {
        const panel = document.getElementById('settingsPanel');
        const overlay = document.getElementById('settingsOverlay');
        if (panel) panel.classList.remove('open');
        if (overlay) overlay.classList.remove('open');
    },

    showChangeName() {
        this.closeSettings();
        const modal = document.getElementById('modal');
        const overlay = document.getElementById('modalOverlay');
        modal.innerHTML = `
            <div style="text-align:center;padding:8px 0 16px;">
                <div style="font-size:40px;margin-bottom:10px;">👤</div>
                <h3 style="margin:0 0 6px;">Change Your Name</h3>
                <p style="color:#6b7280;font-size:14px;margin:0 0 18px;">This is shown when you add items to the list.</p>
                <input type="text" id="changeNameInput" value="${Utils.escapeHtml(API.memberName || '')}" maxlength="20"
                    style="width:100%;padding:14px;border:1.5px solid #e5e7eb;border-radius:12px;font-size:18px;outline:none;text-align:center;margin-bottom:16px;box-sizing:border-box;">
                <div class="modal-actions">
                    <button class="modal-btn cancel" onclick="Utils.closeModal()">Cancel</button>
                    <button class="modal-btn confirm" onclick="App.saveChangedName()">Save</button>
                </div>
            </div>`;
        overlay.classList.add('show');
        setTimeout(() => document.getElementById('changeNameInput')?.select(), 100);
    },

    saveChangedName() {
        const input = document.getElementById('changeNameInput');
        const name = input ? input.value.trim() : '';
        if (!name) return;
        localStorage.setItem('bm_member_name', name);
        API.memberName = name;
        Utils.closeModal();
        Utils.showToast(`Name updated to ${name} ✓`);
    },

    showMyCode() {
        this.closeSettings();
        const modal = document.getElementById('modal');
        const overlay = document.getElementById('modalOverlay');
        modal.innerHTML = `
            <div style="text-align:center;padding:8px 0 16px;">
                <div style="font-size:40px;margin-bottom:10px;">🏠</div>
                <h3 style="margin:0 0 6px;">Your Household Code</h3>
                <p style="color:#6b7280;font-size:14px;margin:0 0 18px;">Share this with family to join your list.</p>
                <div style="background:#f0f9ff;border:2px solid #005EA5;border-radius:16px;padding:18px;margin-bottom:16px;">
                    <div style="font-size:32px;font-weight:900;letter-spacing:8px;color:#005EA5;font-family:monospace;">${API.householdCode || '------'}</div>
                </div>
                <button class="modal-btn cancel" onclick="Utils.closeModal()">Close</button>
            </div>`;
        overlay.classList.add('show');
    },

    showSwitchHousehold() {
        this.closeSettings();
        const modal = document.getElementById('modal');
        const overlay = document.getElementById('modalOverlay');
        modal.innerHTML = `
            <div style="text-align:center;padding:8px 0 16px;">
                <div style="font-size:40px;margin-bottom:10px;">🔄</div>
                <h3 style="margin:0 0 6px;">Switch Household</h3>
                <p style="color:#6b7280;font-size:14px;margin:0 0 18px;">Enter a household code to switch.</p>
                <input type="text" id="switchCodeInput" placeholder="Enter household code" maxlength="6"
                    style="width:100%;padding:14px;border:1.5px solid #e5e7eb;border-radius:12px;font-size:18px;outline:none;text-align:center;letter-spacing:4px;text-transform:uppercase;margin-bottom:8px;box-sizing:border-box;"
                    oninput="this.value=this.value.toUpperCase()">
                <p id="switchError" style="color:#dc2626;font-size:13px;margin:0 0 12px;display:none;"></p>
                <div class="modal-actions">
                    <button class="modal-btn cancel" onclick="Utils.closeModal()">Cancel</button>
                    <button class="modal-btn confirm" onclick="App.confirmSwitchHousehold()">Switch</button>
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

        const btn = document.querySelector('#modal .modal-btn.confirm');
        if (btn) { btn.disabled = true; btn.textContent = 'Switching...'; }

        try {
            await API.joinHousehold(code);
            Utils.closeModal();
            API.connectSSE();
            Utils.showToast('Switched household! 🏠');
        } catch(e) {
            if (btn) { btn.disabled = false; btn.textContent = 'Switch'; }
            input.style.borderColor = '#dc2626';
            error.textContent = 'Household not found. Check the code.';
            error.style.display = 'block';
        }
    },

    toggleSilentMode() {
        const isSilent = localStorage.getItem('bm_silent') === 'true';
        localStorage.setItem('bm_silent', String(!isSilent));

        const toggle = document.getElementById('silentModeToggle');
        const thumb = document.getElementById('silentModeThumb');
        const sub = document.getElementById('silentModeSub');

        if (toggle) toggle.style.background = !isSilent ? '#005EA5' : '#e5e7eb';
        if (thumb) thumb.style.left = !isSilent ? '22px' : '2px';
        if (sub) sub.textContent = !isSilent ? 'Sounds are muted' : 'Mute item ping sounds';

        Utils.showToast(!isSilent ? '🔇 Silent mode on' : '🔔 Silent mode off');
    },

    showHelp() {
        this.closeSettings();
        const modal = document.getElementById('modal');
        const overlay = document.getElementById('modalOverlay');
        modal.innerHTML = `
            <div style="padding:4px 0 8px;max-height:70vh;overflow-y:auto;">
                <h3 style="margin:0 0 16px;font-size:18px;color:#1a1a2e;">📖 How to Use BasketMate</h3>
                <!-- Your full help content here -->
                <button class="modal-btn confirm" style="width:100%;margin-top:16px;" onclick="Utils.closeModal()">Got it! 👍</button>
            </div>`;
        overlay.classList.add('show');
    }
});