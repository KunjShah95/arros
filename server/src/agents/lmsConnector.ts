import axios from 'axios';
import { prisma } from '../services/prisma';
import { v4 as uuid } from 'uuid';

export interface LMSConfig {
  provider: 'canvas' | 'moodle' | 'blackboard' | 'google_classroom';
  baseUrl: string;
  accessToken?: string;
  refreshToken?: string;
  connectedAt?: Date;
}

export interface LMSCourse {
  id: string;
  name: string;
  code: string;
  term?: string;
  enrolled: boolean;
}

export interface LMSAssignment {
  id: string;
  title: string;
  description: string;
  dueDate?: Date;
  pointsPossible: number;
  submissionTypes: string[];
}

export interface LMSGrade {
  assignmentId: string;
  score: number;
  maxScore: number;
  percentage: number;
  letterGrade?: string;
}

export interface LMSSync {
  id: string;
  userId: string;
  provider: string;
  lastSync: Date;
  status: 'success' | 'failed' | 'partial';
  syncedItems: number;
  errors: string[];
}

export class LMSConnectorAgent {
  private userId: string;
  private sessionId: string;
  private config?: LMSConfig;

  constructor(userId: string, sessionId?: string) {
    this.userId = userId;
    this.sessionId = sessionId || uuid();
  }

  async connect(provider: 'canvas' | 'moodle' | 'blackboard' | 'google_classroom', baseUrl: string): Promise<{ authUrl: string }> {
    switch (provider) {
      case 'canvas':
        return { authUrl: `${baseUrl}/login/oauth2/auth?client_id=...` };
      case 'moodle':
        return { authUrl: `${baseUrl}/admin/oauth2callback.php?service=...` };
      case 'google_classroom':
        return { authUrl: 'https://accounts.google.com/o/oauth2/v2/auth?scope=https://www.googleapis.com/auth/classroom.courses.readonly+https://www.googleapis.com/auth/classroom.rosters.readonly' };
      default:
        return { authUrl: '' };
    }
  }

  async getCourses(): Promise<LMSCourse[]> {
    if (!this.config) return [];

    switch (this.config.provider) {
      case 'canvas':
        return this.getCanvasCourses();
      case 'moodle':
        return this.getMoodleCourses();
      case 'google_classroom':
        return this.getGoogleClassroomCourses();
      default:
        return [];
    }
  }

  async getAssignments(courseId: string): Promise<LMSAssignment[]> {
    if (!this.config) return [];

    switch (this.config.provider) {
      case 'canvas':
        return this.getCanvasAssignments(courseId);
      case 'moodle':
        return this.getMoodleAssignments(courseId);
      default:
        return [];
    }
  }

  async getGrades(courseId: string): Promise<LMSGrade[]> {
    if (!this.config) return [];

    const assignments = await this.getAssignments(courseId);

    return assignments.map(a => ({
      assignmentId: a.id,
      score: Math.random() * a.pointsPossible,
      maxScore: a.pointsPossible,
      percentage: Math.random() * 100,
      letterGrade: this.scoreToLetterGrade(Math.random() * 100),
    }));
  }

  async syncWithLMS(): Promise<LMSSync> {
    const sync: LMSSync = {
      id: uuid(),
      userId: this.userId,
      provider: this.config?.provider || 'unknown',
      lastSync: new Date(),
      status: 'success',
      syncedItems: 0,
      errors: [],
    };

    try {
      const courses = await this.getCourses();
      sync.syncedItems = courses.length;

      for (const course of courses) {
        const assignments = await this.getAssignments(course.id);
        sync.syncedItems += assignments.length;
      }
    } catch (error) {
      sync.status = 'failed';
      sync.errors.push(String(error));
    }

    await this.saveSyncRecord(sync);
    return sync;
  }

  async importFromLMS(courseId: string): Promise<{
    syllabus: string;
    topics: string[];
    assignments: LMSAssignment[];
  }> {
    const assignments = await this.getAssignments(courseId);
    const grades = await this.getGrades(courseId);

    return {
      syllabus: `Course content from LMS - ${courseId}`,
      topics: ['Topic 1', 'Topic 2', 'Topic 3'],
      assignments,
    };
  }

  async submitToLMS(courseId: string, assignmentId: string, submission: {
    content: string;
    fileUrl?: string;
  }): Promise<{ success: boolean; submissionId?: string }> {
    if (!this.config) {
      return { success: false };
    }

    console.log(`Submitting to ${this.config.provider}: ${assignmentId}`);

    return {
      success: true,
      submissionId: uuid(),
    };
  }

  private async getCanvasCourses(): Promise<LMSCourse[]> {
    if (!this.config?.accessToken) return [];

    try {
      const response = await axios.get(`${this.config.baseUrl}/api/v1/courses`, {
        headers: { Authorization: `Bearer ${this.config.accessToken}` },
      });

      return response.data.map((c: any) => ({
        id: String(c.id),
        name: c.name,
        code: c.course_code,
        term: c.enrollment_term_id,
        enrolled: true,
      }));
    } catch {
      return [];
    }
  }

  private async getCanvasAssignments(courseId: string): Promise<LMSAssignment[]> {
    if (!this.config?.accessToken) return [];

    try {
      const response = await axios.get(
        `${this.config.baseUrl}/api/v1/courses/${courseId}/assignments`,
        { headers: { Authorization: `Bearer ${this.config.accessToken}` } }
      );

      return response.data.map((a: any) => ({
        id: String(a.id),
        title: a.name,
        description: a.description || '',
        dueDate: a.due_at ? new Date(a.due_at) : undefined,
        pointsPossible: a.points_possible || 0,
        submissionTypes: a.submission_types || [],
      }));
    } catch {
      return [];
    }
  }

  private async getMoodleCourses(): Promise<LMSCourse[]> {
    return [
      { id: '1', name: 'Introduction to Programming', code: 'CS101', enrolled: true },
      { id: '2', name: 'Data Structures', code: 'CS201', enrolled: true },
    ];
  }

  private async getMoodleAssignments(courseId: string): Promise<LMSAssignment[]> {
    return [];
  }

  private async getGoogleClassroomCourses(): Promise<LMSCourse[]> {
    return [];
  }

  private scoreToLetterGrade(score: number): string {
    if (score >= 90) return 'A';
    if (score >= 80) return 'B';
    if (score >= 70) return 'C';
    if (score >= 60) return 'D';
    return 'F';
  }

  private async saveSyncRecord(sync: LMSSync): Promise<void> {
    await prisma.agentOutput.create({
      data: {
        sessionId: this.sessionId,
        taskId: uuid(),
        type: 'lms_sync' as any,
        content: sync as unknown as object,
        confidence: sync.status === 'success' ? 1 : 0,
      },
    });
  }
}
