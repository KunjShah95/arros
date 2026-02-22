import type { MemoryItem, KnowledgeGraphItem } from '../../types';
import { prisma } from '../../services/prisma';
import { llmService } from '../../services/llm';
import { v4 as uuid } from 'uuid';

export interface ShortTermMemoryItem {
  id: string;
  type: 'context' | 'subtask' | 'reasoning' | 'source';
  content: string;
  timestamp: number;
  sessionId: string;
}

export class ShortTermMemoryAgent {
  private memory: Map<string, ShortTermMemoryItem[]> = new Map();
  private maxItems: number = 50;

  store(sessionId: string, type: ShortTermMemoryItem['type'], content: string): string {
    const id = uuid();
    const item: ShortTermMemoryItem = {
      id,
      type,
      content,
      timestamp: Date.now(),
      sessionId,
    };

    if (!this.memory.has(sessionId)) {
      this.memory.set(sessionId, []);
    }

    const sessionMemory = this.memory.get(sessionId)!;
    sessionMemory.push(item);

    if (sessionMemory.length > this.maxItems) {
      sessionMemory.shift();
    }

    return id;
  }

  retrieve(sessionId: string, type?: ShortTermMemoryItem['type']): ShortTermMemoryItem[] {
    const items = this.memory.get(sessionId) || [];
    
    if (type) {
      return items.filter(item => item.type === type);
    }
    
    return items;
  }

  getRecent(sessionId: string, count: number = 10): ShortTermMemoryItem[] {
    const items = this.memory.get(sessionId) || [];
    return items.slice(-count);
  }

  clear(sessionId: string): void {
    this.memory.delete(sessionId);
  }

  getContext(sessionId: string): string {
    const items = this.retrieve(sessionId);
    return items
      .sort((a, b) => b.timestamp - a.timestamp)
      .slice(0, 5)
      .map(item => `[${item.type}] ${item.content}`)
      .join('\n');
  }
}

export class LongTermMemoryAgent {
  private userId: string;

  constructor(userId: string) {
    this.userId = userId;
  }

  async store(
    type: MemoryItem['type'],
    content: string,
    importance: number = 0.5
  ): Promise<string> {
    const embedding = await llmService.generateEmbedding(content);
    const memoryId = uuid();

    await prisma.$executeRaw`
      INSERT INTO "UserMemory" ("id", "userId", "type", "content", "importance", "embedding", "lastUsedAt", "createdAt", "updatedAt")
      VALUES (${memoryId}, ${this.userId}, ${type}, ${content}, ${importance}, ${embedding}::vector, now(), now(), now())
    `;

    return memoryId;
  }

  async retrieve(query: string, limit: number = 5): Promise<MemoryItem[]> {
    const queryEmbedding = await llmService.generateEmbedding(query);

    const results = await prisma.$queryRaw<any[]>`
      SELECT id, type, content, importance, 
             1 - (embedding <=> ${queryEmbedding}::vector) as similarity
      FROM "UserMemory"
      WHERE "userId" = ${this.userId}
      ORDER BY similarity DESC
      LIMIT ${limit}
    `;

    return results.map(r => ({
      id: r.id,
      type: r.type as MemoryItem['type'],
      content: r.content,
      importance: r.importance,
    }));
  }

  async getInterests(): Promise<Array<{ topic: string; depth: number }>> {
    const interests = await prisma.userInterest.findMany({
      where: { userId: this.userId },
      orderBy: { depth: 'desc' },
    });

    return interests.map(i => ({ topic: i.topic, depth: i.depth }));
  }

  async updateInterest(topic: string): Promise<void> {
    await prisma.userInterest.upsert({
      where: { userId_topic: { userId: this.userId, topic } },
      update: { 
        lastResearchedAt: new Date(),
        depth: { increment: 1 },
      },
      create: { 
        userId: this.userId, 
        topic, 
        depth: 1,
        lastResearchedAt: new Date(),
      },
    });
  }

  async compress(memories: MemoryItem[]): Promise<string> {
    if (memories.length === 0) return '';

    const content = memories.map(m => `- ${m.content}`).join('\n');
    
    const messages = [
      {
        role: 'system' as const,
        content: 'Compress multiple memory items into a concise summary. Preserve key information.',
      },
      {
        role: 'user' as const,
        content: `Compress these memories into a summary:\n${content}`,
      },
    ];

    const response = await llmService.chat(messages, {
      maxTokens: 500,
      temperature: 0.3,
      model: 'gpt-4o-mini',
    });

    return response.content;
  }
}

export class KnowledgeGraphAgent {
  private userId: string;

  constructor(userId: string) {
    this.userId = userId;
  }

  async addEntity(
    name: string,
    type: KnowledgeGraphItem['type'],
    description?: string
  ): Promise<string> {
    const node = await prisma.knowledgeNode.create({
      data: {
        type,
        name,
        description,
      },
    });

    return node.id;
  }

  async addRelation(
    fromName: string,
    toName: string,
    relation: string,
    strength: number = 1.0
  ): Promise<void> {
    const fromNode = await prisma.knowledgeNode.findFirst({
      where: { name: { contains: fromName, mode: 'insensitive' } },
    });

    const toNode = await prisma.knowledgeNode.findFirst({
      where: { name: { contains: toName, mode: 'insensitive' } },
    });

    if (fromNode && toNode) {
      await prisma.knowledgeEdge.upsert({
        where: {
          fromNodeId_toNodeId_relation: {
            fromNodeId: fromNode.id,
            toNodeId: toNode.id,
            relation,
          },
        },
        update: { strength },
        create: {
          fromNodeId: fromNode.id,
          toNodeId: toNode.id,
          relation,
          strength,
        },
      });
    }
  }

  async getGraph(depth: number = 2): Promise<KnowledgeGraphItem[]> {
    const nodes = await prisma.knowledgeNode.findMany({
      include: {
        edgesFrom: true,
        edgesTo: true,
      },
      take: 100,
    });

    return nodes.map(node => ({
      id: node.id,
      type: node.type as KnowledgeGraphItem['type'],
      name: node.name,
      description: node.description || undefined,
      relations: [
        ...node.edgesFrom.map(e => ({ target: e.toNodeId, relation: e.relation, strength: e.strength })),
        ...node.edgesTo.map(e => ({ target: e.fromNodeId, relation: e.relation, strength: e.strength })),
      ],
    }));
  }

  async findConnected(entityName: string): Promise<KnowledgeGraphItem[]> {
    const entity = await prisma.knowledgeNode.findFirst({
      where: { name: { contains: entityName, mode: 'insensitive' } },
      include: {
        edgesFrom: { include: { toNode: true } },
        edgesTo: { include: { fromNode: true } },
      },
    });

    if (!entity) return [];

    const connected: KnowledgeGraphItem[] = [];

    for (const edge of entity.edgesFrom) {
      connected.push({
        id: edge.toNode.id,
        type: edge.toNode.type as KnowledgeGraphItem['type'],
        name: edge.toNode.name,
        description: edge.toNode.description || undefined,
        relations: [{ target: entity.id, relation: edge.relation, strength: edge.strength }],
      });
    }

    for (const edge of entity.edgesTo) {
      connected.push({
        id: edge.fromNode.id,
        type: edge.fromNode.type as KnowledgeGraphItem['type'],
        name: edge.fromNode.name,
        description: edge.fromNode.description || undefined,
        relations: [{ target: entity.id, relation: edge.relation, strength: edge.strength }],
      });
    }

    return connected;
  }

  async buildFromResearch(topic: string, keyFindings: string[]): Promise<void> {
    const topicNode = await prisma.knowledgeNode.create({
      data: {
        type: 'concept',
        name: topic,
        description: `Research topic: ${topic}`,
      },
    });

    for (const finding of keyFindings.slice(0, 5)) {
      const findingNode = await prisma.knowledgeNode.create({
        data: {
          type: 'fact',
          name: finding.substring(0, 100),
          description: finding,
        },
      });

      await prisma.knowledgeEdge.create({
        data: {
          fromNodeId: topicNode.id,
          toNodeId: findingNode.id,
          relation: 'contains',
          strength: 1.0,
        },
      });
    }
  }
}

export class MemoryFleet {
  private userId: string;
  private sessionId: string;
  private shortTerm: ShortTermMemoryAgent;

  constructor(userId: string, sessionId: string) {
    this.userId = userId;
    this.sessionId = sessionId;
    this.shortTerm = new ShortTermMemoryAgent();
  }

  storeContext(content: string): void {
    this.shortTerm.store(this.sessionId, 'context', content);
  }

  storeSubtask(subtask: string): void {
    this.shortTerm.store(this.sessionId, 'subtask', subtask);
  }

  storeReasoning(reasoning: string): void {
    this.shortTerm.store(this.sessionId, 'reasoning', reasoning);
  }

  storeSource(source: string): void {
    this.shortTerm.store(this.sessionId, 'source', source);
  }

  getContext(): string {
    return this.shortTerm.getContext(this.sessionId);
  }

  async persistToLongTerm(type: MemoryItem['type'], content: string): Promise<string> {
    const longTerm = new LongTermMemoryAgent(this.userId);
    return longTerm.store(type, content);
  }

  async updateInterest(topic: string): Promise<void> {
    const longTerm = new LongTermMemoryAgent(this.userId);
    await longTerm.updateInterest(topic);
  }

  async buildKnowledgeGraph(topic: string, findings: string[]): Promise<void> {
    const kg = new KnowledgeGraphAgent(this.userId);
    await kg.buildFromResearch(topic, findings);
  }

  clearSession(): void {
    this.shortTerm.clear(this.sessionId);
  }

  async retrieveMemory(query: string, limit: number = 5): Promise<MemoryItem[]> {
    const longTerm = new LongTermMemoryAgent(this.userId);
    return longTerm.retrieve(query, limit);
  }
}
