import { Injectable, NotFoundException } from '@nestjs/common';
import { DietType } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service.js';

@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService) {}

  async profile(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        fullName: true,
        role: true,
        emailVerified: true,
        client: {
          select: {
            weightKg: true,
            heightCm: true,
            dietType: true,
          },
        },
      },
    });

    if (!user) {
      throw new NotFoundException('Profile not found');
    }

    return {
      weightKg: user.client?.weightKg ?? null,
      heightCm: user.client?.heightCm ?? null,
      dietType: user.client?.dietType ?? null,
      user: {
        id: user.id,
        email: user.email,
        fullName: user.fullName,
        role: user.role,
        emailVerified: user.emailVerified,
      },
    };
  }

  async updateProfile(
    userId: string,
    input: { weightKg?: number; heightCm?: number; dietType?: DietType },
  ) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      throw new NotFoundException('Profile not found');
    }

    return this.prisma.client.upsert({
      where: { userId },
      create: {
        userId,
        weightKg: input.weightKg,
        heightCm: input.heightCm,
        dietType: input.dietType ?? DietType.VEGETARIAN,
      },
      update: input,
      select: { weightKg: true, heightCm: true, dietType: true },
    });
  }
}
