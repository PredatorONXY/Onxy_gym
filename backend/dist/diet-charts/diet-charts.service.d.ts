import { Prisma, Role } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service.js';
export declare class DietChartsService {
    private prisma;
    constructor(prisma: PrismaService);
    mine(userId: string): Promise<({
        client: {
            user: {
                id: string;
                email: string;
                fullName: string;
            };
        } & {
            id: string;
            age: number | null;
            gender: string | null;
            goals: string | null;
            weightKg: Prisma.Decimal | null;
            heightCm: Prisma.Decimal | null;
            dietType: import("@prisma/client").$Enums.DietType | null;
            joinedAt: Date;
            userId: string;
        };
    } & {
        id: string;
        createdAt: Date;
        updatedAt: Date;
        clientId: string;
        title: string;
        description: string | null;
        active: boolean;
        meals: Prisma.JsonValue;
        planData: Prisma.JsonValue;
    })[]>;
    all(): Promise<({
        client: {
            user: {
                id: string;
                email: string;
                fullName: string;
            };
        } & {
            id: string;
            age: number | null;
            gender: string | null;
            goals: string | null;
            weightKg: Prisma.Decimal | null;
            heightCm: Prisma.Decimal | null;
            dietType: import("@prisma/client").$Enums.DietType | null;
            joinedAt: Date;
            userId: string;
        };
    } & {
        id: string;
        createdAt: Date;
        updatedAt: Date;
        clientId: string;
        title: string;
        description: string | null;
        active: boolean;
        meals: Prisma.JsonValue;
        planData: Prisma.JsonValue;
    })[]>;
    one(id: string, userId: string, role: Role): Promise<{
        client: {
            user: {
                id: string;
                email: string;
                fullName: string;
            };
        } & {
            id: string;
            age: number | null;
            gender: string | null;
            goals: string | null;
            weightKg: Prisma.Decimal | null;
            heightCm: Prisma.Decimal | null;
            dietType: import("@prisma/client").$Enums.DietType | null;
            joinedAt: Date;
            userId: string;
        };
    } & {
        id: string;
        createdAt: Date;
        updatedAt: Date;
        clientId: string;
        title: string;
        description: string | null;
        active: boolean;
        meals: Prisma.JsonValue;
        planData: Prisma.JsonValue;
    }>;
    create(data: {
        clientId?: string;
        userId?: string;
        title: string;
        description?: string;
        active?: boolean;
        meals?: Prisma.InputJsonValue;
        planData?: Prisma.InputJsonValue;
    }): Promise<{
        client: {
            user: {
                id: string;
                email: string;
                fullName: string;
            };
        } & {
            id: string;
            age: number | null;
            gender: string | null;
            goals: string | null;
            weightKg: Prisma.Decimal | null;
            heightCm: Prisma.Decimal | null;
            dietType: import("@prisma/client").$Enums.DietType | null;
            joinedAt: Date;
            userId: string;
        };
    } & {
        id: string;
        createdAt: Date;
        updatedAt: Date;
        clientId: string;
        title: string;
        description: string | null;
        active: boolean;
        meals: Prisma.JsonValue;
        planData: Prisma.JsonValue;
    }>;
    update(id: string, data: {
        title?: string;
        description?: string;
        active?: boolean;
        meals?: Prisma.InputJsonValue;
        planData?: Prisma.InputJsonValue;
    }): Promise<{
        client: {
            user: {
                id: string;
                email: string;
                fullName: string;
            };
        } & {
            id: string;
            age: number | null;
            gender: string | null;
            goals: string | null;
            weightKg: Prisma.Decimal | null;
            heightCm: Prisma.Decimal | null;
            dietType: import("@prisma/client").$Enums.DietType | null;
            joinedAt: Date;
            userId: string;
        };
    } & {
        id: string;
        createdAt: Date;
        updatedAt: Date;
        clientId: string;
        title: string;
        description: string | null;
        active: boolean;
        meals: Prisma.JsonValue;
        planData: Prisma.JsonValue;
    }>;
    remove(id: string): Promise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        clientId: string;
        title: string;
        description: string | null;
        active: boolean;
        meals: Prisma.JsonValue;
        planData: Prisma.JsonValue;
    }>;
}
