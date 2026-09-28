"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AdminService = void 0;
const common_1 = require("@nestjs/common");
const client_1 = require("@prisma/client");
const prisma_service_js_1 = require("../prisma/prisma.service.js");
const questions_service_js_1 = require("../questions/questions.service.js");
let AdminService = class AdminService {
    prisma;
    questionsService;
    constructor(prisma, questionsService) {
        this.prisma = prisma;
        this.questionsService = questionsService;
    }
    async listUsers(role) {
        return this.prisma.user.findMany({
            where: role ? { role } : undefined,
            orderBy: { createdAt: 'desc' },
            select: {
                id: true,
                email: true,
                fullName: true,
                role: true,
                emailVerified: true,
                createdAt: true,
                client: {
                    select: {
                        id: true,
                        weightKg: true,
                        heightCm: true,
                        dietType: true,
                        _count: {
                            select: {
                                dietCharts: true,
                                conversations: true,
                            },
                        },
                    },
                },
            },
        });
    }
    async getUserDetails(id) {
        const user = await this.prisma.user.findUnique({
            where: { id },
            include: {
                client: {
                    include: {
                        dietCharts: {
                            orderBy: { createdAt: 'desc' },
                        },
                        conversations: {
                            orderBy: { updatedAt: 'desc' },
                            include: {
                                messages: {
                                    orderBy: { createdAt: 'asc' },
                                },
                            },
                        },
                    },
                },
            },
        });
        if (!user) {
            throw new common_1.NotFoundException('User not found');
        }
        const { passwordHash, emailVerificationTokenHash, ...safeUser } = user;
        return safeUser;
    }
    async listDietCharts() {
        return this.prisma.dietChart.findMany({
            orderBy: { createdAt: 'desc' },
            include: {
                client: {
                    include: {
                        user: {
                            select: { id: true, fullName: true, email: true },
                        },
                    },
                },
            },
        });
    }
    async listConversations(adminUserId) {
        return this.questionsService.listConversations(adminUserId, client_1.Role.ADMIN);
    }
    async replyToConversation(conversationId, adminUserId, body) {
        return this.questionsService.sendMessage(conversationId, adminUserId, client_1.Role.ADMIN, { body });
    }
};
exports.AdminService = AdminService;
exports.AdminService = AdminService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_js_1.PrismaService,
        questions_service_js_1.QuestionsService])
], AdminService);
//# sourceMappingURL=admin.service.js.map