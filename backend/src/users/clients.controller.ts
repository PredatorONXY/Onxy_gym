import { Controller, Get, UseGuards } from '@nestjs/common';
import { Role } from '@prisma/client';
import { JwtAuthGuard } from '../auth/jwt-auth.guard.js';
import { Roles } from '../common/roles.decorator.js';
import { RolesGuard } from '../common/roles.guard.js';
import { PrismaService } from '../prisma/prisma.service.js';

@Controller('clients')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.ADMIN)
export class ClientsController {
  constructor(private prisma: PrismaService) {}

  @Get()
  async listClients() {
    const clients = await this.prisma.client.findMany({
      include: {
        user: {
          select: {
            id: true,
            fullName: true,
            email: true,
            createdAt: true,
          },
        },
      },
      orderBy: { joinedAt: 'desc' },
    });

    const clientList = clients.map((c) => ({
      id: c.id,
      userId: c.userId,
      name: c.user.fullName || c.user.email,
      email: c.user.email,
      created_at: c.joinedAt,
      age: c.age,
      gender: c.gender,
      goals: c.goals,
      weightKg: c.weightKg,
      heightCm: c.heightCm,
      dietType: c.dietType,
    }));

    return { clients: clientList };
  }
}
