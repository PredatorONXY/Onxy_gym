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
var PrismaService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.PrismaService = void 0;
const common_1 = require("@nestjs/common");
const adapter_pg_1 = require("@prisma/adapter-pg");
const client_1 = require("@prisma/client");
const pg_1 = require("pg");
let PrismaService = PrismaService_1 = class PrismaService extends client_1.PrismaClient {
    logger = new common_1.Logger(PrismaService_1.name);
    pool;
    constructor() {
        const connectionString = process.env.DATABASE_URL;
        if (!connectionString) {
            throw new Error('DATABASE_URL must be configured.');
        }
        const pool = new pg_1.Pool({
            connectionString,
            max: process.env.VERCEL ? 3 : 10,
            connectionTimeoutMillis: 10000,
        });
        const adapter = new adapter_pg_1.PrismaPg(pool);
        super({ adapter });
        this.pool = pool;
    }
    async onModuleInit() {
        const maxAttempts = 3;
        const delayMs = 2000;
        for (let attempt = 1; attempt <= maxAttempts; attempt++) {
            try {
                await this.$connect();
                await this.$queryRawUnsafe('SELECT 1');
                this.logger.log('PrismaPg connected to database successfully.');
                return;
            }
            catch (err) {
                const errorMsg = err instanceof Error ? err.message : String(err);
                if (attempt < maxAttempts) {
                    this.logger.warn(`Database connection attempt ${attempt}/${maxAttempts} failed (${errorMsg}). Retrying in ${delayMs / 1000}s (possible Neon cold start)...`);
                    await new Promise((resolve) => setTimeout(resolve, delayMs));
                }
                else {
                    this.logger.error(`Database connection failed after ${maxAttempts} attempts: ${errorMsg}`);
                    await this.cleanShutdown();
                    throw err;
                }
            }
        }
    }
    async cleanShutdown() {
        try {
            await this.$disconnect();
        }
        catch {
        }
        try {
            await this.pool.end();
        }
        catch {
        }
    }
    async onModuleDestroy() {
        await this.cleanShutdown();
    }
};
exports.PrismaService = PrismaService;
exports.PrismaService = PrismaService = PrismaService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [])
], PrismaService);
//# sourceMappingURL=prisma.service.js.map