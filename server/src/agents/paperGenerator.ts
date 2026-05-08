import { prisma } from '../services/prisma';
import { llmService } from '../services/llm';
import { z } from 'zod';

const PaperSection = z.object({
  title: z.string(),
  content: z.string(),
  citations: z.array(z.string()).optional(),
});

const PaperDraftSchema = z.object({
  title: z.string(),
  abstract: z.string(),
  introduction: z.string(),
  relatedWork: z.string(),
  methodology: z.string(),
  results: z.string(),
  discussion: z.string(),
  conclusion: z.string(),
  references: z.array(z.object({
    index: z.number(),
    citation: z.string(),
    bibtex: z.string().optional(),
  })),
  claimEvidenceMap: z.array(z.object({
    claim: z.string(),
    epistemicLabel: z.string(),
    supportingEvidence: z.array(z.string()),
    contradictingEvidence: z.array(z.string()).optional(),
  })).optional(),
});

export type PaperDraft = z.infer<typeof PaperDraftSchema>;

export interface PaperGeneratorOptions {
  format: 'ieee' | 'latex' | 'markdown';
  citationStyle: 'ieee' | 'apa' | 'bibtex';
  includeAppendices: boolean;
  includeClaimMap: boolean;
}

export class PaperGeneratorAgent {
  constructor(private sessionId: string, private taskId: string) {}

  async generatePaper(
    researchResults: any[],
    critiqueResults: any,
    options: PaperGeneratorOptions
  ): Promise<PaperDraft> {
    const sources = researchResults.flatMap((r: any) => r.sources || []);
    const claims = critiqueResults?.acceptedClaims || [];

    const prompt = this.buildPrompt(sources, claims, options);

    const messages = [
      {
        role: 'system' as const,
        content: `You are an academic paper generator for ARROS (Academic Research OS). Generate IEEE-formatted research papers with proper structure.

IEEE PAPER FORMAT:
- Title: Title Case, max 12 words
- Abstract: 150-250 words, no citations, present problem/method/results/conclusion
- Sections numbered with roman numerals (I, II, III, IV, V, VI)
- Introduction: motivation, problem statement, contributions
- Related Work: literature review with proper citations [N]
- Methodology: describe your approach
- Results: present findings with citations [N]
- Discussion: analyze implications
- Conclusion: summarize and future work
- References: IEEE format [N] Author, "Title," Journal, vol. X, no. Y, pp. Z-Z, Year.

EVIDENCE-BASED WRITING:
- Each claim in your paper should cite a source
- Use epistemic labels to determine confidence:
  - supported: Can make strong claims
  - inconsistent: Acknowledge conflicting findings
  - suggestive: Use hedged language ("suggests", "may")
  - speculative: Clearly mark as preliminary
  - unknown: Do not include unsupported claims

Output format: JSON with title, abstract, introduction, relatedWork, methodology, results, discussion, conclusion, references, and optional claimEvidenceMap.`,
      },
      {
        role: 'user' as const,
        content: prompt,
      },
    ];

    try {
      const response = await llmService.chat(messages, {
        maxTokens: 8000,
        temperature: 0.3,
        model: 'gpt-4o',
        responseFormat: PaperDraftSchema,
      });

      const paper = PaperDraftSchema.parse(JSON.parse(response.content));

      await prisma.agentTask.update({
        where: { id: this.taskId },
        data: {
          status: 'completed',
          output: paper as unknown as object,
          tokens: response.usage.totalTokens,
          cost: llmService.calculateCost(response.usage, 'gpt-4o'),
        },
      });

      return paper;
    } catch (error) {
      console.error('Paper generation failed:', error);
      throw error;
    }
  }

  private buildPrompt(sources: any[], claims: any[], options: PaperGeneratorOptions): string {
    const sourcesText = sources
      .slice(0, 50)
      .map((s: any, i: number) => `[${i + 1}] ${s.title} - ${s.url || 'N/A'} (${s.metadata?.authors || 'Unknown'}, ${s.metadata?.year || 'n.d.'}, ${s.metadata?.venue || 'N/A'})`)
      .join('\n');

    const claimsText = claims
      .map((c: any, i: number) => `[${i + 1}] "${c.statement}" (${c.epistemicLabel || 'unknown'}) - sources: ${(c.supportingSources || []).join(', ')}`)
      .join('\n');

    return `Generate an IEEE-format research paper based on the following sources and verified claims:

SOURCES (${sources.length} total, showing first 50):
${sourcesText}

VERIFIED CLAIMS (${claims.length} total):
${claimsText}

FORMAT: ${options.format.toUpperCase()}
CITATION STYLE: ${options.citationStyle.toUpperCase()}
INCLUDE APPENDICES: ${options.includeAppendices}
INCLUDE CLAIM MAP: ${options.includeClaimMap}

Generate a complete paper with all required IEEE sections. Use the claims and sources to build a coherent argument. Ensure all claims are properly attributed to sources.`;
  }

  async exportToLatex(paper: PaperDraft): Promise<string> {
    const references = paper.references
      .map((r) => `\\bibitem{ref${r.index}} ${r.citation}`)
      .join('\n');

    return `\\documentclass[conference]{IEEEtran}

\\usepackage[utf8]{inputenc}
\\usepackage{graphicx}
\\usepackage{cite}

\\title{${paper.title}}

\\author{%
  \\IEEEauthorblockN{Author Name}
  \\IEEEauthorblockA{Institution\\City, Country\\\\
  email@example.com}
}

\\begin{document}
\\maketitle

\\begin{abstract}
${paper.abstract}
\\end{abstract}

\\IEEEpeerreviewmaketitle

\\section{Introduction}
${paper.introduction}

\\section{Related Work}
${paper.relatedWork}

\\section{Methodology}
${paper.methodology}

\\section{Results and Analysis}
${paper.results}

\\section{Discussion}
${paper.discussion}

\\section{Conclusion}
${paper.conclusion}

\\section*{References}
\\begin{thebibliography}{99}
${references}
\\end{thebibliography}

\\end{document}`;
  }

  async exportToMarkdown(paper: PaperDraft): Promise<string> {
    const lines = [
      `# ${paper.title}`,
      '',
      '## Abstract',
      paper.abstract,
      '',
      '## I. Introduction',
      paper.introduction,
      '',
      '## II. Related Work',
      paper.relatedWork,
      '',
      '## III. Methodology',
      paper.methodology,
      '',
      '## IV. Results and Analysis',
      paper.results,
      '',
      '## V. Discussion',
      paper.discussion,
      '',
      '## VI. Conclusion',
      paper.conclusion,
      '',
      '## References',
      paper.references.map((r) => `[${r.index}] ${r.citation}`).join('\n'),
    ];

    return lines.join('\n');
  }

  async exportToBibTeX(paper: PaperDraft): Promise<string> {
    const bibtexEntries = paper.references
      .filter((r) => r.bibtex)
      .map((r) => r.bibtex)
      .join('\n\n');

    if (!bibtexEntries) {
      return paper.references
        .map((r, i) => {
          const source = paper.references[i];
          const key = `ref${i + 1}`;
          return `@misc{${key},\n  note = {${source.citation}}\n}`;
        })
        .join('\n\n');
    }

    return bibtexEntries;
  }

  generatePRISMAFlowchart(screeningData: {
    identified: number;
    screened: number;
    eligible: number;
    included: number;
  }): string {
    return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 500">
  <!-- PRISMA Flow Diagram -->
  <rect x="50" y="20" width="300" height="60" fill="#2D4A6F" rx="5"/>
  <text x="200" y="45" text-anchor="middle" fill="white" font-size="12">Identification</text>
  <text x="200" y="65" text-anchor="middle" fill="white" font-size="14" font-weight="bold">${screeningData.identified}</text>
  
  <line x1="200" y1="80" x2="200" y2="110" stroke="#666" stroke-width="2"/>
  <polygon points="200,110 195,100 205,100" fill="#666"/>
  
  <rect x="50" y="110" width="300" height="60" fill="#F57C00" rx="5"/>
  <text x="200" y="135" text-anchor="middle" fill="white" font-size="12">Screening</text>
  <text x="200" y="155" text-anchor="middle" fill="white" font-size="14" font-weight="bold">${screeningData.screened}</text>
  
  <line x1="200" y1="170" x2="200" y2="200" stroke="#666" stroke-width="2"/>
  <polygon points="200,200 195,190 205,190" fill="#666"/>
  
  <rect x="50" y="200" width="300" height="60" fill="#2E7D32" rx="5"/>
  <text x="200" y="225" text-anchor="middle" fill="white" font-size="12">Included</text>
  <text x="200" y="245" text-anchor="middle" fill="white" font-size="14" font-weight="bold">${screeningData.included}</text>
  
  <text x="200" y="290" text-anchor="middle" fill="#666" font-size="10">
    Eligible: ${screeningData.eligible}
  </text>
</svg>`;
  }
}
