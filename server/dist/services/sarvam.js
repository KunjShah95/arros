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
exports.sarvamClient = exports.SarvamClient = void 0;
const axios_1 = __importDefault(require("axios"));
const adm_zip_1 = __importDefault(require("adm-zip"));
class SarvamClient {
    constructor(apiKey) {
        this.baseUrl = 'https://api.sarvam.ai';
        this.pollInterval = 2000;
        this.maxRetries = 60;
        this.apiKey = apiKey || process.env.SARVAM_API_KEY || '';
    }
    toBlob(file) {
        const uint8Array = new Uint8Array(file.buffer);
        return new Blob([uint8Array], { type: file.mimetype });
    }
    /**
     * Document Intelligence - Extract text from PDFs and images
     * API: https://api.sarvam.ai/document-intelligence/v1/jobs
     */
    performOCR(imageUrl_1) {
        return __awaiter(this, arguments, void 0, function* (imageUrl, language = 'en-IN') {
            if (!this.apiKey) {
                console.warn('SARVAM_API_KEY not configured');
                return this.getMockOCRResult();
            }
            try {
                const targetLanguage = this.mapLanguageCode(language);
                const file = typeof imageUrl === 'string' ? yield this.urlToFile(imageUrl) : imageUrl;
                const fileName = typeof imageUrl === 'string' ? 'document' : imageUrl.originalname;
                const contentType = typeof imageUrl === 'string' ? 'application/pdf' : imageUrl.mimetype;
                const createResponse = yield axios_1.default.post(`${this.baseUrl}/document-intelligence/v1/jobs`, {
                    language: targetLanguage,
                    output_format: 'md',
                }, {
                    headers: {
                        'api-subscription-key': this.apiKey,
                        'Content-Type': 'application/json',
                    },
                });
                const jobId = createResponse.data.job_id;
                const uploadUrl = createResponse.data.upload_url;
                yield axios_1.default.put(uploadUrl, file, {
                    headers: {
                        'Content-Type': contentType,
                    },
                });
                yield axios_1.default.post(`${this.baseUrl}/document-intelligence/v1/jobs/${jobId}/start`, {}, {
                    headers: {
                        'api-subscription-key': this.apiKey,
                    },
                });
                const result = yield this.pollJobCompletion(jobId);
                if (result.downloadUrl) {
                    const text = yield this.extractTextFromZip(result.downloadUrl);
                    return {
                        text,
                        confidence: 0.95,
                        language: targetLanguage,
                        metadata: { jobId, pages: result.pages },
                        pages: result.pages,
                    };
                }
                return this.getMockOCRResult();
            }
            catch (error) {
                console.error('Sarvam Document Intelligence error:', error);
                return this.getMockOCRResult();
            }
        });
    }
    pollJobCompletion(jobId) {
        return __awaiter(this, void 0, void 0, function* () {
            var _a;
            for (let i = 0; i < this.maxRetries; i++) {
                const statusResponse = yield axios_1.default.get(`${this.baseUrl}/document-intelligence/v1/jobs/${jobId}`, {
                    headers: {
                        'api-subscription-key': this.apiKey,
                    },
                });
                const jobState = statusResponse.data.job_state;
                if (jobState === 'Completed') {
                    const downloadResponse = yield axios_1.default.get(`${this.baseUrl}/document-intelligence/v1/jobs/${jobId}/download`, {
                        headers: {
                            'api-subscription-key': this.apiKey,
                        },
                    });
                    return {
                        downloadUrl: downloadResponse.data.url,
                        pages: (_a = statusResponse.data.page_metrics) === null || _a === void 0 ? void 0 : _a.total_pages,
                    };
                }
                else if (jobState === 'Failed' || jobState === 'PartiallyCompleted') {
                    console.error('Job failed or partially failed:', statusResponse.data);
                    break;
                }
                yield this.sleep(this.pollInterval);
            }
            return {};
        });
    }
    extractTextFromZip(downloadUrl) {
        return __awaiter(this, void 0, void 0, function* () {
            const response = yield axios_1.default.get(downloadUrl, { responseType: 'arraybuffer' });
            const zip = new adm_zip_1.default(Buffer.from(response.data));
            const entries = zip.getEntries();
            let fullText = '';
            const textFiles = entries
                .filter(e => e.entryName.endsWith('.md') || e.entryName.endsWith('.html'))
                .sort((a, b) => a.entryName.localeCompare(b.entryName));
            for (const entry of textFiles) {
                fullText += entry.getData().toString('utf8') + '\n\n';
            }
            return fullText || 'No text extracted';
        });
    }
    sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
    urlToFile(url) {
        return __awaiter(this, void 0, void 0, function* () {
            const response = yield axios_1.default.get(url, { responseType: 'blob' });
            return response.data;
        });
    }
    /**
     * Text-to-Speech (TTS) - Convert text to speech
     * API: POST https://api.sarvam.ai/text-to-speech
     */
    textToSpeech(request) {
        return __awaiter(this, void 0, void 0, function* () {
            var _a, _b;
            if (!this.apiKey) {
                console.warn('SARVAM_API_KEY not configured');
                return this.getMockTTSResult();
            }
            const targetLanguage = this.mapLanguageCode(request.language || 'en');
            try {
                const response = yield axios_1.default.post(`${this.baseUrl}/text-to-speech`, {
                    text: request.text,
                    target_language_code: targetLanguage,
                    speaker: request.voice === 'male' ? 'ravi' : 'anushka',
                }, {
                    headers: {
                        'api-subscription-key': this.apiKey,
                        'Content-Type': 'application/json',
                    },
                });
                return {
                    audioUrl: ((_a = response.data.audios) === null || _a === void 0 ? void 0 : _a[0]) || '',
                    audioBase64: (_b = response.data.audios) === null || _b === void 0 ? void 0 : _b[0],
                    duration: response.data.duration || 0,
                    format: 'mp3',
                };
            }
            catch (error) {
                console.error('Sarvam TTS error:', error);
                return this.getMockTTSResult();
            }
        });
    }
    /**
     * Speech-to-Text (STT) - Convert speech to text
     * API: POST https://api.sarvam.ai/speech-to-text
     */
    speechToText(audioUrl_1) {
        return __awaiter(this, arguments, void 0, function* (audioUrl, language = 'en') {
            if (!this.apiKey) {
                console.warn('SARVAM_API_KEY not configured');
                return this.getMockSTTResult();
            }
            try {
                const formData = new FormData();
                if (typeof audioUrl === 'string') {
                    if (audioUrl.startsWith('data:')) {
                        const base64Data = audioUrl.split(',')[1];
                        const binaryString = atob(base64Data);
                        const bytes = new Uint8Array(binaryString.length);
                        for (let i = 0; i < binaryString.length; i++) {
                            bytes[i] = binaryString.charCodeAt(i);
                        }
                        formData.append('file', new Blob([bytes], { type: 'audio/webm' }), 'audio.webm');
                    }
                    else {
                        formData.append('file', yield this.urlToBlob(audioUrl));
                    }
                }
                else {
                    formData.append('file', this.toBlob(audioUrl), audioUrl.originalname);
                }
                formData.append('model', 'saaras:v3');
                formData.append('mode', 'transcribe');
                const response = yield axios_1.default.post(`${this.baseUrl}/speech-to-text`, formData, {
                    headers: {
                        'api-subscription-key': this.apiKey,
                    },
                    timeout: 60000,
                });
                return {
                    text: response.data.transcript || response.data.text || '',
                    confidence: response.data.confidence || 0.85,
                    language: response.data.language_code || language,
                    duration: response.data.duration || 0,
                };
            }
            catch (error) {
                console.error('Sarvam STT error:', error);
                return this.getMockSTTResult();
            }
        });
    }
    urlToBlob(url) {
        return __awaiter(this, void 0, void 0, function* () {
            const response = yield axios_1.default.get(url, { responseType: 'blob' });
            return response.data;
        });
    }
    mapLanguageCode(code) {
        const mapping = {
            en: 'en-IN',
            hi: 'hi-IN',
            ta: 'ta-IN',
            te: 'te-IN',
            kn: 'kn-IN',
            ml: 'ml-IN',
        };
        return mapping[code] || 'en-IN';
    }
    /**
     * Batch OCR - Process multiple images
     */
    batchOCR(imageUrls_1) {
        return __awaiter(this, arguments, void 0, function* (imageUrls, language = 'en') {
            return Promise.all(imageUrls.map((url) => this.performOCR(url, language)));
        });
    }
    /**
     * Get available voices for TTS
     */
    getAvailableVoices() {
        return __awaiter(this, void 0, void 0, function* () {
            return [
                'anushka',
                'arvind',
                'divya',
                'hari',
                'kajal',
                'ravi',
                'sanjay',
            ];
        });
    }
    /**
     * Get supported languages
     */
    getSupportedLanguages() {
        return __awaiter(this, void 0, void 0, function* () {
            if (!this.apiKey) {
                return {
                    en: 'English',
                    hi: 'Hindi',
                    ta: 'Tamil',
                    te: 'Telugu',
                    kn: 'Kannada',
                    ml: 'Malayalam',
                };
            }
            try {
                const response = yield axios_1.default.get(`${this.baseUrl}/languages`, {
                    headers: {
                        'api-subscription-key': this.apiKey,
                    },
                });
                return response.data.languages || {};
            }
            catch (error) {
                console.error('Failed to get supported languages:', error);
                return {
                    en: 'English',
                    hi: 'Hindi',
                    ta: 'Tamil',
                    te: 'Telugu',
                    kn: 'Kannada',
                    ml: 'Malayalam',
                };
            }
        });
    }
    getMockOCRResult() {
        return {
            text: 'This is mock Document Intelligence result. Configure SARVAM_API_KEY in .env for real results.\n\nSupported formats: PDF, PNG, JPEG, ZIP\n\nSupported languages: All 22 Indian languages + English',
            confidence: 0.95,
            language: 'en-IN',
            metadata: { source: 'mock', service: 'document-intelligence' },
            pages: 1,
        };
    }
    getMockTTSResult() {
        return {
            audioUrl: 'https://example.com/mock-audio.mp3',
            duration: 5.0,
            format: 'mp3',
        };
    }
    getMockSTTResult() {
        return {
            text: 'This is mock speech to text result. Configure SARVAM_API_KEY for real results.',
            confidence: 0.92,
            language: 'en',
            duration: 3.5,
        };
    }
}
exports.SarvamClient = SarvamClient;
exports.sarvamClient = new SarvamClient();
