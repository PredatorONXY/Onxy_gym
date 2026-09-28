import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { Role } from '@prisma/client';
import { JwtAuthGuard } from '../auth/jwt-auth.guard.js';
import { Roles } from '../common/roles.decorator.js';
import { RolesGuard } from '../common/roles.guard.js';
import { SendMessageDto } from '../questions/dto/send-message.dto.js';
import { AdminService } from './admin.service.js';

interface RequestWithUser {
  user: {
    id: string;
    email: string;
    role: Role;
  };
}

@Controller('admin')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.ADMIN)
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  @Get('users')
  listUsers(@Query('role') role?: Role) {
    return this.adminService.listUsers(role);
  }

  @Get('users/:id')
  getUserDetails(@Param('id') id: string) {
    return this.adminService.getUserDetails(id);
  }

  @Get('diet-charts')
  listDietCharts() {
    return this.adminService.listDietCharts();
  }

  @Get('conversations')
  listConversations(@Req() req: RequestWithUser) {
    return this.adminService.listConversations(req.user.id);
  }

  @Post('conversations/:id/reply')
  replyToConversation(
    @Param('id') id: string,
    @Req() req: RequestWithUser,
    @Body() dto: SendMessageDto,
  ) {
    return this.adminService.replyToConversation(id, req.user.id, dto.body);
  }
}
