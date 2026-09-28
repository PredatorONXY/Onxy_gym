import {
  Body,
  Controller,
  Get,
  Post,
  Query,
  Req,
  Res,
  UseGuards,
} from '@nestjs/common';
import type { Request, Response } from 'express';
import { IsEmail, IsNotEmpty, IsOptional, IsString, MinLength } from 'class-validator';
import { AuthService } from './auth.service.js';
import { JwtAuthGuard } from './jwt-auth.guard.js';

class RegisterDto {
  @IsString()
  @IsNotEmpty()
  fullName!: string;

  @IsEmail()
  email!: string;

  @MinLength(8)
  password!: string;
}

class LoginDto {
  @IsEmail()
  email!: string;

  @IsString()
  password!: string;
}

class VerifyEmailDto {
  @IsString()
  @IsNotEmpty()
  token!: string;
}

class ResendVerificationDto {
  @IsEmail()
  email!: string;
}

class GoogleAuthDto {
  @IsString()
  @IsNotEmpty()
  googleId!: string;

  @IsEmail()
  email!: string;

  @IsOptional()
  @IsString()
  fullName?: string;
}

@Controller('auth')
export class AuthController {
  constructor(private auth: AuthService) {}

  private setAuthCookie(res: Response, token: string) {
    const isProduction = process.env.NODE_ENV === 'production';
    res.cookie('onxy_auth_token', token, {
      httpOnly: true,
      secure: isProduction,
      sameSite: 'lax',
      path: '/',
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    });
  }

  private clearAuthCookie(res: Response) {
    const isProduction = process.env.NODE_ENV === 'production';
    res.clearCookie('onxy_auth_token', {
      httpOnly: true,
      secure: isProduction,
      sameSite: 'lax',
      path: '/',
    });
  }

  @Post('register')
  async register(
    @Body() body: RegisterDto,
    @Res({ passthrough: true }) res: Response,
  ) {
    const session = await this.auth.register(body);
    this.setAuthCookie(res, session.accessToken);
    return session;
  }

  @Post('login')
  async login(
    @Body() body: LoginDto,
    @Res({ passthrough: true }) res: Response,
  ) {
    const session = await this.auth.login(body.email, body.password);
    this.setAuthCookie(res, session.accessToken);
    return session;
  }

  @Get('me')
  @UseGuards(JwtAuthGuard)
  me(@Req() req: { user: unknown }) {
    return req.user;
  }

  @Post('logout')
  logout(
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    this.clearAuthCookie(res);

    let token: string | null = null;
    if ((req as any).cookies?.onxy_auth_token) {
      token = (req as any).cookies.onxy_auth_token;
    } else if (req.headers && req.headers.cookie) {
      const match = req.headers.cookie.match(/(?:^|;\s*)onxy_auth_token=([^;]+)/);
      if (match) token = decodeURIComponent(match[1]);
    }
    if (!token && req.headers && req.headers.authorization) {
      const parts = req.headers.authorization.split(' ');
      if (parts.length === 2 && parts[0].toLowerCase() === 'bearer') {
        token = parts[1];
      }
    }

    if (token) {
      this.auth.revokeToken(token);
    }

    return { success: true };
  }

  @Post('verify-email')
  verifyEmail(@Body() body: VerifyEmailDto) {
    return this.auth.verifyEmail(body.token);
  }

  @Get('verify-email')
  verifyEmailQuery(@Query('token') token: string) {
    return this.auth.verifyEmail(token);
  }

  @Post('resend-verification')
  resendVerification(@Body() body: ResendVerificationDto) {
    return this.auth.resendVerification(body.email);
  }

  @Post('google')
  async googleAuth(
    @Body() body: GoogleAuthDto,
    @Res({ passthrough: true }) res: Response,
  ) {
    const session = await this.auth.googleLogin({
      googleId: body.googleId,
      email: body.email,
      fullName: body.fullName || 'Google User',
    });
    this.setAuthCookie(res, session.accessToken);
    return session;
  }
}

