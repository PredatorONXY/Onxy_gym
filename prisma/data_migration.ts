import { PrismaClient, Role, DietType } from '@prisma/client';

const prisma = new PrismaClient();

export async function runDataMigration() {
  console.log('\n--- Running Safe Legacy Data Mapping & Preservation ---');

  // 1. Check legacy admin records
  const currentAdmins = await prisma.user.findMany({ where: { role: Role.ADMIN } });
  const legacyAdminUsers = await prisma.user.findMany({
    where: {
      isAdmin: true,
      role: { not: Role.ADMIN },
    },
  });

  if (legacyAdminUsers.length > 1) {
    throw new Error(
      `HARD SAFETY STOP: Multiple legacy admins detected (${legacyAdminUsers.length}). Cannot proceed with automatic role mapping.`,
    );
  }

  if (legacyAdminUsers.length === 1 && currentAdmins.length === 0) {
    const singleLegacyAdmin = legacyAdminUsers[0];
    await prisma.user.update({
      where: { id: singleLegacyAdmin.id },
      data: { role: Role.ADMIN },
    });
    console.log(`Mapped legacy admin to Role.ADMIN: ${singleLegacyAdmin.email}`);
  } else if (currentAdmins.length === 1) {
    console.log(`Confirmed existing single ADMIN: ${currentAdmins[0].email}`);
  }

  // 2. Map legacy progress logs into client profiles where missing
  const clients = await prisma.client.findMany({
    include: {
      progressLogs: {
        orderBy: { logDate: 'desc' },
        take: 1,
      },
    },
  });

  for (const client of clients) {
    const latestLog = client.progressLogs[0];
    if (latestLog && (!client.weightKg || !client.heightCm)) {
      await prisma.client.update({
        where: { id: client.id },
        data: {
          weightKg: client.weightKg ?? latestLog.weightKg,
          heightCm: client.heightCm ?? latestLog.heightCm,
        },
      });
      console.log(`Preserved client ${client.id} metrics from latest progress log.`);
    }
  }

  // 3. Preserve and map legacy diet-chart data
  const charts = await prisma.dietChart.findMany();
  let mappedCount = 0;

  for (const chart of charts) {
    const meals = (chart.meals || {}) as Record<string, any>;
    const planData = (chart.planData || {}) as Record<string, any>;

    const hasMeals = Object.keys(meals).length > 0;
    const isPlanEmpty = !planData.dailyCalories && (!planData.meals || planData.meals.length === 0);

    if (hasMeals && isPlanEmpty) {
      let totalCalories = 0;
      let totalProtein = 0;
      let totalCarbs = 0;
      let totalFat = 0;
      const structuredMeals: any[] = [];

      for (const [mealName, mealBlock] of Object.entries(meals)) {
        if (mealBlock && Array.isArray(mealBlock.items)) {
          for (const item of mealBlock.items) {
            totalCalories += item.calories || 0;
            totalProtein += item.protein || 0;
            totalCarbs += item.carbs || 0;
            totalFat += item.fat || 0;
          }
          structuredMeals.push({
            name: mealName,
            items: mealBlock.items,
          });
        }
      }

      await prisma.dietChart.update({
        where: { id: chart.id },
        data: {
          // Never overwrite or delete chart.meals
          planData: {
            dailyCalories: totalCalories,
            proteinGrams: totalProtein,
            carbsGrams: totalCarbs,
            fatGrams: totalFat,
            meals: structuredMeals,
          },
        },
      });
      mappedCount++;
    }
  }

  console.log(`Mapped ${mappedCount} legacy diet charts into structured planData without discarding legacy JSON.`);

  // 4. Verify all tables and records preserved
  const [usersCount, clientsCount, chartsCount, sessionsCount, logsCount, plansCount, exercisesCount] =
    await Promise.all([
      prisma.user.count(),
      prisma.client.count(),
      prisma.dietChart.count(),
      prisma.session.count(),
      prisma.progressLog.count(),
      prisma.plan.count(),
      prisma.workoutExercise.count(),
    ]);

  console.log('\n--- Post-Migration Database Status ---');
  console.log(`Users: ${usersCount} (Admins: ${(await prisma.user.count({ where: { role: Role.ADMIN } }))})`);
  console.log(`Clients: ${clientsCount}`);
  console.log(`Diet Charts (All Historical Preserved): ${chartsCount}`);
  console.log(`Sessions: ${sessionsCount}`);
  console.log(`Progress Logs: ${logsCount}`);
  console.log(`Workout Plans: ${plansCount}`);
  console.log(`Workout Exercises: ${exercisesCount}`);
  console.log('--------------------------------------\n');
}

if (process.argv[1]?.endsWith('data_migration.ts') || process.argv[1]?.endsWith('data_migration.js')) {
  runDataMigration()
    .catch((e) => {
      console.error(e);
      process.exit(1);
    })
    .finally(() => prisma.$disconnect());
}
