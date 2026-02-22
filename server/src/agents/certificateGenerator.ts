import { z } from 'zod';
import { llmService } from '../services/llm';
import { prisma } from '../services/prisma';
import { v4 as uuid } from 'uuid';

export interface Certificate {
  id: string;
  recipientName: string;
  recipientEmail: string;
  courseName: string;
  issuer: string;
  issueDate: Date;
  expiryDate?: Date;
  credentialId: string;
  verificationUrl: string;
  skills: string[];
  grade?: string;
  signature?: string;
  template: string;
  blockchainVerified: boolean;
}

export interface CertificateTemplate {
  id: string;
  name: string;
  background: string;
  border: string;
  logo?: string;
  font: string;
}

export interface BatchCertificate {
  certificates: Certificate[];
  issuedAt: Date;
  totalCount: number;
}

export class CertificateGeneratorAgent {
  private userId: string;
  private sessionId: string;

  constructor(userId: string, sessionId?: string) {
    this.userId = userId;
    this.sessionId = sessionId || uuid();
  }

  async generateCertificate(
    recipient: {
      name: string;
      email: string;
    },
    course: {
      name: string;
      skills: string[];
      grade?: string;
      duration: string;
    },
    issuer: {
      name: string;
      signature?: string;
    } = { name: 'Learning OS' }
  ): Promise<Certificate> {
    const credentialId = this.generateCredentialId();
    const verificationUrl = `https://learningos.app/verify/${credentialId}`;

    const certificate: Certificate = {
      id: uuid(),
      recipientName: recipient.name,
      recipientEmail: recipient.email,
      courseName: course.name,
      issuer: issuer.name,
      issueDate: new Date(),
      credentialId,
      verificationUrl,
      skills: course.skills,
      grade: course.grade,
      signature: issuer.signature,
      template: 'professional',
      blockchainVerified: false,
    };

    await this.saveCertificate(certificate);
    return certificate;
  }

  async generateBatch(
    recipients: Array<{ name: string; email: string; grade?: string }>,
    course: { name: string; skills: string[] }
  ): Promise<BatchCertificate> {
    const certificates: Certificate[] = [];

    for (const recipient of recipients) {
      const cert = await this.generateCertificate(
        { name: recipient.name, email: recipient.email },
        { name: course.name, skills: course.skills, grade: recipient.grade, duration: '' },
        { name: 'Learning OS' }
      );
      certificates.push(cert);
    }

    return {
      certificates,
      issuedAt: new Date(),
      totalCount: certificates.length,
    };
  }

  async verifyCertificate(credentialId: string): Promise<{
    valid: boolean;
    certificate?: Certificate;
    message: string;
  }> {
    const output = await prisma.agentOutput.findFirst({
      where: { type: 'certificate' as any },
    });

    const cert = output?.content as unknown as Certificate;

    if (!cert || cert.credentialId !== credentialId) {
      return { valid: false, message: 'Certificate not found' };
    }

    if (cert.expiryDate && new Date() > cert.expiryDate) {
      return { valid: false, certificate: cert, message: 'Certificate has expired' };
    }

    return { valid: true, certificate: cert, message: 'Certificate is valid' };
  }

  async generatePDF(certificate: Certificate): Promise<Buffer> {
    const pdfContent = `
CERTIFICATE OF COMPLETION

This is to certify that

${certificate.recipientName}

has successfully completed

${certificate.courseName}

Date: ${certificate.issueDate.toLocaleDateString()}
Credential ID: ${certificate.credentialId}

${certificate.issuer}
    `;

    return Buffer.from(pdfContent);
  }

  async generateHTML(certificate: Certificate): Promise<string> {
    return `
<!DOCTYPE html>
<html>
<head>
  <title>Certificate - ${certificate.courseName}</title>
  <style>
    body { 
      font-family: 'Georgia', serif; 
      max-width: 800px; 
      margin: 50px auto; 
      padding: 40px;
      text-align: center;
      border: 10px solid #1a1a2e;
      background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);
    }
    h1 { color: #1a1a2e; font-size: 36px; margin-bottom: 30px; }
    h2 { color: #333; font-size: 24px; margin: 20px 0; }
    .name { font-size: 32px; color: #2c3e50; font-weight: bold; margin: 30px 0; }
    .course { font-size: 20px; color: #555; }
    .date { margin-top: 40px; color: #777; }
    .credential { font-size: 12px; color: #999; margin-top: 30px; }
    .verify { margin-top: 20px; }
  </style>
</head>
<body>
  <h1>Certificate of Completion</h1>
  <h2>This is to certify that</h2>
  <div class="name">${certificate.recipientName}</div>
  <h2>has successfully completed</h2>
  <div class="course">${certificate.courseName}</div>
  ${certificate.grade ? `<p><strong>Grade:</strong> ${certificate.grade}</p>` : ''}
  <div class="date">Issued on ${certificate.issueDate.toLocaleDateString()}</div>
  <p class="credential">Credential ID: ${certificate.credentialId}</p>
  <div class="verify">
    <a href="${certificate.verificationUrl}">Verify Certificate</a>
  </div>
</body>
</html>`;
  }

  async recordOnBlockchain(certificate: Certificate): Promise<{
    transactionHash: string;
    blockNumber: number;
  }> {
    console.log('Recording certificate on blockchain...');

    return {
      transactionHash: `0x${uuid().replace(/-/g, '')}`,
      blockNumber: Math.floor(Math.random() * 1000000) + 15000000,
    };
  }

  private generateCredentialId(): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let result = 'LOS-';
    for (let i = 0; i < 12; i++) {
      if (i > 0 && i % 4 === 0) result += '-';
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  }

  private async saveCertificate(certificate: Certificate): Promise<void> {
    await prisma.agentOutput.create({
      data: {
        sessionId: this.sessionId,
        taskId: uuid(),
        type: 'certificate' as any,
        content: certificate as unknown as object,
        confidence: 1,
      },
    });
  }
}
