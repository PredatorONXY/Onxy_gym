import { Body, Controller, Get, Patch, UseGuards } from '@nestjs/common';
import { IsEnum, IsNumber, IsOptional, Max, Min } from 'class-validator';
import { DietType } from '@prisma/client';
import { JwtAuthGuard } from '../auth/jwt-auth.guard.js';
import { UsersService } from './users.service.js';
import { Req } from '@nestjs/common';
class UpdateProfileDto {@IsOptional() @IsNumber() @Min(1) @Max(500) weightKg?:number; @IsOptional() @IsNumber() @Min(1) @Max(300) heightCm?:number; @IsOptional() @IsEnum(DietType) dietType?:DietType}
@Controller('users/me') @UseGuards(JwtAuthGuard) export class UsersController {constructor(private users:UsersService){} @Get('profile') profile(@Req() req:{user:{id:string}}){return this.users.profile(req.user.id)} @Patch('profile') update(@Req() req:{user:{id:string}},@Body() dto:UpdateProfileDto){return this.users.updateProfile(req.user.id,dto)}}
