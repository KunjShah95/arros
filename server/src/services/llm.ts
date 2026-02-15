import OpenAI from 'openai';
import Anthropic from '@anthropic-ai/sdk';
import { z } from 'zod';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY || '',
});

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY || '',
});

export type LLMModel = 'gpt-4o' | 'gpt-4o-mini' | 'claude-3-5-sonnet' | 'claude-3-haiku';

export interface LLMMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface LLMResponse {
  content: string;
  usage: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
  model: string;
}

export interface LLMOptions {
  temperature?: number;
  maxTokens?: number;
  model?: LLMModel;
  responseFormat?: z.ZodSchema;
}

export class LLMService {
  private defaultModel: LLMModel = 'gpt-4o-mini';

  async chat(messages: LLMMessage[], options: LLMOptions = {}): Promise<LLMResponse> {
    const model = options.model || this.defaultModel;
    
    if (model.startsWith('claude')) {
      return this.chatAnthropic(messages, options);
    }
    return this.chatOpenAI(messages, options);
  }

  private async chatOpenAI(messages: LLMMessage[], options: LLMOptions): Promise<LLMResponse> {
    const model = options.model || 'gpt-4o-mini';
    
    const response = await openai.chat.completions.create({
      model,
      messages: messages as OpenAI.Chat.ChatCompletionMessageParam[],
      temperature: options.temperature ?? 0.7,
      max_tokens: options.maxTokens ?? 4096,
      response_format: options.responseFormat ? { type: 'json_object' } : undefined,
    });

    const content = response.choices[0]?.message?.content || '';
    
    return {
      content: options.responseFormat ? content : content,
      usage: {
        promptTokens: response.usage?.prompt_tokens || 0,
        completionTokens: response.usage?.completion_tokens || 0,
        totalTokens: response.usage?.total_tokens || 0,
      },
      model: response.model,
    };
  }

  private async chatAnthropic(messages: LLMMessage[], options: LLMOptions): Promise<LLMResponse> {
    const model = options.model || 'claude-3-haiku-20240307';
    
    const systemMessage = messages.find(m => m.role === 'system');
    const userMessages = messages.filter(m => m.role !== 'system');

    const response = await anthropic.messages.create({
      model,
      max_tokens: options.maxTokens ?? 4096,
      temperature: options.temperature ?? 0.7,
      system: systemMessage?.content,
      messages: userMessages as Anthropic.MessageParam[],
    });

    const content = response.content[0]?.type === 'text' ? response.content[0].text : '';
    
    return {
      content,
      usage: {
        promptTokens: response.usage.input_tokens,
        completionTokens: response.usage.output_tokens,
        totalTokens: response.usage.input_tokens + response.usage.output_tokens,
      },
      model: response.model,
    };
  }

  async summarize(text: string, maxLength: number = 500): Promise<string> {
    const messages: LLMMessage[] = [
      {
        role: 'system',
        content: 'You are a helpful assistant that summarizes text concisely.',
      },
      {
        role: 'user',
        content: `Summarize the following text in no more than ${maxLength} characters:\n\n${text}`,
      },
    ];

    const response = await this.chat(messages, { maxTokens: 1000 });
    return response.content;
  }

  async extractStructuredData<T>(text: string, schema: z.ZodSchema<T>, context?: string): Promise<T> {
    const schemaDescription = schema.description || 'Extract the following data structure';
    
    const messages: LLMMessage[] = [
      {
        role: 'system',
        content: `You are a data extraction assistant. Extract structured data from the provided text according to the schema. Return only valid JSON.`,
      },
      {
        role: 'user',
        content: `Extract data with these fields: ${schemaDescription}\n\n${context ? `Context: ${context}\n\n` : ''}Text to extract from:\n${text}`,
      },
    ];

    const response = await this.chat(messages, { 
      maxTokens: 2000,
      temperature: 0.1,
    });

    try {
      const parsed = JSON.parse(response.content);
      return schema.parse(parsed);
    } catch (error) {
      console.error('Failed to parse LLM response:', error);
      throw new Error('Failed to extract structured data');
    }
  }

  async generateEmbedding(text: string): Promise<number[]> {
    const response = await openai.embeddings.create({
      model: 'text-embedding-3-small',
      input: text,
    });

    return response.data[0]?.embedding || [];
  }

  calculateCost(usage: LLMResponse['usage'], model: LLMModel): number {
    const pricing: Record<LLMModel, { prompt: number; completion: number }> = {
      'gpt-4o': { prompt: 2.5, completion: 10 },
      'gpt-4o-mini': { prompt: 0.15, completion: 0.6 },
      'claude-3-5-sonnet': { prompt: 3, completion: 15 },
      'claude-3-haiku': { prompt: 0.2, completion: 1 },
    };

    const { prompt, completion } = pricing[model];
    return (usage.promptTokens / 1_000_000) * prompt + 
           (usage.completionTokens / 1_000_000) * completion;
  }
}

export const llmService = new LLMService();
