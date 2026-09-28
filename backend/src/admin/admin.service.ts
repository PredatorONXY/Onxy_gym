import { Injectable, NotFoundException } from '@nestjs/common';
import { Role } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service.js';
import { QuestionsService } from '../questions/questions.service.js';

@Injectable()
export class AdminService {
  constructor(
    private prisma: PrismaService,
    private questionsService: QuestionsService,
  ) {}

  async listUsers(role?: Role) {
    return this.prisma.user.findMany({
      where: role ? { role } : undefined,
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        email: true,
        fullName: true,
        role: true,
        emailVerified: true,
        createdAt: true,
        client: {
          select: {
            id: true,
            weightKg: true,
            heightCm: true,
            dietType: true,
            _count: {
              select: {
                dietCharts: true,
                conversations: true,
              },
            },
          },
        },
      },
    });
  }

  async getUserDetails(id: string) {
    const user = await this.prisma.user.findUnique({
      where: { id },
      include: {
        client: {
          include: {
            dietCharts: {
              orderBy: { createdAt: 'desc' },
            },
            conversations: {
              orderBy: { updatedAt: 'desc' },
              include: {
                messages: {
                  orderBy: { createdAt: 'asc' },
                },
              },
            },
          },
        },
      },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    const { passwordHash, emailVerificationTokenHash, ...safeUser } = user;
    return safeUser;
  }

  async listDietCharts() {
    return this.prisma.dietChart.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        client: {
          include: {
            user: {
              select: { id: true, fullName: true, email: true },
            },
          },
        },
      },
    });
  }

  async listConversations(adminUserId: string) {
    return this.questionsService.listConversations(adminUserId, Role.ADMIN);
  }

  async replyToConversation(conversationId: string, adminUserId: string, body: string) {
    return this.questionsService.sendMessage(conversationId, adminUserId, Role.ADMIN, { body });
  }
}
