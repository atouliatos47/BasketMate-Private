// ===================================================
// js/push-notifications.js — Push notifications only
// ===================================================
Object.assign(App, {

    async setupPushNotifications() {
        if (!('Notification' in window) || !('serviceWorker' in navigator)) return;
        if (Notification.permission === 'denied') return;
        if (!API.householdId) {
            console.warn('Push setup skipped: No householdId');
            return;
        }

        await new Promise(resolve => setTimeout(resolve, 2500));

        try {
            const permission = await Notification.requestPermission();
            if (permission !== 'granted') return;

            const reg = await navigator.serviceWorker.ready;
            const r = await fetch('/push/vapid-key');
            if (!r.ok) throw new Error('Failed to get VAPID key');

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

            console.log('✅ Push notifications enabled');
        } catch (e) {
            console.log('Push setup failed (non-critical):', e.message || e);
        }
    },

    urlBase64ToUint8Array(base64String) {
        const padding = '='.repeat((4 - base64String.length % 4) % 4);
        const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
        const rawData = window.atob(base64);
        return new Uint8Array([...rawData].map(c => c.charCodeAt(0)));
    }
});