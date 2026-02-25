/**
 * WorkingMemory — The RAM of the AI Brain
 *
 * Implements Baddeley's Multi-Component Working Memory Model:
 *  - Central Executive: Controls attention and coordinates slave systems
 *  - Phonological Loop: Verbal/linguistic information buffer
 *  - Visuospatial Sketchpad: Structural/relational information
 *  - Episodic Buffer: Links working memory to long-term memory
 *
 * Capacity: Follows Miller's Law — 7 ± 2 active chunks
 * Forgetting: Decay over time (Ebbinghaus forgetting curve)
 * Chunking: Related items are grouped into larger units
 */

// ─── Memory Item ──────────────────────────────────────────────────────────────

export interface WorkingMemoryItem {
    key: string;
    content: string;
    importance: number;   // 0-1 priority
    timestamp: Date;
    tags: string[];
    accessCount: number;  // more access = more memorable
    decayRate: number;    // how fast it fades
}

// ─── Chunk ────────────────────────────────────────────────────────────────────

interface Chunk {
    id: string;
    items: WorkingMemoryItem[];
    label: string;
    strength: number;
}

// ─── WorkingMemory Class ──────────────────────────────────────────────────────

export class WorkingMemory {
    private sessionId: string;
    private capacity = 9; // 7 ± 2
    private buffer: Map<string, WorkingMemoryItem> = new Map();
    private chunks: Map<string, Chunk> = new Map();
    private attentionalFocus: string | null = null;

    constructor(sessionId: string) {
        this.sessionId = sessionId;
    }

    /**
     * Store a new item in working memory
     * Evicts lowest-importance items if over capacity
     */
    store(item: Omit<WorkingMemoryItem, 'accessCount' | 'decayRate'>): void {
        const fullItem: WorkingMemoryItem = {
            ...item,
            accessCount: 1,
            decayRate: 1 - item.importance, // important things decay slower
        };

        // Apply decay to existing items first
        this.applyDecay();

        // If at capacity, evict lowest-importance item
        if (this.buffer.size >= this.capacity) {
            this.evict();
        }

        this.buffer.set(item.key, fullItem);
        this.tryChunk(fullItem);
    }

    /**
     * Retrieve items from working memory relevant to a query
     * Accessing an item refreshes it (like rehearsal strengthens memory)
     */
    retrieve(query: string): WorkingMemoryItem[] {
        const queryWords = new Set(query.toLowerCase().split(/\s+/));
        const relevant: Array<{ item: WorkingMemoryItem; score: number }> = [];

        for (const item of this.buffer.values()) {
            const itemWords = new Set(item.content.toLowerCase().split(/\s+/));
            item.tags.forEach(t => itemWords.add(t.toLowerCase()));

            const overlap = [...queryWords].filter(w => itemWords.has(w)).length;
            if (overlap > 0) {
                relevant.push({ item, score: overlap / queryWords.size });
                item.accessCount++;
                item.importance = Math.min(1, item.importance + 0.05); // rehearsal effect
            }
        }

        return relevant
            .sort((a, b) => b.score - a.score)
            .slice(0, 5)
            .map(r => r.item);
    }

    /**
     * Set attentional focus — only one thing can be in the spotlight at a time
     */
    focus(key: string): void {
        this.attentionalFocus = key;
        const item = this.buffer.get(key);
        if (item) {
            item.importance = Math.min(1, item.importance + 0.2);
            item.accessCount++;
        }
    }

    /**
     * Peek at full buffer (for introspection/self-awareness)
     */
    peek(): WorkingMemoryItem[] {
        return Array.from(this.buffer.values()).sort((a, b) => b.importance - a.importance);
    }

    /**
     * Get current memory load (0-1)
     */
    getLoad(): number {
        return this.buffer.size / this.capacity;
    }

    /**
     * Consolidate working memory — transfer important items to long-term, clear the rest
     * Called during cognitive rest / end of session
     */
    consolidate(): WorkingMemoryItem[] {
        const toConsolidate = Array.from(this.buffer.values())
            .filter(item => item.importance > 0.7 && item.accessCount > 2);

        // Clear full buffer (like waking from sleep clears working memory)
        this.buffer.clear();
        this.chunks.clear();
        return toConsolidate;
    }

    /**
     * Clear everything (session end)
     */
    clear(): void {
        this.buffer.clear();
        this.chunks.clear();
        this.attentionalFocus = null;
    }

    /**
     * Get the number of distinct chunks formed (measure of cognitive organization)
     */
    getChunkCount(): number {
        return this.chunks.size;
    }

    // ─── Private Methods ─────────────────────────────────────────────────────────

    /**
     * Apply forgetting: items decay over time (Ebbinghaus curve approximation)
     */
    private applyDecay(): void {
        const now = Date.now();
        for (const [key, item] of this.buffer.entries()) {
            const ageMs = now - item.timestamp.getTime();
            const ageMins = ageMs / 60000;

            // Decay formula: importance = importance * e^(-rate * age)
            const decay = Math.exp(-item.decayRate * ageMins * 0.1);
            item.importance *= decay;

            // Prune items that have faded completely
            if (item.importance < 0.05 && key !== this.attentionalFocus) {
                this.buffer.delete(key);
            }
        }
    }

    /**
     * Evict the least important non-focused item
     */
    private evict(): void {
        let minImportance = Infinity;
        let evictKey: string | null = null;

        for (const [key, item] of this.buffer.entries()) {
            if (key !== this.attentionalFocus && item.importance < minImportance) {
                minImportance = item.importance;
                evictKey = key;
            }
        }

        if (evictKey) this.buffer.delete(evictKey);
    }

    /**
     * Chunking: group related items together (Miller's chunking mechanism)
     */
    private tryChunk(newItem: WorkingMemoryItem): void {
        for (const tag of newItem.tags) {
            // Look for existing items with the same tag
            const relatedItems = Array.from(this.buffer.values())
                .filter(item => item !== newItem && item.tags.includes(tag));

            if (relatedItems.length >= 2) {
                const chunkId = `chunk_${tag}`;
                if (!this.chunks.has(chunkId)) {
                    this.chunks.set(chunkId, {
                        id: chunkId,
                        items: [newItem, ...relatedItems],
                        label: tag,
                        strength: relatedItems.length * 0.2,
                    });
                } else {
                    const chunk = this.chunks.get(chunkId)!;
                    if (!chunk.items.find(i => i.key === newItem.key)) {
                        chunk.items.push(newItem);
                        chunk.strength = Math.min(1, chunk.strength + 0.1);
                    }
                }
            }
        }
    }
}
