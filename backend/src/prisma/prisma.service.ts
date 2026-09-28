import { Injectable, Logger, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '@prisma/client';
import { Pool } from 'pg';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(PrismaService.name);
  private pool: Pool;

  constructor() {
    const connectionString = process.env.DATABASE_URL;
    if (!connectionString) {
      throw new Error('DATABASE_URL must be configured.');
    }

    const pool = new Pool({
      connectionString,
      max: process.env.VERCEL ? 3 : 10,
      connectionTimeoutMillis: 10000,
    });

    const adapter = new PrismaPg(pool);
    super({ adapter });
    this.pool = pool;
  }

  async onModuleInit(): Promise<void> {
    const maxAttempts = 3;
    const delayMs = 2000;

    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      try {
        await this.$connect();
        await this.$queryRawUnsafe('SELECT 1');
        this.logger.log('PrismaPg connected to database successfully.');
        return;
      } catch (err: unknown) {
        const errorMsg = err instanceof Error ? err.message : String(err);
        if (attempt < maxAttempts) {
          this.logger.warn(
            `Database connection attempt ${attempt}/${maxAttempts} failed (${errorMsg}). Retrying in ${delayMs / 1000}s (possible Neon cold start)...`,
          );
          await new Promise((resolve) => setTimeout(resolve, delayMs));
        } else {
          this.logger.error(
            `Database connection failed after ${maxAttempts} attempts: ${errorMsg}`,
          );
          await this.cleanShutdown();
          throw err;
        }
      }
    }
  }

  private async cleanShutdown(): Promise<void> {
    try {
      await this.$disconnect();
    } catch {
      // ignore error during disconnect
    }
    try {
      await this.pool.end();
    } catch {
      // ignore error during pool end
    }
  }

  async onModuleDestroy(): Promise<void> {
    await this.cleanShutdown();
  }
}
