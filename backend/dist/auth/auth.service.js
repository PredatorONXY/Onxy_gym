"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthService = void 0;
const common_1 = require("@nestjs/common");
const jwt_1 = require("@nestjs/jwt");
const client_1 = require("@prisma/client");
const bcrypt = __importStar(require("bcrypt"));
const crypto = __importStar(require("crypto"));
const prisma_service_js_1 = require("../prisma/prisma.service.js");
let AuthService = class AuthService {
    prisma;
    jwt;
    constructor(prisma, jwt) {
        this.prisma = prisma;
        this.jwt = jwt;
    }
    revokedTokens = new Set();
    revokeToken(token) {
        if (token) {
            this.revokedTokens.add(token.trim());
        }
    }
    isTokenRevoked(token) {
        if (!token)
            return false;
        return this.revokedTokens.has(token.trim());
    }
    hashToken(token) {
        return crypto.createHash('sha256').update(token).digest('hex');
    }
    async generateVerificationToken(userId) {
        const rawToken = crypto.randomBytes(32).toString('hex');
        const tokenHash = this.hashToken(rawToken);
        const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);
        await this.prisma.user.update({
            where: { id: userId },
            data: {
                emailVerificationTokenHash: tokenHash,
                emailVerificationExpiresAt: expiresAt,
            },
        });
        return rawToken;
    }
    async register(input) {
        const email = input.email.trim().toLowerCase();
        if (await this.prisma.user.findUnique({ where: { email } })) {
            throw new common_1.ConflictException('Email is already registered');
        }
        const passwordHash = await bcrypt.hash(input.password, 12);
        const user = await this.prisma.user.create({
            data: {
                email,
                fullName: input.fullName.trim(),
                passwordHash,
                role: client_1.Role.USER,
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
        await this.generateVerificationToken(user.id);
        return this.session(user);
    }
    async login(email, password) {
        const user = await this.prisma.user.findUnique({
            where: { email: email.trim().toLowerCase() },
            include: { client: true },
        });
        if (!user?.passwordHash || !(await bcrypt.compare(password, user.passwordHash))) {
            throw new common_1.UnauthorizedException('Invalid email or password');
        }
        return this.session(user);
    }
    async verifyEmail(token) {
        if (!token || typeof token !== 'string') {
            throw new common_1.BadRequestException('Verification token is required');
        }
        const tokenHash = this.hashToken(token.trim());
        const user = await this.prisma.user.findFirst({
            where: {
                emailVerificationTokenHash: tokenHash,
                emailVerificationExpiresAt: { gt: new Date() },
            },
        });
        if (!user) {
            throw new common_1.BadRequestException('Invalid or expired verification token');
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
    async resendVerification(email) {
        if (!email) {
            throw new common_1.BadRequestException('Email is required');
        }
        const user = await this.prisma.user.findUnique({
            where: { email: email.trim().toLowerCase() },
        });
        if (user && !user.emailVerified) {
            await this.generateVerificationToken(user.id);
        }
        return {
            success: true,
            message: 'If an account exists with this email, a verification link has been sent.',
        };
    }
    async googleLogin(profile) {
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
        }
        else {
            user = await this.prisma.user.create({
                data: {
                    email,
                    fullName: profile.fullName || 'Google User',
                    googleId: profile.googleId,
                    role: client_1.Role.USER,
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
    session(user) {
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
};
exports.AuthService = AuthService;
exports.AuthService = AuthService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_js_1.PrismaService,
        jwt_1.JwtService])
], AuthService);
//# sourceMappingURL=auth.service.js.map