import {
  BadRequestException,
  ConflictException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Role } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import * as crypto from 'crypto';
import { PrismaService } from '../prisma/prisma.service.js';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwt: JwtService,
  ) {}

  private revokedTokens = new Set<string>();

  revokeToken(token: string) {
    if (token) {
      this.revokedTokens.add(token.trim());
    }
  }

  isTokenRevoked(token: string): boolean {
    if (!token) return false;
    return this.revokedTokens.has(token.trim());
  }

  private hashToken(token: string): string {
    return crypto.createHash('sha256').update(token).digest('hex');
  }

  async generateVerificationToken(userId: string): Promise<string> {
    const rawToken = crypto.randomBytes(32).toString('hex');
    const tokenHash = this.hashToken(rawToken);
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

    // Invalidate any previous tokens by updating with the new hash & expiration
    await this.prisma.user.update({
      where: { id: userId },
      data: {
        emailVerificationTokenHash: tokenHash,
        emailVerificationExpiresAt: expiresAt,
      },
    });

    return rawToken;
  }

  async register(input: { email: string; fullName: string; password: string }) {
    const email = input.email.trim().toLowerCase();
    if (await this.prisma.user.findUnique({ where: { email } })) {
      throw new ConflictException('Email is already registered');
    }

    const passwordHash = await bcrypt.hash(input.password, 12);
    // Public registration always assigns role USER
    const user = await this.prisma.user.create({
      data: {
        email,
        fullName: input.fullName.trim(),
        passwordHash,
        role: Role.USER,
        isAdmin: false,
        isTrainer: false,
        emailVerified: false,
        client: {
          create: {},
        },
      },
      select: {
        id: true,
        email: true,
        fullName: true,
        role: true,
        emailVerified: true,
      },
    });

    // Generate email verification token in background
    await this.generateVerificationToken(user.id);

    return this.session(user);
  }

  async login(email: string, password: string) {
    const user = await this.prisma.user.findUnique({
      where: { email: email.trim().toLowerCase() },
      include: { client: true },
    });

    if (!user?.passwordHash || !(await bcrypt.compare(password, user.passwordHash))) {
      throw new UnauthorizedException('Invalid email or password');
    }

    return this.session(user);
  }

  async verifyEmail(token: string) {
    if (!token || typeof token !== 'string') {
      throw new BadRequestException('Verification token is required');
    }

    const tokenHash = this.hashToken(token.trim());
    const user = await this.prisma.user.findFirst({
      where: {
        emailVerificationTokenHash: tokenHash,
        emailVerificationExpiresAt: { gt: new Date() },
      },
    });

    if (!user) {
      throw new BadRequestException('Invalid or expired verification token');
    }

    await this.prisma.user.update({
      where: { id: user.id },
      data: {
        emailVerified: true,
        emailVerificationTokenHash: null,
        emailVerificationExpiresAt: null,
      },
    });

    return {
      success: true,
      message: 'Email verified successfully',
    };
  }

  async resendVerification(email: string) {
    if (!email) {
      throw new BadRequestException('Email is required');
    }

    const user = await this.prisma.user.findUnique({
      where: { email: email.trim().toLowerCase() },
    });

    if (user && !user.emailVerified) {
      await this.generateVerificationToken(user.id);
    }

    // Always return a generic success message without leaking account existence or tokens
    return {
      success: true,
      message: 'If an account exists with this email, a verification link has been sent.',
    };
  }

  async googleLogin(profile: { googleId: string; email: string; fullName: string }) {
    const email = profile.email.trim().toLowerCase();
    let user = await this.prisma.user.findFirst({
      where: {
        OR: [{ googleId: profile.googleId }, { email }],
      },
    });

    if (user) {
      if (!user.googleId) {
        user = await this.prisma.user.update({
          where: { id: user.id },
          data: { googleId: profile.googleId, emailVerified: true },
        });
      }
    } else {
      user = await this.prisma.user.create({
        data: {
          email,
          fullName: profile.fullName || 'Google User',
          googleId: profile.googleId,
          role: Role.USER,
          isAdmin: false,
          isTrainer: false,
          emailVerified: true,
          client: {
            create: {},
          },
        },
      });
    }

    return this.session(user);
  }

  session(user: { id: string; email: string; role: string; emailVerified: boolean; fullName?: string }) {
    return {
      accessToken: this.jwt.sign({ sub: user.id, role: user.role }),
      user: {
        id: user.id,
        email: user.email,
        fullName: user.fullName,
        role: user.role,
        emailVerified: user.emailVerified,
      },
    };
  }
}
