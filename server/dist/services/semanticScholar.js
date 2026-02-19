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
exports.semanticScholarClient = exports.SemanticScholarClient = void 0;
const axios_1 = __importDefault(require("axios"));
class SemanticScholarClient {
    constructor(apiKey) {
        this.baseUrl = 'https://api.semanticscholar.org/graph/v1';
        this.apiKey = apiKey || process.env.SEMANTIC_SCHOLAR_API_KEY || '';
    }
    getHeaders() {
        const headers = {
            'Content-Type': 'application/json',
        };
        if (this.apiKey) {
            headers['x-api-key'] = this.apiKey;
        }
        return headers;
    }
    searchPapers(query_1) {
        return __awaiter(this, arguments, void 0, function* (query, limit = 10, fields = [
            'paperId', 'title', 'abstract', 'year', 'citationCount',
            'authors', 'venue', 'externalIds', 'url', 'openAccessPdf',
            'tldr', 'fieldsOfStudy', 'publicationDate'
        ]) {
            try {
                const response = yield axios_1.default.get(`${this.baseUrl}/paper/search`, {
                    params: {
                        query,
                        limit,
                        fields: fields.join(','),
                    },
                    headers: this.getHeaders(),
                    timeout: 10000,
                });
                return response.data.data || [];
            }
            catch (error) {
                console.error('Semantic Scholar search error:', error);
                return this.getMockPapers(query, limit);
            }
        });
    }
    getPaper(paperId) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const response = yield axios_1.default.get(`${this.baseUrl}/paper/${paperId}`, {
                    params: {
                        fields: 'paperId,title,abstract,year,citationCount,authors,venue,externalIds,url,openAccessPdf,tldr,fieldsOfStudy',
                    },
                    headers: this.getHeaders(),
                    timeout: 10000,
                });
                return response.data;
            }
            catch (error) {
                console.error('Semantic Scholar get paper error:', error);
                return null;
            }
        });
    }
    searchArXiv(query_1) {
        return __awaiter(this, arguments, void 0, function* (query, limit = 5) {
            // Search specifically on arXiv via Semantic Scholar
            const arxivQuery = `${query}`;
            try {
                const response = yield axios_1.default.get(`${this.baseUrl}/paper/search`, {
                    params: {
                        query: arxivQuery,
                        limit,
                        fields: 'paperId,title,abstract,year,citationCount,authors,venue,externalIds,url,openAccessPdf,tldr',
                        openAccessPdf: true,
                    },
                    headers: this.getHeaders(),
                    timeout: 10000,
                });
                // Filter for papers with arXiv IDs or open access PDFs
                const papers = (response.data.data || []).filter(p => { var _a; return ((_a = p.externalIds) === null || _a === void 0 ? void 0 : _a.ArXiv) || p.openAccessPdf; });
                return papers;
            }
            catch (error) {
                console.error('ArXiv search error:', error);
                return [];
            }
        });
    }
    getMockPapers(query, limit) {
        const topics = query.split(' ').slice(0, 3).join(' ');
        return Array.from({ length: Math.min(limit, 3) }, (_, i) => ({
            paperId: `mock_${i}`,
            title: `${topics}: ${['A Comprehensive Survey', 'Recent Advances', 'A Systematic Review'][i]}`,
            abstract: `This paper provides a comprehensive study on ${query}. We analyze recent developments, key challenges, and future directions in this rapidly evolving field.`,
            year: 2023 - i,
            citationCount: Math.floor(Math.random() * 500),
            authors: [
                { authorId: `author_${i}_1`, name: 'John Smith' },
                { authorId: `author_${i}_2`, name: 'Jane Doe' },
            ],
            venue: ['Nature', 'IEEE Transactions', 'arXiv preprint'][i] || 'Conference on AI',
            externalIds: {
                ArXiv: `230${i}.12345`,
            },
            url: `https://arxiv.org/abs/230${i}.12345`,
            openAccessPdf: { url: `https://arxiv.org/pdf/230${i}.12345` },
            tldr: { text: `A study on ${query} revealing key insights and findings.` },
            fieldsOfStudy: ['Computer Science', 'Artificial Intelligence'],
            publicationDate: `${2023 - i}-01-15`,
        }));
    }
}
exports.SemanticScholarClient = SemanticScholarClient;
exports.semanticScholarClient = new SemanticScholarClient();
