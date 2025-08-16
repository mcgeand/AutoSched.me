"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
// Minimal Express app for testing session management endpoints
const express_1 = __importDefault(require("express"));
const cookie_parser_1 = __importDefault(require("cookie-parser"));
const login_1 = __importDefault(require("./auth/login"));
const refresh_1 = __importDefault(require("./auth/refresh"));
const logout_1 = __importDefault(require("./auth/logout"));
const session_1 = __importDefault(require("./auth/session"));
const cleanup_1 = __importDefault(require("./auth/cleanup"));
const app = (0, express_1.default)();
app.use(express_1.default.json());
app.use((0, cookie_parser_1.default)());
app.post('/api/auth/login', login_1.default);
app.post('/api/auth/refresh', refresh_1.default);
app.post('/api/auth/logout', logout_1.default);
app.get('/api/auth/session', session_1.default);
app.post('/api/auth/cleanup', cleanup_1.default);
exports.default = app;
