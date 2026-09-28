import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import type { Request } from 'express';
import { PrismaService } from '../prisma/prisma.service.js';
import { AuthService } from './auth.service.js';

export const extractTokenFromReq = (req: Request): string | null => {
  if (req && (req as any).cookies && (req as any).cookies.onxy_auth_token) {
    return (req as any).cookies.onxy_auth_token;
  }
  if (req && req.headers && req.headers.cookie) {
    const match = req.headers.cookie.match(/(?:^|;\s*)onxy_auth_token=([^;]+)/);
    if (match) {
      return decodeURIComponent(match[1]);
    }
  }
  return ExtractJwt.fromAuthHeaderAsBearerToken()(req);
};

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    private prisma: PrismaService,
    private authService: AuthService,
  ) {
    super({
      jwtFromRequest: extractTokenFromReq,
      ignoreExpiration: false,
      secretOrKey: process.env.JWT_SECRET ?? 'unsafe-local-only',
      passReqToCallback: true,
    });
  }

  async validate(req: Request, payload: { sub: string }) {
    const rawToken = extractTokenFromReq(req);
    if (rawToken && this.authService.isTokenRevoked(rawToken)) {
      throw new UnauthorizedException('Token has been revoked');
    }

    const user = await this.prisma.user.findUnique({
      where: { id: payload.sub },
      select: {
        id: true,
        email: true,
        fullName: true,
        role: true,
        emailVerified: true,
        isAdmin: true,
        isTrainer: true,
      },
    });

    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    return user;
  }
}
