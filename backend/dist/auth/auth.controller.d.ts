import type { Request, Response } from 'express';
import { AuthService } from './auth.service.js';
declare class RegisterDto {
    fullName: string;
    email: string;
    password: string;
}
declare class LoginDto {
    email: string;
    password: string;
}
declare class VerifyEmailDto {
    token: string;
}
declare class ResendVerificationDto {
    email: string;
}
declare class GoogleAuthDto {
    googleId: string;
    email: string;
    fullName?: string;
}
export declare class AuthController {
    private auth;
    constructor(auth: AuthService);
    private setAuthCookie;
    private clearAuthCookie;
    register(body: RegisterDto, res: Response): Promise<{
        accessToken: string;
        user: {
            id: string;
            email: string;
            fullName: string | undefined;
            role: string;
            emailVerified: boolean;
        };
    }>;
    login(body: LoginDto, res: Response): Promise<{
        accessToken: string;
        user: {
            id: string;
            email: string;
            fullName: string | undefined;
            role: string;
            emailVerified: boolean;
        };
    }>;
    me(req: {
        user: unknown;
    }): unknown;
    logout(req: Request, res: Response): {
        success: boolean;
    };
    verifyEmail(body: VerifyEmailDto): Promise<{
        success: boolean;
        message: string;
    }>;
    verifyEmailQuery(token: string): Promise<{
        success: boolean;
        message: string;
    }>;
    resendVerification(body: ResendVerificationDto): Promise<{
        success: boolean;
        message: string;
    }>;
    googleAuth(body: GoogleAuthDto, res: Response): Promise<{
        accessToken: string;
        user: {
            id: string;
            email: string;
            fullName: string | undefined;
            role: string;
            emailVerified: boolean;
        };
    }>;
}
export {};
