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
    const rawUrl = req.url || '';
    const [pathname, search] = rawUrl.split('?');
    const isGenericApiPath = !pathname ||
        pathname === '/api' ||
        pathname === '/api/' ||
        pathname === '/api/index' ||
        pathname === '/api/[...path]' ||
        pathname === '/api/%5B...path%5D';
    if (isGenericApiPath) {
        const matchedPath = req.headers['x-matched-path'] ||
            req.headers['x-forwarded-uri'] ||
            req.headers['x-now-route-matches'];
        if (matchedPath && matchedPath.startsWith('/api') && matchedPath !== '/api' && matchedPath !== '/api/') {
            const [matchedPathname, matchedSearch] = matchedPath.split('?');
            const query = search || matchedSearch;
            req.url = query ? `${matchedPathname}?${query}` : matchedPathname;
        }
        else if (search) {
            const urlParams = new URLSearchParams(search);
            const pathParam = urlParams.get('path');
            if (pathParam) {
                urlParams.delete('path');
                const remainingQuery = urlParams.toString();
                const targetPath = pathParam.startsWith('/api')
                    ? pathParam
                    : `/api/${pathParam.startsWith('/') ? pathParam.slice(1) : pathParam}`;
                req.url = remainingQuery ? `${targetPath}?${remainingQuery}` : targetPath;
            }
        }
    }
    if (!isReady) {
        await bootstrapServerless();
    }
    return server(req, res);
}
//# sourceMappingURL=serverless.js.map