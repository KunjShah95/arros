/**
 * PDFResearcher / YouTubeResearcher
 *
 * Enables the brain to consume external media:
 *  - PDFs: extracted via text parsing, then synthesized
 *  - YouTube: transcript fetched, then analyzed
 * 
 * Output feeds directly into the HumanBrainOrchestrator pipeline.
 */

import { llmService } from '../services/llm';
import { prisma } from '../services/prisma';
import { z } from 'zod';
import { v4 as uuid } from 'uuid';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface MediaAnalysis {
    sessionId: string;
    title: string;
    mediaType: 'pdf' | 'youtube' | 'image' | 'text';
    extractedText: string;
    wordCount: number;
    summary: string;
    keyFindings: string[];
    keyTakeaways: string[];
    questions: string[];
    difficulty: 'beginner' | 'intermediate' | 'advanced';
    topics: string[];
    confidence: number;
}

const AnalysisSchema = z.object({
    title: z.string(),
    summary: z.string(),
    keyFindings: z.array(z.string()),
    keyTakeaways: z.array(z.string()),
    questions: z.array(z.string()),
    difficulty: z.enum(['beginner', 'intermediate', 'advanced']),
    topics: z.array(z.string()),
    confidence: z.number().min(0).max(1),
});

// ─── PDFResearcher ─────────────────────────────────────────────────────────────

export class PDFResearcher {
    private userId: string;

    constructor(userId: string) {
        this.userId = userId;
    }

    /**
     * Analyze raw text content from a PDF
     */
    async analyzeText(rawText: string, filename: string): Promise<MediaAnalysis> {
        const sessionId = `pdf_${uuid()}`;
        const wordCount = rawText.split(/\s+/).length;

        // Truncate for LLM context window
        const truncated = rawText.substring(0, 12000);

        console.log(`[PDFResearcher] Analyzing "${filename}" — ${wordCount} words`);

        const messages = [
            {
                role: 'system' as const,
                content: `You are an expert research analyst. Analyze the provided document and extract structured knowledge.
Be thorough, precise, and academically rigorous. Focus on what's most important for learning and retention.`,
            },
            {
                role: 'user' as const,
                content: `Document: "${filename}"

Content:
${truncated}

Analyze this document and provide:
- A concise title (if not obvious from filename)
- A 2-3 paragraph summary
- 5-8 key findings (specific, factual claims from the document)
- 4-6 key takeaways (actionable insights for the reader)
- 3-5 study questions this document raises
- Difficulty level
- Main topics covered
- Confidence in analysis (0-1)

Return as JSON.`,
            },
        ];

        try {
            const response = await llmService.chat(messages, {
                maxTokens: 2500,
                temperature: 0.3,
                model: 'gpt-4o-mini',
                responseFormat: AnalysisSchema,
            });

            const parsed = AnalysisSchema.parse(JSON.parse(response.content));

            // Store as a session for tracking
            await prisma.session.create({
                data: {
                    id: sessionId,
                    userId: this.userId,
                    query: `PDF Analysis: ${filename}`,
                    title: parsed.title,
                    status: 'completed',
                    outputs: {
                        create: {
                            taskId: 'media_analysis',
                            type: 'media_analysis',
                            content: {
                                summary: parsed.summary,
                                keyFindings: parsed.keyFindings,
                                keyTakeaways: parsed.keyTakeaways,
                                questions: parsed.questions,
                                topics: parsed.topics,
                                difficulty: parsed.difficulty,
                            },
                            confidence: parsed.confidence,
                        },
                    },
                },
            });

            // Store findings in memory
            for (const finding of parsed.keyFindings.slice(0, 5)) {
                await prisma.userMemory.create({
                    data: {
                        userId: this.userId,
                        type: 'fact',
                        content: finding,
                        importance: parsed.confidence * 0.8,
                    },
                });
            }

            return {
                sessionId,
                title: parsed.title,
                mediaType: 'pdf',
                extractedText: rawText,
                wordCount,
                summary: parsed.summary,
                keyFindings: parsed.keyFindings,
                keyTakeaways: parsed.keyTakeaways,
                questions: parsed.questions,
                difficulty: parsed.difficulty,
                topics: parsed.topics,
                confidence: parsed.confidence,
            };
        } catch (err) {
            console.error('[PDFResearcher] Analysis failed:', err);
            // Return basic analysis
            return {
                sessionId,
                title: filename,
                mediaType: 'pdf',
                extractedText: rawText,
                wordCount,
                summary: rawText.substring(0, 500),
                keyFindings: [],
                keyTakeaways: [],
                questions: [],
                difficulty: 'intermediate',
                topics: [],
                confidence: 0.3,
            };
        }
    }
}

// ─── YouTubeResearcher ─────────────────────────────────────────────────────────

export class YouTubeResearcher {
    private userId: string;

    constructor(userId: string) {
        this.userId = userId;
    }

    /**
     * Extract video ID from YouTube URL
     */
    private extractVideoId(url: string): string | null {
        const patterns = [
            /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([a-zA-Z0-9_-]{11})/,
            /^([a-zA-Z0-9_-]{11})$/,
        ];
        for (const p of patterns) {
            const match = url.match(p);
            if (match) return match[1];
        }
        return null;
    }

    /**
     * Fetch YouTube transcript via youtube-transcript API
     * Falls back to description analysis if unavailable
     */
    async analyzeVideo(youtubeUrl: string): Promise<MediaAnalysis> {
        const sessionId = `yt_${uuid()}`;
        const videoId = this.extractVideoId(youtubeUrl);

        if (!videoId) {
            throw new Error('Invalid YouTube URL');
        }

        console.log(`[YouTubeResearcher] Analyzing video: ${videoId}`);

        let transcript = '';
        let title = `YouTube Video: ${videoId}`;

        // Try to fetch transcript from youtube-transcript package
        try {
            // eslint-disable-next-line @typescript-eslint/no-var-requires
            const ytModule = require('youtube-transcript') as { YoutubeTranscript: { fetchTranscript: (id: string) => Promise<Array<{ text: string }>> } };
            const segments = await ytModule.YoutubeTranscript.fetchTranscript(videoId);
            transcript = segments.map((s) => s.text).join(' ');
            console.log(`[YouTubeResearcher] Got transcript: ${transcript.split(' ').length} words`);
        } catch {
            // Fallback: use LLM to analyze what we know about the URL
            transcript = `YouTube video URL: ${youtubeUrl}. Video ID: ${videoId}. Unable to fetch transcript directly.`;
            console.log('[YouTubeResearcher] Could not fetch transcript, using fallback analysis');
        }

        // Analyze the transcript
        const messages = [
            {
                role: 'system' as const,
                content: `You are an expert at analyzing educational video content. Extract structured knowledge from video transcripts.
If no transcript is available, acknowledge this and provide what insights you can from the URL/context.`,
            },
            {
                role: 'user' as const,
                content: `YouTube URL: ${youtubeUrl}

Transcript (may be partial):
${transcript.substring(0, 10000)}

Analyze this video and provide:
- Inferred title
- 2-3 paragraph summary  
- 5-8 key findings/claims made in the video
- 4-6 key takeaways for the viewer
- 3-5 follow-up questions for deeper study
- Difficulty level
- Main topics discussed
- Confidence in analysis (0-1, lower if no transcript)

Return as JSON.`,
            },
        ];

        try {
            const response = await llmService.chat(messages, {
                maxTokens: 2000,
                temperature: 0.3,
                model: 'gpt-4o-mini',
                responseFormat: AnalysisSchema,
            });

            const parsed = AnalysisSchema.parse(JSON.parse(response.content));

            await prisma.session.create({
                data: {
                    id: sessionId,
                    userId: this.userId,
                    query: `YouTube: ${youtubeUrl}`,
                    title: parsed.title,
                    status: 'completed',
                    outputs: {
                        create: {
                            taskId: 'media_analysis',
                            type: 'media_analysis',
                            content: {
                                summary: parsed.summary,
                                keyFindings: parsed.keyFindings,
                                keyTakeaways: parsed.keyTakeaways,
                                questions: parsed.questions,
                                topics: parsed.topics,
                                difficulty: parsed.difficulty,
                            },
                            confidence: parsed.confidence,
                        },
                    },
                },
            });

            for (const finding of parsed.keyFindings.slice(0, 5)) {
                await prisma.userMemory.create({
                    data: {
                        userId: this.userId,
                        type: 'fact',
                        content: finding,
                        importance: parsed.confidence * 0.75,
                    },
                });
            }

            return {
                sessionId,
                title: parsed.title,
                mediaType: 'youtube',
                extractedText: transcript,
                wordCount: transcript.split(' ').length,
                summary: parsed.summary,
                keyFindings: parsed.keyFindings,
                keyTakeaways: parsed.keyTakeaways,
                questions: parsed.questions,
                difficulty: parsed.difficulty,
                topics: parsed.topics,
                confidence: parsed.confidence,
            };
        } catch (err) {
            console.error('[YouTubeResearcher] Analysis failed:', err);
            throw new Error('Could not analyze YouTube video');
        }
    }
}
