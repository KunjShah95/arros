import axios from 'axios';
import AdmZip from 'adm-zip';

export interface SarvamOCRResult {
  text: string;
  confidence: number;
  language?: string;
  metadata: Record<string, unknown>;
  pages?: number;
}

export interface SarvamTTSRequest {
  text: string;
  language?: string;
  voice?: string;
  target_language_code?: string;
  speaker?: string;
}

export interface SarvamTTSResult {
  audioUrl: string;
  audioBase64?: string;
  duration: number;
  format: string;
}

export interface SarvamSTTResult {
  text: string;
  confidence: number;
  language?: string;
  duration: number;
}

export interface DocumentIntelligenceJob {
  jobId: string;
  jobState: string;
}

export class SarvamClient {
  private apiKey: string;
  private baseUrl = 'https://api.sarvam.ai';
  private pollInterval = 2000;
  private maxRetries = 60;

  constructor(apiKey?: string) {
    this.apiKey = apiKey || process.env.SARVAM_API_KEY || '';
  }

  private toBlob(file: Express.Multer.File): Blob {
    const uint8Array = new Uint8Array(file.buffer);
    return new Blob([uint8Array], { type: file.mimetype });
  }

  /**
   * Document Intelligence - Extract text from PDFs and images
   * API: https://api.sarvam.ai/document-intelligence/v1/jobs
   */
  async performOCR(imageUrl: string | Express.Multer.File, language: string = 'en-IN'): Promise<SarvamOCRResult> {
    if (!this.apiKey) {
      console.warn('SARVAM_API_KEY not configured');
      return this.getMockOCRResult();
    }

    try {
      const targetLanguage = this.mapLanguageCode(language);
      const file = typeof imageUrl === 'string' ? await this.urlToFile(imageUrl) : imageUrl;
      const fileName = typeof imageUrl === 'string' ? 'document' : imageUrl.originalname;
      const contentType = typeof imageUrl === 'string' ? 'application/pdf' : imageUrl.mimetype;

      const createResponse = await axios.post(
        `${this.baseUrl}/document-intelligence/v1/jobs`,
        {
          language: targetLanguage,
          output_format: 'md',
        },
        {
          headers: {
            'api-subscription-key': this.apiKey,
            'Content-Type': 'application/json',
          },
        }
      );

      const jobId = createResponse.data.job_id;
      const uploadUrl = createResponse.data.upload_url;

      await axios.put(uploadUrl, file, {
        headers: {
          'Content-Type': contentType,
        },
      });

      await axios.post(
        `${this.baseUrl}/document-intelligence/v1/jobs/${jobId}/start`,
        {},
        {
          headers: {
            'api-subscription-key': this.apiKey,
          },
        }
      );

      const result = await this.pollJobCompletion(jobId);

      if (result.downloadUrl) {
        const text = await this.extractTextFromZip(result.downloadUrl);
        return {
          text,
          confidence: 0.95,
          language: targetLanguage,
          metadata: { jobId, pages: result.pages },
          pages: result.pages,
        };
      }

      return this.getMockOCRResult();
    } catch (error) {
      console.error('Sarvam Document Intelligence error:', error);
      return this.getMockOCRResult();
    }
  }

  private async pollJobCompletion(jobId: string): Promise<{ downloadUrl?: string; pages?: number }> {
    for (let i = 0; i < this.maxRetries; i++) {
      const statusResponse = await axios.get(
        `${this.baseUrl}/document-intelligence/v1/jobs/${jobId}`,
        {
          headers: {
            'api-subscription-key': this.apiKey,
          },
        }
      );

      const jobState = statusResponse.data.job_state;

      if (jobState === 'Completed') {
        const downloadResponse = await axios.get(
          `${this.baseUrl}/document-intelligence/v1/jobs/${jobId}/download`,
          {
            headers: {
              'api-subscription-key': this.apiKey,
            },
          }
        );
        return {
          downloadUrl: downloadResponse.data.url,
          pages: statusResponse.data.page_metrics?.total_pages,
        };
      } else if (jobState === 'Failed' || jobState === 'PartiallyCompleted') {
        console.error('Job failed or partially failed:', statusResponse.data);
        break;
      }

      await this.sleep(this.pollInterval);
    }

    return {};
  }

  private async extractTextFromZip(downloadUrl: string): Promise<string> {
    const response = await axios.get(downloadUrl, { responseType: 'arraybuffer' });
    const zip = new AdmZip(Buffer.from(response.data));
    const entries = zip.getEntries();
    
    let fullText = '';
    const textFiles = entries
      .filter(e => e.entryName.endsWith('.md') || e.entryName.endsWith('.html'))
      .sort((a, b) => a.entryName.localeCompare(b.entryName));

    for (const entry of textFiles) {
      fullText += entry.getData().toString('utf8') + '\n\n';
    }

    return fullText || 'No text extracted';
  }

  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  private async urlToFile(url: string): Promise<Blob> {
    const response = await axios.get(url, { responseType: 'blob' });
    return response.data;
  }

  /**
   * Text-to-Speech (TTS) - Convert text to speech
   * API: POST https://api.sarvam.ai/text-to-speech
   */
  async textToSpeech(request: SarvamTTSRequest): Promise<SarvamTTSResult> {
    if (!this.apiKey) {
      console.warn('SARVAM_API_KEY not configured');
      return this.getMockTTSResult();
    }

    const targetLanguage = this.mapLanguageCode(request.language || 'en');

    try {
      const response = await axios.post(
        `${this.baseUrl}/text-to-speech`,
        {
          text: request.text,
          target_language_code: targetLanguage,
          speaker: request.voice === 'male' ? 'ravi' : 'anushka',
        },
        {
          headers: {
            'api-subscription-key': this.apiKey,
            'Content-Type': 'application/json',
          },
        }
      );

      return {
        audioUrl: response.data.audios?.[0] || '',
        audioBase64: response.data.audios?.[0],
        duration: response.data.duration || 0,
        format: 'mp3',
      };
    } catch (error) {
      console.error('Sarvam TTS error:', error);
      return this.getMockTTSResult();
    }
  }

  /**
   * Speech-to-Text (STT) - Convert speech to text
   * API: POST https://api.sarvam.ai/speech-to-text
   */
  async speechToText(audioUrl: string | Express.Multer.File, language: string = 'en'): Promise<SarvamSTTResult> {
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
        } else {
          formData.append('file', await this.urlToBlob(audioUrl));
        }
      } else {
        formData.append('file', this.toBlob(audioUrl), audioUrl.originalname);
      }

      formData.append('model', 'saaras:v3');
      formData.append('mode', 'transcribe');

      const response = await axios.post(
        `${this.baseUrl}/speech-to-text`,
        formData,
        {
          headers: {
            'api-subscription-key': this.apiKey,
          },
          timeout: 60000,
        }
      );

      return {
        text: response.data.transcript || response.data.text || '',
        confidence: response.data.confidence || 0.85,
        language: response.data.language_code || language,
        duration: response.data.duration || 0,
      };
    } catch (error) {
      console.error('Sarvam STT error:', error);
      return this.getMockSTTResult();
    }
  }

  private async urlToBlob(url: string): Promise<Blob> {
    const response = await axios.get(url, { responseType: 'blob' });
    return response.data;
  }

  private mapLanguageCode(code: string): string {
    const mapping: Record<string, string> = {
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
  async batchOCR(imageUrls: string[], language: string = 'en'): Promise<SarvamOCRResult[]> {
    return Promise.all(imageUrls.map((url) => this.performOCR(url, language)));
  }

  /**
   * Get available voices for TTS
   */
  async getAvailableVoices(): Promise<string[]> {
    return [
      'anushka',
      'arvind',
      'divya',
      'hari',
      'kajal',
      'ravi',
      'sanjay',
    ];
  }

  /**
   * Get supported languages
   */
  async getSupportedLanguages(): Promise<Record<string, string>> {
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
      const response = await axios.get(`${this.baseUrl}/languages`, {
        headers: {
          'api-subscription-key': this.apiKey,
        },
      });

      return response.data.languages || {};
    } catch (error) {
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
  }

  private getMockOCRResult(): SarvamOCRResult {
    return {
      text: 'This is mock Document Intelligence result. Configure SARVAM_API_KEY in .env for real results.\n\nSupported formats: PDF, PNG, JPEG, ZIP\n\nSupported languages: All 22 Indian languages + English',
      confidence: 0.95,
      language: 'en-IN',
      metadata: { source: 'mock', service: 'document-intelligence' },
      pages: 1,
    };
  }

  private getMockTTSResult(): SarvamTTSResult {
    return {
      audioUrl: 'https://example.com/mock-audio.mp3',
      duration: 5.0,
      format: 'mp3',
    };
  }

  private getMockSTTResult(): SarvamSTTResult {
    return {
      text: 'This is mock speech to text result. Configure SARVAM_API_KEY for real results.',
      confidence: 0.92,
      language: 'en',
      duration: 3.5,
    };
  }
}

export const sarvamClient = new SarvamClient();
