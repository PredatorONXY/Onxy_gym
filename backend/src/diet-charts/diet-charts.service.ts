import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { Prisma, Role } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service.js';

@Injectable()
export class DietChartsService {
  constructor(private prisma: PrismaService) {}

  async mine(userId: string) {
    return this.prisma.dietChart.findMany({
      where: { client: { userId } },
      orderBy: { createdAt: 'desc' },
      include: {
        client: {
          include: {
            user: {
              select: { id: true, email: true, fullName: true },
            },
          },
        },
      },
    });
  }

  async all() {
    return this.prisma.dietChart.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        client: {
          include: {
            user: {
              select: { id: true, email: true, fullName: true },
            },
          },
        },
      },
    });
  }

  async one(id: string, userId: string, role: Role) {
    const chart = await this.prisma.dietChart.findFirst({
      where: role === 'ADMIN' ? { id } : { id, client: { userId } },
      include: {
        client: {
          include: {
            user: {
              select: { id: true, email: true, fullName: true },
            },
          },
        },
      },
    });
    if (!chart) throw new NotFoundException('Diet chart not found');
    return chart;
  }

  async create(data: {
    clientId?: string;
    userId?: string;
    title: string;
    description?: string;
    active?: boolean;
    meals?: Prisma.InputJsonValue;
    planData?: Prisma.InputJsonValue;
  }) {
    let resolvedClientId: string;

    if (data.userId) {
      const user = await this.prisma.user.findUnique({
        where: { id: data.userId },
        include: { client: true },
      });
      if (!user) throw new NotFoundException('User not found');
      if (user.role !== Role.USER) {
        throw new BadRequestException('Diet charts can only be assigned to accounts with role USER');
      }

      if (user.client) {
        resolvedClientId = user.client.id;
      } else {
        const newClient = await this.prisma.client.create({
          data: { userId: user.id },
        });
        resolvedClientId = newClient.id;
      }
    } else if (data.clientId) {
      const client = await this.prisma.client.findUnique({
        where: { id: data.clientId },
        include: { user: true },
      });
      if (!client) throw new NotFoundException('Client not found');
      if (client.user && client.user.role !== Role.USER) {
        throw new BadRequestException('Diet charts can only be assigned to accounts with role USER');
      }
      resolvedClientId = client.id;
    } else {
      throw new BadRequestException('Either userId or clientId must be provided');
    }

    let mealsPayload = data.meals;
    if ((!mealsPayload || Object.keys(mealsPayload as object).length === 0) && data.planData) {
      const pd = data.planData as Record<string, any>;
      const synthMeals: Record<string, any> = {};
      const mealMappings = [
        ['breakfast', pd.breakfast],
        ['lunch', pd.lunch],
        ['snack', pd.eveningSnack],
        ['dinner', pd.dinner],
      ] as const;

      for (const [key, group] of mealMappings) {
        const options = Array.isArray(group) ? group : group?.options;
        if (options && options.length > 0) {
          const opt1 = options[0];
          synthMeals[key] = {
            items: (opt1.ingredients || []).map((ing: any) => ({
              name: ing.name || 'Item',
              serving_size: ing.quantity || ing.serving || '',
              protein: 0,
              carbs: 0,
              fat: 0,
              calories: 0,
            })),
            total: {
              calories: Number(opt1.calories) || 0,
              protein: Number(opt1.protein) || 0,
              carbs: Number(opt1.carbs) || 0,
              fat: Number(opt1.fat) || 0,
            },
          };
        }
      }
      if (Object.keys(synthMeals).length > 0) {
        mealsPayload = synthMeals;
      }
    }

    return this.prisma.dietChart.create({
      data: {
        clientId: resolvedClientId,
        title: data.title,
        description: data.description ?? null,
        active: data.active ?? true,
        meals: mealsPayload ?? {},
        planData: data.planData ?? {},
      },
      include: {
        client: {
          include: {
            user: {
              select: { id: true, email: true, fullName: true },
            },
          },
        },
      },
    });
  }

  async update(
    id: string,
    data: {
      title?: string;
      description?: string;
      active?: boolean;
      meals?: Prisma.InputJsonValue;
      planData?: Prisma.InputJsonValue;
    },
  ) {
    await this.one(id, '', 'ADMIN');
    return this.prisma.dietChart.update({
      where: { id },
      data: {
        ...(data.title !== undefined && { title: data.title }),
        ...(data.description !== undefined && { description: data.description }),
        ...(data.active !== undefined && { active: data.active }),
        ...(data.meals !== undefined && { meals: data.meals }),
        ...(data.planData !== undefined && { planData: data.planData }),
      },
      include: {
        client: {
          include: {
            user: {
              select: { id: true, email: true, fullName: true },
            },
          },
        },
      },
    });
  }

  async remove(id: string) {
    await this.one(id, '', 'ADMIN');
    return this.prisma.dietChart.delete({ where: { id } });
  }
}
