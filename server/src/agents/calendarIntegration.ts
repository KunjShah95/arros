import { z } from 'zod';
import { llmService } from '../services/llm';
import { prisma } from '../services/prisma';
import { v4 as uuid } from 'uuid';

export interface CalendarEvent {
  id: string;
  title: string;
  description?: string;
  startTime: Date;
  endTime: Date;
  location?: string;
  type: 'study' | 'exam' | 'revision' | 'break' | 'reminder';
  topic?: string;
  recurring?: boolean;
  reminder?: number;
}

export interface CalendarSync {
  id: string;
  userId: string;
  provider: 'google' | 'outlook' | 'apple';
  connectedAt: Date;
  lastSync: Date;
  calendarId?: string;
}

export interface StudySchedule {
  id: string;
  userId: string;
  events: CalendarEvent[];
  generatedAt: Date;
  examDate?: Date;
}

export class CalendarIntegrationAgent {
  private userId: string;
  private sessionId: string;

  constructor(userId: string, sessionId?: string) {
    this.userId = userId;
    this.sessionId = sessionId || uuid();
  }

  async generateStudySchedule(
    examDate: Date,
    topics: Array<{ name: string; weight: number; hoursNeeded: number }>,
    dailyStudyHours: number = 2,
    preferredHours?: { start: number; end: number }
  ): Promise<StudySchedule> {
    const daysUntilExam = Math.ceil((examDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24));
    const totalHoursNeeded = topics.reduce((sum, t) => sum + t.hoursNeeded, 0);
    const availableDays = Math.min(daysUntilExam, Math.floor(totalHoursNeeded / dailyStudyHours));

    const events: CalendarEvent[] = [];
    const current = new Date();
    const studyHours = preferredHours || { start: 9, end: 21 };

    const sortedTopics = [...topics].sort((a, b) => b.weight - a.weight);
    
    let hoursAssigned = 0;
    let dayIndex = 0;

    while (hoursAssigned < totalHoursNeeded && dayIndex < availableDays) {
      const date = new Date(current);
      date.setDate(date.getDate() + dayIndex);

      if (date.getDay() === 0 || date.getDay() === 6) {
        dayIndex++;
        continue;
      }

      const topic = sortedTopics.find(t => {
        const assigned = events.filter(e => e.topic === t.name).length * 1;
        return assigned < t.hoursNeeded;
      });

      if (!topic) {
        dayIndex++;
        continue;
      }

      const startHour = studyHours.start + (dayIndex % (studyHours.end - studyHours.start - 1));
      const startTime = new Date(date);
      startTime.setHours(startHour, 0, 0, 0);

      const endTime = new Date(startTime);
      endTime.setMinutes(dailyStudyHours * 60);

      events.push({
        id: uuid(),
        title: `Study: ${topic.name}`,
        description: `Study session for ${topic.name}`,
        startTime,
        endTime,
        type: 'study',
        topic: topic.name,
        reminder: 15,
      });

      hoursAssigned += 1;
      dayIndex++;
    }

    events.push({
      id: uuid(),
      title: 'Exam Day',
      description: 'Final examination',
      startTime: examDate,
      endTime: new Date(examDate.getTime() + 3 * 60 * 60 * 1000),
      type: 'exam',
      reminder: 60 * 24,
    });

    const schedule: StudySchedule = {
      id: uuid(),
      userId: this.userId,
      events,
      generatedAt: new Date(),
      examDate,
    };

    await this.saveSchedule(schedule);
    return schedule;
  }

  async addToCalendar(event: CalendarEvent): Promise<void> {
    await prisma.agentOutput.create({
      data: {
        sessionId: this.sessionId,
        taskId: uuid(),
        type: 'calendar_event' as any,
        content: {
          userId: this.userId,
          ...event,
        } as unknown as object,
        confidence: 1,
      },
    });
  }

  async getUpcomingEvents(days: number = 7): Promise<CalendarEvent[]> {
    const outputs = await prisma.agentOutput.findMany({
      where: { type: 'calendar_event' as any },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });

    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() + days);

    return outputs
      .map(o => o.content as any)
      .filter(e => e.userId === this.userId && new Date(e.startTime) <= cutoff)
      .sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime());
  }

  async syncWithGoogle(): Promise<{ authUrl: string }> {
    const clientId = process.env.GOOGLE_CLIENT_ID;
    const redirectUri = process.env.GOOGLE_REDIRECT_URI;

    const scopes = [
      'https://www.googleapis.com/auth/calendar',
      'https://www.googleapis.com/auth/calendar.events',
    ];

    const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${clientId}&redirect_uri=${redirectUri}&response_type=code&scope=${scopes.join(' ')}&access_type=offline`;

    return { authUrl };
  }

  async syncWithOutlook(): Promise<{ authUrl: string }> {
    const clientId = process.env.OUTLOOK_CLIENT_ID;
    const redirectUri = process.env.OUTLOOK_REDIRECT_URI;

    const scopes = ['Calendars.ReadWrite', 'User.Read'];

    const authUrl = `https://login.microsoftonline.com/common/oauth2/v2.0/authorize?client_id=${clientId}&redirect_uri=${redirectUri}&response_type=code&scope=${scopes.join(' ')}`;

    return { authUrl };
  }

  async exportToICS(schedule: StudySchedule): Promise<string> {
    let ics = 'BEGIN:VCALENDAR\nVERSION:2.0\nPRODID:-//LearningOS//Study Schedule//EN\n';

    for (const event of schedule.events) {
      const start = new Date(event.startTime).toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
      const end = new Date(event.endTime).toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';

      ics += 'BEGIN:VEVENT\n';
      ics += `UID:${event.id}@learningos\n`;
      ics += `DTSTART:${start}\n`;
      ics += `DTEND:${end}\n`;
      ics += `SUMMARY:${event.title}\n`;
      if (event.description) ics += `DESCRIPTION:${event.description}\n`;
      if (event.location) ics += `LOCATION:${event.location}\n`;
      ics += 'END:VEVENT\n';
    }

    ics += 'END:VCALENDAR';
    return ics;
  }

  private async saveSchedule(schedule: StudySchedule): Promise<void> {
    await prisma.agentOutput.create({
      data: {
        sessionId: this.sessionId,
        taskId: uuid(),
        type: 'study_schedule' as any,
        content: schedule as unknown as object,
        confidence: 1,
      },
    });
  }
}
