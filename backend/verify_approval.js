const http = require('http');

// Helper to make requests
function request(method, path, body = null, headers = {}) {
    return new Promise((resolve, reject) => {
        const options = {
            hostname: 'localhost',
            port: 3000,
            path: '/api' + path,
            method: method,
            headers: {
                'Content-Type': 'application/json',
                ...headers
            }
        };

        const req = http.request(options, (res) => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => {
                if (res.statusCode >= 200 && res.statusCode < 300) {
                    resolve(JSON.parse(data));
                } else {
                    reject({ statusCode: res.statusCode, body: data });
                }
            });
        });

        req.on('error', reject);

        if (body) {
            req.write(JSON.stringify(body));
        }
        req.end();
    });
}

// Mock Auth Header mechanism - if server uses it. 
// Standard server.js usually has: app.use((req, res, next) => { req.user = { id: ... } ... })
// If not, we might need to assume no auth or basic mock.
// I'll assume standard JWT or just try to hit it. If 401, I'll know.
// But earlier view (line 421) showed `app.post('/api/changes', async (req, res) => { if (!req.user) ...`
// So it DOES check req.user.

// Let's assume there is a mock middleware that sets req.user based on a header or it's hardcoded?
// I need to know how to authenticate.
// If I can't auth, I can't create a change.

// WORKAROUND: I will try to login first if I can find the login endpoint logic.
// Earlier view of server.js was truncated.
// I'll try to use a hardcoded known user ID if I can find one or insert one.
// Actually, `server.js` usually has a `req.user = ...` middleware for dev.
// If not, I'll rely on the existing 'admin@example.com' user if I can login.

async function run() {
    try {
        console.log('1. Creating a new Change...');
        // Generate random user
        const rand = Math.floor(Math.random() * 10000);
        const email = `verifier${rand}@example.com`;

        console.log(`1. Logging in/Creating user: ${email}`);

        let token;
        let userId;
        try {
            const login = await request('POST', '/auth/login', { email, password: 'password123' });
            token = login.token;
            userId = login.user.id;
            console.log('Logged in. Token/UserID:', token);
        } catch (e) {
            console.error('Login failed:', e.body || e);
            process.exit(1);
        }

        const headers = token ? { 'Authorization': `Bearer ${token}` } : {};

        // Create
        const change = await request('POST', '/changes', {
            title: 'Backend Verification Test',
            description: 'Testing approval',
            type: 'standard',
            priority: 'low'
        }, headers);
        console.log('Change created:', change.id);

        console.log('2. Approving Change...');
        // We need a user ID for approval. Using the one from change.requested_by or a hardcoded one.
        // The store sends `approved_by` in the PUT body.
        userId = change.requested_by;

        const approved = await request('PUT', `/changes/${change.id}`, {
            status: 'approved',
            approved_by: userId
        }, headers);

        console.log('3. Verifying Result...');
        if (approved.status === 'approved' && approved.approved_by === userId) {
            console.log('SUCCESS: Change status is APPROVED and approved_by is set.');
            console.log('Approved By ID:', approved.approved_by);
        } else {
            console.error('FAILURE: API did not update fields correctly.');
            console.log('Expected:', { status: 'approved', approved_by: userId });
            console.log('Actual:', { status: approved.status, approved_by: approved.approved_by });
            process.exit(1);
        }

    } catch (err) {
        console.error('Test Failed:', err);
        process.exit(1);
    }
}

run();
