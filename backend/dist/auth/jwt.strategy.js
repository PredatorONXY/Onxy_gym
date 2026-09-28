"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.JwtStrategy = exports.extractTokenFromReq = void 0;
const common_1 = require("@nestjs/common");
const passport_1 = require("@nestjs/passport");
const passport_jwt_1 = require("passport-jwt");
const prisma_service_js_1 = require("../prisma/prisma.service.js");
const auth_service_js_1 = require("./auth.service.js");
const extractTokenFromReq = (req) => {
    if (req && req.cookies && req.cookies.onxy_auth_token) {
        return req.cookies.onxy_auth_token;
    }
    if (req && req.headers && req.headers.cookie) {
        const match = req.headers.cookie.match(/(?:^|;\s*)onxy_auth_token=([^;]+)/);
        if (match) {
            return decodeURIComponent(match[1]);
        }
    }
    return passport_jwt_1.ExtractJwt.fromAuthHeaderAsBearerToken()(req);
};
exports.extractTokenFromReq = extractTokenFromReq;
let JwtStrategy = class JwtStrategy extends (0, passport_1.PassportStrategy)(passport_jwt_1.Strategy) {
    prisma;
    authService;
    constructor(prisma, authService) {
        super({
            jwtFromRequest: exports.extractTokenFromReq,
            ignoreExpiration: false,
            secretOrKey: process.env.JWT_SECRET ?? 'unsafe-local-only',
            passReqToCallback: true,
        });
        this.prisma = prisma;
        this.authService = authService;
    }
    async validate(req, payload) {
        const rawToken = (0, exports.extractTokenFromReq)(req);
        if (rawToken && this.authService.isTokenRevoked(rawToken)) {
            throw new common_1.UnauthorizedException('Token has been revoked');
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
            throw new common_1.UnauthorizedException('User not found');
        }
        return user;
    }
};
exports.JwtStrategy = JwtStrategy;
exports.JwtStrategy = JwtStrategy = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_js_1.PrismaService,
        auth_service_js_1.AuthService])
], JwtStrategy);
//# sourceMappingURL=jwt.strategy.js.map