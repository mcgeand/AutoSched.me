"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.signJwt = signJwt;
exports.verifyJwt = verifyJwt;
exports.setSessionCookie = setSessionCookie;
exports.clearSessionCookie = clearSessionCookie;
exports.getTokenFromRequest = getTokenFromRequest;
// JWT utilities: sign, verify, and manage session cookies
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
function signJwt(payload, expiry) {
    return jsonwebtoken_1.default.sign(payload, process.env.JWT_SECRET, { expiresIn: Math.floor((expiry.getTime() - Date.now()) / 1000) });
}
function verifyJwt(token) {
    try {
        return jsonwebtoken_1.default.verify(token, process.env.JWT_SECRET);
    }
    catch {
        return null;
    }
}
function setSessionCookie(res, token, expiry) {
    res.cookie('session', token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        expires: expiry,
        sameSite: 'lax'
    });
}
function clearSessionCookie(res) {
    res.clearCookie('session');
}
function getTokenFromRequest(req) {
    return req.cookies?.session || req.headers.authorization?.split(' ')[1];
}
