import { Role } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service.js';
import { QuestionsService } from '../questions/questions.service.js';
export declare class AdminService {
    private prisma;
    private questionsService;
    constructor(prisma: PrismaService, questionsService: QuestionsService);
    listUsers(role?: Role): Promise<{
        client: {
            id: string;
            weightKg: import("@prisma/client/runtime/library").Decimal | null;
            heightCm: import("@prisma/client/runtime/library").Decimal | null;
            dietType: import("@prisma/client").$Enums.DietType | null;
            _count: {
                dietCharts: number;
                conversations: number;
            };
        } | null;
        id: string;
        email: string;
        fullName: string;
        role: import("@prisma/client").$Enums.Role;
        emailVerified: boolean;
        createdAt: Date;
    }[]>;
    getUserDetails(id: string): Promise<{
        client: ({
            dietCharts: {
                id: string;
                createdAt: Date;
                updatedAt: Date;
                clientId: string;
                title: string;
                description: string | null;
                active: boolean;
                meals: import("@prisma/client/runtime/library").JsonValue;
                planData: import("@prisma/client/runtime/library").JsonValue;
            }[];
            conversations: ({
                messages: {
                    id: string;
                    createdAt: Date;
                    body: string;
                    authorRole: import("@prisma/client").$Enums.MessageAuthor;
                    authorId: string;
                    conversationId: string;
                }[];
            } & {
                id: string;
                createdAt: Date;
                updatedAt: Date;
                clientId: string;
                subject: string | null;
                dietChartId: string | null;
            })[];
        } & {
            id: string;
            age: number | null;
            gender: string | null;
            goals: string | null;
            weightKg: import("@prisma/client/runtime/library").Decimal | null;
            heightCm: import("@prisma/client/runtime/library").Decimal | null;
            dietType: import("@prisma/client").$Enums.DietType | null;
            joinedAt: Date;
            userId: string;
        }) | null;
        id: string;
        email: string;
        googleId: string | null;
        fullName: string;
        role: import("@prisma/client").$Enums.Role;
        isAdmin: boolean;
        isTrainer: boolean;
        specialization: string | null;
        experienceYears: number | null;
        bio: string | null;
        emailVerified: boolean;
        emailVerificationExpiresAt: Date | null;
        createdAt: Date;
        updatedAt: Date;
    }>;
    listDietCharts(): Promise<({
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
            weightKg: import("@prisma/client/runtime/library").Decimal | null;
            heightCm: import("@prisma/client/runtime/library").Decimal | null;
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
        meals: import("@prisma/client/runtime/library").JsonValue;
        planData: import("@prisma/client/runtime/library").JsonValue;
    })[]>;
    listConversations(adminUserId: string): Promise<({
        dietChart: {
            id: string;
            title: string;
        } | null;
        messages: {
            id: string;
            createdAt: Date;
            body: string;
            authorRole: import("@prisma/client").$Enums.MessageAuthor;
            authorId: string;
            conversationId: string;
        }[];
    } & {
        id: string;
        createdAt: Date;
        updatedAt: Date;
        clientId: string;
        subject: string | null;
        dietChartId: string | null;
    })[]>;
    replyToConversation(conversationId: string, adminUserId: string, body: string): Promise<{
        author: {
            id: string;
            fullName: string;
            role: import("@prisma/client").$Enums.Role;
        };
    } & {
        id: string;
        createdAt: Date;
        body: string;
        authorRole: import("@prisma/client").$Enums.MessageAuthor;
        authorId: string;
        conversationId: string;
    }>;
}
