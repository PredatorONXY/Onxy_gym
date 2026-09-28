import { DietType } from '@prisma/client';
import { UsersService } from './users.service.js';
declare class UpdateProfileDto {
    weightKg?: number;
    heightCm?: number;
    dietType?: DietType;
}
export declare class UsersController {
    private users;
    constructor(users: UsersService);
    profile(req: {
        user: {
            id: string;
        };
    }): Promise<{
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
    update(req: {
        user: {
            id: string;
        };
    }, dto: UpdateProfileDto): Promise<{
        weightKg: import("@prisma/client/runtime/library").Decimal | null;
        heightCm: import("@prisma/client/runtime/library").Decimal | null;
        dietType: import("@prisma/client").$Enums.DietType | null;
    }>;
}
export {};
