import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { AuthController } from './auth.controller.js';
import { AuthService } from './auth.service.js';
import { JwtStrategy } from './jwt.strategy.js';
@Module({imports:[PassportModule,JwtModule.register({secret:process.env.JWT_SECRET??'unsafe-local-only',signOptions:{expiresIn:'8h'}})],controllers:[AuthController],providers:[AuthService,JwtStrategy],exports:[AuthService,JwtModule]}) export class AuthModule {}
