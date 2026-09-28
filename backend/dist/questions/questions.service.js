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
exports.QuestionsService = void 0;
const common_1 = require("@nestjs/common");
const client_1 = require("@prisma/client");
const prisma_service_js_1 = require("../prisma/prisma.service.js");
let QuestionsService = class QuestionsService {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    async getClientByUserId(userId) {
        const client = await this.prisma.client.findUnique({
            where: { userId },
        });
        if (!client) {
            throw new common_1.NotFoundException('Client profile not found for user');
        }
        return client;
    }
    async createConversation(userId, role, dto) {
        const client = await this.getClientByUserId(userId);
        if (dto.dietChartId) {
            const chart = await this.prisma.dietChart.findUnique({
                where: { id: dto.dietChartId },
            });
            if (!chart || chart.clientId !== client.id) {
                throw new common_1.ForbiddenException('Invalid diet chart reference');
            }
        }
        return this.prisma.conversation.create({
            data: {
                clientId: client.id,
                dietChartId: dto.dietChartId ?? null,
                subject: dto.subject ?? null,
                messages: {
                    create: {
                        authorId: userId,
                        authorRole: role === client_1.Role.ADMIN ? 'ADMIN' : 'USER',
                        body: dto.body,
                    },
                },
            },
            include: {
                messages: {
                    include: {
                        author: {
                            select: { id: true, fullName: true, role: true },
                        },
                    },
                },
                dietChart: {
                    select: { id: true, title: true },
                },
            },
        });
    }
    async listConversations(userId, role) {
        if (role === client_1.Role.ADMIN) {
            return this.prisma.conversation.findMany({
                orderBy: { updatedAt: 'desc' },
                include: {
                    client: {
                        include: {
                            user: {
                                select: { id: true, fullName: true, email: true },
                            },
                        },
                    },
                    dietChart: {
                        select: { id: true, title: true },
                    },
                    messages: {
                        take: 1,
                        orderBy: { createdAt: 'desc' },
                    },
                },
            });
        }
        const client = await this.getClientByUserId(userId);
        return this.prisma.conversation.findMany({
            where: { clientId: client.id },
            orderBy: { updatedAt: 'desc' },
            include: {
                dietChart: {
                    select: { id: true, title: true },
                },
                messages: {
                    take: 1,
                    orderBy: { createdAt: 'desc' },
                },
            },
        });
    }
    async getConversation(id, userId, role) {
        const conversation = await this.prisma.conversation.findUnique({
            where: { id },
            include: {
                client: {
                    include: {
                        user: {
                            select: { id: true, fullName: true, email: true },
                        },
                    },
                },
                dietChart: true,
                messages: {
                    orderBy: { createdAt: 'asc' },
                    include: {
                        author: {
                            select: { id: true, fullName: true, role: true },
                        },
                    },
                },
            },
        });
        if (!conversation) {
            throw new common_1.NotFoundException('Conversation not found');
        }
        if (role !== client_1.Role.ADMIN && conversation.client.userId !== userId) {
            throw new common_1.ForbiddenException('Access denied to this conversation');
        }
        return conversation;
    }
    async sendMessage(id, userId, role, dto) {
        const conversation = await this.prisma.conversation.findUnique({
            where: { id },
            include: {
                client: true,
            },
        });
        if (!conversation) {
            throw new common_1.NotFoundException('Conversation not found');
        }
        if (role !== client_1.Role.ADMIN && conversation.client.userId !== userId) {
            throw new common_1.ForbiddenException('Access denied: cannot message this conversation');
        }
        const [message] = await this.prisma.$transaction([
            this.prisma.conversationMessage.create({
                data: {
                    conversationId: id,
                    authorId: userId,
                    authorRole: role === client_1.Role.ADMIN ? 'ADMIN' : 'USER',
                    body: dto.body,
                },
                include: {
                    author: {
                        select: { id: true, fullName: true, role: true },
                    },
                },
            }),
            this.prisma.conversation.update({
                where: { id },
                data: { updatedAt: new Date() },
            }),
        ]);
        return message;
    }
};
exports.QuestionsService = QuestionsService;
exports.QuestionsService = QuestionsService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_js_1.PrismaService])
], QuestionsService);
//# sourceMappingURL=questions.service.js.map