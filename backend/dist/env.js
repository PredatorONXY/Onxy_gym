"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.resolveRootEnvPath = resolveRootEnvPath;
exports.loadRootEnv = loadRootEnv;
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const dotenv_1 = __importDefault(require("dotenv"));
function resolveRootEnvPath() {
    const candidates = [
        path_1.default.resolve(process.cwd(), '.env'),
        path_1.default.resolve(process.cwd(), '../.env'),
        path_1.default.resolve(__dirname, '../../.env'),
        path_1.default.resolve(__dirname, '../../../.env'),
    ];
    for (const candidate of candidates) {
        if (fs_1.default.existsSync(candidate)) {
            return candidate;
        }
    }
    return '/home/dare/project/Onxy_gym/.env';
}
function loadRootEnv() {
    const envPath = resolveRootEnvPath();
    if (fs_1.default.existsSync(envPath)) {
        dotenv_1.default.config({ path: envPath });
    }
}
loadRootEnv();
//# sourceMappingURL=env.js.map