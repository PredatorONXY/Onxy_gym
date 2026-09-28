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
exports.UsersService = void 0;
const common_1 = require("@nestjs/common");
const client_1 = require("@prisma/client");
const prisma_service_js_1 = require("../prisma/prisma.service.js");
let UsersService = class UsersService {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    async profile(userId) {
        const user = await this.prisma.user.findUnique({
            where: { id: userId },
            select: {
                id: true,
                email: true,
                fullName: true,
                role: true,
                emailVerified: true,
                client: {
                    select: {
                        weightKg: true,
                        heightCm: true,
                        dietType: true,
                    },
                },
            },
        });
        if (!user) {
            throw new common_1.NotFoundException('Profile not found');
        }
        return {
            weightKg: user.client?.weightKg ?? null,
            heightCm: user.client?.heightCm ?? null,
            dietType: user.client?.dietType ?? null,
            user: {
                id: user.id,
                email: user.email,
                fullName: user.fullName,
                role: user.role,
                emailVerified: user.emailVerified,
            },
        };
    }
    async updateProfile(userId, input) {
        const user = await this.prisma.user.findUnique({ where: { id: userId } });
        if (!user) {
            throw new common_1.NotFoundException('Profile not found');
        }
        return this.prisma.client.upsert({
            where: { userId },
            create: {
                userId,
                weightKg: input.weightKg,
                heightCm: input.heightCm,
                dietType: input.dietType ?? client_1.DietType.VEGETARIAN,
            },
            update: input,
            select: { weightKg: true, heightCm: true, dietType: true },
        });
    }
};
exports.UsersService = UsersService;
exports.UsersService = UsersService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_js_1.PrismaService])
], UsersService);
//# sourceMappingURL=users.service.js.map