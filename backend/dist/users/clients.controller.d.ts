import { PrismaService } from '../prisma/prisma.service.js';
export declare class ClientsController {
    private prisma;
    constructor(prisma: PrismaService);
    listClients(): Promise<{
        clients: {
            id: string;
            userId: string;
            name: string;
            email: string;
            created_at: Date;
            age: number | null;
            gender: string | null;
            goals: string | null;
            weightKg: import("@prisma/client/runtime/library").Decimal | null;
            heightCm: import("@prisma/client/runtime/library").Decimal | null;
            dietType: import("@prisma/client").$Enums.DietType | null;
        }[];
    }>;
}
