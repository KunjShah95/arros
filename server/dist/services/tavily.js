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
exports.tavilyClient = exports.TavilyClient = void 0;
const axios_1 = __importDefault(require("axios"));
class TavilyClient {
    constructor(apiKey) {
        this.baseUrl = 'https://api.tavily.com';
        this.apiKey = apiKey || process.env.TAVILY_API_KEY || '';
    }
    search(query_1) {
        return __awaiter(this, arguments, void 0, function* (query, maxResults = 10) {
            if (!this.apiKey) {
                console.warn('TAVILY_API_KEY not configured, returning mock data');
                return this.getMockResults(query, maxResults);
            }
            try {
                const response = yield axios_1.default.post(`${this.baseUrl}/search`, {
                    query,
                    max_results: maxResults,
                    include_answer: true,
                    include_raw_content: false,
                    include_images: false,
                }, {
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    params: {
                        api_key: this.apiKey,
                    },
                });
                return (response.data.results || []).map((result) => ({
                    title: result.title,
                    url: result.url,
                    content: result.content,
                    score: parseFloat(result.score) || 0.5,
                    published_date: result.published_date,
                }));
            }
            catch (error) {
                console.error('Tavily search error:', error);
                return this.getMockResults(query, maxResults);
            }
        });
    }
    getMockResults(query, maxResults) {
        return Array.from({ length: maxResults }, (_, i) => ({
            title: `${query} - Result ${i + 1}`,
            url: `https://example.com/result-${i + 1}`,
            content: `This is mock content for "${query}". Configure TAVILY_API_KEY for real results.`,
            score: 0.9 - i * 0.05,
        }));
    }
}
exports.TavilyClient = TavilyClient;
exports.tavilyClient = new TavilyClient();
