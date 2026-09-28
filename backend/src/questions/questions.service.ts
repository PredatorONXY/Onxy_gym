import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { Role } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service.js';
import { CreateConversationDto } from './dto/create-conversation.dto.js';
import { SendMessageDto } from './dto/send-message.dto.js';

@Injectable()
export class QuestionsService {
  constructor(private prisma: PrismaService) {}

  private async getClientByUserId(userId: string) {
    const client = await this.prisma.client.findUnique({
      where: { userId },
    });
    if (!client) {
      throw new NotFoundException('Client profile not found for user');
    }
    return client;
  }

  async createConversation(userId: string, role: Role, dto: CreateConversationDto) {
    const client = await this.getClientByUserId(userId);

    if (dto.dietChartId) {
      const chart = await this.prisma.dietChart.findUnique({
        where: { id: dto.dietChartId },
      });
      if (!chart || chart.clientId !== client.id) {
        throw new ForbiddenException('Invalid diet chart reference');
      }
    }

    return this.prisma.conversation.create({
      data: {
        clientId: client.id,
        dietChartId: dto.dietChartId ?? null,
        subject: dto.subject ?? null,
        messages: {
          create: {
            authorId: userId,
            authorRole: role === Role.ADMIN ? 'ADMIN' : 'USER',
            body: dto.body,
          },
        },
      },
      include: {
        messages: {
          include: {
            author: {
              select: { id: true, fullName: true, role: true },
            },
          },
        },
        dietChart: {
          select: { id: true, title: true },
        },
      },
    });
  }

  async listConversations(userId: string, role: Role) {
    if (role === Role.ADMIN) {
      return this.prisma.conversation.findMany({
        orderBy: { updatedAt: 'desc' },
        include: {
          client: {
            include: {
              user: {
                select: { id: true, fullName: true, email: true },
              },
            },
          },
          dietChart: {
            select: { id: true, title: true },
          },
          messages: {
            take: 1,
            orderBy: { createdAt: 'desc' },
          },
        },
      });
    }

    const client = await this.getClientByUserId(userId);
    return this.prisma.conversation.findMany({
      where: { clientId: client.id },
      orderBy: { updatedAt: 'desc' },
      include: {
        dietChart: {
          select: { id: true, title: true },
        },
        messages: {
          take: 1,
          orderBy: { createdAt: 'desc' },
        },
      },
    });
  }

  async getConversation(id: string, userId: string, role: Role) {
    const conversation = await this.prisma.conversation.findUnique({
      where: { id },
      include: {
        client: {
          include: {
            user: {
              select: { id: true, fullName: true, email: true },
            },
          },
        },
        dietChart: true,
        messages: {
          orderBy: { createdAt: 'asc' },
          include: {
            author: {
              select: { id: true, fullName: true, role: true },
            },
          },
        },
      },
    });

    if (!conversation) {
      throw new NotFoundException('Conversation not found');
    }

    if (role !== Role.ADMIN && conversation.client.userId !== userId) {
      throw new ForbiddenException('Access denied to this conversation');
    }

    return conversation;
  }

  async sendMessage(id: string, userId: string, role: Role, dto: SendMessageDto) {
    const conversation = await this.prisma.conversation.findUnique({
      where: { id },
      include: {
        client: true,
      },
    });

    if (!conversation) {
      throw new NotFoundException('Conversation not found');
    }

    if (role !== Role.ADMIN && conversation.client.userId !== userId) {
      throw new ForbiddenException('Access denied: cannot message this conversation');
    }

    const [message] = await this.prisma.$transaction([
      this.prisma.conversationMessage.create({
        data: {
          conversationId: id,
          authorId: userId,
          authorRole: role === Role.ADMIN ? 'ADMIN' : 'USER',
          body: dto.body,
        },
        include: {
          author: {
            select: { id: true, fullName: true, role: true },
          },
        },
      }),
      this.prisma.conversation.update({
        where: { id },
        data: { updatedAt: new Date() },
      }),
    ]);

    return message;
  }
}
