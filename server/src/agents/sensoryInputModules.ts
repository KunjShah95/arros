/**
 * Sensory Input Modules - Simulating Human Sensory Perception
 *
 * These modules process different types of input similar to human senses:
 *  - VisualProcessor: Processes visual/textual information
 *  - AudioProcessor: Processes spoken/audio input
 *  - TextProcessor: Analyzes written content
 *  - ContextIntegrator: Combines inputs into unified perception
 *
 * Inspired by:
 *  - Sensory memory and perception psychology
 *  - Multimodal integration in the brain
 *  - Selective attention mechanisms
 */

import { llmService } from '../services/llm';
import { v4 as uuid } from 'uuid';

// ─── Sensory Input Types ───────────────────────────────────────────────────────

export interface VisualInput {
  type: 'visual' | 'text' | 'image';
  content: string;
  source: string;
  metadata?: {
    resolution?: string;
    confidence?: number;
    context?: string;
  };
}

export interface AudioInput {
  type: 'speech' | 'environment' | 'music';
  content: string; // transcribed text
  source: string;
  metadata?: {
    audioQuality?: number;
    speakerCount?: number;
    emotion?: string;
  };
}

export interface TextInput {
  type: 'written' | 'code' | 'math' | 'mixed';
  content: string;
  source: string;
  metadata?: {
    language?: string;
    formality?: number;
    complexity?: number;
    confidence?: number;
  };
}

export type SensoryInput = VisualInput | AudioInput | TextInput;

export interface PerceptualState {
  attentionFocus: string;      // what's currently in focus
  inputQuality: number;        // 0-1
  processingLoad: number;      // 0-1
  sensoryMemory: SensoryInput[];
  consciousPerception: ProcessedPerception[];
}

// ─── SensoryProcessor Base Class ───────────────────────────────────────────────

export abstract class SensoryProcessor {
  protected processorName: string;
  protected sessionId: string;

  constructor(processorName: string, sessionId: string) {
    this.processorName = processorName;
    this.sessionId = sessionId;
  }

  abstract process(input: SensoryInput): Promise<ProcessedPerception>;
  abstract getName(): string;
}

export interface ProcessedPerception {
  id: string;
  originalInput: SensoryInput;
  interpretation: string;
  confidence: number;
  情感Valence: number;     // 0-1
  情感Arousal: number;       // 0-1
  salience: number;           // how attention-worthy
  relevantContext: string[];
  issues?: string[];
}

// ─── VisualProcessor Class ─────────────────────────────────────────────────────

export class VisualProcessor extends SensoryProcessor {
  constructor(sessionId: string) {
    super('VisualProcessor', sessionId);
  }

  getName(): string {
    return 'VisualProcessor';
  }

  /**
   * Process visual/textual input
   */
  async process(input: VisualInput): Promise<ProcessedPerception> {
    // Determine input type and process accordingly
    const isCode = input.type === 'text' && input.content.includes('function') || input.content.includes('const ') || input.content.includes('import');
    const isImageAnalysis = input.type === 'image';

    let interpretation: string;
    let issues: string[] = [];

    if (isImageAnalysis) {
      interpretation = await this.analyzeVisualContent(input.content);
    } else if (isCode) {
      interpretation = await this.analyzeCode(input.content);
    } else {
      interpretation = await this.processTextAsVisual(input.content);
    }

    // Detect potential issues
    if (input.metadata?.confidence && input.metadata.confidence < 0.7) {
      issues.push('Low confidence interpretation');
    }

    // Determine emotional valence from content
    const emotionalResponse = this.detectEmotionalTone(input.content);

    const perception: ProcessedPerception = {
      id: `visual_${uuid()}`,
      originalInput: input,
      interpretation,
      confidence: input.metadata?.confidence ? input.metadata.confidence * 0.8 : 0.75,
      情感Valence: emotionalResponse.valence,
      情感Arousal: emotionalResponse.arousal,
      salience: this.calculateSalience(input, issues),
      relevantContext: this.extractRelevantContext(input.content),
      issues,
    };

    return perception;
  }

  /**
   * Analyze visual content (for images)
   */
  private async analyzeVisualContent(content: string): Promise<string> {
    const messages = [
      {
        role: 'system' as const,
        content: 'You are a visual analysis assistant. Describe what is visually present in the input.',
      },
      { role: 'user' as const, content: content.substring(0, 2000) },
    ];

    try {
      const response = await llmService.chat(messages, {
        maxTokens: 500,
        temperature: 0.4,
        model: 'gpt-4o-mini',
      });
      return response.content;
    } catch {
      return 'Visual content analysis unavailable';
    }
  }

  /**
   * Analyze code as visual input
   */
  private async analyzeCode(content: string): Promise<string> {
    const messages = [
      {
        role: 'system' as const,
        content: 'Analyze this code for: purpose, key components, potential issues, and structure.',
      },
      { role: 'user' as const, content: content.substring(0, 1000) },
    ];

    try {
      const response = await llmService.chat(messages, {
        maxTokens: 500,
        temperature: 0.3,
        model: 'gpt-4o-mini',
      });
      return response.content;
    } catch {
      return 'Code structure and purpose analysis';
    }
  }

  /**
   * Process text as visual input
   */
  private async processTextAsVisual(content: string): Promise<string> {
    const messages = [
      {
        role: 'system' as const,
        content: 'Summarize this text, identifying: main topic, key points, and structure.',
      },
      { role: 'user' as const, content: content.substring(0, 1000) },
    ];

    try {
      const response = await llmService.chat(messages, {
        maxTokens: 300,
        temperature: 0.3,
        model: 'gpt-4o-mini',
      });
      return response.content;
    } catch {
      return 'Text content processing';
    }
  }

  /**
   * Detect emotional tone in visual content
   */
  private detectEmotionalTone(content: string): { valence: number; arousal: number } {
    const lower = content.toLowerCase();

    const positiveWords = ['good', 'great', 'excellent', 'wonderful', 'beautiful', 'amazing', 'love', 'happy', 'success', 'win'];
    const negativeWords = ['bad', 'terrible', 'awful', 'horrible', 'ugly', 'sad', 'fail', 'loss', 'worse', 'worst'];

    let positiveCount = 0;
    let negativeCount = 0;

    for (const word of positiveWords) {
      if (lower.includes(word)) positiveCount++;
    }
    for (const word of negativeWords) {
      if (lower.includes(word)) negativeCount++;
    }

    const total = positiveCount + negativeCount;
    if (total === 0) return { valence: 0.5, arousal: 0.3 };

    const valence = 0.5 + (positiveCount - negativeCount) * 0.1;
    const arousal = Math.min(1, (positiveCount + negativeCount) * 0.15);

    return {
      valence: Math.max(0, Math.min(1, valence)),
      arousal: Math.max(0, Math.min(1, arousal)),
    };
  }

  /**
   * Calculate how attention-worthy this input is
   */
  private calculateSalience(input: VisualInput, issues: string[]): number {
    let salience = 0.3; // base salience

    // Length affects salience (very short or very long might be more attention-worthy)
    const length = input.content.length;
    if (length < 20 || length > 5000) salience += 0.2;
    else if (length > 200) salience += 0.1;

    // Confidence affects salience (low confidence is more attention-worthy)
    if (input.metadata?.confidence && input.metadata.confidence < 0.7) salience += 0.2;

    // Issues increase salience
    salience += issues.length * 0.1;

    return Math.min(1, salience);
  }

  /**
   * Extract context from visual content
   */
  private extractRelevantContext(content: string): string[] {
    const words = content.toLowerCase().split(/\s+/);
    const context: string[] = [];

    // Extract potential topics (long words, possibly technical)
    const topicWords = words.filter(w => w.length > 6 && !this.isStopWord(w)).slice(0, 5);
    context.push(...topicWords);

    // Extract numbers (often significant)
    const numbers = content.match(/\b\d+\b/g)?.slice(0, 3) || [];
    context.push(...numbers.map(n => `value: ${n}`));

    return context.slice(0, 5);
  }

  private isStopWord(word: string): boolean {
    const stopWords = ['the', 'a', 'an', 'is', 'are', 'was', 'were', 'to', 'of', 'and', 'or', 'in', 'on', 'at', 'for', 'with', 'by'];
    return stopWords.includes(word);
  }
}

// ─── AudioProcessor Class ──────────────────────────────────────────────────────

export class AudioProcessor extends SensoryProcessor {
  constructor(sessionId: string) {
    super('AudioProcessor', sessionId);
  }

  getName(): string {
    return 'AudioProcessor';
  }

  /**
   * Process audio input
   */
  async process(input: AudioInput): Promise<ProcessedPerception> {
    // Interpret speech content
    let interpretation: string;
    let emotionalContent: { valence: number; arousal: number; dominantEmotion: string } = {
      valence: 0.5,
      arousal: 0.5,
      dominantEmotion: 'neutral',
    };

    if (input.type === 'speech') {
      const analysis = await this.analyzeSpeech(input.content);
      interpretation = analysis.summary;
      emotionalContent = analysis.emotion;
    } else {
      interpretation = await this.processNonSpeechAudio(input);
    }

    // Adjust for audio quality
    let confidence = 0.75;
    if (input.metadata?.audioQuality) {
      confidence = input.metadata.audioQuality * 0.9;
    }

    const perception: ProcessedPerception = {
      id: `audio_${uuid()}`,
      originalInput: input,
      interpretation,
      confidence: Math.max(0.5, Math.min(1, confidence)),
      情感Valence: emotionalContent.valence,
      情感Arousal: emotionalContent.arousal,
      salience: this.calculateSalience(input, emotionalContent),
      relevantContext: this.extractSpeechContext(input.content),
      issues: input.metadata?.audioQuality && input.metadata.audioQuality < 0.6 ? ['Low audio quality'] : [],
    };

    return perception;
  }

  /**
   * Analyze spoken speech
   */
  private async analyzeSpeech(content: string): Promise<{
    summary: string;
    emotion: { valence: number; arousal: number; dominantEmotion: string };
  }> {
    const messages = [
      {
        role: 'system' as const,
        content: 'Analyze this speech for: main message, emotional tone, speaker intent, and key points.',
      },
      { role: 'user' as const, content: content.substring(0, 1000) },
    ];

    try {
      const response = await llmService.chat(messages, {
        maxTokens: 500,
        temperature: 0.4,
        model: 'gpt-4o-mini',
      });

      // Parse to extract emotion
      const emotion = this.assessEmotion(content);

      return {
        summary: response.content,
        emotion,
      };
    } catch {
      return {
        summary: 'Speech content analysis',
        emotion: { valence: 0.5, arousal: 0.3, dominantEmotion: 'neutral' },
      };
    }
  }

  /**
   * Process non-speech audio
   */
  private async processNonSpeechAudio(input: AudioInput): Promise<string> {
    const messages = [
      {
        role: 'system' as const,
        content: 'Describe what type of non-speech audio this might be and its characteristics.',
      },
      { role: 'user' as const, content: `Audio type: ${input.type}` },
    ];

    try {
      const response = await llmService.chat(messages, {
        maxTokens: 300,
        temperature: 0.3,
        model: 'gpt-4o-mini',
      });
      return response.content;
    } catch {
      return `Processing ${input.type} audio`;
    }
  }

  /**
   * Assess emotional content of speech
   */
  private assessEmotion(content: string): { valence: number; arousal: number; dominantEmotion: string } {
    const lower = content.toLowerCase();

    // Emotion keywords
    const emotions = {
      joy: ['happy', 'great', 'excited', 'wonderful', 'love', 'joy', 'celebrate'],
      anger: ['angry', 'mad', 'frustrated', 'annoyed', 'rage', 'furious'],
      sadness: ['sad', 'depressed', 'upset', 'miserable', 'grief', 'pain'],
      fear: ['afraid', 'scared', 'fear', 'anxiety', 'worried', 'nervous'],
      surprise: ['surprised', 'shocked', 'amazed', 'stunned', 'unexpected'],
      calm: ['calm', 'peaceful', 'serene', 'relaxed', 'quiet', 'still'],
    };

    let emotionScores: Record<string, number> = {};
    for (const [emotion, keywords] of Object.entries(emotions)) {
      emotionScores[emotion] = keywords.reduce((count, kw) => count + (lower.includes(kw) ? 1 : 0), 0);
    }

    // Determine dominant emotion
    const dominantEmotion = Object.entries(emotionScores)
      .sort((a, b) => b[1] - a[1])[0]?.[0] || 'neutral';

    // Calculate valence and arousal
    let valence = 0.5;
    let arousal = 0.3;

    if (emotionScores.joy) valence += emotionScores.joy * 0.1;
    if (emotionScores.anger || emotionScores.fear || emotionScores.sadness) valence -= emotionScores.anger * 0.15;
    if (emotionScores.surprise) arousal += 0.2;

    if (emotionScores.anger || emotionScores.surprise) arousal += 0.2;
    if (emotionScores.calm || emotionScores.sadness) arousal -= 0.1;

    return {
      valence: Math.max(0, Math.min(1, valence)),
      arousal: Math.max(0, Math.min(1, arousal)),
      dominantEmotion,
    };
  }

  /**
   * Calculate salience for audio
   */
  private calculateSalience(input: AudioInput, emotion: any): number {
    let salience = 0.3;

    // High arousal audio is more attention-worthy
    salience += emotion.arousal * 0.3;

    // Emotional content increases salience
    if (emotion.dominantEmotion !== 'neutral') salience += 0.2;

    return Math.min(1, salience);
  }

  /**
   * Extract context from speech
   */
  private extractSpeechContext(content: string): string[] {
    const words = content.toLowerCase().split(/\s+/);
    const context: string[] = [];

    // Extract key nouns and verbs
    const importantWords = words.filter(w =>
      w.length > 4 &&
      !this.isStopWord(w) &&
      !this.isPronoun(w)
    ).slice(0, 5);

    context.push(...importantWords);

    return context.slice(0, 5);
  }

  private isPronoun(word: string): boolean {
    const pronouns = ['i', 'you', 'he', 'she', 'it', 'we', 'they', 'me', 'him', 'her', 'us', 'them', 'my', 'your', 'his', 'her', 'our', 'their', 'this', 'that', 'these', 'those'];
    return pronouns.includes(word);
  }

  private isStopWord(word: string): boolean {
    const stopWords = ['the', 'a', 'an', 'is', 'are', 'was', 'were', 'to', 'of', 'and', 'or', 'in', 'on', 'at', 'for', 'with', 'by'];
    return stopWords.includes(word);
  }
}

// ─── TextProcessor Class ───────────────────────────────────────────────────────

export class TextProcessor extends SensoryProcessor {
  constructor(sessionId: string) {
    super('TextProcessor', sessionId);
  }

  getName(): string {
    return 'TextProcessor';
  }

  /**
   * Process text input
   */
  async process(input: TextInput): Promise<ProcessedPerception> {
    // Analyze text complexity
    const complexity = this.estimateComplexity(input.content);
    const language = input.metadata?.language || this.estimateLanguage(input.content);

    let interpretation: string;
    let issues: string[] = [];

    if (input.type === 'code') {
      interpretation = await this.analyzeCodeText(input.content);
    } else if (input.type === 'math') {
      interpretation = await this.analyzeMathText(input.content);
    } else {
      interpretation = await this.analyzeGeneralText(input.content);
    }

    // Detect issues
    if (input.metadata?.complexity && input.metadata.complexity > 0.8) {
      issues.push('High complexity content');
    }

    const emotionalResponse = this.analyzeTextEmotion(input.content);

    const perception: ProcessedPerception = {
      id: `text_${uuid()}`,
      originalInput: input,
      interpretation,
      confidence: 0.8,
      情感Valence: emotionalResponse.valence,
      情感Arousal: emotionalResponse.arousal,
      salience: this.calculateSalience(input, issues, complexity),
      relevantContext: this.extractTextContext(input.content, input.type),
      issues,
    };

    return perception;
  }

  /**
   * Analyze code text
   */
  private async analyzeCodeText(content: string): Promise<string> {
    const messages = [
      {
        role: 'system' as const,
        content: 'Analyze this code for: purpose, algorithm used, and key functions.',
      },
      { role: 'user' as const, content: content.substring(0, 1000) },
    ];

    try {
      const response = await llmService.chat(messages, {
        maxTokens: 400,
        temperature: 0.3,
        model: 'gpt-4o-mini',
      });
      return response.content;
    } catch {
      return 'Code text analysis';
    }
  }

  /**
   * Analyze math text
   */
  private async analyzeMathText(content: string): Promise<string> {
    const messages = [
      {
        role: 'system' as const,
        content: 'Analyze this mathematical content for: concepts involved, formulas used, and relationships.',
      },
      { role: 'user' as const, content: content.substring(0, 500) },
    ];

    try {
      const response = await llmService.chat(messages, {
        maxTokens: 400,
        temperature: 0.2,
        model: 'gpt-4o-mini',
      });
      return response.content;
    } catch {
      return 'Mathematical content analysis';
    }
  }

  /**
   * Analyze general text
   */
  private async analyzeGeneralText(content: string): Promise<string> {
    const messages = [
      {
        role: 'system' as const,
        content: 'Summarize this text: main topic, key arguments, conclusions.',
      },
      { role: 'user' as const, content: content.substring(0, 1000) },
    ];

    try {
      const response = await llmService.chat(messages, {
        maxTokens: 400,
        temperature: 0.3,
        model: 'gpt-4o-mini',
      });
      return response.content;
    } catch {
      return 'Text content analysis';
    }
  }

  /**
   * Estimate text complexity
   */
  private estimateComplexity(content: string): number {
    const words = content.split(/\s+/);
    const sentences = content.split(/[.!?]+/);

    const avgWordLength = words.reduce((sum, w) => sum + w.length, 0) / (words.length || 1);
    const avgSentenceLength = words.length / (sentences.length || 1);

    let complexity = 0.3;
    complexity += Math.min(0.3, avgWordLength / 10);
    complexity += Math.min(0.4, avgSentenceLength / 20);

    return Math.min(1, complexity);
  }

  /**
   * Estimate language from text
   */
  private estimateLanguage(content: string): string {
    const lower = content.toLowerCase();

    // Common words by language
    const languageIndicators: Record<string, string[]> = {
      english: ['the', 'be', 'to', 'of', 'and', 'a', 'in', 'that', 'have', 'it'],
      spanish: ['el', 'la', 'de', 'que', 'y', 'a', 'en', 'un', 'ser', 'se'],
      french: ['le', 'la', 'de', 'et', 'est', 'une', 'pour', 'dans', 'sur', 'cela'],
      german: ['der', 'die', 'das', 'und', 'in', 'den', 'vom', 'aber', 'wir', 'hat'],
      chinese: ['的', '是', '在', '有', '人', '这', '中', '大', '为', '和'],
      japanese: ['の', 'に', 'は', 'を', 'た', 'が', 'で', 'て', 'と', 'し'],
    };

    let maxScore = 0;
    let detectedLang = 'unknown';

    for (const [lang, words] of Object.entries(languageIndicators)) {
      let score = 0;
      for (const word of words) {
        if (lower.includes(word)) score++;
      }
      if (score > maxScore) {
        maxScore = score;
        detectedLang = lang;
      }
    }

    return detectedLang;
  }

  /**
   * Analyze text emotion
   */
  private analyzeTextEmotion(content: string): { valence: number; arousal: number } {
    return this.detectEmotionalTone(content);
  }

  /**
   * Calculate salience for text
   */
  private calculateSalience(input: TextInput, issues: string[], complexity: number): number {
    let salience = 0.3;

    // Complex text is more attention-worthy
    salience += complexity * 0.2;

    // Length affects salience
    const length = input.content.length;
    if (length < 50 || length > 2000) salience += 0.15;

    // Issues increase salience
    salience += issues.length * 0.1;

    return Math.min(1, salience);
  }

  /**
   * Extract context from text
   */
  private extractTextContext(content: string, type: string): string[] {
    const words = content.toLowerCase().split(/\s+/);
    const context: string[] = [];

    // Extract topic words based on text type
    if (type === 'code') {
      // Extract function names, variable names, technical terms
      const codeWords = words.filter(w =>
        w.length > 5 &&
        (w.includes('function') || w.includes('const') || w.includes('import') || /^[a-z][A-Z]/.test(w) || /^[A-Z][A-Z0-9_]+$/.test(w))
      );
      context.push(...codeWords.slice(0, 5));
    } else if (type === 'math') {
      // Extract mathematical symbols and terms
      const mathTerms = content.match(/[a-zA-Z]+\d*|[+\-*/=<>(){}[\]]+/g) || [];
      context.push(...mathTerms.slice(0, 5));
    } else {
      // General text - extract significant words
      const significantWords = words.filter(w =>
        w.length > 5 &&
        !this.isStopWord(w)
      );
      context.push(...significantWords.slice(0, 5));
    }

    return context.slice(0, 5);
  }

  private detectEmotionalTone(content: string): { valence: number; arousal: number } {
    const lower = content.toLowerCase();

    const positiveWords = ['good', 'great', 'excellent', 'wonderful', 'beautiful', 'love', 'happy', 'success', 'win'];
    const negativeWords = ['bad', 'terrible', 'awful', 'horrible', 'sad', 'fail', 'loss', 'worse'];

    let positiveCount = 0;
    let negativeCount = 0;

    for (const word of positiveWords) {
      if (lower.includes(word)) positiveCount++;
    }
    for (const word of negativeWords) {
      if (lower.includes(word)) negativeCount++;
    }

    const total = positiveCount + negativeCount;
    if (total === 0) return { valence: 0.5, arousal: 0.3 };

    const valence = 0.5 + (positiveCount - negativeCount) * 0.1;
    const arousal = Math.min(1, (positiveCount + negativeCount) * 0.1);

    return {
      valence: Math.max(0, Math.min(1, valence)),
      arousal: Math.max(0, Math.min(1, arousal)),
    };
  }

  private isStopWord(word: string): boolean {
    const stopWords = ['the', 'a', 'an', 'is', 'are', 'was', 'were', 'to', 'of', 'and', 'or', 'in', 'on', 'at', 'for', 'with', 'by'];
    return stopWords.includes(word);
  }
}

// ─── ContextIntegrator Class ───────────────────────────────────────────────────

export class ContextIntegrator {
  private sessionId: string;
  private sensoryMemoryLimit = 20;

  constructor(sessionId: string) {
    this.sessionId = sessionId;
  }

  /**
   * Integrate multiple sensory inputs into unified perception
   */
  async integrate(inputs: SensoryInput[]): Promise<{
    unifiedPerception: ProcessedPerception[];
    attentionState: PerceptualState;
    emergingFocus: string;
  }> {
    // Process each input through appropriate processor
    const processors: Record<string, SensoryProcessor> = {
      visual: new VisualProcessor(this.sessionId),
      text: new TextProcessor(this.sessionId),
      speech: new AudioProcessor(this.sessionId),
    };

    const processedPerceptions: ProcessedPerception[] = [];

    for (const input of inputs) {
      let processor: SensoryProcessor;

      if (input.type === 'visual' || input.type === 'image') {
        processor = processors.visual;
      } else if (input.type === 'text' || input.type === 'code' || input.type === 'math') {
        processor = processors.text;
      } else {
        processor = processors.speech;
      }

      try {
        const perception = await processor.process(input);
        processedPerceptions.push(perception);
      } catch (err) {
        console.warn(`[ContextIntegrator] Processing error for ${input.type}:`, err);
      }
    }

    // Sort by salience (most attention-worthy first)
    processedPerceptions.sort((a, b) => b.salience - a.salience);

    // Determine attention state
    const attentionState: PerceptualState = {
      attentionFocus: processedPerceptions[0]?.originalInput.content.substring(0, 50) || '',
      inputQuality: processedPerceptions.length > 0
        ? processedPerceptions.reduce((sum, p) => sum + p.confidence, 0) / processedPerceptions.length
        : 0,
      processingLoad: Math.min(1, processedPerceptions.length * 0.15),
      sensoryMemory: inputs.slice(-this.sensoryMemoryLimit),
      consciousPerception: processedPerceptions.slice(0, 5),
    };

    // Determine emerging focus (what the "brain" is focusing on)
    const emergingFocus = this.determineEmergingFocus(processedPerceptions);

    return {
      unifiedPerception: processedPerceptions,
      attentionState,
      emergingFocus,
    };
  }

  /**
   * Determine what the brain should focus on
   */
  private determineEmergingFocus(perceptions: ProcessedPerception[]): string {
    if (perceptions.length === 0) return '';

    // Find the most salient and highest confidence perception
    const focusCandidate = perceptions.reduce((best, current) => {
      const currentScore = current.salience * current.confidence;
      const bestScore = best.salience * best.confidence;
      return currentScore > bestScore ? current : best;
    });

    return focusCandidate.interpretation.substring(0, 100);
  }

  /**
   * Clear sensory memory
   */
  clearMemory(): void {
    // In a real implementation, this would clear the memory buffer
    // For now, just a placeholder
  }

  /**
   * Get attention state summary
   */
  getAttentionStateSummary(perceptions: ProcessedPerception[]): string {
    if (perceptions.length === 0) return 'No sensory input detected';

    const totalSalience = perceptions.reduce((sum, p) => sum + p.salience, 0);
    const avgConfidence = perceptions.reduce((sum, p) => sum + p.confidence, 0) / perceptions.length;

    return `Processing ${perceptions.length} inputs with avg confidence: ${(avgConfidence * 100).toFixed(0)}%`;
  }
}
