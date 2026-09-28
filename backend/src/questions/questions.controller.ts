import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import { Role } from '@prisma/client';
import { JwtAuthGuard } from '../auth/jwt-auth.guard.js';
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

@Controller('questions')
@UseGuards(JwtAuthGuard)
export class QuestionsController {
  constructor(private readonly questionsService: QuestionsService) {}

  @Get()
  list(@Req() req: RequestWithUser) {
    return this.questionsService.listConversations(req.user.id, req.user.role);
  }

  @Get('conversations')
  listConversations(@Req() req: RequestWithUser) {
    return this.questionsService.listConversations(req.user.id, req.user.role);
  }

  @Post()
  create(@Req() req: RequestWithUser, @Body() dto: CreateConversationDto) {
    return this.questionsService.createConversation(req.user.id, req.user.role, dto);
  }

  @Post('conversations')
  createConversation(@Req() req: RequestWithUser, @Body() dto: CreateConversationDto) {
    return this.questionsService.createConversation(req.user.id, req.user.role, dto);
  }

  @Get('conversations/:id')
  getOne(@Param('id') id: string, @Req() req: RequestWithUser) {
    return this.questionsService.getConversation(id, req.user.id, req.user.role);
  }

  @Get(':id')
  getOneShort(@Param('id') id: string, @Req() req: RequestWithUser) {
    return this.questionsService.getConversation(id, req.user.id, req.user.role);
  }

  @Post('conversations/:id/messages')
  sendMessage(
    @Param('id') id: string,
    @Req() req: RequestWithUser,
    @Body() dto: SendMessageDto,
  ) {
    return this.questionsService.sendMessage(id, req.user.id, req.user.role, dto);
  }

  @Post(':id/messages')
  sendMessageShort(
    @Param('id') id: string,
    @Req() req: RequestWithUser,
    @Body() dto: SendMessageDto,
  ) {
    return this.questionsService.sendMessage(id, req.user.id, req.user.role, dto);
  }
}
