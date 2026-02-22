import type { Claim, SourceResult } from '../../types';
import { prisma } from '../../services/prisma';

export interface VerificationResult {
  claimId: string;
  statement: string;
  verified: boolean;
  confidence: number;
  evidence: string[];
  reason: string;
}

export class ClaimVerifierAgent {
  private sessionId: string;

  constructor(sessionId: string) {
    this.sessionId = sessionId;
  }

  async verify(claims: Claim[], sources: SourceResult[]): Promise<VerificationResult[]> {
    const results: VerificationResult[] = [];

    for (const claim of claims) {
      const supportingSources = claim.evidence
        .map(id => sources.find(s => s.id === id))
        .filter((s): s is SourceResult => s !== undefined);

      if (supportingSources.length === 0) {
        results.push({
          claimId: claim.id,
          statement: claim.statement,
          verified: false,
          confidence: 0,
          evidence: [],
          reason: 'No supporting sources found',
        });
        continue;
      }

      const avgReliability = supportingSources.reduce((sum, s) => sum + s.reliability, 0) / supportingSources.length;
      const verified = avgReliability >= 0.6 && claim.confidence >= 0.5;

      results.push({
        claimId: claim.id,
        statement: claim.statement,
        verified,
        confidence: avgReliability * claim.confidence,
        evidence: supportingSources.map(s => s.url),
        reason: verified 
          ? `Verified by ${supportingSources.length} source(s) with avg reliability ${(avgReliability * 100).toFixed(0)}%`
          : `Insufficient evidence - reliability ${(avgReliability * 100).toFixed(0)}% below threshold`,
      });
    }

    await prisma.evaluation.create({
      data: {
        sessionId: this.sessionId,
        type: 'claim_verification',
        score: results.filter(r => r.verified).length / results.length,
        details: {
          verified: results.filter(r => r.verified).length,
          total: results.length,
        } as object,
        passed: results.filter(r => r.verified).length / results.length >= 0.7,
      },
    });

    return results;
  }
}

export interface BiasResult {
  claimId: string;
  statement: string;
  biasType: string;
  severity: number;
  source: string;
  explanation: string;
}

export class BiasDetectorAgent {
  private sessionId: string;

  constructor(sessionId: string) {
    this.sessionId = sessionId;
  }

  async detect(claims: Claim[], sources: SourceResult[]): Promise<BiasResult[]> {
    const results: BiasResult[] = [];

    const biasPatterns = [
      { pattern: /always|never|definitely|undeniably/i, type: 'absolutism', severity: 0.3 },
      { pattern: /shocking|unbelievable|miracle|revolutionary/i, type: 'sensationalism', severity: 0.4 },
      { pattern: /experts say|research shows|studies prove/i, type: 'appeal_to_authority', severity: 0.2 },
      { pattern: /they don't want you to know|secret|hidden truth/i, type: 'conspiracy', severity: 0.5 },
      { pattern: /best|worst|top|#1|leading/i, type: 'superlative_abuse', severity: 0.2 },
    ];

    for (const claim of claims) {
      const source = sources.find(s => claim.evidence.includes(s.id));
      if (!source) continue;

      const content = (claim.statement + ' ' + source.title).toLowerCase();

      for (const { pattern, type, severity } of biasPatterns) {
        if (pattern.test(content)) {
          results.push({
            claimId: claim.id,
            statement: claim.statement.substring(0, 100),
            biasType: type,
            severity,
            source: source.url,
            explanation: `Detected ${type} language in claim`,
          });
        }
      }

      if (source.bias !== 0) {
        results.push({
          claimId: claim.id,
          statement: claim.statement.substring(0, 100),
          biasType: source.bias > 0 ? 'source_positive' : 'source_negative',
          severity: Math.abs(source.bias),
          source: source.url,
          explanation: `Source has bias score of ${source.bias}`,
        });
      }
    }

    return results;
  }
}

export interface ContradictionResult {
  claimAId: string;
  claimBId: string;
  statementA: string;
  statementB: string;
  severity: 'low' | 'medium' | 'high';
  explanation: string;
}

export class ContradictionFinderAgent {
  private sessionId: string;

  constructor(sessionId: string) {
    this.sessionId = sessionId;
  }

  async find(claims: Claim[]): Promise<ContradictionResult[]> {
    const results: ContradictionResult[] = [];
    const negationWords = ['not', 'no', 'never', 'cannot', 'impossible', 'false', 'wrong', 'incorrect'];
    const comparisonWords = ['more', 'less', 'better', 'worse', 'higher', 'lower', 'increase', 'decrease'];

    for (let i = 0; i < claims.length; i++) {
      for (let j = i + 1; j < claims.length; j++) {
        const claimA = claims[i];
        const claimB = claims[j];

        const similarity = this.calculateSimilarity(claimA.statement, claimB.statement);
        
        if (similarity > 0.6 && similarity < 0.95) {
          const hasNegationA = negationWords.some(w => claimA.statement.toLowerCase().includes(w));
          const hasNegationB = negationWords.some(w => claimB.statement.toLowerCase().includes(w));

          if (hasNegationA !== hasNegationB) {
            results.push({
              claimAId: claimA.id,
              claimBId: claimB.id,
              statementA: claimA.statement.substring(0, 100),
              statementB: claimB.statement.substring(0, 100),
              severity: similarity > 0.85 ? 'high' : 'medium',
              explanation: `Contradictory statements detected (negation mismatch)`,
            });
          }

          const hasComparisonA = comparisonWords.some(w => claimA.statement.toLowerCase().includes(w));
          const hasComparisonB = comparisonWords.some(w => claimB.statement.toLowerCase().includes(w));

          if (hasComparisonA && hasComparisonB) {
            const comparisonA = this.extractComparison(claimA.statement);
            const comparisonB = this.extractComparison(claimB.statement);

            if (comparisonA.direction !== comparisonB.direction) {
              results.push({
                claimAId: claimA.id,
                claimBId: claimB.id,
                statementA: claimA.statement.substring(0, 100),
                statementB: claimB.statement.substring(0, 100),
                severity: 'medium',
                explanation: `Conflicting comparisons: ${comparisonA.value} vs ${comparisonB.value}`,
              });
            }
          }
        }
      }
    }

    if (results.length > 0) {
      await prisma.evaluation.create({
        data: {
          sessionId: this.sessionId,
          type: 'contradiction_detection',
          score: 1 - (results.filter(r => r.severity === 'high').length * 0.2),
          details: {
            total: results.length,
            high: results.filter(r => r.severity === 'high').length,
            medium: results.filter(r => r.severity === 'medium').length,
          } as object,
          passed: results.filter(r => r.severity === 'high').length === 0,
        },
      });
    }

    return results;
  }

  private calculateSimilarity(textA: string, textB: string): number {
    const wordsA = new Set(textA.toLowerCase().split(/\s+/).filter(w => w.length > 2));
    const wordsB = new Set(textB.toLowerCase().split(/\s+/).filter(w => w.length > 2));
    
    const intersection = new Set([...wordsA].filter(x => wordsB.has(x)));
    const union = new Set([...wordsA, ...wordsB]);
    
    return union.size > 0 ? intersection.size / union.size : 0;
  }

  private extractComparison(text: string): { direction: string; value: string } {
    const lower = text.toLowerCase();
    
    if (lower.includes('more') || lower.includes('increase') || lower.includes('higher') || lower.includes('better')) {
      return { direction: 'positive', value: 'increase' };
    }
    if (lower.includes('less') || lower.includes('decrease') || lower.includes('lower') || lower.includes('worse')) {
      return { direction: 'negative', value: 'decrease' };
    }
    
    return { direction: 'neutral', value: 'unknown' };
  }
}

export class CriticFleet {
  private sessionId: string;

  constructor(sessionId: string) {
    this.sessionId = sessionId;
  }

  async critique(claims: Claim[], sources: SourceResult[]): Promise<{
    verified: VerificationResult[];
    biases: BiasResult[];
    contradictions: ContradictionResult[];
    overallConfidence: number;
  }> {
    const verifier = new ClaimVerifierAgent(this.sessionId);
    const biasDetector = new BiasDetectorAgent(this.sessionId);
    const contradictionFinder = new ContradictionFinderAgent(this.sessionId);

    const [verified, biases, contradictions] = await Promise.all([
      verifier.verify(claims, sources),
      biasDetector.detect(claims, sources),
      contradictionFinder.find(claims),
    ]);

    const verifiedCount = verified.filter(v => v.verified).length;
    const overallConfidence = claims.length > 0 
      ? (verifiedCount / claims.length) - (contradictions.length * 0.1) - (biases.length * 0.05)
      : 0;

    return {
      verified,
      biases,
      contradictions,
      overallConfidence: Math.max(0, Math.min(1, overallConfidence)),
    };
  }
}
