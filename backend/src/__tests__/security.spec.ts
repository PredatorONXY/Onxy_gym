import '../env.js';
import { ExecutionContext, ForbiddenException, NotFoundException, UnauthorizedException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { JwtService } from '@nestjs/jwt';
import { DietType, Role } from '@prisma/client';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { AdminController } from '../admin/admin.controller.js';
import { AdminService } from '../admin/admin.service.js';
import { AuthController } from '../auth/auth.controller.js';
import { AuthService } from '../auth/auth.service.js';
import { RolesGuard } from '../common/roles.guard.js';
import { DietChartsController } from '../diet-charts/diet-charts.controller.js';
import { DietChartsService } from '../diet-charts/diet-charts.service.js';
import { PrismaService } from '../prisma/prisma.service.js';
import { QuestionsController } from '../questions/questions.controller.js';
import { QuestionsService } from '../questions/questions.service.js';
import { UsersController } from '../users/users.controller.js';
import { UsersService } from '../users/users.service.js';

describe('Comprehensive Backend Security & Business Logic Suite', () => {
  let prisma: PrismaService;
  let jwt: JwtService;
  let reflector: Reflector;
  let rolesGuard: RolesGuard;
  let authService: AuthService;
  let authController: AuthController;
  let usersService: UsersService;
  let usersController: UsersController;
  let dietChartsService: DietChartsService;
  let dietChartsController: DietChartsController;
  let questionsService: QuestionsService;
  let questionsController: QuestionsController;
  let adminService: AdminService;
  let adminController: AdminController;

  // Test entities
  let userA: { id: string; email: string; role: Role };
  let userB: { id: string; email: string; role: Role };
  let adminUser: { id: string; email: string; role: Role };
  let clientAId: string;
  let clientBId: string;
  let chartAId: string;
  let chartBId: string;
  let conversationAId: string;
  let conversationBId: string;

  const testSuffix = Date.now().toString().slice(-6);

  function makeContext(user: any, handler: any, targetClass?: any): ExecutionContext {
    return {
      switchToHttp: () => ({
        getRequest: () => ({ user }),
        getResponse: () => ({}),
        getNext: () => ({}),
      }),
      getHandler: () => handler,
      getClass: () => targetClass || handler,
    } as unknown as ExecutionContext;
  }

  let origDbUrl: string | undefined;

  beforeAll(async () => {
    origDbUrl = process.env.DATABASE_URL;
    process.env.DATABASE_URL = process.env.TEST_DATABASE_URL || 'postgresql://postgres@localhost:5432/onxy_gym';
    prisma = new PrismaService();

    jwt = new JwtService({ secret: 'test-secret-key-32chars-minimum-test', signOptions: { expiresIn: '1h' } });
    reflector = new Reflector();
    rolesGuard = new RolesGuard(reflector);

    authService = new AuthService(prisma, jwt);
    authController = new AuthController(authService);
    usersService = new UsersService(prisma);
    usersController = new UsersController(usersService);
    dietChartsService = new DietChartsService(prisma);
    dietChartsController = new DietChartsController(dietChartsService);
    questionsService = new QuestionsService(prisma);
    questionsController = new QuestionsController(questionsService);
    adminService = new AdminService(prisma, questionsService);
    adminController = new AdminController(adminService);

    // Find existing admin or ensure admin
    const existingAdmin = await prisma.user.findFirst({ where: { role: Role.ADMIN } });
    if (existingAdmin) {
      adminUser = { id: existingAdmin.id, email: existingAdmin.email, role: Role.ADMIN };
    } else {
      const res = await authService.register({
        email: `admin_sec_${testSuffix}@test.com`,
        fullName: 'Sec Admin',
        password: 'AdminPassword123!',
      });
      const updated = await prisma.user.update({
        where: { id: res.user.id },
        data: { role: Role.ADMIN },
      });
      adminUser = { id: updated.id, email: updated.email, role: Role.ADMIN };
    }
  }, 30000);

  afterAll(async () => {
    // Cleanup test users created in this run
    if (userA) {
      await prisma.user.delete({ where: { id: userA.id } }).catch(() => {});
    }
    if (userB) {
      await prisma.user.delete({ where: { id: userB.id } }).catch(() => {});
    }
    await prisma.onModuleDestroy();
    if (origDbUrl) {
      process.env.DATABASE_URL = origDbUrl;
    }
  });

  // ==========================================
  // AUTH TESTS (1-4)
  // ==========================================
  describe('AUTH', () => {
    it('1. Registration creates USER', async () => {
      const email = `usera_${testSuffix}@test.com`;
      const res = await authService.register({
        email,
        fullName: 'User Alpha',
        password: 'Password123!',
      });

      expect(res.accessToken).toBeDefined();
      expect(res.user.role).toBe(Role.USER);
      expect(res.user.email).toBe(email);

      const dbUser = await prisma.user.findUnique({
        where: { id: res.user.id },
        include: { client: true },
      });
      expect(dbUser).toBeDefined();
      expect(dbUser?.role).toBe(Role.USER);
      expect(dbUser?.client).toBeDefined();

      userA = { id: res.user.id, email: res.user.email, role: Role.USER };
      clientAId = dbUser!.client!.id;
    });

    it('2. Registration cannot create ADMIN', async () => {
      const email = `userb_${testSuffix}@test.com`;
      const input = {
        email,
        fullName: 'User Beta',
        password: 'Password123!',
        role: 'ADMIN', // malicious payload
      };

      const res = await authService.register(input as any);
      expect(res.user.role).toBe(Role.USER);

      const dbUser = await prisma.user.findUnique({
        where: { id: res.user.id },
        include: { client: true },
      });
      expect(dbUser?.role).toBe(Role.USER);
      expect(dbUser?.isAdmin).toBe(false);

      userB = { id: res.user.id, email: res.user.email, role: Role.USER };
      clientBId = dbUser!.client!.id;
    });

    it('3. Invalid login fails', async () => {
      await expect(
        authService.login(userA.email, 'WrongPassword999!'),
      ).rejects.toThrow(UnauthorizedException);

      await expect(
        authService.login('nonexistent@user.com', 'SomePassword123!'),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('4. Protected endpoints reject unauthenticated requests', () => {
      const handler = DietChartsController.prototype.create;
      const ctxNoUser = makeContext(null, handler, DietChartsController);

      expect(() => rolesGuard.canActivate(ctxNoUser)).toThrow(ForbiddenException);

      const ctxEmptyUser = makeContext({}, handler, DietChartsController);
      expect(() => rolesGuard.canActivate(ctxEmptyUser)).toThrow(ForbiddenException);
    });
  });

  // ==========================================
  // PROFILE TESTS (5-7)
  // ==========================================
  describe('PROFILE', () => {
    it('5. USER can access own profile', async () => {
      const profile = await usersService.profile(userA.id);
      expect(profile).toBeDefined();
      expect(profile.user.id).toBe(userA.id);
      expect(profile.user.email).toBe(userA.email);
    });

    it('6. USER can update own profile', async () => {
      const updated = await usersService.updateProfile(userA.id, {
        weightKg: 78.5,
        heightCm: 182.0,
        dietType: DietType.VEGETARIAN,
      });

      expect(Number(updated.weightKg)).toBe(78.5);
      expect(Number(updated.heightCm)).toBe(182.0);
      expect(updated.dietType).toBe(DietType.VEGETARIAN);
    });

    it('7. USER cannot modify another user profile', async () => {
      // UsersController updates based on req.user.id from JWT
      // Verify User A updating their profile does not affect User B
      await usersController.update(
        { user: { id: userA.id } },
        { weightKg: 85.0 },
      );

      const profileA = await usersService.profile(userA.id);
      const profileB = await usersService.profile(userB.id);

      expect(Number(profileA.weightKg)).toBe(85.0);
      expect(profileB.weightKg).toBeNull(); // User B untouched
    });
  });

  // ==========================================
  // DIET TESTS (8-16)
  // ==========================================
  describe('DIET', () => {
    it('10. USER cannot create diet chart', () => {
      const handler = DietChartsController.prototype.create;
      const ctxUser = makeContext({ id: userA.id, role: Role.USER }, handler, DietChartsController);
      expect(() => rolesGuard.canActivate(ctxUser)).toThrow(ForbiddenException);
    });

    it('11. USER cannot update diet chart', () => {
      const handler = DietChartsController.prototype.update;
      const ctxUser = makeContext({ id: userA.id, role: Role.USER }, handler, DietChartsController);
      expect(() => rolesGuard.canActivate(ctxUser)).toThrow(ForbiddenException);
    });

    it('12. USER cannot delete diet chart', () => {
      const handler = DietChartsController.prototype.remove;
      const ctxUser = makeContext({ id: userA.id, role: Role.USER }, handler, DietChartsController);
      expect(() => rolesGuard.canActivate(ctxUser)).toThrow(ForbiddenException);
    });

    it('13. ADMIN can create diet chart', async () => {
      const handler = DietChartsController.prototype.create;
      const ctxAdmin = makeContext({ id: adminUser.id, role: Role.ADMIN }, handler, DietChartsController);
      expect(rolesGuard.canActivate(ctxAdmin)).toBe(true);

      const chartA = await dietChartsService.create({
        clientId: clientAId,
        title: 'User A Starter Diet',
        description: 'First plan',
        active: true,
        planData: { calories: 2000, meals: [] },
      });

      expect(chartA.id).toBeDefined();
      expect(chartA.title).toBe('User A Starter Diet');
      chartAId = chartA.id;

      // Also create chart for User B
      const chartB = await dietChartsService.create({
        clientId: clientBId,
        title: 'User B Muscle Plan',
        description: 'Plan for B',
        active: true,
        planData: { calories: 2500, meals: [] },
      });
      chartBId = chartB.id;
    });

    it('8. USER can access own diet chart', async () => {
      const myCharts = await dietChartsService.mine(userA.id);
      expect(myCharts.length).toBeGreaterThanOrEqual(1);
      expect(myCharts.some((c) => c.id === chartAId)).toBe(true);

      const chart = await dietChartsService.one(chartAId, userA.id, Role.USER);
      expect(chart.id).toBe(chartAId);
    });

    it('9. USER cannot access another user diet chart', async () => {
      await expect(
        dietChartsService.one(chartBId, userA.id, Role.USER),
      ).rejects.toThrow(NotFoundException);
    });

    it('14. ADMIN can update diet chart', async () => {
      const handler = DietChartsController.prototype.update;
      const ctxAdmin = makeContext({ id: adminUser.id, role: Role.ADMIN }, handler, DietChartsController);
      expect(rolesGuard.canActivate(ctxAdmin)).toBe(true);

      const updated = await dietChartsService.update(chartAId, {
        title: 'User A Updated Diet Plan',
      });
      expect(updated.title).toBe('User A Updated Diet Plan');
    });

    it('16. Creating a new chart preserves previous charts', async () => {
      const chart2 = await dietChartsService.create({
        clientId: clientAId,
        title: 'User A Plan 2 (Preserved History)',
        active: true,
        planData: { calories: 2200 },
      });

      const chartsAfter = await dietChartsService.mine(userA.id);
      const ids = chartsAfter.map((c) => c.id);

      expect(ids).toContain(chartAId);
      expect(ids).toContain(chart2.id);
      expect(chartsAfter.length).toBeGreaterThanOrEqual(2);
    });

    it('15. ADMIN can delete diet chart', async () => {
      const handler = DietChartsController.prototype.remove;
      const ctxAdmin = makeContext({ id: adminUser.id, role: Role.ADMIN }, handler, DietChartsController);
      expect(rolesGuard.canActivate(ctxAdmin)).toBe(true);

      // Create a temporary chart to delete
      const tempChart = await dietChartsService.create({
        clientId: clientAId,
        title: 'Temp Chart to Delete',
        planData: {},
      });

      await dietChartsService.remove(tempChart.id);
      await expect(
        dietChartsService.one(tempChart.id, adminUser.id, Role.ADMIN),
      ).rejects.toThrow(NotFoundException);
    });
  });

  // ==========================================
  // QUESTIONS TESTS (17-22)
  // ==========================================
  describe('QUESTIONS', () => {
    it('17. USER can create own conversation', async () => {
      const convo = await questionsService.createConversation(userA.id, Role.USER, {
        subject: 'Nutritional Inquiry',
        dietChartId: chartAId,
        body: 'Should I take creatine before or after workouts?',
      });

      expect(convo.id).toBeDefined();
      expect(convo.clientId).toBe(clientAId);
      expect(convo.messages.length).toBe(1);
      expect(convo.messages[0].body).toContain('creatine');
      expect(convo.messages[0].authorRole).toBe('USER');
      conversationAId = convo.id;

      // Create Conversation for B as well
      const convoB = await questionsService.createConversation(userB.id, Role.USER, {
        subject: 'User B Question',
        dietChartId: chartBId,
        body: 'How many eggs per day?',
      });
      conversationBId = convoB.id;
    });

    it('18. USER can read own conversation', async () => {
      const convo = await questionsService.getConversation(conversationAId, userA.id, Role.USER);
      expect(convo.id).toBe(conversationAId);
      expect(convo.messages.length).toBeGreaterThanOrEqual(1);
    });

    it('19. USER cannot read another user conversation', async () => {
      await expect(
        questionsService.getConversation(conversationBId, userA.id, Role.USER),
      ).rejects.toThrow(ForbiddenException);
    });

    it('20. USER cannot message another user conversation', async () => {
      await expect(
        questionsService.sendMessage(conversationBId, userA.id, Role.USER, {
          body: 'Attempting cross-user message injection',
        }),
      ).rejects.toThrow(ForbiddenException);
    });

    it('21. ADMIN can read conversations', async () => {
      const convo = await questionsService.getConversation(conversationAId, adminUser.id, Role.ADMIN);
      expect(convo.id).toBe(conversationAId);
      expect(convo.client.userId).toBe(userA.id);

      const allConvos = await questionsService.listConversations(adminUser.id, Role.ADMIN);
      const ids = allConvos.map((c) => c.id);
      expect(ids).toContain(conversationAId);
      expect(ids).toContain(conversationBId);
    });

    it('22. ADMIN can reply', async () => {
      const reply = await questionsService.sendMessage(conversationAId, adminUser.id, Role.ADMIN, {
        body: 'Take 5g of creatine daily with your post-workout meal.',
      });

      expect(reply.conversationId).toBe(conversationAId);
      expect(reply.authorRole).toBe('ADMIN');
      expect(reply.body).toContain('creatine');

      const updated = await questionsService.getConversation(conversationAId, userA.id, Role.USER);
      expect(updated.messages.length).toBe(2);
      expect(updated.messages[1].authorRole).toBe('ADMIN');
    });
  });

  // ==========================================
  // ADMIN TESTS (23-24)
  // ==========================================
  describe('ADMIN', () => {
    it('23. USER cannot access admin endpoints', () => {
      const listUsersHandler = AdminController.prototype.listUsers;
      const ctxUser = makeContext({ id: userA.id, role: Role.USER }, listUsersHandler, AdminController);

      expect(() => rolesGuard.canActivate(ctxUser)).toThrow(ForbiddenException);
    });

    it('24. ADMIN can access admin endpoints', async () => {
      const listUsersHandler = AdminController.prototype.listUsers;
      const ctxAdmin = makeContext({ id: adminUser.id, role: Role.ADMIN }, listUsersHandler, AdminController);

      expect(rolesGuard.canActivate(ctxAdmin)).toBe(true);

      const users = await adminService.listUsers();
      expect(users.length).toBeGreaterThan(0);
      expect(users.some((u) => u.id === userA.id)).toBe(true);

      const userDetails = await adminService.getUserDetails(userA.id);
      expect(userDetails.id).toBe(userA.id);
      expect(userDetails.client).toBeDefined();
    });
  });
});
