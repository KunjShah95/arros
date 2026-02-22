import { SynthesisResult } from '../types';

export class ExportService {
    static toMarkdown(synthesis: SynthesisResult): string {
        let md = `# ${synthesis.summary.split('\n')[0] || 'Research Report'}\n\n`;

        if (synthesis.introduction) {
            md += `## Introduction\n${synthesis.introduction}\n\n`;
        }

        md += `## Key Findings\n${synthesis.keyFindings.map(f => `- ${f}`).join('\n')}\n\n`;

        if (synthesis.conceptsAndDefinitions) {
            md += `## Concepts & Definitions\n${synthesis.conceptsAndDefinitions}\n\n`;
        }

        if (synthesis.applications) {
            md += `## Applications\n${synthesis.applications}\n\n`;
        }

        if (synthesis.conclusion) {
            md += `## Conclusion\n${synthesis.conclusion}\n\n`;
        }

        if (synthesis.citations && synthesis.citations.length > 0) {
            md += `## References\n`;
            synthesis.citations.forEach(c => {
                md += `${c.index}. [${c.title}](${c.url || '#'}) ${c.authors ? `| ${c.authors}` : ''} (${c.year || 'N/A'})\n`;
            });
        }

        return md;
    }
}
