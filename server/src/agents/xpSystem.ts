/**
 * XPSystem — Gamification Layer
 *
 * Tracks user XP, levels, streaks, and achievements.
 * XP is earned by:
 *  - Research sessions (+50 XP)
 *  - Flashcard reviews (+5 XP each)
 *  - Perfect recall (quality=5) (+10 bonus XP)
 *  - Streak maintenance (+25 XP/day)
 *  - Memory consolidation (sleep) (+30 XP)
 *  - Uploading PDFs/videos (+40 XP)
 *  - Night research discoveries (+60 XP)
 */

import { prisma } from '../services/prisma';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface UserXP {
    userId: string;
    totalXP: number;
    level: number;
    levelTitle: string;
    xpToNextLevel: number;
    xpProgress: number; // 0-1 within current level
    streakDays: number;
    longestStreak: number;
    achievements: Achievement[];
    weeklyXP: number;
    allTimeRank?: number;
}

export interface Achievement {
    id: string;
    title: string;
    description: string;
    icon: string;
    earnedAt: Date;
    xpBonus: number;
}

// ─── Level thresholds and titles ──────────────────────────────────────────────

const LEVELS = [
    { min: 0, max: 100, title: 'Apprentice Scholar', icon: '📖' },
    { min: 100, max: 300, title: 'Curious Mind', icon: '🔍' },
    { min: 300, max: 600, title: 'Knowledge Seeker', icon: '🧭' },
    { min: 600, max: 1000, title: 'Deep Thinker', icon: '💭' },
    { min: 1000, max: 1500, title: 'Research Associate', icon: '🔬' },
    { min: 1500, max: 2200, title: 'Scholar', icon: '🎓' },
    { min: 2200, max: 3000, title: 'Analyst', icon: '📊' },
    { min: 3000, max: 4000, title: 'Synthesist', icon: '⚗️' },
    { min: 4000, max: 5500, title: 'Polymath', icon: '🌐' },
    { min: 5500, max: 7500, title: 'Sage', icon: '🦉' },
    { min: 7500, max: Infinity, title: 'Luminary', icon: '✨' },
];

// ─── Achievement definitions ───────────────────────────────────────────────────

const ACHIEVEMENT_DEFS = [
    { id: 'first_research', title: 'First Steps', description: 'Complete your first research', icon: '🚀', xpBonus: 25 },
    { id: 'ten_research', title: 'Researcher', description: 'Complete 10 research sessions', icon: '🔬', xpBonus: 100 },
    { id: 'fifty_research', title: 'Polymath', description: 'Complete 50 research sessions', icon: '🌐', xpBonus: 500 },
    { id: 'first_flashcard', title: 'Flash of Insight', description: 'Review your first flashcard', icon: '⚡', xpBonus: 10 },
    { id: 'hundred_flashcards', title: 'Memory Palace', description: 'Review 100 flashcards', icon: '🏛️', xpBonus: 200 },
    { id: 'insomniac', title: 'Insomniac', description: 'Use Brain Sleep 10 times', icon: '🌙', xpBonus: 150 },
    { id: 'streak_7', title: 'Week Warrior', description: '7-day study streak', icon: '🔥', xpBonus: 70 },
    { id: 'streak_30', title: 'Iron Mind', description: '30-day study streak', icon: '💎', xpBonus: 300 },
    { id: 'pdf_uploader', title: 'Document Devourer', description: 'Upload 5 PDFs for research', icon: '📄', xpBonus: 100 },
    { id: 'youtube_scholar', title: 'Video Scholar', description: 'Research 5 YouTube videos', icon: '▶️', xpBonus: 100 },
    { id: 'skeptic', title: 'The Skeptic', description: 'Run 20 sessions with critic mode', icon: '🧐', xpBonus: 150 },
    { id: 'night_owl', title: 'Night Owl', description: 'Find 3 morning digests', icon: '🦉', xpBonus: 75 },
    { id: 'curious_mind', title: 'Perpetually Curious', description: 'Open 50 questions in curiosity engine', icon: '❓', xpBonus: 100 },
    { id: 'domain_master', title: 'Domain Master', description: 'Research 5 different domains', icon: '🗺️', xpBonus: 200 },
    { id: 'perfect_recall', title: 'Photographic Memory', description: 'Get quality=5 on 25 flashcards', icon: '🧠', xpBonus: 125 },
];

// ─── XPSystem Class ────────────────────────────────────────────────────────────

export class XPSystem {
    private userId: string;

    constructor(userId: string) {
        this.userId = userId;
    }

    /**
     * Award XP for an action
     */
    async awardXP(
        action: 'research' | 'flashcard_review' | 'perfect_recall' | 'daily_streak' |
            'brain_sleep' | 'pdf_upload' | 'youtube_research' | 'night_discovery' | 'quiz_complete' | 'voice_command',
        metadata?: Record<string, any>
    ): Promise<{ xpEarned: number; newAchievements: Achievement[]; levelUp: boolean; newLevel?: number }> {
        const XP_VALUES: Record<string, number> = {
            research: 50,
            flashcard_review: 5,
            perfect_recall: 15,
            daily_streak: 25,
            brain_sleep: 30,
            pdf_upload: 40,
            youtube_research: 40,
            night_discovery: 60,
            quiz_complete: 35,
            voice_command: 10,
        };

        const xpEarned = XP_VALUES[action] ?? 10;

        // Get current XP record
        const record = await this.getOrCreateRecord();
        const before = JSON.parse(record.content);
        const oldLevel = this.computeLevel(before.totalXP).level;

        // Update XP
        before.totalXP = (before.totalXP || 0) + xpEarned;
        before.weeklyXP = (before.weeklyXP || 0) + xpEarned;
        before.actionsLog = before.actionsLog || [];
        before.actionsLog.push({ action, xp: xpEarned, at: new Date().toISOString(), ...metadata });

        // Update streak
        const today = new Date().toISOString().split('T')[0];
        if (before.lastActiveDay !== today) {
            const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];
            if (before.lastActiveDay === yesterday) {
                before.streakDays = (before.streakDays || 0) + 1;
            } else if (before.lastActiveDay !== today) {
                before.streakDays = 1;
            }
            before.lastActiveDay = today;
            before.longestStreak = Math.max(before.longestStreak || 0, before.streakDays);
        }

        // Check achievements
        const newAchievements = await this.checkAchievements(before);
        if (newAchievements.length > 0) {
            before.achievements = [...(before.achievements || []), ...newAchievements];
            before.totalXP += newAchievements.reduce((s, a) => s + a.xpBonus, 0);
        }

        const newLevel = this.computeLevel(before.totalXP).level;
        const levelUp = newLevel > oldLevel;

        // Save
        await prisma.userMemory.update({
            where: { id: record.id },
            data: { content: JSON.stringify(before), importance: 1.0 },
        });

        return { xpEarned, newAchievements, levelUp, newLevel: levelUp ? newLevel : undefined };
    }

    /**
     * Get full XP profile for a user
     */
    async getProfile(): Promise<UserXP> {
        const record = await this.getOrCreateRecord();
        const data = JSON.parse(record.content);

        const { level, title, xpToNextLevel, xpProgress } = this.computeLevel(data.totalXP || 0);

        return {
            userId: this.userId,
            totalXP: data.totalXP || 0,
            level,
            levelTitle: title,
            xpToNextLevel,
            xpProgress,
            streakDays: data.streakDays || 0,
            longestStreak: data.longestStreak || 0,
            achievements: (data.achievements || []) as Achievement[],
            weeklyXP: data.weeklyXP || 0,
        };
    }

    /**
     * Compute level from total XP
     */
    private computeLevel(totalXP: number): {
        level: number; title: string; icon: string;
        xpToNextLevel: number; xpProgress: number;
    } {
        let levelIndex = 0;
        for (let i = 0; i < LEVELS.length; i++) {
            if (totalXP >= LEVELS[i].min) levelIndex = i;
        }

        const current = LEVELS[levelIndex];
        const next = LEVELS[Math.min(levelIndex + 1, LEVELS.length - 1)];
        const xpInLevel = totalXP - current.min;
        const levelRange = next.min - current.min;
        const xpProgress = levelRange > 0 ? Math.min(1, xpInLevel / levelRange) : 1;
        const xpToNextLevel = Math.max(0, next.min - totalXP);

        return {
            level: levelIndex + 1,
            title: current.title,
            icon: current.icon,
            xpToNextLevel,
            xpProgress,
        };
    }

    /**
     * Check and return newly earned achievements
     */
    private async checkAchievements(data: any): Promise<Achievement[]> {
        const existing = new Set((data.achievements || []).map((a: any) => a.id));
        const newOnes: Achievement[] = [];
        const logs: any[] = data.actionsLog || [];

        const count = (action: string) => logs.filter((l: any) => l.action === action).length;

        const checks: Array<[string, boolean]> = [
            ['first_research', count('research') >= 1],
            ['ten_research', count('research') >= 10],
            ['fifty_research', count('research') >= 50],
            ['first_flashcard', count('flashcard_review') >= 1],
            ['hundred_flashcards', count('flashcard_review') >= 100],
            ['insomniac', count('brain_sleep') >= 10],
            ['streak_7', (data.streakDays || 0) >= 7],
            ['streak_30', (data.streakDays || 0) >= 30],
            ['pdf_uploader', count('pdf_upload') >= 5],
            ['youtube_scholar', count('youtube_research') >= 5],
            ['night_owl', count('night_discovery') >= 3],
            ['perfect_recall', count('perfect_recall') >= 25],
        ];

        for (const [id, earned] of checks) {
            if (earned && !existing.has(id)) {
                const def = ACHIEVEMENT_DEFS.find(d => d.id === id);
                if (def) {
                    newOnes.push({ ...def, earnedAt: new Date() });
                }
            }
        }

        return newOnes;
    }

    private async getOrCreateRecord() {
        const existing = await prisma.userMemory.findFirst({
            where: { userId: this.userId, type: 'strategy', content: { contains: 'xp_profile' } },
        });

        if (existing) return existing;

        return prisma.userMemory.create({
            data: {
                userId: this.userId,
                type: 'strategy',
                content: JSON.stringify({
                    kind: 'xp_profile',
                    totalXP: 0,
                    streakDays: 0,
                    longestStreak: 0,
                    weeklyXP: 0,
                    achievements: [],
                    actionsLog: [],
                    lastActiveDay: '',
                }),
                importance: 1.0,
            },
        });
    }
}
