"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
require("../env.js");
const common_1 = require("@nestjs/common");
const core_1 = require("@nestjs/core");
const jwt_1 = require("@nestjs/jwt");
const client_1 = require("@prisma/client");
const vitest_1 = require("vitest");
const admin_controller_js_1 = require("../admin/admin.controller.js");
const admin_service_js_1 = require("../admin/admin.service.js");
const auth_controller_js_1 = require("../auth/auth.controller.js");
const auth_service_js_1 = require("../auth/auth.service.js");
const roles_guard_js_1 = require("../common/roles.guard.js");
const diet_charts_controller_js_1 = require("../diet-charts/diet-charts.controller.js");
const diet_charts_service_js_1 = require("../diet-charts/diet-charts.service.js");
const prisma_service_js_1 = require("../prisma/prisma.service.js");
const questions_controller_js_1 = require("../questions/questions.controller.js");
const questions_service_js_1 = require("../questions/questions.service.js");
const users_controller_js_1 = require("../users/users.controller.js");
const users_service_js_1 = require("../users/users.service.js");
(0, vitest_1.describe)('Comprehensive Backend Security & Business Logic Suite', () => {
    let prisma;
    let jwt;
    let reflector;
    let rolesGuard;
    let authService;
    let authController;
    let usersService;
    let usersController;
    let dietChartsService;
    let dietChartsController;
    let questionsService;
    let questionsController;
    let adminService;
    let adminController;
    let userA;
    let userB;
    let adminUser;
    let clientAId;
    let clientBId;
    let chartAId;
    let chartBId;
    let conversationAId;
    let conversationBId;
    const testSuffix = Date.now().toString().slice(-6);
    function makeContext(user, handler, targetClass) {
        return {
            switchToHttp: () => ({
                getRequest: () => ({ user }),
                getResponse: () => ({}),
                getNext: () => ({}),
            }),
            getHandler: () => handler,
            getClass: () => targetClass || handler,
        };
    }
    let origDbUrl;
    (0, vitest_1.beforeAll)(async () => {
        origDbUrl = process.env.DATABASE_URL;
        process.env.DATABASE_URL = process.env.TEST_DATABASE_URL || 'postgresql://postgres@localhost:5432/onxy_gym';
        prisma = new prisma_service_js_1.PrismaService();
        jwt = new jwt_1.JwtService({ secret: 'test-secret-key-32chars-minimum-test', signOptions: { expiresIn: '1h' } });
        reflector = new core_1.Reflector();
        rolesGuard = new roles_guard_js_1.RolesGuard(reflector);
        authService = new auth_service_js_1.AuthService(prisma, jwt);
        authController = new auth_controller_js_1.AuthController(authService);
        usersService = new users_service_js_1.UsersService(prisma);
        usersController = new users_controller_js_1.UsersController(usersService);
        dietChartsService = new diet_charts_service_js_1.DietChartsService(prisma);
        dietChartsController = new diet_charts_controller_js_1.DietChartsController(dietChartsService);
        questionsService = new questions_service_js_1.QuestionsService(prisma);
        questionsController = new questions_controller_js_1.QuestionsController(questionsService);
        adminService = new admin_service_js_1.AdminService(prisma, questionsService);
        adminController = new admin_controller_js_1.AdminController(adminService);
        const existingAdmin = await prisma.user.findFirst({ where: { role: client_1.Role.ADMIN } });
        if (existingAdmin) {
            adminUser = { id: existingAdmin.id, email: existingAdmin.email, role: client_1.Role.ADMIN };
        }
        else {
            const res = await authService.register({
                email: `admin_sec_${testSuffix}@test.com`,
                fullName: 'Sec Admin',
                password: 'AdminPassword123!',
            });
            const updated = await prisma.user.update({
                where: { id: res.user.id },
                data: { role: client_1.Role.ADMIN },
            });
            adminUser = { id: updated.id, email: updated.email, role: client_1.Role.ADMIN };
        }
    }, 30000);
    (0, vitest_1.afterAll)(async () => {
        if (userA) {
            await prisma.user.delete({ where: { id: userA.id } }).catch(() => { });
        }
        if (userB) {
            await prisma.user.delete({ where: { id: userB.id } }).catch(() => { });
        }
        await prisma.onModuleDestroy();
        if (origDbUrl) {
            process.env.DATABASE_URL = origDbUrl;
        }
    });
    (0, vitest_1.describe)('AUTH', () => {
        (0, vitest_1.it)('1. Registration creates USER', async () => {
            const email = `usera_${testSuffix}@test.com`;
            const res = await authService.register({
                email,
                fullName: 'User Alpha',
                password: 'Password123!',
            });
            (0, vitest_1.expect)(res.accessToken).toBeDefined();
            (0, vitest_1.expect)(res.user.role).toBe(client_1.Role.USER);
            (0, vitest_1.expect)(res.user.email).toBe(email);
            const dbUser = await prisma.user.findUnique({
                where: { id: res.user.id },
                include: { client: true },
            });
            (0, vitest_1.expect)(dbUser).toBeDefined();
            (0, vitest_1.expect)(dbUser?.role).toBe(client_1.Role.USER);
            (0, vitest_1.expect)(dbUser?.client).toBeDefined();
            userA = { id: res.user.id, email: res.user.email, role: client_1.Role.USER };
            clientAId = dbUser.client.id;
        });
        (0, vitest_1.it)('2. Registration cannot create ADMIN', async () => {
            const email = `userb_${testSuffix}@test.com`;
            const input = {
                email,
                fullName: 'User Beta',
                password: 'Password123!',
                role: 'ADMIN',
            };
            const res = await authService.register(input);
            (0, vitest_1.expect)(res.user.role).toBe(client_1.Role.USER);
            const dbUser = await prisma.user.findUnique({
                where: { id: res.user.id },
                include: { client: true },
            });
            (0, vitest_1.expect)(dbUser?.role).toBe(client_1.Role.USER);
            (0, vitest_1.expect)(dbUser?.isAdmin).toBe(false);
            userB = { id: res.user.id, email: res.user.email, role: client_1.Role.USER };
            clientBId = dbUser.client.id;
        });
        (0, vitest_1.it)('3. Invalid login fails', async () => {
            await (0, vitest_1.expect)(authService.login(userA.email, 'WrongPassword999!')).rejects.toThrow(common_1.UnauthorizedException);
            await (0, vitest_1.expect)(authService.login('nonexistent@user.com', 'SomePassword123!')).rejects.toThrow(common_1.UnauthorizedException);
        });
        (0, vitest_1.it)('4. Protected endpoints reject unauthenticated requests', () => {
            const handler = diet_charts_controller_js_1.DietChartsController.prototype.create;
            const ctxNoUser = makeContext(null, handler, diet_charts_controller_js_1.DietChartsController);
            (0, vitest_1.expect)(() => rolesGuard.canActivate(ctxNoUser)).toThrow(common_1.ForbiddenException);
            const ctxEmptyUser = makeContext({}, handler, diet_charts_controller_js_1.DietChartsController);
            (0, vitest_1.expect)(() => rolesGuard.canActivate(ctxEmptyUser)).toThrow(common_1.ForbiddenException);
        });
    });
    (0, vitest_1.describe)('PROFILE', () => {
        (0, vitest_1.it)('5. USER can access own profile', async () => {
            const profile = await usersService.profile(userA.id);
            (0, vitest_1.expect)(profile).toBeDefined();
            (0, vitest_1.expect)(profile.user.id).toBe(userA.id);
            (0, vitest_1.expect)(profile.user.email).toBe(userA.email);
        });
        (0, vitest_1.it)('6. USER can update own profile', async () => {
            const updated = await usersService.updateProfile(userA.id, {
                weightKg: 78.5,
                heightCm: 182.0,
                dietType: client_1.DietType.VEGETARIAN,
            });
            (0, vitest_1.expect)(Number(updated.weightKg)).toBe(78.5);
            (0, vitest_1.expect)(Number(updated.heightCm)).toBe(182.0);
            (0, vitest_1.expect)(updated.dietType).toBe(client_1.DietType.VEGETARIAN);
        });
        (0, vitest_1.it)('7. USER cannot modify another user profile', async () => {
            await usersController.update({ user: { id: userA.id } }, { weightKg: 85.0 });
            const profileA = await usersService.profile(userA.id);
            const profileB = await usersService.profile(userB.id);
            (0, vitest_1.expect)(Number(profileA.weightKg)).toBe(85.0);
            (0, vitest_1.expect)(profileB.weightKg).toBeNull();
        });
    });
    (0, vitest_1.describe)('DIET', () => {
        (0, vitest_1.it)('10. USER cannot create diet chart', () => {
            const handler = diet_charts_controller_js_1.DietChartsController.prototype.create;
            const ctxUser = makeContext({ id: userA.id, role: client_1.Role.USER }, handler, diet_charts_controller_js_1.DietChartsController);
            (0, vitest_1.expect)(() => rolesGuard.canActivate(ctxUser)).toThrow(common_1.ForbiddenException);
        });
        (0, vitest_1.it)('11. USER cannot update diet chart', () => {
            const handler = diet_charts_controller_js_1.DietChartsController.prototype.update;
            const ctxUser = makeContext({ id: userA.id, role: client_1.Role.USER }, handler, diet_charts_controller_js_1.DietChartsController);
            (0, vitest_1.expect)(() => rolesGuard.canActivate(ctxUser)).toThrow(common_1.ForbiddenException);
        });
        (0, vitest_1.it)('12. USER cannot delete diet chart', () => {
            const handler = diet_charts_controller_js_1.DietChartsController.prototype.remove;
            const ctxUser = makeContext({ id: userA.id, role: client_1.Role.USER }, handler, diet_charts_controller_js_1.DietChartsController);
            (0, vitest_1.expect)(() => rolesGuard.canActivate(ctxUser)).toThrow(common_1.ForbiddenException);
        });
        (0, vitest_1.it)('13. ADMIN can create diet chart', async () => {
            const handler = diet_charts_controller_js_1.DietChartsController.prototype.create;
            const ctxAdmin = makeContext({ id: adminUser.id, role: client_1.Role.ADMIN }, handler, diet_charts_controller_js_1.DietChartsController);
            (0, vitest_1.expect)(rolesGuard.canActivate(ctxAdmin)).toBe(true);
            const chartA = await dietChartsService.create({
                clientId: clientAId,
                title: 'User A Starter Diet',
                description: 'First plan',
                active: true,
                planData: { calories: 2000, meals: [] },
            });
            (0, vitest_1.expect)(chartA.id).toBeDefined();
            (0, vitest_1.expect)(chartA.title).toBe('User A Starter Diet');
            chartAId = chartA.id;
            const chartB = await dietChartsService.create({
                clientId: clientBId,
                title: 'User B Muscle Plan',
                description: 'Plan for B',
                active: true,
                planData: { calories: 2500, meals: [] },
            });
            chartBId = chartB.id;
        });
        (0, vitest_1.it)('8. USER can access own diet chart', async () => {
            const myCharts = await dietChartsService.mine(userA.id);
            (0, vitest_1.expect)(myCharts.length).toBeGreaterThanOrEqual(1);
            (0, vitest_1.expect)(myCharts.some((c) => c.id === chartAId)).toBe(true);
            const chart = await dietChartsService.one(chartAId, userA.id, client_1.Role.USER);
            (0, vitest_1.expect)(chart.id).toBe(chartAId);
        });
        (0, vitest_1.it)('9. USER cannot access another user diet chart', async () => {
            await (0, vitest_1.expect)(dietChartsService.one(chartBId, userA.id, client_1.Role.USER)).rejects.toThrow(common_1.NotFoundException);
        });
        (0, vitest_1.it)('14. ADMIN can update diet chart', async () => {
            const handler = diet_charts_controller_js_1.DietChartsController.prototype.update;
            const ctxAdmin = makeContext({ id: adminUser.id, role: client_1.Role.ADMIN }, handler, diet_charts_controller_js_1.DietChartsController);
            (0, vitest_1.expect)(rolesGuard.canActivate(ctxAdmin)).toBe(true);
            const updated = await dietChartsService.update(chartAId, {
                title: 'User A Updated Diet Plan',
            });
            (0, vitest_1.expect)(updated.title).toBe('User A Updated Diet Plan');
        });
        (0, vitest_1.it)('16. Creating a new chart preserves previous charts', async () => {
            const chart2 = await dietChartsService.create({
                clientId: clientAId,
                title: 'User A Plan 2 (Preserved History)',
                active: true,
                planData: { calories: 2200 },
            });
            const chartsAfter = await dietChartsService.mine(userA.id);
            const ids = chartsAfter.map((c) => c.id);
            (0, vitest_1.expect)(ids).toContain(chartAId);
            (0, vitest_1.expect)(ids).toContain(chart2.id);
            (0, vitest_1.expect)(chartsAfter.length).toBeGreaterThanOrEqual(2);
        });
        (0, vitest_1.it)('15. ADMIN can delete diet chart', async () => {
            const handler = diet_charts_controller_js_1.DietChartsController.prototype.remove;
            const ctxAdmin = makeContext({ id: adminUser.id, role: client_1.Role.ADMIN }, handler, diet_charts_controller_js_1.DietChartsController);
            (0, vitest_1.expect)(rolesGuard.canActivate(ctxAdmin)).toBe(true);
            const tempChart = await dietChartsService.create({
                clientId: clientAId,
                title: 'Temp Chart to Delete',
                planData: {},
            });
            await dietChartsService.remove(tempChart.id);
            await (0, vitest_1.expect)(dietChartsService.one(tempChart.id, adminUser.id, client_1.Role.ADMIN)).rejects.toThrow(common_1.NotFoundException);
        });
    });
    (0, vitest_1.describe)('QUESTIONS', () => {
        (0, vitest_1.it)('17. USER can create own conversation', async () => {
            const convo = await questionsService.createConversation(userA.id, client_1.Role.USER, {
                subject: 'Nutritional Inquiry',
                dietChartId: chartAId,
                body: 'Should I take creatine before or after workouts?',
            });
            (0, vitest_1.expect)(convo.id).toBeDefined();
            (0, vitest_1.expect)(convo.clientId).toBe(clientAId);
            (0, vitest_1.expect)(convo.messages.length).toBe(1);
            (0, vitest_1.expect)(convo.messages[0].body).toContain('creatine');
            (0, vitest_1.expect)(convo.messages[0].authorRole).toBe('USER');
            conversationAId = convo.id;
            const convoB = await questionsService.createConversation(userB.id, client_1.Role.USER, {
                subject: 'User B Question',
                dietChartId: chartBId,
                body: 'How many eggs per day?',
            });
            conversationBId = convoB.id;
        });
        (0, vitest_1.it)('18. USER can read own conversation', async () => {
            const convo = await questionsService.getConversation(conversationAId, userA.id, client_1.Role.USER);
            (0, vitest_1.expect)(convo.id).toBe(conversationAId);
            (0, vitest_1.expect)(convo.messages.length).toBeGreaterThanOrEqual(1);
        });
        (0, vitest_1.it)('19. USER cannot read another user conversation', async () => {
            await (0, vitest_1.expect)(questionsService.getConversation(conversationBId, userA.id, client_1.Role.USER)).rejects.toThrow(common_1.ForbiddenException);
        });
        (0, vitest_1.it)('20. USER cannot message another user conversation', async () => {
            await (0, vitest_1.expect)(questionsService.sendMessage(conversationBId, userA.id, client_1.Role.USER, {
                body: 'Attempting cross-user message injection',
            })).rejects.toThrow(common_1.ForbiddenException);
        });
        (0, vitest_1.it)('21. ADMIN can read conversations', async () => {
            const convo = await questionsService.getConversation(conversationAId, adminUser.id, client_1.Role.ADMIN);
            (0, vitest_1.expect)(convo.id).toBe(conversationAId);
            (0, vitest_1.expect)(convo.client.userId).toBe(userA.id);
            const allConvos = await questionsService.listConversations(adminUser.id, client_1.Role.ADMIN);
            const ids = allConvos.map((c) => c.id);
            (0, vitest_1.expect)(ids).toContain(conversationAId);
            (0, vitest_1.expect)(ids).toContain(conversationBId);
        });
        (0, vitest_1.it)('22. ADMIN can reply', async () => {
            const reply = await questionsService.sendMessage(conversationAId, adminUser.id, client_1.Role.ADMIN, {
                body: 'Take 5g of creatine daily with your post-workout meal.',
            });
            (0, vitest_1.expect)(reply.conversationId).toBe(conversationAId);
            (0, vitest_1.expect)(reply.authorRole).toBe('ADMIN');
            (0, vitest_1.expect)(reply.body).toContain('creatine');
            const updated = await questionsService.getConversation(conversationAId, userA.id, client_1.Role.USER);
            (0, vitest_1.expect)(updated.messages.length).toBe(2);
            (0, vitest_1.expect)(updated.messages[1].authorRole).toBe('ADMIN');
        });
    });
    (0, vitest_1.describe)('ADMIN', () => {
        (0, vitest_1.it)('23. USER cannot access admin endpoints', () => {
            const listUsersHandler = admin_controller_js_1.AdminController.prototype.listUsers;
            const ctxUser = makeContext({ id: userA.id, role: client_1.Role.USER }, listUsersHandler, admin_controller_js_1.AdminController);
            (0, vitest_1.expect)(() => rolesGuard.canActivate(ctxUser)).toThrow(common_1.ForbiddenException);
        });
        (0, vitest_1.it)('24. ADMIN can access admin endpoints', async () => {
            const listUsersHandler = admin_controller_js_1.AdminController.prototype.listUsers;
            const ctxAdmin = makeContext({ id: adminUser.id, role: client_1.Role.ADMIN }, listUsersHandler, admin_controller_js_1.AdminController);
            (0, vitest_1.expect)(rolesGuard.canActivate(ctxAdmin)).toBe(true);
            const users = await adminService.listUsers();
            (0, vitest_1.expect)(users.length).toBeGreaterThan(0);
            (0, vitest_1.expect)(users.some((u) => u.id === userA.id)).toBe(true);
            const userDetails = await adminService.getUserDetails(userA.id);
            (0, vitest_1.expect)(userDetails.id).toBe(userA.id);
            (0, vitest_1.expect)(userDetails.client).toBeDefined();
        });
    });
});
//# sourceMappingURL=security.spec.js.map