import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../prisma/prisma.service.js';
export declare class AuthService {
    private prisma;
    private jwt;
    constructor(prisma: PrismaService, jwt: JwtService);
    private revokedTokens;
    revokeToken(token: string): void;
    isTokenRevoked(token: string): boolean;
    private hashToken;
    generateVerificationToken(userId: string): Promise<string>;
    register(input: {
        email: string;
        fullName: string;
        password: string;
    }): Promise<{
        accessToken: string;
        user: {
            id: string;
            email: string;
            fullName: string | undefined;
            role: string;
            emailVerified: boolean;
        };
    }>;
    login(email: string, password: string): Promise<{
        accessToken: string;
        user: {
            id: string;
            email: string;
            fullName: string | undefined;
            role: string;
            emailVerified: boolean;
        };
    }>;
    verifyEmail(token: string): Promise<{
        success: boolean;
        message: string;
    }>;
    resendVerification(email: string): Promise<{
        success: boolean;
        message: string;
    }>;
    googleLogin(profile: {
        googleId: string;
        email: string;
        fullName: string;
    }): Promise<{
        accessToken: string;
        user: {
            id: string;
            email: string;
            fullName: string | undefined;
            role: string;
            emailVerified: boolean;
        };
    }>;
    session(user: {
        id: string;
        email: string;
        role: string;
        emailVerified: boolean;
        fullName?: string;
    }): {
        accessToken: string;
        user: {
            id: string;
            email: string;
            fullName: string | undefined;
            role: string;
            emailVerified: boolean;
        };
    };
}
