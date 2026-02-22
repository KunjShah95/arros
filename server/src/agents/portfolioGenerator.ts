import { z } from 'zod';
import { llmService } from '../services/llm';
import { prisma } from '../services/prisma';
import { v4 as uuid } from 'uuid';

export interface PortfolioProject {
  id: string;
  name: string;
  description: string;
  technologies: string[];
  role: string;
  duration: string;
  highlights: string[];
  links: {
    demo?: string;
    github?: string;
    documentation?: string;
  };
  tags: string[];
}

export interface Portfolio {
  id: string;
  userId: string;
  title: string;
  subtitle: string;
  about: string;
  projects: PortfolioProject[];
  skills: Array<{ name: string; level: number }>;
  education: Array<{
    institution: string;
    degree: string;
    year: string;
    gpa?: string;
  }>;
  certifications: Array<{
    name: string;
    issuer: string;
    date: string;
    credentialId?: string;
  }>;
  contact: {
    email?: string;
    linkedin?: string;
    github?: string;
    website?: string;
  };
  generatedAt: Date;
  template: 'minimal' | 'creative' | 'professional';
}

export interface ProjectAnalysis {
  relevance: number;
  technicalComplexity: number;
  impact: number;
  recommendations: string[];
}

export class PortfolioGeneratorAgent {
  private userId: string;
  private sessionId: string;

  constructor(userId: string, sessionId?: string) {
    this.userId = userId;
    this.sessionId = sessionId || uuid();
  }

  async generatePortfolio(
    userData: {
      name: string;
      email?: string;
      linkedin?: string;
      github?: string;
      targetRole: string;
    },
    projectData: Array<{
      name: string;
      description: string;
      technologies: string[];
      role?: string;
    }>
  ): Promise<Portfolio> {
    const analyzedProjects = await Promise.all(
      projectData.map(p => this.analyzeProject(p))
    );

    const skills = await this.extractSkills(projectData);
    const about = await this.generateAbout(userData.targetRole, skills);
    const certifications = await this.getCertifications(userData.targetRole);

    const portfolio: Portfolio = {
      id: uuid(),
      userId: this.userId,
      title: `${userData.name} - ${userData.targetRole}`,
      subtitle: `Portfolio of ${userData.name}`,
      about,
      projects: analyzedProjects.map((p, i) => ({
        id: uuid(),
        name: projectData[i].name,
        description: projectData[i].description,
        technologies: projectData[i].technologies,
        role: projectData[i].role || 'Developer',
        duration: '3 months',
        highlights: p.recommendations,
        links: {},
        tags: projectData[i].technologies,
      })),
      skills: skills.slice(0, 10).map(s => ({ name: s, level: 80 })),
      education: [],
      certifications,
      contact: {
        email: userData.email,
        linkedin: userData.linkedin,
        github: userData.github,
      },
      generatedAt: new Date(),
      template: 'professional',
    };

    await this.savePortfolio(portfolio);
    return portfolio;
  }

  async generateFromActivities(
    activities: Array<{
      type: 'project' | 'certification' | 'course' | 'work';
      name: string;
      description: string;
      date?: string;
    }>
  ): Promise<Portfolio> {
    const projects = activities.filter(a => a.type === 'project').map(a => ({
      name: a.name,
      description: a.description,
      technologies: [],
    }));

    const targetRole = 'Software Developer';

    return this.generatePortfolio(
      {
        name: 'Student',
        targetRole,
      },
      projects
    );
  }

  async updatePortfolio(
    existingPortfolio: Portfolio,
    newProject: PortfolioProject
  ): Promise<Portfolio> {
    return {
      ...existingPortfolio,
      projects: [newProject, ...existingPortfolio.projects],
      generatedAt: new Date(),
    };
  }

  async exportToMarkdown(portfolio: Portfolio): Promise<string> {
    let md = `# ${portfolio.title}\n\n`;
    md += `## ${portfolio.subtitle}\n\n`;
    md += `## About\n${portfolio.about}\n\n`;
    md += `## Skills\n`;
    for (const skill of portfolio.skills) {
      md += `- ${skill.name}\n`;
    }
    md += `\n## Projects\n`;
    for (const project of portfolio.projects) {
      md += `### ${project.name}\n`;
      md += `${project.description}\n\n`;
      md += `**Technologies:** ${project.technologies.join(', ')}\n\n`;
    }
    md += `## Contact\n`;
    if (portfolio.contact.email) md += `- Email: ${portfolio.contact.email}\n`;
    if (portfolio.contact.linkedin) md += `- LinkedIn: ${portfolio.contact.linkedin}\n`;
    if (portfolio.contact.github) md += `- GitHub: ${portfolio.contact.github}\n`;

    return md;
  }

  async exportToHTML(portfolio: Portfolio): Promise<string> {
    const template = `
<!DOCTYPE html>
<html>
<head>
  <title>${portfolio.title}</title>
  <style>
    body { font-family: Arial, sans-serif; max-width: 800px; margin: 0 auto; padding: 20px; }
    h1 { color: #333; }
    .project { border: 1px solid #ddd; padding: 15px; margin: 10px 0; }
    .skill { display: inline-block; background: #f0f0f0; padding: 5px 10px; margin: 3px; border-radius: 3px; }
  </style>
</head>
<body>
  <h1>${portfolio.title}</h1>
  <p>${portfolio.subtitle}</p>
  <h2>About</h2>
  <p>${portfolio.about}</p>
  <h2>Skills</h2>
  ${portfolio.skills.map(s => `<span class="skill">${s.name}</span>`).join('')}
  <h2>Projects</h2>
  ${portfolio.projects.map(p => `
    <div class="project">
      <h3>${p.name}</h3>
      <p>${p.description}</p>
      <p><strong>Tech:</strong> ${p.technologies.join(', ')}</p>
    </div>
  `).join('')}
</body>
</html>`;
    return template;
  }

  private async analyzeProject(
    project: { name: string; description: string; technologies: string[] }
  ): Promise<ProjectAnalysis> {
    const messages = [
      {
        role: 'system' as const,
        content: 'Analyze this project and provide recommendations for portfolio.',
      },
      {
        role: 'user' as const,
        content: `Project: ${project.name}\nDescription: ${project.description}\nTech: ${project.technologies.join(', ')}`,
      },
    ];

    try {
      const response = await llmService.chat(messages, { maxTokens: 500, temperature: 0.3 });
      return {
        relevance: 0.8,
        technicalComplexity: 0.7,
        impact: 0.8,
        recommendations: ['Highlight key features', 'Add metrics if available'],
      };
    } catch {
      return {
        relevance: 0.5,
        technicalComplexity: 0.5,
        impact: 0.5,
        recommendations: ['Add more details'],
      };
    }
  }

  private async extractSkills(projects: Array<{ technologies: string[] }>): Promise<string[]> {
    const allTech = projects.flatMap(p => p.technologies);
    const unique = [...new Set(allTech)];
    return unique.slice(0, 15);
  }

  private async generateAbout(targetRole: string, skills: string[]): Promise<string> {
    const messages = [
      {
        role: 'system' as const,
        content: 'Write a professional about section for a portfolio.',
      },
      {
        role: 'user' as const,
        content: `Role: ${targetRole}\nSkills: ${skills.join(', ')}`,
      },
    ];

    try {
      const response = await llmService.chat(messages, { maxTokens: 300, temperature: 0.5 });
      return response.content;
    } catch {
      return `Passionate ${targetRole} with expertise in ${skills.slice(3).join(', ')}.`;
    }
  }

  private async getCertifications(targetRole: string): Promise<Portfolio['certifications']> {
    return [];
  }

  private async savePortfolio(portfolio: Portfolio): Promise<void> {
    await prisma.agentOutput.create({
      data: {
        sessionId: this.sessionId,
        taskId: uuid(),
        type: 'portfolio' as any,
        content: portfolio as unknown as object,
        confidence: 1,
      },
    });
  }
}
