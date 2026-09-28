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
exports.DietChartsService = void 0;
const common_1 = require("@nestjs/common");
const client_1 = require("@prisma/client");
const prisma_service_js_1 = require("../prisma/prisma.service.js");
let DietChartsService = class DietChartsService {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    async mine(userId) {
        return this.prisma.dietChart.findMany({
            where: { client: { userId } },
            orderBy: { createdAt: 'desc' },
            include: {
                client: {
                    include: {
                        user: {
                            select: { id: true, email: true, fullName: true },
                        },
                    },
                },
            },
        });
    }
    async all() {
        return this.prisma.dietChart.findMany({
            orderBy: { createdAt: 'desc' },
            include: {
                client: {
                    include: {
                        user: {
                            select: { id: true, email: true, fullName: true },
                        },
                    },
                },
            },
        });
    }
    async one(id, userId, role) {
        const chart = await this.prisma.dietChart.findFirst({
            where: role === 'ADMIN' ? { id } : { id, client: { userId } },
            include: {
                client: {
                    include: {
                        user: {
                            select: { id: true, email: true, fullName: true },
                        },
                    },
                },
            },
        });
        if (!chart)
            throw new common_1.NotFoundException('Diet chart not found');
        return chart;
    }
    async create(data) {
        let resolvedClientId;
        if (data.userId) {
            const user = await this.prisma.user.findUnique({
                where: { id: data.userId },
                include: { client: true },
            });
            if (!user)
                throw new common_1.NotFoundException('User not found');
            if (user.role !== client_1.Role.USER) {
                throw new common_1.BadRequestException('Diet charts can only be assigned to accounts with role USER');
            }
            if (user.client) {
                resolvedClientId = user.client.id;
            }
            else {
                const newClient = await this.prisma.client.create({
                    data: { userId: user.id },
                });
                resolvedClientId = newClient.id;
            }
        }
        else if (data.clientId) {
            const client = await this.prisma.client.findUnique({
                where: { id: data.clientId },
                include: { user: true },
            });
            if (!client)
                throw new common_1.NotFoundException('Client not found');
            if (client.user && client.user.role !== client_1.Role.USER) {
                throw new common_1.BadRequestException('Diet charts can only be assigned to accounts with role USER');
            }
            resolvedClientId = client.id;
        }
        else {
            throw new common_1.BadRequestException('Either userId or clientId must be provided');
        }
        let mealsPayload = data.meals;
        if ((!mealsPayload || Object.keys(mealsPayload).length === 0) && data.planData) {
            const pd = data.planData;
            const synthMeals = {};
            const mealMappings = [
                ['breakfast', pd.breakfast],
                ['lunch', pd.lunch],
                ['snack', pd.eveningSnack],
                ['dinner', pd.dinner],
            ];
            for (const [key, group] of mealMappings) {
                const options = Array.isArray(group) ? group : group?.options;
                if (options && options.length > 0) {
                    const opt1 = options[0];
                    synthMeals[key] = {
                        items: (opt1.ingredients || []).map((ing) => ({
                            name: ing.name || 'Item',
                            serving_size: ing.quantity || ing.serving || '',
                            protein: 0,
                            carbs: 0,
                            fat: 0,
                            calories: 0,
                        })),
                        total: {
                            calories: Number(opt1.calories) || 0,
                            protein: Number(opt1.protein) || 0,
                            carbs: Number(opt1.carbs) || 0,
                            fat: Number(opt1.fat) || 0,
                        },
                    };
                }
            }
            if (Object.keys(synthMeals).length > 0) {
                mealsPayload = synthMeals;
            }
        }
        return this.prisma.dietChart.create({
            data: {
                clientId: resolvedClientId,
                title: data.title,
                description: data.description ?? null,
                active: data.active ?? true,
                meals: mealsPayload ?? {},
                planData: data.planData ?? {},
            },
            include: {
                client: {
                    include: {
                        user: {
                            select: { id: true, email: true, fullName: true },
                        },
                    },
                },
            },
        });
    }
    async update(id, data) {
        await this.one(id, '', 'ADMIN');
        return this.prisma.dietChart.update({
            where: { id },
            data: {
                ...(data.title !== undefined && { title: data.title }),
                ...(data.description !== undefined && { description: data.description }),
                ...(data.active !== undefined && { active: data.active }),
                ...(data.meals !== undefined && { meals: data.meals }),
                ...(data.planData !== undefined && { planData: data.planData }),
            },
            include: {
                client: {
                    include: {
                        user: {
                            select: { id: true, email: true, fullName: true },
                        },
                    },
                },
            },
        });
    }
    async remove(id) {
        await this.one(id, '', 'ADMIN');
        return this.prisma.dietChart.delete({ where: { id } });
    }
};
exports.DietChartsService = DietChartsService;
exports.DietChartsService = DietChartsService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_js_1.PrismaService])
], DietChartsService);
//# sourceMappingURL=diet-charts.service.js.map