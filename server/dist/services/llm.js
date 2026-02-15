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
exports.llmService = exports.LLMService = void 0;
const openai_1 = __importDefault(require("openai"));
const sdk_1 = __importDefault(require("@anthropic-ai/sdk"));
const openai = new openai_1.default({
    apiKey: process.env.OPENAI_API_KEY || '',
});
const anthropic = new sdk_1.default({
    apiKey: process.env.ANTHROPIC_API_KEY || '',
});
class LLMService {
    constructor() {
        this.defaultModel = 'gpt-4o-mini';
    }
    chat(messages_1) {
        return __awaiter(this, arguments, void 0, function* (messages, options = {}) {
            const model = options.model || this.defaultModel;
            if (model.startsWith('claude')) {
                return this.chatAnthropic(messages, options);
            }
            return this.chatOpenAI(messages, options);
        });
    }
    chatOpenAI(messages, options) {
        return __awaiter(this, void 0, void 0, function* () {
            var _a, _b, _c, _d, _e, _f, _g;
            const model = options.model || 'gpt-4o-mini';
            const response = yield openai.chat.completions.create({
                model,
                messages: messages,
                temperature: (_a = options.temperature) !== null && _a !== void 0 ? _a : 0.7,
                max_tokens: (_b = options.maxTokens) !== null && _b !== void 0 ? _b : 4096,
                response_format: options.responseFormat ? { type: 'json_object' } : undefined,
            });
            const content = ((_d = (_c = response.choices[0]) === null || _c === void 0 ? void 0 : _c.message) === null || _d === void 0 ? void 0 : _d.content) || '';
            return {
                content: options.responseFormat ? content : content,
                usage: {
                    promptTokens: ((_e = response.usage) === null || _e === void 0 ? void 0 : _e.prompt_tokens) || 0,
                    completionTokens: ((_f = response.usage) === null || _f === void 0 ? void 0 : _f.completion_tokens) || 0,
                    totalTokens: ((_g = response.usage) === null || _g === void 0 ? void 0 : _g.total_tokens) || 0,
                },
                model: response.model,
            };
        });
    }
    chatAnthropic(messages, options) {
        return __awaiter(this, void 0, void 0, function* () {
            var _a, _b, _c;
            const model = options.model || 'claude-3-haiku-20240307';
            const systemMessage = messages.find(m => m.role === 'system');
            const userMessages = messages.filter(m => m.role !== 'system');
            const response = yield anthropic.messages.create({
                model,
                max_tokens: (_a = options.maxTokens) !== null && _a !== void 0 ? _a : 4096,
                temperature: (_b = options.temperature) !== null && _b !== void 0 ? _b : 0.7,
                system: systemMessage === null || systemMessage === void 0 ? void 0 : systemMessage.content,
                messages: userMessages,
            });
            const content = ((_c = response.content[0]) === null || _c === void 0 ? void 0 : _c.type) === 'text' ? response.content[0].text : '';
            return {
                content,
                usage: {
                    promptTokens: response.usage.input_tokens,
                    completionTokens: response.usage.output_tokens,
                    totalTokens: response.usage.input_tokens + response.usage.output_tokens,
                },
                model: response.model,
            };
        });
    }
    summarize(text_1) {
        return __awaiter(this, arguments, void 0, function* (text, maxLength = 500) {
            const messages = [
                {
                    role: 'system',
                    content: 'You are a helpful assistant that summarizes text concisely.',
                },
                {
                    role: 'user',
                    content: `Summarize the following text in no more than ${maxLength} characters:\n\n${text}`,
                },
            ];
            const response = yield this.chat(messages, { maxTokens: 1000 });
            return response.content;
        });
    }
    extractStructuredData(text, schema, context) {
        return __awaiter(this, void 0, void 0, function* () {
            const schemaDescription = schema.description || 'Extract the following data structure';
            const messages = [
                {
                    role: 'system',
                    content: `You are a data extraction assistant. Extract structured data from the provided text according to the schema. Return only valid JSON.`,
                },
                {
                    role: 'user',
                    content: `Extract data with these fields: ${schemaDescription}\n\n${context ? `Context: ${context}\n\n` : ''}Text to extract from:\n${text}`,
                },
            ];
            const response = yield this.chat(messages, {
                maxTokens: 2000,
                temperature: 0.1,
            });
            try {
                const parsed = JSON.parse(response.content);
                return schema.parse(parsed);
            }
            catch (error) {
                console.error('Failed to parse LLM response:', error);
                throw new Error('Failed to extract structured data');
            }
        });
    }
    generateEmbedding(text) {
        return __awaiter(this, void 0, void 0, function* () {
            var _a;
            const response = yield openai.embeddings.create({
                model: 'text-embedding-3-small',
                input: text,
            });
            return ((_a = response.data[0]) === null || _a === void 0 ? void 0 : _a.embedding) || [];
        });
    }
    calculateCost(usage, model) {
        const pricing = {
            'gpt-4o': { prompt: 2.5, completion: 10 },
            'gpt-4o-mini': { prompt: 0.15, completion: 0.6 },
            'claude-3-5-sonnet': { prompt: 3, completion: 15 },
            'claude-3-haiku': { prompt: 0.2, completion: 1 },
        };
        const { prompt, completion } = pricing[model];
        return (usage.promptTokens / 1000000) * prompt +
            (usage.completionTokens / 1000000) * completion;
    }
}
exports.LLMService = LLMService;
exports.llmService = new LLMService();
