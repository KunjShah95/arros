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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.serperClient = exports.SerperClient = void 0;
const axios_1 = __importDefault(require("axios"));
class SerperClient {
    constructor(apiKey) {
        this.apiKey = apiKey || process.env.SERPER_API_KEY || '';
    }
    search(query_1) {
        return __awaiter(this, arguments, void 0, function* (query, numResults = 10) {
            if (!this.apiKey) {
                console.warn('SERPER_API_KEY not configured, returning mock data');
                return this.getMockResults(query, numResults);
            }
            try {
                const response = yield axios_1.default.post('https://google.serper.dev/search', {
                    q: query,
                    num: numResults,
                }, {
                    headers: {
                        'X-API-KEY': this.apiKey,
                        'Content-Type': 'application/json',
                    },
                });
                const organic = response.data.organic || [];
                return organic.map((item) => ({
                    title: item.title,
                    url: item.link,
                    snippet: item.snippet,
                }));
            }
            catch (error) {
                console.error('Serper search error:', error);
                return this.getMockResults(query, numResults);
            }
        });
    }
    searchImages(query_1) {
        return __awaiter(this, arguments, void 0, function* (query, numResults = 10) {
            if (!this.apiKey) {
                return [];
            }
            try {
                const response = yield axios_1.default.post('https://google.serper.dev/images', {
                    q: query,
                    num: numResults,
                }, {
                    headers: {
                        'X-API-KEY': this.apiKey,
                        'Content-Type': 'application/json',
                    },
                });
                return (response.data.images || []).map((item) => ({
                    title: item.title,
                    url: item.imageUrl,
                    snippet: item.snippet,
                }));
            }
            catch (error) {
                console.error('Serper image search error:', error);
                return [];
            }
        });
    }
    getMockResults(query, numResults) {
        return Array.from({ length: numResults }, (_, i) => ({
            title: `${query} - Result ${i + 1}`,
            url: `https://example.com/result-${i + 1}`,
            snippet: `This is a mock result for "${query}". Configure SERPER_API_KEY for real results.`,
        }));
    }
}
exports.SerperClient = SerperClient;
exports.serperClient = new SerperClient();
