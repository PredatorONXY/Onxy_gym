import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Put,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { IsBoolean, IsObject, IsOptional, IsString, IsUUID } from 'class-validator';
import { Prisma, Role } from '@prisma/client';
import { JwtAuthGuard } from '../auth/jwt-auth.guard.js';
import { Roles } from '../common/roles.decorator.js';
import { RolesGuard } from '../common/roles.guard.js';
import { DietChartsService } from './diet-charts.service.js';

class CreateChartDto {
  @IsOptional()
  @IsUUID()
  clientId?: string;

  @IsOptional()
  @IsUUID()
  userId?: string;

  @IsString()
  title!: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsBoolean()
  active?: boolean;

  @IsOptional()
  @IsObject()
  meals?: Prisma.InputJsonObject;

  @IsOptional()
  @IsObject()
  planData?: Prisma.InputJsonObject;
}

class UpdateChartDto {
  @IsOptional()
  @IsUUID()
  id?: string;

  @IsOptional()
  @IsUUID()
  clientId?: string;

  @IsOptional()
  @IsString()
  title?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsBoolean()
  active?: boolean;

  @IsOptional()
  @IsObject()
  meals?: Prisma.InputJsonObject;

  @IsOptional()
  @IsObject()
  planData?: Prisma.InputJsonObject;
}

interface RequestWithUser {
  user: {
    id: string;
    role: Role;
  };
}

@Controller('diet-charts')
@UseGuards(JwtAuthGuard, RolesGuard)
export class DietChartsController {
  constructor(private charts: DietChartsService) {}

  @Get()
  allOrMine(@Req() req: RequestWithUser) {
    if (req.user.role === Role.ADMIN) {
      return this.charts.all();
    }
    return this.charts.mine(req.user.id);
  }

  @Get('me')
  mine(@Req() req: RequestWithUser) {
    return this.charts.mine(req.user.id);
  }

  @Get(':id')
  one(@Param('id') id: string, @Req() req: RequestWithUser) {
    return this.charts.one(id, req.user.id, req.user.role);
  }

  @Post()
  @Roles(Role.ADMIN)
  create(@Body() dto: CreateChartDto) {
    return this.charts.create(dto);
  }

  @Patch(':id')
  @Roles(Role.ADMIN)
  update(@Param('id') id: string, @Body() dto: UpdateChartDto) {
    return this.charts.update(id, dto);
  }

  @Put(':id')
  @Roles(Role.ADMIN)
  putUpdate(@Param('id') id: string, @Body() dto: UpdateChartDto) {
    return this.charts.update(id, dto);
  }

  @Put()
  @Roles(Role.ADMIN)
  putWithoutParam(@Body() dto: UpdateChartDto) {
    if (!dto.id) {
      throw new Error('Chart id is required for update');
    }
    return this.charts.update(dto.id, dto);
  }

  @Delete(':id')
  @Roles(Role.ADMIN)
  remove(@Param('id') id: string) {
    return this.charts.remove(id);
  }

  @Delete()
  @Roles(Role.ADMIN)
  removeQuery(@Query('id') id: string) {
    return this.charts.remove(id);
  }
}
