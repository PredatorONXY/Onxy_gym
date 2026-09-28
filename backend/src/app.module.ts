import './env.js';
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { resolveRootEnvPath } from './env.js';
import { PrismaModule } from './prisma/prisma.module.js';
import { AuthModule } from './auth/auth.module.js';
import { UsersModule } from './users/users.module.js';
import { DietChartsModule } from './diet-charts/diet-charts.module.js';
import { QuestionsModule } from './questions/questions.module.js';
import { AdminModule } from './admin/admin.module.js';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: resolveRootEnvPath(),
    }),
    PrismaModule,
    AuthModule,
    UsersModule,
    DietChartsModule,
    QuestionsModule,
    AdminModule,
  ],
})
export class AppModule {}
