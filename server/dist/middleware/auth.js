"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateSessionToken = exports.generateApiKey = exports.authenticate = void 0;
const uuid_1 = require("uuid");
const prisma_1 = require("../services/prisma");
const authenticate = (options = {}) => {
    return (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
        var _a;
        try {
            const authHeader = req.headers.authorization;
            const apiKey = req.headers['x-api-key'];
            let userId = null;
            if (authHeader === null || authHeader === void 0 ? void 0 : authHeader.startsWith('Bearer ')) {
                const token = authHeader.substring(7);
                userId = yield verifyToken(token);
            }
            else if (apiKey) {
                userId = yield verifyApiKey(apiKey);
            }
            else if (!options.optional) {
                userId = yield getOrCreateGuestUser();
            }
            if (!userId && !options.optional) {
                return res.status(401).json({ error: 'Unauthorized' });
            }
            if (userId) {
                const user = yield prisma_1.prisma.user.findUnique({
                    where: { id: userId },
                    select: { id: true, email: true, name: true },
                });
                if (user) {
                    req.userId = user.id;
                    req.user = {
                        id: user.id,
                        email: user.email,
                        name: (_a = user.name) !== null && _a !== void 0 ? _a : undefined,
                    };
                }
            }
            next();
        }
        catch (error) {
            console.error('Auth error:', error);
            if (!options.optional) {
                return res.status(401).json({ error: 'Unauthorized' });
            }
            next();
        }
    });
};
exports.authenticate = authenticate;
function verifyToken(token) {
    return __awaiter(this, void 0, void 0, function* () {
        const session = yield prisma_1.prisma.session.findFirst({
            where: {
                userId: token,
                status: 'active',
            },
            select: { userId: true },
        });
        return (session === null || session === void 0 ? void 0 : session.userId) || null;
    });
}
function verifyApiKey(apiKey) {
    return __awaiter(this, void 0, void 0, function* () {
        const user = yield prisma_1.prisma.user.findFirst({
            where: {
                id: apiKey,
            },
            select: { id: true },
        });
        return (user === null || user === void 0 ? void 0 : user.id) || null;
    });
}
function getOrCreateGuestUser() {
    return __awaiter(this, void 0, void 0, function* () {
        const guestEmail = `guest_${(0, uuid_1.v4)()}@guest.local`;
        const existingGuest = yield prisma_1.prisma.user.findFirst({
            where: { email: guestEmail },
            select: { id: true },
        });
        if (existingGuest) {
            return existingGuest.id;
        }
        const guest = yield prisma_1.prisma.user.create({
            data: {
                email: guestEmail,
                name: 'Guest User',
            },
            select: { id: true },
        });
        return guest.id;
    });
}
const generateApiKey = (userId) => {
    return userId;
};
exports.generateApiKey = generateApiKey;
const generateSessionToken = () => {
    return (0, uuid_1.v4)();
};
exports.generateSessionToken = generateSessionToken;
