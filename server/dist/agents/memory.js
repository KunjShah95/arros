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
Object.defineProperty(exports, "__esModule", { value: true });
exports.MemoryAgent = void 0;
const prisma_1 = require("../services/prisma");
const llm_1 = require("../services/llm");
const uuid_1 = require("uuid");
class MemoryAgent {
    constructor(sessionId, userId, taskId) {
        this.sessionId = sessionId;
        this.userId = userId;
        this.taskId = taskId;
    }
    storeResults(synthesisResult, query) {
        return __awaiter(this, void 0, void 0, function* () {
            const memories = [];
            const topic = this.extractTopic(query);
            if (topic) {
                yield prisma_1.prisma.userInterest.upsert({
                    where: { userId_topic: { userId: this.userId, topic } },
                    update: { lastResearchedAt: new Date(), depth: { increment: 1 } },
                    create: { userId: this.userId, topic, depth: 1, lastResearchedAt: new Date() },
                });
            }
            // Store key findings as memories with embeddings
            for (const finding of synthesisResult.keyFindings.slice(0, 5)) {
                const embedding = yield llm_1.llmService.generateEmbedding(finding);
                // Use raw SQL for vector insertion because Prisma doesn't support the vector type natively in the create API for Unsupported fields easily
                const memoryId = (0, uuid_1.v4)();
                yield prisma_1.prisma.$executeRaw `
        INSERT INTO "UserMemory" ("id", "userId", "type", "content", "importance", "embedding", "lastUsedAt", "createdAt", "updatedAt")
        VALUES (${memoryId}, ${this.userId}, 'fact', ${finding}, ${synthesisResult.confidence}, ${embedding}::vector, now(), now(), now())
      `;
                memories.push({
                    type: 'fact',
                    content: finding,
                    importance: synthesisResult.confidence,
                });
            }
            yield this.updateKnowledgeGraph(synthesisResult, query);
            yield prisma_1.prisma.agentTask.update({
                where: { id: this.taskId },
                data: { status: 'completed', output: { memoriesStored: memories.length } },
            });
        });
    }
    getRelevantMemories(query_1) {
        return __awaiter(this, arguments, void 0, function* (query, limit = 5) {
            const queryEmbedding = yield llm_1.llmService.generateEmbedding(query);
            // Semantic search using pgvector cosine distance (<=>)
            const relevantMemories = yield prisma_1.prisma.$queryRaw `
      SELECT id, type, content, importance, 
             1 - (embedding <=> ${queryEmbedding}::vector) as similarity
      FROM "UserMemory"
      WHERE "userId" = ${this.userId}
      ORDER BY similarity DESC
      LIMIT ${limit}
    `;
            return relevantMemories.map(m => ({
                id: m.id,
                type: m.type,
                content: m.content,
                importance: m.importance,
                similarity: m.similarity,
            }));
        });
    }
    getUserInterests() {
        return __awaiter(this, void 0, void 0, function* () {
            const interests = yield prisma_1.prisma.userInterest.findMany({
                where: { userId: this.userId },
                orderBy: { depth: 'desc' },
            });
            return interests.map((i) => ({ topic: i.topic, depth: i.depth }));
        });
    }
    updateKnowledgeGraph(synthesisResult, query) {
        return __awaiter(this, void 0, void 0, function* () {
            const topicNode = yield prisma_1.prisma.knowledgeNode.create({
                data: {
                    type: 'concept',
                    name: this.extractTopic(query) || 'Research Topic',
                    description: query,
                },
            });
            for (const finding of synthesisResult.keyFindings.slice(0, 5)) {
                const findingNode = yield prisma_1.prisma.knowledgeNode.create({
                    data: {
                        type: 'fact',
                        name: finding.substring(0, 100),
                        description: finding,
                    },
                });
                yield prisma_1.prisma.knowledgeEdge.create({
                    data: {
                        fromNodeId: topicNode.id,
                        toNodeId: findingNode.id,
                        relation: 'contains',
                        strength: synthesisResult.confidence,
                    },
                });
            }
        });
    }
    extractTopic(query) {
        const stopWords = ['what', 'how', 'why', 'when', 'where', 'who', 'is', 'are', 'the', 'a', 'an', 'to', 'for'];
        const words = query.toLowerCase().split(/\s+/).filter(w => !stopWords.includes(w));
        return words.slice(0, 3).join(' ') || null;
    }
}
exports.MemoryAgent = MemoryAgent;
