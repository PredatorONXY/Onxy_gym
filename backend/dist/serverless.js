"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.bootstrapServerless = bootstrapServerless;
exports.default = handler;
require("./env.js");
require("reflect-metadata");
const common_1 = require("@nestjs/common");
const core_1 = require("@nestjs/core");
const platform_express_1 = require("@nestjs/platform-express");
const express_1 = __importDefault(require("express"));
const app_module_js_1 = require("./app.module.js");
const server = (0, express_1.default)();
let isReady = false;
async function bootstrapServerless() {
    const app = await core_1.NestFactory.create(app_module_js_1.AppModule, new platform_express_1.ExpressAdapter(server));
    app.setGlobalPrefix('api');
    app.enableCors({
        origin: (origin, callback) => {
            if (!origin)
                return callback(null, true);
            callback(null, true);
        },
        credentials: true,
    });
    app.useGlobalPipes(new common_1.ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
    }));
    await app.init();
    isReady = true;
    return server;
}
async function handler(req, res) {
    if (!isReady) {
        await bootstrapServerless();
    }
    return server(req, res);
}
//# sourceMappingURL=serverless.js.map