// ===================================================
// routes/push.js — Push notifications (Fixed)
// ===================================================
module.exports = function(pool, getBody) {

    async function getVapidKey(req, res) {
        if (!process.env.VAPID_PUBLIC_KEY) {
            console.error('VAPID_PUBLIC_KEY environment variable is missing');
            res.writeHead(500);
            return res.end(JSON.stringify({ error: 'Push notifications not configured' }));
        }
        res.writeHead(200);
        res.end(JSON.stringify({ publicKey: process.env.VAPID_PUBLIC_KEY }));
    }

    async function subscribe(req, res) {
        try {
            const b = await getBody(req);
            const householdId = parseInt(b.householdId);

            if (!householdId) {
                res.writeHead(400);
                return res.end(JSON.stringify({ error: 'householdId required' }));
            }

            // IMPORTANT FIX: Check if the household actually exists first
            const householdCheck = await pool.query(
                'SELECT id FROM households WHERE id = $1',
                [householdId]
            );

            if (householdCheck.rows.length === 0) {
                console.warn(`Push subscribe failed: Household ${householdId} does not exist`);
                res.writeHead(404);
                return res.end(JSON.stringify({ error: 'Household not found' }));
            }

            // Now safely insert the push subscription
            await pool.query(
                `INSERT INTO push_subscriptions (household_id, endpoint, subscription)
                 VALUES ($1, $2, $3)
                 ON CONFLICT (endpoint) 
                 DO UPDATE SET 
                    subscription = $3,
                    household_id = $1,
                    updated_at = NOW()`,
                [householdId, b.subscription.endpoint, JSON.stringify(b.subscription)]
            );

            console.log(`Push subscription saved for household ${householdId}`);
            res.writeHead(201);
            res.end(JSON.stringify({ success: true }));

        } catch (e) {
            console.error('Subscribe error:', e);
            res.writeHead(500);
            res.end(JSON.stringify({ error: 'Failed to subscribe' }));
        }
    }

    async function shoppingStatus(req, res) {
        try {
            const b = await getBody(req);
            if (!b.endpoint) {
                res.writeHead(400);
                return res.end(JSON.stringify({ error: 'endpoint required' }));
            }

            await pool.query(
                'UPDATE push_subscriptions SET shopping_active = $1 WHERE endpoint = $2',
                [b.active === true, b.endpoint]
            );

            res.end(JSON.stringify({ success: true }));
        } catch (e) {
            console.error('Shopping status update error:', e);
            res.writeHead(500);
            res.end(JSON.stringify({ error: 'Failed to update status' }));
        }
    }

    return { getVapidKey, subscribe, shoppingStatus };
};