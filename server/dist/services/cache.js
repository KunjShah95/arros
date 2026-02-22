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
exports.cacheService = void 0;
const redis_1 = require("redis");
class CacheService {
    constructor() {
        this.client = null;
        this.memoryCache = new Map();
        this.isConnected = false;
    }
    connect() {
        return __awaiter(this, void 0, void 0, function* () {
            const redisUrl = process.env.REDIS_URL;
            if (redisUrl) {
                try {
                    this.client = (0, redis_1.createClient)({ url: redisUrl });
                    yield this.client.connect();
                    this.isConnected = true;
                    console.log('Redis cache connected');
                }
                catch (error) {
                    console.warn('Redis connection failed, using in-memory cache:', error);
                    this.isConnected = false;
                }
            }
        });
    }
    get(key) {
        return __awaiter(this, void 0, void 0, function* () {
            if (this.isConnected && this.client) {
                try {
                    const value = yield this.client.get(key);
                    return value ? JSON.parse(value) : null;
                }
                catch (error) {
                    console.error('Cache get error:', error);
                }
            }
            const item = this.memoryCache.get(key);
            if (item && item.expiry > Date.now()) {
                return item.value;
            }
            this.memoryCache.delete(key);
            return null;
        });
    }
    set(key_1, value_1) {
        return __awaiter(this, arguments, void 0, function* (key, value, ttlSeconds = 3600) {
            const expiry = Date.now() + ttlSeconds * 1000;
            if (this.isConnected && this.client) {
                try {
                    yield this.client.setEx(key, ttlSeconds, JSON.stringify(value));
                }
                catch (error) {
                    console.error('Cache set error:', error);
                }
            }
            this.memoryCache.set(key, { value, expiry });
        });
    }
    del(key) {
        return __awaiter(this, void 0, void 0, function* () {
            if (this.isConnected && this.client) {
                try {
                    yield this.client.del(key);
                }
                catch (error) {
                    console.error('Cache del error:', error);
                }
            }
            this.memoryCache.delete(key);
        });
    }
    invalidatePattern(pattern) {
        return __awaiter(this, void 0, void 0, function* () {
            if (this.isConnected && this.client) {
                try {
                    const keys = yield this.client.keys(pattern);
                    if (keys.length > 0) {
                        yield this.client.del(keys);
                    }
                }
                catch (error) {
                    console.error('Cache invalidate error:', error);
                }
            }
            for (const key of this.memoryCache.keys()) {
                if (key.includes(pattern.replace('*', ''))) {
                    this.memoryCache.delete(key);
                }
            }
        });
    }
    generateCacheKey(prefix, ...parts) {
        return `${prefix}:${parts.map(p => p.toLowerCase().replace(/\s+/g, '-')).join(':')}`;
    }
    getStatus() {
        return this.isConnected;
    }
}
exports.cacheService = new CacheService();
