import { OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
export declare class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
    private readonly logger;
    private pool;
    constructor();
    onModuleInit(): Promise<void>;
    private cleanShutdown;
    onModuleDestroy(): Promise<void>;
}
