import path from 'path';
import dotenv from 'dotenv';
import { PrismaClient, Role } from '@prisma/client';
import * as bcrypt from 'bcrypt';

dotenv.config({ path: path.resolve(__dirname, '../.env') });

const prisma = new PrismaClient();

async function main() {
  const adminEmail = (process.env.ADMIN_EMAIL || 'admin@onxygym.com').trim().toLowerCase();
  const adminPassword = process.env.ADMIN_PASSWORD || 'AdminPassword123!';

  // Check for any users with role ADMIN
  const existingAdmins = await prisma.user.findMany({
    where: { role: Role.ADMIN },
  });

  // Check for legacy admin flags
  const legacyAdmins = await prisma.user.findMany({
    where: {
      OR: [
        { isAdmin: true },
        { isTrainer: true },
      ],
    },
  });

  if (existingAdmins.length > 1) {
    throw new Error(
      `HARD SAFETY STOP: Multiple (${existingAdmins.length}) ADMIN accounts exist. Cannot automatically seed or resolve.`,
    );
  }

  if (existingAdmins.length === 1) {
    console.log(`Verified existing single ADMIN: ${existingAdmins[0].email} (${existingAdmins[0].id})`);
  } else {
    // No role=ADMIN exists. Check if multiple ambiguous legacy admin accounts exist
    const legacyAdminUsers = legacyAdmins.filter(u => u.isAdmin);
    if (legacyAdminUsers.length > 1) {
      throw new Error(
        `HARD SAFETY STOP: Multiple (${legacyAdminUsers.length}) legacy accounts have isAdmin=true. Cannot automatically choose one.`,
      );
    }

    if (legacyAdminUsers.length === 1) {
      // Exactly one legacy admin exists - upgrade to ADMIN
      const legacy = legacyAdminUsers[0];
      const updated = await prisma.user.update({
        where: { id: legacy.id },
        data: {
          role: Role.ADMIN,
          isAdmin: true,
          isTrainer: true,
          emailVerified: true,
          passwordHash: legacy.passwordHash ?? (await bcrypt.hash(adminPassword, 12)),
        },
      });
      console.log(`Promoted single legacy admin to ADMIN: ${updated.email} (${updated.id})`);
    } else {
      // Create new single admin
      const passwordHash = await bcrypt.hash(adminPassword, 12);
      const admin = await prisma.user.create({
        data: {
          email: adminEmail,
          fullName: 'System Administrator',
          passwordHash,
          role: Role.ADMIN,
          isAdmin: true,
          isTrainer: true,
          emailVerified: true,
          specialization: 'System Administration & Head Trainer',
          experienceYears: 10,
          bio: 'Head trainer and system administrator for Onxy Gym platform.',
        },
      });
      console.log(`Created single ADMIN: ${admin.email} (${admin.id})`);
    }
  }

  // Seed sample client for development if no clients exist
  const existingClients = await prisma.client.count();
  if (existingClients === 0) {
    const clientEmail = 'client@onxygym.com';
    const clientPasswordHash = await bcrypt.hash('ClientPassword123!', 12);
    const clientUser = await prisma.user.create({
      data: {
        email: clientEmail,
        fullName: 'Jane Doe',
        passwordHash: clientPasswordHash,
        role: Role.USER,
        emailVerified: true,
        client: {
          create: {
            age: 28,
            gender: 'Female',
            goals: 'Muscle tone and endurance',
            weightKg: 62.5,
            heightCm: 168.0,
            dietType: 'VEGETARIAN',
            dietCharts: {
              create: {
                title: 'High Protein Vegetarian Plan',
                description: 'Balanced 4-meal plan for strength and tone',
                active: true,
                meals: {},
                planData: {
                  dailyCalories: 2100,
                  proteinGrams: 130,
                  carbsGrams: 220,
                  fatGrams: 65,
                  meals: [
                    {
                      name: 'Breakfast',
                      time: '08:00',
                      items: [
                        { name: 'Oats with Greek yogurt & berries', calories: 450, protein: 28, carbs: 60, fat: 10 },
                      ],
                    },
                    {
                      name: 'Lunch',
                      time: '13:00',
                      items: [
                        { name: 'Tofu and quinoa bowl with avocado', calories: 650, protein: 35, carbs: 70, fat: 22 },
                      ],
                    },
                    {
                      name: 'Post-Workout Snack',
                      time: '17:00',
                      items: [
                        { name: 'Whey isolate shake & banana', calories: 300, protein: 32, carbs: 35, fat: 3 },
                      ],
                    },
                    {
                      name: 'Dinner',
                      time: '20:00',
                      items: [
                        { name: 'Lentil soup with spinach salad', calories: 550, protein: 35, carbs: 55, fat: 15 },
                      ],
                    },
                  ],
                },
              },
            },
          },
        },
      },
    });
    console.log(`Created sample development client: ${clientUser.email}`);
  }

  console.log('Seed completed successfully.');
}

main()
  .catch((e) => {
    console.error('Seed error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
