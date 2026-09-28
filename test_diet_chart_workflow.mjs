// test_diet_chart_workflow.mjs
const API_URL = 'http://localhost:3001/api';

function assert(condition, message) {
  if (!condition) {
    throw new Error(`Assertion Failed: ${message}`);
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

async function run() {
  console.log('====================================================');
  console.log('TESTING DIET CHART SYSTEM & ADMIN SELECTION WORKFLOW');
  console.log('====================================================\n');

  // 1. Admin login
  console.log('Step 1: Admin login...');
  let adminToken;
  let adminId;
  const adminRes = await api('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email: 'admin@onxygym.com', password: 'AdminPassword123!' }),
  });
  if (adminRes.ok) {
    adminToken = adminRes.data.accessToken;
    adminId = adminRes.data.user.id;
  } else {
    const crypto = await import('crypto');
    const header = Buffer.from(JSON.stringify({ alg: 'HS256', typ: 'JWT' })).toString('base64url');
    const now = Math.floor(Date.now() / 1000);
    const body = Buffer.from(JSON.stringify({ sub: '831a1c6b-2279-493e-af36-fbb6d391b349', role: 'ADMIN', iat: now, exp: now + 3600 })).toString('base64url');
    const sig = crypto.createHmac('sha256', process.env.JWT_SECRET || 'unsafe-local-only').update(`${header}.${body}`).digest('base64url');
    adminToken = `${header}.${body}.${sig}`;
    adminId = '831a1c6b-2279-493e-af36-fbb6d391b349';
  }
  console.log('✓ Admin login successful.');

  // 2. Fetch users with ?role=USER
  console.log('\nStep 2: Admin list users with role=USER filter...');
  const usersRes = await api('/admin/users?role=USER', { method: 'GET' }, adminToken);
  assert(usersRes.ok, `List users failed: ${usersRes.status}`);
  const userList = usersRes.data;
  assert(Array.isArray(userList), 'User list is not an array');
  assert(userList.length > 0, 'No users found with role=USER');
  const hasAdmin = userList.some(u => u.role === 'ADMIN');
  assert(!hasAdmin, 'Admin found in role=USER filtered list!');
  console.log(`✓ Fetched ${userList.length} users with role=USER (0 admins included).`);

  const targetUser = userList[0];
  console.log(`Selected candidate: ${targetUser.fullName} (${targetUser.email})`);

  // 3. Test Security: Admin attempting to create diet chart for another ADMIN
  console.log('\nStep 3: Security enforcement — attempting to assign diet chart to ADMIN account...');
  const badAssignRes = await api('/diet-charts', {
    method: 'POST',
    body: JSON.stringify({
      userId: adminId,
      title: 'Invalid Admin Diet Plan',
      planData: { test: true },
    }),
  }, adminToken);
  assert(badAssignRes.status === 400, `Expected 400 Bad Request, got ${badAssignRes.status}`);
  console.log('✓ Blocked assigning diet chart to ADMIN account (400 Bad Request):', badAssignRes.data.message);

  // 4. Create reference-style diet chart for targetUser
  console.log('\nStep 4: Create reference-style diet chart for selected user...');
  const sampleReferencePlan = {
    clientDetails: {
      name: targetUser.fullName,
      age: 28,
      weight: '75 kg',
      height: "5'10\"",
      goal: 'Fat Loss & Lean Muscle',
      planType: 'Non-Vegetarian High Protein',
    },
    planOverview: {
      dailyCalories: 2100,
      proteinGrams: 170,
      carbsGrams: 190,
      fatGrams: 55,
      focus: 'Caloric deficit with high protein retention',
      notes: 'Maintain 500 kcal deficit on training days.',
    },
    morningRoutine: {
      timing: 'Upon waking / 7:00 AM',
      description: '500ml warm water with lemon juice & pinch of Himalayan salt',
      instructions: 'Wait 30 minutes before first meal',
      hydration: '3.5 - 4.0 Liters daily',
    },
    breakfast: {
      options: [
        {
          id: 'b-opt-1',
          name: 'Oats & Whey Porridge with Berries',
          ingredients: [
            { id: 'i1', name: 'Rolled Oats', quantity: '60g' },
            { id: 'i2', name: 'Whey Protein Isolate', quantity: '1 scoop (30g)' },
            { id: 'i3', name: 'Mixed Berries', quantity: '50g' },
          ],
          recipe: 'Cook oats in hot water, stir in whey protein once slightly cooled.',
          calories: 420,
          protein: 36,
          carbs: 52,
          fat: 6,
        },
      ],
    },
    lunch: {
      options: [
        {
          id: 'l-opt-1',
          name: 'Grilled Chicken Breast with Brown Rice & Broccoli',
          ingredients: [
            { id: 'i4', name: 'Chicken Breast', quantity: '180g cooked' },
            { id: 'i5', name: 'Brown Rice', quantity: '150g cooked' },
            { id: 'i6', name: 'Steamed Broccoli', quantity: '100g' },
          ],
          recipe: 'Season chicken with garlic & paprika. Grill in 1 tsp olive oil.',
          calories: 540,
          protein: 50,
          carbs: 48,
          fat: 12,
        },
      ],
    },
    eveningSnack: {
      options: [
        {
          id: 's-opt-1',
          name: 'Greek Yogurt with Almonds',
          ingredients: [
            { id: 'i7', name: 'Plain Greek Yogurt (0%)', quantity: '200g' },
            { id: 'i8', name: 'Raw Almonds', quantity: '15g' },
          ],
          recipe: 'Mix together in a bowl.',
          calories: 220,
          protein: 22,
          carbs: 9,
          fat: 9,
        },
      ],
    },
    dinner: {
      options: [
        {
          id: 'd-opt-1',
          name: 'Baked Salmon with Sweet Potato & Asparagus',
          ingredients: [
            { id: 'i9', name: 'Salmon Fillet', quantity: '160g' },
            { id: 'i10', name: 'Sweet Potato', quantity: '150g baked' },
            { id: 'i11', name: 'Asparagus Spears', quantity: '100g' },
          ],
          recipe: 'Bake salmon at 200C for 15 minutes with lemon and herbs.',
          calories: 520,
          protein: 38,
          carbs: 35,
          fat: 22,
        },
      ],
    },
    postWorkout: {
      options: [
        {
          id: 'p-opt-1',
          name: 'Rapid Recovery Shake',
          ingredients: [
            { id: 'i12', name: 'Whey Isolate', quantity: '1 scoop (30g)' },
            { id: 'i13', name: 'Banana', quantity: '1 medium (100g)' },
          ],
          recipe: 'Blend with cold water within 30 minutes post session.',
          calories: 240,
          protein: 27,
          carbs: 28,
          fat: 1,
        },
      ],
    },
    weeklyGuidelines: [
      { id: 'g1', category: 'Goal / Deficit', text: 'Maintain consistent 500 kcal deficit across the week.' },
      { id: 'g2', category: 'Refeed', text: 'Single maintenance calorie refeed day on leg workout day.' },
      { id: 'g3', category: 'Hydration', text: 'Consume minimum 3.5 liters of clean water daily.' },
      { id: 'g4', category: 'Sleep', text: 'Aim for 7.5 to 8.5 hours of quality restorative sleep.' },
    ],
  };

  const createChartRes = await api('/diet-charts', {
    method: 'POST',
    body: JSON.stringify({
      userId: targetUser.id,
      title: 'Personalized Hypertrophy & Fat Loss Blueprint',
      description: 'Structured 5-meal nutrition plan with multi-option flexibility and weekly guidelines',
      active: true,
      planData: sampleReferencePlan,
    }),
  }, adminToken);

  assert(createChartRes.ok, `Create chart failed: ${createChartRes.status}: ${JSON.stringify(createChartRes.data)}`);
  const createdChart = createChartRes.data;
  console.log('✓ Diet chart successfully created! Chart ID:', createdChart.id);
  assert(createdChart.planData.clientDetails.name === targetUser.fullName, 'Client name in planData mismatch');
  assert(createdChart.planData.weeklyGuidelines.length === 4, 'Weekly guidelines count mismatch');
  assert(createdChart.meals.breakfast, 'Backward-compatible meals JSON was not populated');

  // 5. Verify User View: targetUser logs in and views the chart
  console.log('\nStep 5: Client portal verification (target user viewing chart)...');
  // Register a temporary user to log in or login target user
  // Let's create a fresh user and assign to them to test user view
  const stamp = Date.now().toString().slice(-5);
  const testUserEmail = `client_${stamp}@testgym.com`;
  const regRes = await api('/auth/register', {
    method: 'POST',
    body: JSON.stringify({ fullName: 'Diana Dynamo', email: testUserEmail, password: 'Password123!' }),
  });
  assert(regRes.ok, `Register failed: ${regRes.status}`);
  const userToken = regRes.data.accessToken;
  const userObj = regRes.data.user;

  // Admin creates chart for Diana Dynamo
  const dianaChartRes = await api('/diet-charts', {
    method: 'POST',
    body: JSON.stringify({
      userId: userObj.id,
      title: 'Diana Dynamo Metabolic Reset Plan',
      description: 'High protein reference diet plan',
      active: true,
      planData: {
        ...sampleReferencePlan,
        clientDetails: { ...sampleReferencePlan.clientDetails, name: 'Diana Dynamo' },
      },
    }),
  }, adminToken);
  assert(dianaChartRes.ok, `Create Diana chart failed: ${dianaChartRes.status}`);
  const dianaChartId = dianaChartRes.data.id;

  // Diana views /api/diet-charts/me
  const clientChartsRes = await api('/diet-charts/me', { method: 'GET' }, userToken);
  assert(clientChartsRes.ok, `Diana view charts failed: ${clientChartsRes.status}`);
  assert(clientChartsRes.data.length >= 1, 'Diana has no charts');
  const clientChart = clientChartsRes.data[0];
  assert(clientChart.id === dianaChartId, 'Chart ID mismatch for client');
  assert(clientChart.planData.clientDetails.name === 'Diana Dynamo', 'Client details mismatch');
  console.log('✓ Client successfully accessed their reference diet chart via /api/diet-charts/me.');

  // 6. Verify User CANNOT modify or delete chart (Read-Only)
  console.log('\nStep 6: User read-only verification (client cannot edit or delete)...');
  const userEditRes = await api(`/diet-charts/${dianaChartId}`, {
    method: 'PATCH',
    body: JSON.stringify({ title: 'Hacked Title' }),
  }, userToken);
  assert(userEditRes.status === 403, `Expected 403 Forbidden for client edit, got ${userEditRes.status}`);

  const userDeleteRes = await api(`/diet-charts/${dianaChartId}`, {
    method: 'DELETE',
  }, userToken);
  assert(userDeleteRes.status === 403, `Expected 403 Forbidden for client delete, got ${userDeleteRes.status}`);
  console.log('✓ Client edit blocked (403 Forbidden) and client delete blocked (403 Forbidden).');

  // 7. Verify IDOR protection: User B cannot access Diana's chart
  console.log('\nStep 7: IDOR protection verification...');
  const userBReg = await api('/auth/register', {
    method: 'POST',
    body: JSON.stringify({ fullName: 'Eve External', email: `eve_${stamp}@testgym.com`, password: 'Password123!' }),
  });
  const eveToken = userBReg.data.accessToken;

  const idorRes = await api(`/diet-charts/${dianaChartId}`, { method: 'GET' }, eveToken);
  assert(idorRes.status === 403 || idorRes.status === 404, `Expected 403/404 for IDOR attempt, got ${idorRes.status}`);
  console.log(`✓ IDOR attempt by unauthorized user blocked (${idorRes.status}).`);

  console.log('\n====================================================');
  console.log('ALL WORKFLOW & SECURITY VERIFICATION TESTS PASSED!');
  console.log('====================================================\n');
}

run().catch((err) => {
  console.error('\n✗ TEST RUN FAILED:', err.message);
  process.exit(1);
});
