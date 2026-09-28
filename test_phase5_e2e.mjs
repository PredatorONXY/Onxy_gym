// test_phase5_e2e.mjs
const API_URL = 'http://localhost:3001/api';
const FRONTEND_URL = 'http://localhost:3000';

const results = [];

function assert(condition, message) {
  if (!condition) {
    throw new Error(`Assertion Failed: ${message}`);
  }
}

async function recordTest(name, fn) {
  try {
    await fn();
    results.push({ name, status: 'PASSED' });
    console.log(`✓ [PASS] ${name}`);
  } catch (err) {
    results.push({ name, status: 'FAILED', error: err.message });
    console.error(`✗ [FAIL] ${name}:`, err.message);
  }
}

async function api(path, options = {}, token = null) {
  const headers = {
    'Content-Type': 'application/json',
    ...(options.headers || {}),
  };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  const res = await fetch(`${API_URL}${path}`, { ...options, headers });
  let data = null;
  const contentType = res.headers.get('content-type');
  if (contentType && contentType.includes('application/json')) {
    data = await res.json();
  } else {
    data = await res.text();
  }
  return { status: res.status, ok: res.ok, data };
}

async function runAll() {
  console.log('\n========================================');
  console.log('STARTING PHASE 5 LOCAL END-TO-END TESTS');
  console.log('========================================\n');

  const stamp = Date.now().toString().slice(-6);
  const emailA = `usera_e2e_${stamp}@test.com`;
  const emailB = `userb_e2e_${stamp}@test.com`;
  const password = 'Password123!';

  let tokenA = null;
  let userAId = null;
  let tokenB = null;
  let userBId = null;
  let adminToken = null;
  let clientAId = null;
  let clientBId = null;
  let chartA1Id = null;
  let chartBId = null;
  let convoAId = null;
  let convoBId = null;

  // 1. USER TEST
  await recordTest('1.1 User A: Register', async () => {
    const res = await api('/auth/register', {
      method: 'POST',
      body: JSON.stringify({ fullName: 'Alice Athlete', email: emailA, password }),
    });
    assert(res.ok, `Register returned ${res.status}: ${JSON.stringify(res.data)}`);
    assert(res.data.accessToken, 'Missing accessToken');
    assert(res.data.user.role === 'USER', 'Registered role is not USER');
    tokenA = res.data.accessToken;
    userAId = res.data.user.id;
  });

  await recordTest('1.2 User A: Login', async () => {
    const res = await api('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email: emailA, password }),
    });
    assert(res.ok, `Login failed: ${res.status}`);
    assert(res.data.accessToken, 'Missing accessToken on login');
    tokenA = res.data.accessToken;
  });

  await recordTest('1.3 User A: /auth/me', async () => {
    const res = await api('/auth/me', { method: 'GET' }, tokenA);
    assert(res.ok, `/auth/me failed: ${res.status}`);
    assert(res.data.id === userAId, 'User ID mismatch');
    assert(res.data.email === emailA, 'Email mismatch');
  });

  await recordTest('1.4 User A: Get Profile', async () => {
    const res = await api('/users/me/profile', { method: 'GET' }, tokenA);
    assert(res.ok, `Get profile failed: ${res.status}`);
    assert(res.data.user.id === userAId, 'Profile user ID mismatch');
  });

  await recordTest('1.5 User A: Update Profile', async () => {
    const res = await api('/users/me/profile', {
      method: 'PATCH',
      body: JSON.stringify({ weightKg: 68.5, heightCm: 172.0, dietType: 'VEGETARIAN' }),
    }, tokenA);
    assert(res.ok, `Update profile failed: ${res.status}`);
    assert(Number(res.data.weightKg) === 68.5, 'Weight not updated');
    assert(res.data.dietType === 'VEGETARIAN', 'Diet type not updated');
  });

  // 2. ADMIN SETUP & INITIAL CHART CREATION FOR USERS
  await recordTest('2.1 Admin: Login & Setup', async () => {
    let res = await api('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email: 'admin@onxygym.com', password: 'AdminPassword123!' }),
    });
    if (!res.ok) {
      const crypto = await import('crypto');
      const header = Buffer.from(JSON.stringify({ alg: 'HS256', typ: 'JWT' })).toString('base64url');
      const now = Math.floor(Date.now() / 1000);
      const body = Buffer.from(JSON.stringify({ sub: '831a1c6b-2279-493e-af36-fbb6d391b349', role: 'ADMIN', iat: now, exp: now + 3600 })).toString('base64url');
      const sig = crypto.createHmac('sha256', process.env.JWT_SECRET || 'unsafe-local-only').update(`${header}.${body}`).digest('base64url');
      adminToken = `${header}.${body}.${sig}`;
      const meRes = await api('/auth/me', { method: 'GET' }, adminToken);
      assert(meRes.ok, `Admin me check failed: ${meRes.status}`);
      assert(meRes.data.role === 'ADMIN', 'Role is not ADMIN');
    } else {
      assert(res.data.user.role === 'ADMIN', 'Role is not ADMIN');
      adminToken = res.data.accessToken;
    }

    // Get client IDs for User A and B
    const clientsRes = await api('/clients', { method: 'GET' }, adminToken);
    assert(clientsRes.ok, `Get clients failed: ${clientsRes.status}`);
    const clientA = clientsRes.data.clients.find(c => c.userId === userAId);
    assert(clientA, 'Client A not found in clients list');
    clientAId = clientA.id;
  });

  await recordTest('2.2 Admin: Create Chart for User A', async () => {
    const res = await api('/diet-charts', {
      method: 'POST',
      body: JSON.stringify({
        clientId: clientAId,
        title: 'Plan A1 - Hypertrophy Fuel',
        description: 'High carb workout plan',
        active: true,
        planData: { dailyCalories: 2400, proteinGrams: 160 },
      }),
    }, adminToken);
    assert(res.ok, `Create chart failed: ${res.status}: ${JSON.stringify(res.data)}`);
    chartA1Id = res.data.id;
  });

  await recordTest('1.6 User A: View Own Diet Chart & History', async () => {
    const res = await api('/diet-charts/me', { method: 'GET' }, tokenA);
    assert(res.ok, `View charts failed: ${res.status}`);
    assert(Array.isArray(res.data) && res.data.length >= 1, 'No charts returned');
    assert(res.data.some(c => c.id === chartA1Id), 'Chart A1 missing from list');
  });

  await recordTest('1.7 User A: Ask Question', async () => {
    const res = await api('/questions/conversations', {
      method: 'POST',
      body: JSON.stringify({
        subject: 'Pre-workout carbs query',
        dietChartId: chartA1Id,
        body: 'How many minutes before workout should I consume meal 1?',
      }),
    }, tokenA);
    assert(res.ok, `Create conversation failed: ${res.status}`);
    assert(res.data.id, 'No conversation id returned');
    convoAId = res.data.id;
  });

  await recordTest('1.8 User A: Send Follow-up Message', async () => {
    const res = await api(`/questions/conversations/${convoAId}/messages`, {
      method: 'POST',
      body: JSON.stringify({ body: 'Also wondering if rice cakes are acceptable.' }),
    }, tokenA);
    assert(res.ok, `Send message failed: ${res.status}`);
    assert(res.data.body.includes('rice cakes'), 'Message body mismatch');
  });

  await recordTest('1.9 User A: Logout & Re-login', async () => {
    const res = await api('/auth/logout', { method: 'POST' }, tokenA);
    assert(res.ok, `Logout failed: ${res.status}`);
    const loginRes = await api('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email: emailA, password }),
    });
    assert(loginRes.ok, `User A re-login failed: ${loginRes.status}`);
    tokenA = loginRes.data.accessToken;
  });

  // 3. SECOND USER & IDOR SECURITY TESTS
  await recordTest('3.1 User B: Register', async () => {
    const res = await api('/auth/register', {
      method: 'POST',
      body: JSON.stringify({ fullName: 'Bob Builder', email: emailB, password }),
    });
    assert(res.ok, `User B register failed: ${res.status}`);
    tokenB = res.data.accessToken;
    userBId = res.data.user.id;

    // Get client B ID
    const clientsRes = await api('/clients', { method: 'GET' }, adminToken);
    const clientB = clientsRes.data.clients.find(c => c.userId === userBId);
    assert(clientB, 'Client B not found');
    clientBId = clientB.id;

    // Admin creates chart for B
    const chartRes = await api('/diet-charts', {
      method: 'POST',
      body: JSON.stringify({
        clientId: clientBId,
        title: 'Plan B - Fat Loss',
        active: true,
        planData: { dailyCalories: 1800 },
      }),
    }, adminToken);
    chartBId = chartRes.data.id;

    // User B creates a conversation
    const convoRes = await api('/questions/conversations', {
      method: 'POST',
      body: JSON.stringify({
        subject: 'User B private question',
        dietChartId: chartBId,
        body: 'Is cardio recommended in fasting state?',
      }),
    }, tokenB);
    convoBId = convoRes.data.id;
  });

  await recordTest('3.2 IDOR: User A CANNOT access User B diet chart', async () => {
    const res = await api(`/diet-charts/${chartBId}`, { method: 'GET' }, tokenA);
    assert(res.status === 404 || res.status === 403, `Expected 404/403 but got ${res.status}`);
  });

  await recordTest('3.3 IDOR: User A CANNOT access User B conversation', async () => {
    const res = await api(`/questions/conversations/${convoBId}`, { method: 'GET' }, tokenA);
    assert(res.status === 403 || res.status === 404, `Expected 403/404 but got ${res.status}`);
  });

  await recordTest('3.4 IDOR: User A CANNOT message User B conversation', async () => {
    const res = await api(`/questions/conversations/${convoBId}/messages`, {
      method: 'POST',
      body: JSON.stringify({ body: 'Malicious message from User A' }),
    }, tokenA);
    assert(res.status === 403 || res.status === 404, `Expected 403/404 but got ${res.status}`);
  });

  // 4. ADMIN & AUTHORIZATION TESTS
  await recordTest('4.1 Admin: List Users', async () => {
    const res = await api('/admin/users', { method: 'GET' }, adminToken);
    assert(res.ok, `List users failed: ${res.status}`);
    assert(Array.isArray(res.data), 'Expected array of users');
    assert(res.data.some(u => u.id === userAId), 'User A missing in admin users');
  });

  await recordTest('4.2 Admin: View User Details', async () => {
    const res = await api(`/admin/users/${userAId}`, { method: 'GET' }, adminToken);
    assert(res.ok, `Get user details failed: ${res.status}`);
    assert(res.data.id === userAId, 'User ID mismatch');
    assert(res.data.client, 'Client details missing');
  });

  await recordTest('4.3 Admin: View All Conversations', async () => {
    const res = await api('/admin/conversations', { method: 'GET' }, adminToken);
    assert(res.ok, `List conversations failed: ${res.status}`);
    assert(Array.isArray(res.data), 'Expected array');
    const ids = res.data.map(c => c.id);
    assert(ids.includes(convoAId), 'Convo A missing');
    assert(ids.includes(convoBId), 'Convo B missing');
  });

  await recordTest('4.4 Admin: Reply to Client Conversation', async () => {
    const res = await api(`/admin/conversations/${convoAId}/reply`, {
      method: 'POST',
      body: JSON.stringify({ body: 'Consume meal 1 approximately 60-90 minutes prior to lifting.' }),
    }, adminToken);
    assert(res.ok, `Admin reply failed: ${res.status}`);
    assert(res.data.authorRole === 'ADMIN', 'Message authorRole is not ADMIN');
  });

  await recordTest('4.5 Authorization: User CANNOT access Admin endpoints', async () => {
    const resUsers = await api('/admin/users', { method: 'GET' }, tokenA);
    assert(resUsers.status === 403, `Expected 403 Forbidden, got ${resUsers.status}`);

    const resReply = await api(`/admin/conversations/${convoAId}/reply`, {
      method: 'POST',
      body: JSON.stringify({ body: 'Fake reply' }),
    }, tokenA);
    assert(resReply.status === 403, `Expected 403 Forbidden, got ${resReply.status}`);
  });

  // 5. DIET HISTORY PRESERVATION TEST
  await recordTest('5.1 Diet History: Plan 1, Plan 2, Plan 3 All Preserved', async () => {
    // Create Plan 2 for User A
    const res2 = await api('/diet-charts', {
      method: 'POST',
      body: JSON.stringify({
        clientId: clientAId,
        title: 'Plan A2 - Summer Shred',
        active: false,
        planData: { dailyCalories: 2100 },
      }),
    }, adminToken);
    assert(res2.ok, `Plan 2 creation failed: ${res2.status}`);
    const chartA2Id = res2.data.id;

    // Create Plan 3 for User A
    const res3 = await api('/diet-charts', {
      method: 'POST',
      body: JSON.stringify({
        clientId: clientAId,
        title: 'Plan A3 - Powerbuilding Peak',
        active: true,
        planData: { dailyCalories: 2600 },
      }),
    }, adminToken);
    assert(res3.ok, `Plan 3 creation failed: ${res3.status}`);
    const chartA3Id = res3.data.id;

    // Verify all 3 charts exist for User A
    const chartsRes = await api('/diet-charts/me', { method: 'GET' }, tokenA);
    assert(chartsRes.ok, `Get charts failed: ${chartsRes.status}`);
    const userAChartIds = chartsRes.data.map(c => c.id);

    assert(userAChartIds.includes(chartA1Id), 'Plan 1 was overwritten or deleted!');
    assert(userAChartIds.includes(chartA2Id), 'Plan 2 was overwritten or deleted!');
    assert(userAChartIds.includes(chartA3Id), 'Plan 3 is missing!');
    assert(chartsRes.data.length >= 3, `Expected at least 3 plans, found ${chartsRes.data.length}`);
  });

  // 6. FRONTEND REGRESSION TEST
  await recordTest('6.1 Frontend: Landing Page (/)', async () => {
    const res = await fetch(FRONTEND_URL);
    assert(res.ok, `Landing page failed with ${res.status}`);
    const html = await res.text();
    assert(html.includes('ft.hxrry'), 'Missing branding ft.hxrry');
  });

  await recordTest('6.2 Frontend: Auth Login Page (/auth/login)', async () => {
    const res = await fetch(`${FRONTEND_URL}/auth/login`);
    assert(res.ok, `Login page failed with ${res.status}`);
    const html = await res.text();
    assert(html.includes('Welcome Back') || html.includes('Sign in'), 'Missing login text');
  });

  await recordTest('6.3 Frontend: Auth Register Page (/auth/register)', async () => {
    const res = await fetch(`${FRONTEND_URL}/auth/register`);
    assert(res.ok, `Register page failed with ${res.status}`);
    const html = await res.text();
    assert(html.includes('Create Account'), 'Missing register text');
  });

  await recordTest('6.4 Frontend: Verify Email Page (/auth/verify-email)', async () => {
    const res = await fetch(`${FRONTEND_URL}/auth/verify-email`);
    assert(res.ok, `Verify email page failed with ${res.status}`);
    const html = await res.text();
    assert(html.includes('Email Verification'), 'Missing email verification text');
  });

  await recordTest('6.5 Frontend: Client Dashboard (/dashboard/client)', async () => {
    const res = await fetch(`${FRONTEND_URL}/dashboard/client`);
    assert(res.ok, `Client dashboard failed with ${res.status}`);
  });

  await recordTest('6.6 Frontend: Trainer Dashboard (/dashboard/trainer)', async () => {
    const res = await fetch(`${FRONTEND_URL}/dashboard/trainer`);
    assert(res.ok, `Trainer dashboard failed with ${res.status}`);
  });

  await recordTest('6.7 Frontend: Profile Page (/profile)', async () => {
    const res = await fetch(`${FRONTEND_URL}/profile`);
    assert(res.ok, `Profile page failed with ${res.status}`);
  });

  console.log('\n========================================');
  console.log(`PHASE 5 E2E SUMMARY: ${results.filter(r => r.status === 'PASSED').length}/${results.length} PASSED`);
  console.log('========================================\n');

  if (results.some(r => r.status === 'FAILED')) {
    process.exit(1);
  }
}

runAll().catch(e => {
  console.error('Fatal E2E runner error:', e);
  process.exit(1);
});
