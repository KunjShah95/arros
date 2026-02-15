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
exports.firecrawlClient = exports.FirecrawlClient = void 0;
const axios_1 = __importDefault(require("axios"));
class FirecrawlClient {
    constructor(apiKey) {
        this.apiKey = apiKey || process.env.FIRECRAWL_API_KEY || '';
        this.baseUrl = process.env.FIRECRAWL_BASE_URL || 'https://api.firecrawl.dev';
    }
    scrape(url) {
        return __awaiter(this, void 0, void 0, function* () {
            var _a, _b, _c, _d;
            if (!this.apiKey) {
                console.warn('FIRECRAWL_API_KEY not configured, using fallback');
                return this.getMockScrape(url);
            }
            try {
                const response = yield axios_1.default.post(`${this.baseUrl}/v1/scrape`, { url, formats: ['markdown', 'html', 'text'] }, {
                    headers: {
                        'Authorization': `Bearer ${this.apiKey}`,
                        'Content-Type': 'application/json',
                    },
                    timeout: 30000,
                });
                if (response.data.success) {
                    return {
                        success: true,
                        data: {
                            content: ((_a = response.data.data) === null || _a === void 0 ? void 0 : _a.text) || '',
                            markdown: ((_b = response.data.data) === null || _b === void 0 ? void 0 : _b.markdown) || '',
                            title: ((_c = response.data.data) === null || _c === void 0 ? void 0 : _c.title) || '',
                            description: (_d = response.data.data) === null || _d === void 0 ? void 0 : _d.description,
                            url,
                            statusCode: 200,
                        },
                    };
                }
                return { success: false, error: response.data.error };
            }
            catch (error) {
                console.error('Firecrawl scrape error:', error);
                return this.getMockScrape(url);
            }
        });
    }
    crawl(url_1) {
        return __awaiter(this, arguments, void 0, function* (url, limit = 10) {
            var _a;
            if (!this.apiKey) {
                console.warn('FIRECRAWL_API_KEY not configured');
                return { success: false, error: 'API key not configured' };
            }
            try {
                const response = yield axios_1.default.post(`${this.baseUrl}/v1/crawl`, { url, limit, formats: ['markdown', 'html', 'text'] }, {
                    headers: {
                        'Authorization': `Bearer ${this.apiKey}`,
                        'Content-Type': 'application/json',
                    },
                    timeout: 60000,
                });
                if (response.data.success) {
                    return {
                        success: true,
                        data: (_a = response.data.data) === null || _a === void 0 ? void 0 : _a.map((item) => ({
                            content: item.markdown || '',
                            markdown: item.markdown || '',
                            title: item.title || '',
                            url: item.url,
                            statusCode: item.statusCode,
                        })),
                    };
                }
                return { success: false, error: response.data.error };
            }
            catch (error) {
                console.error('Firecrawl crawl error:', error);
                return { success: false, error: 'Crawl failed' };
            }
        });
    }
    getMockScrape(url) {
        return {
            success: true,
            data: {
                content: `This is mock scraped content from ${url}. Configure FIRECRAWL_API_KEY for real content.`,
                markdown: `# Mock Content\n\nThis is mock scraped content from ${url}.`,
                title: 'Mock Page Title',
                url,
                statusCode: 200,
            },
        };
    }
}
exports.FirecrawlClient = FirecrawlClient;
exports.firecrawlClient = new FirecrawlClient();
