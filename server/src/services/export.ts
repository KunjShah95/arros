import { SynthesisResult } from '../types';

interface MediaAnalysis {
    title: string;
    summary: string;
    keyFindings: string[];
    keyTakeaways: string[];
    questions: string[];
    topics: string[];
    mediaType: string;
    wordCount?: number;
}

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

    static toMarkdownFromMedia(analysis: MediaAnalysis): string {
        const date = new Date().toLocaleDateString();
        let md = `# ${analysis.title}\n\n`;
        md += `*Exported on ${date} | ARROS Research Assistant*\n\n`;

        md += `## Summary\n${analysis.summary}\n\n`;

        md += `## Key Findings\n`;
        analysis.keyFindings.forEach((f, i) => {
            md += `${i + 1}. ${f}\n`;
        });
        md += '\n';

        md += `## Key Takeaways\n`;
        analysis.keyTakeaways.forEach((t, i) => {
            md += `- ${t}\n`;
        });
        md += '\n';

        if (analysis.questions.length > 0) {
            md += `## Study Questions\n`;
            analysis.questions.forEach((q, i) => {
                md += `${i + 1}. ${q}\n`;
            });
            md += '\n';
        }

        if (analysis.topics.length > 0) {
            md += `## Topics\n${analysis.topics.map(t => `- ${t}`).join('\n')}\n\n`;
        }

        if (analysis.wordCount) {
            md += `*Total: ${analysis.wordCount.toLocaleString()} words*\n`;
        }

        return md;
    }

    static toHTML(analysis: MediaAnalysis): string {
        const html = `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>${analysis.title}</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 800px; margin: 40px auto; padding: 20px; line-height: 1.6; color: #333; }
    h1 { border-bottom: 2px solid #2563eb; padding-bottom: 10px; }
    h2 { color: #2563eb; margin-top: 30px; }
    ul { padding-left: 20px; }
    li { margin: 8px 0; }
    .meta { color: #666; font-size: 14px; }
    .topics { display: flex; gap: 8px; flex-wrap: wrap; margin-top: 20px; }
    .topic { background: #e0e7ff; padding: 4px 12px; border-radius: 16px; font-size: 12px; color: #3730a3; }
  </style>
</head>
<body>
  <h1>${analysis.title}</h1>
  <p class="meta">Exported from ARROS Research Assistant</p>
  
  <h2>Summary</h2>
  <p>${analysis.summary.replace(/\n/g, '<br>')}</p>
  
  <h2>Key Findings</h2>
  <ol>${analysis.keyFindings.map(f => `<li>${f}</li>`).join('')}</ol>
  
  <h2>Key Takeaways</h2>
  <ul>${analysis.keyTakeaways.map(t => `<li>${t}</li>`).join('')}</ul>
  
  ${analysis.questions.length > 0 ? `<h2>Study Questions</h2>
  <ol>${analysis.questions.map(q => `<li>${q}</li>`).join('')}</ol>` : ''}
  
  ${analysis.topics.length > 0 ? `<div class="topics">${analysis.topics.map(t => `<span class="topic">${t}</span>`).join('')}</div>` : ''}
</body>
</html>`;
        return html;
    }
}
