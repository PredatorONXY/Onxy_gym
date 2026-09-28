import { Strategy } from 'passport-jwt';
import type { Request } from 'express';
import { PrismaService } from '../prisma/prisma.service.js';
import { AuthService } from './auth.service.js';
export declare const extractTokenFromReq: (req: Request) => string | null;
declare const JwtStrategy_base: new (...args: [opt: import("passport-jwt").StrategyOptionsWithRequest] | [opt: import("passport-jwt").StrategyOptionsWithoutRequest]) => Strategy & {
    validate(...args: any[]): unknown;
};
export declare class JwtStrategy extends JwtStrategy_base {
    private prisma;
    private authService;
    constructor(prisma: PrismaService, authService: AuthService);
    validate(req: Request, payload: {
        sub: string;
    }): Promise<{
        id: string;
        email: string;
        fullName: string;
        role: import("@prisma/client").$Enums.Role;
        isAdmin: boolean;
        isTrainer: boolean;
        emailVerified: boolean;
    }>;
}
export {};
