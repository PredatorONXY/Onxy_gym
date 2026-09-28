import { Role } from '@prisma/client';
import { CreateConversationDto } from './dto/create-conversation.dto.js';
import { SendMessageDto } from './dto/send-message.dto.js';
import { QuestionsService } from './questions.service.js';
interface RequestWithUser {
    user: {
        id: string;
        email: string;
        role: Role;
    };
}
export declare class QuestionsController {
    private readonly questionsService;
    constructor(questionsService: QuestionsService);
    list(req: RequestWithUser): Promise<({
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
    listConversations(req: RequestWithUser): Promise<({
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
    create(req: RequestWithUser, dto: CreateConversationDto): Promise<{
        dietChart: {
            id: string;
            title: string;
        } | null;
        messages: ({
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
        })[];
    } & {
        id: string;
        createdAt: Date;
        updatedAt: Date;
        clientId: string;
        subject: string | null;
        dietChartId: string | null;
    }>;
    createConversation(req: RequestWithUser, dto: CreateConversationDto): Promise<{
        dietChart: {
            id: string;
            title: string;
        } | null;
        messages: ({
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
        })[];
    } & {
        id: string;
        createdAt: Date;
        updatedAt: Date;
        clientId: string;
        subject: string | null;
        dietChartId: string | null;
    }>;
    getOne(id: string, req: RequestWithUser): Promise<{
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
        dietChart: {
            id: string;
            createdAt: Date;
            updatedAt: Date;
            clientId: string;
            title: string;
            description: string | null;
            active: boolean;
            meals: import("@prisma/client/runtime/library").JsonValue;
            planData: import("@prisma/client/runtime/library").JsonValue;
        } | null;
        messages: ({
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
        })[];
    } & {
        id: string;
        createdAt: Date;
        updatedAt: Date;
        clientId: string;
        subject: string | null;
        dietChartId: string | null;
    }>;
    getOneShort(id: string, req: RequestWithUser): Promise<{
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
        dietChart: {
            id: string;
            createdAt: Date;
            updatedAt: Date;
            clientId: string;
            title: string;
            description: string | null;
            active: boolean;
            meals: import("@prisma/client/runtime/library").JsonValue;
            planData: import("@prisma/client/runtime/library").JsonValue;
        } | null;
        messages: ({
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
        })[];
    } & {
        id: string;
        createdAt: Date;
        updatedAt: Date;
        clientId: string;
        subject: string | null;
        dietChartId: string | null;
    }>;
    sendMessage(id: string, req: RequestWithUser, dto: SendMessageDto): Promise<{
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
    sendMessageShort(id: string, req: RequestWithUser, dto: SendMessageDto): Promise<{
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
export {};
