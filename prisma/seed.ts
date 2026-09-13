import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  // Create admin user
  const adminUser = await prisma.user.upsert({
    where: { id: 'admin-user-id' },
    update: {},
    create: {
      id: 'admin-user-id',
      email: 'admin@gymtrainer.com',
      fullName: 'System Administrator',
      isAdmin: true,
      isTrainer: true,
      specialization: 'System Administration',
      experienceYears: 10,
      bio: 'System administrator for the gym trainer platform',
    },
  })

  // Create a sample trainer
  const trainerUser = await prisma.user.upsert({
    where: { id: 'trainer-user-id' },
    update: {},
    create: {
      id: 'trainer-user-id',
      email: 'trainer@gymtrainer.com',
      fullName: 'John Smith',
      isAdmin: false,
      isTrainer: true,
      specialization: 'Fitness Training',
      experienceYears: 5,
      bio: 'Certified personal trainer specializing in weight loss and muscle building',
    },
  })

  // Create a sample client
  const clientUser = await prisma.user.upsert({
    where: { id: 'client-user-id' },
    update: {},
    create: {
      id: 'client-user-id',
      email: 'client@gymtrainer.com',
      fullName: 'Jane Doe',
      isAdmin: false,
      isTrainer: false,
    },
  })

  // Create client record for the sample client
  const client = await prisma.client.upsert({
    where: { id: 'sample-client-id' },
    update: {},
    create: {
      id: 'sample-client-id',
      userId: 'client-user-id',
      age: 30,
      gender: 'Female',
      goals: 'Weight loss and fitness improvement',
    },
  })

  // Create additional sample clients
  const clientUser2 = await prisma.user.upsert({
    where: { id: 'client-user-id-2' },
    update: {},
    create: {
      id: 'client-user-id-2',
      email: 'client2@gymtrainer.com',
      fullName: 'Bob Johnson',
      isAdmin: false,
      isTrainer: false,
    },
  })

  const client2 = await prisma.client.upsert({
    where: { id: 'sample-client-id-2' },
    update: {},
    create: {
      id: 'sample-client-id-2',
      userId: 'client-user-id-2',
      age: 25,
      gender: 'Male',
      goals: 'Muscle building and strength training',
    },
  })

  const clientUser3 = await prisma.user.upsert({
    where: { id: 'client-user-id-3' },
    update: {},
    create: {
      id: 'client-user-id-3',
      email: 'client3@gymtrainer.com',
      fullName: 'Alice Wilson',
      isAdmin: false,
      isTrainer: false,
    },
  })

  const client3 = await prisma.client.upsert({
    where: { id: 'sample-client-id-3' },
    update: {},
    create: {
      id: 'sample-client-id-3',
      userId: 'client-user-id-3',
      age: 28,
      gender: 'Female',
      goals: 'General fitness and health improvement',
    },
  })

  console.log('Database seeded successfully!')
  console.log('Admin user created:', adminUser)
  console.log('Trainer user created:', trainerUser)
  console.log('Client users created:', clientUser, clientUser2, clientUser3)
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
