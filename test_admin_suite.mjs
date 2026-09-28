// test_admin_suite.mjs - Verification for Onxy Gym Admin Profile & Auth Persistence
import crypto from 'crypto';
import pg from 'pg';

const API_BASE = 'http://localhost:3001/api';
const FRONTEND_BASE = 'http://localhost:3000';
const JWT_SECRET = process.env.JWT_SECRET || 'unsafe-local-only';
const REAL_ADMIN_EMAIL = 'bearrbicepss@gmail.com';
const REAL_ADMIN_ID = '831a1c6b-2279-493e-af36-fbb6d391b349';

function signJwt(payload, secret) {
  const header = Buffer.from(JSON.stringify({ alg: 'HS256', typ: 'JWT' })).toString('base64url');
  const body = Buffer.from(JSON.stringify(payload)).toString('base64url');
  const signature = crypto.createHmac('sha256', secret).update(`${header}.${body}`).digest('base64url');
  return `${header}.${body}.${signature}`;
}

let testsPassed = 0;
let testsFailed = 0;

function assert(condition, message) {
  if (!condition) {
    console.error(`  ❌ FAILED: ${message}`);
    testsFailed++;
    throw new Error(message);
  } else {
    console.log(`  ✓ PASSED: ${message}`);
    testsPassed++;
  }
}

async function run() {
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('ONXY GYM COMPREHENSIVE VERIFICATION SUITE');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  // Generate valid signed JWT for real ADMIN
  const now = Math.floor(Date.now() / 1000);
  const adminToken = signJwt({ sub: REAL_ADMIN_ID, role: 'ADMIN', iat: now, exp: now + 3600 }, JWT_SECRET);

  // -----------------------------------------------------------------
  // TEST A: ADMIN Authentication & No Profile Not Found
  // -----------------------------------------------------------------
  console.log('[TEST A] Admin Authentication Verification');
  {
    const meRes = await fetch(`${API_BASE}/auth/me`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    assert(meRes.status === 200, `/api/auth/me returned 200 for real ADMIN`);
    const meData = await meRes.json();
    assert(meData.email === REAL_ADMIN_EMAIL, `Authenticated as real admin email: ${REAL_ADMIN_EMAIL}`);
    assert(meData.role === 'ADMIN', `User role is ADMIN`);
  }

  // -----------------------------------------------------------------
  // TEST B: Admin Profile (No Client Row in DB)
  // -----------------------------------------------------------------
  console.log('\n[TEST B] Admin Profile (No "Profile not found" error)');
  {
    const profileRes = await fetch(`${API_BASE}/users/me/profile`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    assert(profileRes.status === 200, `GET /api/users/me/profile returned 200 OK for ADMIN without client row`);
    const profileData = await profileRes.json();
    assert(profileData.user.id === REAL_ADMIN_ID, `Profile user ID matches real ADMIN ID`);
    assert(profileData.user.email === REAL_ADMIN_EMAIL, `Profile email matches real ADMIN email`);
    assert(profileData.user.role === 'ADMIN', `Profile user role is ADMIN`);
    assert(profileData.weightKg === null, `weightKg is null without client row (no error thrown)`);
    assert(profileData.heightCm === null, `heightCm is null without client row (no error thrown)`);
    assert(profileData.dietType === null, `dietType is null without client row (no error thrown)`);
  }

  // -----------------------------------------------------------------
  // TEST C: Logout Invalidates Authentication Mechanism
  // -----------------------------------------------------------------
  console.log('\n[TEST C] Logout Invalidates Authentication Mechanism');
  {
    const sessionToken = signJwt({ sub: REAL_ADMIN_ID, role: 'ADMIN', session: 'logout-test', iat: now, exp: now + 3600 }, JWT_SECRET);
    
    // First confirm it works
    const check1 = await fetch(`${API_BASE}/auth/me`, {
      headers: { Authorization: `Bearer ${sessionToken}` },
    });
    assert(check1.status === 200, `Session is valid before logout`);

    // Call logout
    const logoutRes = await fetch(`${API_BASE}/auth/logout`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${sessionToken}` },
    });
    assert(logoutRes.status === 201 || logoutRes.status === 200, `POST /api/auth/logout returned success`);
    
    // Check Set-Cookie clears cookie
    const setCookie = logoutRes.headers.get('set-cookie');
    assert(setCookie && setCookie.includes('onxy_auth_token='), `Logout Set-Cookie header clears onxy_auth_token`);

    // Now call /auth/me with the revoked token
    const check2 = await fetch(`${API_BASE}/auth/me`, {
      headers: { Authorization: `Bearer ${sessionToken}` },
    });
    assert(check2.status === 401, `GET /api/auth/me with revoked token returns 401 Unauthorized`);

    // Call /auth/me without any credentials
    const check3 = await fetch(`${API_BASE}/auth/me`);
    assert(check3.status === 401, `GET /api/auth/me without credentials returns 401 Unauthorized`);
  }

  // -----------------------------------------------------------------
  // TEST D: Browser Back Protection & Route Middleware
  // -----------------------------------------------------------------
  console.log('\n[TEST D] Browser Back & Middleware Route Protection');
  {
    // Logged out GET /admin should redirect to /auth/login
    const adminPageRes = await fetch(`${FRONTEND_BASE}/admin`, {
      redirect: 'manual',
    });
    assert(
      adminPageRes.status === 307 || adminPageRes.status === 302,
      `Unauthenticated GET /admin responds with redirect status (${adminPageRes.status}) to /auth/login`
    );
    const location = adminPageRes.headers.get('location');
    assert(location && location.includes('/auth/login'), `Redirect location targets /auth/login: ${location}`);

    // Verify Cache-Control: no-store headers on sensitive pages to eliminate bfcache exposure
    const ccAdmin = adminPageRes.headers.get('cache-control');
    assert(ccAdmin && ccAdmin.includes('no-store'), `/admin response has Cache-Control: no-store (${ccAdmin})`);

    const clientDashRes = await fetch(`${FRONTEND_BASE}/dashboard/client`, { redirect: 'manual' });
    const ccClient = clientDashRes.headers.get('cache-control');
    assert(ccClient && ccClient.includes('no-store'), `/dashboard/client has Cache-Control: no-store`);

    const profilePageRes = await fetch(`${FRONTEND_BASE}/profile`, { redirect: 'manual' });
    const ccProfile = profilePageRes.headers.get('cache-control');
    assert(ccProfile && ccProfile.includes('no-store'), `/profile has Cache-Control: no-store`);
  }

  // -----------------------------------------------------------------
  // TEST E: USER Cannot Access ADMIN
  // -----------------------------------------------------------------
  console.log('\n[TEST E] Normal USER Cannot Access Admin');
  const testUserEmail = `tester_${Date.now()}@test.com`;
  let userToken = null;
  let testUserId = null;
  {
    // Register temporary USER
    const regRes = await fetch(`${API_BASE}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: testUserEmail,
        fullName: 'Test User',
        password: 'TestPassword123!',
      }),
    });
    assert(regRes.status === 201, `Register temporary user returned 201 Created`);
    const regData = await regRes.json();
    userToken = regData.accessToken;
    testUserId = regData.user.id;
    assert(regData.user.role === 'USER', `Registered user has role USER`);

    // Verify Cookie set on register
    const regCookie = regRes.headers.get('set-cookie');
    assert(regCookie && regCookie.includes('onxy_auth_token='), `Registration set onxy_auth_token cookie`);

    // USER attempts to access GET /api/admin/users
    const adminUsersRes = await fetch(`${API_BASE}/admin/users`, {
      headers: { Authorization: `Bearer ${userToken}` },
    });
    assert(adminUsersRes.status === 403, `USER accessing GET /api/admin/users is denied with 403 Forbidden`);

    // USER attempts to access GET /api/admin/conversations
    const adminConvosRes = await fetch(`${API_BASE}/admin/conversations`, {
      headers: { Authorization: `Bearer ${userToken}` },
    });
    assert(adminConvosRes.status === 403, `USER accessing GET /api/admin/conversations is denied with 403 Forbidden`);
  }

  // -----------------------------------------------------------------
  // TEST F: USER Profile Functionality
  // -----------------------------------------------------------------
  console.log('\n[TEST F] USER Profile Behavior & Updates');
  {
    // View profile
    const getProf = await fetch(`${API_BASE}/users/me/profile`, {
      headers: { Authorization: `Bearer ${userToken}` },
    });
    assert(getProf.status === 200, `USER profile loads with 200 OK`);
    const profData = await getProf.json();
    assert(profData.user.email === testUserEmail, `USER profile has correct email`);

    // Update profile
    const updateProf = await fetch(`${API_BASE}/users/me/profile`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${userToken}`,
      },
      body: JSON.stringify({
        weightKg: 75.5,
        heightCm: 180.0,
        dietType: 'VEGETARIAN',
      }),
    });
    assert(updateProf.status === 200, `PATCH /api/users/me/profile returned 200 OK`);
    const updatedData = await updateProf.json();
    assert(Number(updatedData.weightKg) === 75.5, `Updated weightKg is 75.5`);
    assert(Number(updatedData.heightCm) === 180.0, `Updated heightCm is 180.0`);
    assert(updatedData.dietType === 'VEGETARIAN', `Updated dietType is VEGETARIAN`);

    // Update to NON_VEGETARIAN
    const updateProf2 = await fetch(`${API_BASE}/users/me/profile`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${userToken}`,
      },
      body: JSON.stringify({
        weightKg: 76.0,
        heightCm: 180.0,
        dietType: 'NON_VEGETARIAN',
      }),
    });
    assert(updateProf2.status === 200, `Update to NON_VEGETARIAN returned 200 OK`);
    const updatedData2 = await updateProf2.json();
    assert(updatedData2.dietType === 'NON_VEGETARIAN', `Diet type updated to NON_VEGETARIAN`);
  }

  // -----------------------------------------------------------------
  // TEST G: API Authorization Matrix
  // -----------------------------------------------------------------
  console.log('\n[TEST G] API Authorization Matrix');
  {
    // 1. Unauthenticated -> 401
    const noAuth = await fetch(`${API_BASE}/admin/users`);
    assert(noAuth.status === 401, `Unauthenticated GET /api/admin/users returns 401 Unauthorized`);

    // 2. USER -> 403
    const userAuth = await fetch(`${API_BASE}/admin/users`, {
      headers: { Authorization: `Bearer ${userToken}` },
    });
    assert(userAuth.status === 403, `USER GET /api/admin/users returns 403 Forbidden`);

    // 3. ADMIN -> 200
    const adminAuth = await fetch(`${API_BASE}/admin/users`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    assert(adminAuth.status === 200, `ADMIN GET /api/admin/users returns 200 OK`);
    const adminData = await adminAuth.json();
    assert(Array.isArray(adminData), `ADMIN successfully received user list (array length ${adminData.length})`);
  }

  // -----------------------------------------------------------------
  // CLEANUP: Clean up temporary test user
  // -----------------------------------------------------------------
  console.log('\n[CLEANUP] Removing temporary test user');
  {
    const client = new pg.Client({ connectionString: process.env.DATABASE_URL });
    await client.connect();
    if (testUserId) {
      await client.query('DELETE FROM users WHERE id = $1', [testUserId]);
      console.log(`  ✓ Cleaned up temporary test user ${testUserEmail}`);
    }
    // Verify real admin is untouched
    const checkAdmin = await client.query('SELECT id, email, role FROM users WHERE email = $1', [REAL_ADMIN_EMAIL]);
    assert(checkAdmin.rows.length === 1, `Authoritative production ADMIN ${REAL_ADMIN_EMAIL} is intact`);
    assert(checkAdmin.rows[0].role === 'ADMIN', `Authoritative production ADMIN has role ADMIN`);
    await client.end();
  }

  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log(`SUITE RESULTS: ${testsPassed} PASSED, ${testsFailed} FAILED`);
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  if (testsFailed > 0) {
    process.exit(1);
  }
}

run().catch((e) => {
  console.error('Fatal error in test suite:', e);
  process.exit(1);
});
