"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.verifyGoogleToken = verifyGoogleToken;
exports.verifyMicrosoftToken = verifyMicrosoftToken;
// OAuth service: verifies Google and Microsoft tokens
const axios_1 = __importDefault(require("axios"));
async function verifyGoogleToken(oauthToken) {
    // Call Google API to verify token and extract user info
    const res = await axios_1.default.get(`https://www.googleapis.com/oauth2/v3/tokeninfo?id_token=${oauthToken}`);
    if (res.status !== 200)
        throw new Error('Invalid Google token');
    return { email: res.data.email, name: res.data.name };
}
async function verifyMicrosoftToken(oauthToken) {
    // Call Microsoft API to verify token and extract user info
    const res = await axios_1.default.get(`https://graph.microsoft.com/v1.0/me`, {
        headers: { Authorization: `Bearer ${oauthToken}` }
    });
    if (res.status !== 200)
        throw new Error('Invalid Microsoft token');
    return { email: res.data.mail || res.data.userPrincipalName, name: res.data.displayName };
}
