import { DietType } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service.js';
export declare class UsersService {
    private prisma;
    constructor(prisma: PrismaService);
    profile(userId: string): Promise<{
        weightKg: import("@prisma/client/runtime/library").Decimal | null;
        heightCm: import("@prisma/client/runtime/library").Decimal | null;
        dietType: import("@prisma/client").$Enums.DietType | null;
        user: {
            id: string;
            email: string;
            fullName: string;
            role: import("@prisma/client").$Enums.Role;
            emailVerified: boolean;
        };
    }>;
    updateProfile(userId: string, input: {
        weightKg?: number;
        heightCm?: number;
        dietType?: DietType;
    }): Promise<{
        weightKg: import("@prisma/client/runtime/library").Decimal | null;
        heightCm: import("@prisma/client/runtime/library").Decimal | null;
        dietType: import("@prisma/client").$Enums.DietType | null;
    }>;
}
