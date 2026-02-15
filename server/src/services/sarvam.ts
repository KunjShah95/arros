import axios from 'axios';

export interface SarvamOCRResult {
  text: string;
  confidence: number;
  language?: string;
  metadata: Record<string, unknown>;
}

export interface SarvamTTSRequest {
  text: string;
  language?: string;
  voice?: string;
  speed?: number;
  pitch?: number;
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

export class SarvamClient {
  private apiKey: string;
  private baseUrl = 'https://api.sarvam.ai/v1';

  constructor(apiKey?: string) {
    this.apiKey = apiKey || process.env.SARVAM_API_KEY || '';
  }

  /**
   * Optical Character Recognition (OCR) - Extract text from images
   */
  async performOCR(imageUrl: string | File, language: string = 'en'): Promise<SarvamOCRResult> {
    if (!this.apiKey) {
      console.warn('SARVAM_API_KEY not configured');
      return this.getMockOCRResult();
    }

    try {
      const formData: any = new FormData ? new FormData() : {};
      if (typeof imageUrl === 'string') {
        formData.append('image_url', imageUrl);
      } else {
        formData.append('image', imageUrl);
      }
      formData.append('language', language);

      const response = await axios.post(
        `${this.baseUrl}/ocr/extract`,
        formData,
        {
          headers: {
            'api-subscription-key': this.apiKey,
            'Content-Type': 'multipart/form-data',
          },
        }
      );

      return {
        text: response.data.text || '',
        confidence: response.data.confidence || 0.9,
        language: response.data.language || language,
        metadata: response.data.metadata || {},
      };
    } catch (error) {
      console.error('Sarvam OCR error:', error);
      return this.getMockOCRResult();
    }
  }

  /**
   * Text-to-Speech (TTS) - Convert text to speech
   */
  async textToSpeech(request: SarvamTTSRequest): Promise<SarvamTTSResult> {
    if (!this.apiKey) {
      console.warn('SARVAM_API_KEY not configured');
      return this.getMockTTSResult();
    }

    try {
      const response = await axios.post(
        `${this.baseUrl}/audio/tts`,
        {
          text: request.text,
          language: request.language || 'en',
          voice: request.voice || 'female',
          speed: request.speed || 1.0,
          pitch: request.pitch || 1.0,
        },
        {
          headers: {
            'api-subscription-key': this.apiKey,
            'Content-Type': 'application/json',
          },
        }
      );

      return {
        audioUrl: response.data.audioUrl || '',
        audioBase64: response.data.audioBase64,
        duration: response.data.duration || 0,
        format: response.data.format || 'mp3',
      };
    } catch (error) {
      console.error('Sarvam TTS error:', error);
      return this.getMockTTSResult();
    }
  }

  /**
   * Speech-to-Text (STT) - Convert speech to text
   */
  async speechToText(audioUrl: string | File, language: string = 'en'): Promise<SarvamSTTResult> {
    if (!this.apiKey) {
      console.warn('SARVAM_API_KEY not configured');
      return this.getMockSTTResult();
    }

    try {
      const formData: any = new FormData ? new FormData() : {};
      if (typeof audioUrl === 'string') {
        formData.append('audio_url', audioUrl);
      } else {
        formData.append('audio', audioUrl);
      }
      formData.append('language', language);

      const response = await axios.post(
        `${this.baseUrl}/audio/stt`,
        formData,
        {
          headers: {
            'api-subscription-key': this.apiKey,
            'Content-Type': 'multipart/form-data',
          },
          timeout: 60000,
        }
      );

      return {
        text: response.data.text || '',
        confidence: response.data.confidence || 0.85,
        language: response.data.language || language,
        duration: response.data.duration || 0,
      };
    } catch (error) {
      console.error('Sarvam STT error:', error);
      return this.getMockSTTResult();
    }
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
    if (!this.apiKey) {
      return ['male', 'female'];
    }

    try {
      const response = await axios.get(`${this.baseUrl}/audio/voices`, {
        headers: {
          'api-subscription-key': this.apiKey,
        },
      });

      return response.data.voices || ['male', 'female'];
    } catch (error) {
      console.error('Failed to get available voices:', error);
      return ['male', 'female'];
    }
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
      text: 'This is mock OCR text. Configure SARVAM_API_KEY for real results.',
      confidence: 0.95,
      language: 'en',
      metadata: { source: 'mock' },
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
