import { Prisma, Role } from '@prisma/client';
import { DietChartsService } from './diet-charts.service.js';
declare class CreateChartDto {
    clientId?: string;
    userId?: string;
    title: string;
    description?: string;
    active?: boolean;
    meals?: Prisma.InputJsonObject;
    planData?: Prisma.InputJsonObject;
}
declare class UpdateChartDto {
    id?: string;
    clientId?: string;
    title?: string;
    description?: string;
    active?: boolean;
    meals?: Prisma.InputJsonObject;
    planData?: Prisma.InputJsonObject;
}
interface RequestWithUser {
    user: {
        id: string;
        role: Role;
    };
}
export declare class DietChartsController {
    private charts;
    constructor(charts: DietChartsService);
    allOrMine(req: RequestWithUser): Promise<({
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
    mine(req: RequestWithUser): Promise<({
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
    one(id: string, req: RequestWithUser): Promise<{
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
    create(dto: CreateChartDto): Promise<{
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
    update(id: string, dto: UpdateChartDto): Promise<{
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
    putUpdate(id: string, dto: UpdateChartDto): Promise<{
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
    putWithoutParam(dto: UpdateChartDto): Promise<{
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
    removeQuery(id: string): Promise<{
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
export {};
