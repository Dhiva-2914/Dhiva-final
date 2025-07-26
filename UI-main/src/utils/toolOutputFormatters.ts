// Formatting functions for tool outputs to match tool mode display

export function formatAIPoweredSearchOutput(response: string): string {
  // Plain markdown/text output
  return response;
}

export function formatCodeAssistantOutput(outputs: string[]): string {
  // Join outputs with section headers, use markdown code blocks for code
  return outputs.map((out) => {
    let header = '### Output';
    if (out.startsWith('AI Action Output:')) header = '### AI Action Output';
    else if (out.startsWith('Target Language Conversion Output:')) header = '### Target Language Conversion Output';
    else if (out.startsWith('Modification Output:')) header = '### Modification Output';
    // Remove the label from the output
    const content = out.replace(/^[^:]+:\n/, '');
    return `---\n${header}\n\n\n\`\`\`js\n${content}\n\`\`\``;
  }).join('\n');
}

export function formatTestSupportOutput(report: { strategy?: string, crossPlatform?: string, sensitivity?: string, qa?: { question: string, answer: string }[] }): string {
  let out = '';
  if (report.strategy) out += `## Test Strategy\n${report.strategy}\n`;
  if (report.crossPlatform) out += `\n## Cross-Platform Analysis\n${report.crossPlatform}\n`;
  if (report.sensitivity) out += `\n## Sensitivity Analysis\n${report.sensitivity}\n`;
  if (report.qa && report.qa.length > 0) {
    out += '\n## Q&A\n' + report.qa.map(qa => `**Q:** ${qa.question}\n**A:** ${qa.answer}`).join('\n\n');
  }
  return out;
}

export function formatImpactAnalyzerOutput(result: { metrics?: any, riskLevel?: any, impactSummary?: string, diffResults?: string, qa?: { question: string, answer: string }[] }): string {
  let out = '## Metrics\n';
  if (result.metrics) {
    out += `- Lines Added: ${result.metrics.linesAdded}\n- Lines Removed: ${result.metrics.linesRemoved}\n- Files Changed: ${result.metrics.filesChanged}\n- Percentage Changed: ${result.metrics.percentageChanged}%\n`;
  }
  if (result.riskLevel) {
    out += `\n## Risk Assessment\n- **Risk Level**: ${result.riskLevel.level?.toUpperCase()}\n- **Risk Score**: ${result.riskLevel.score}/10\n- **Risk Factors**:\n${(result.riskLevel.factors || []).map((f: string) => `  - ${f}`).join('\n')}`;
  }
  if (result.impactSummary) out += `\n\n${result.impactSummary}`;
  if (result.diffResults) out += `\n\n## Code Diff\n\n\`\`\`diff\n${result.diffResults}\n\`\`\``;
  if (result.qa && result.qa.length > 0) {
    out += '\n## Q&A\n' + result.qa.map(qa => `**Q:** ${qa.question}\n**A:** ${qa.answer}`).join('\n\n');
  }
  return out;
}

export function formatImageInsightsOutput(images: { name: string, summary?: string, qa?: { question: string, answer: string }[] }[]): string {
  return images.map(img => `### ${img.name}\n${img.summary || ''}\n` + (img.qa && img.qa.length > 0 ? '\n#### Q&A\n' + img.qa.map(qa => `**Q:** ${qa.question}\n**A:** ${qa.answer}`).join('\n\n') : '')).join('\n---\n');
}

export function formatVideoSummarizerOutput(video: { name: string, summary?: string, quotes?: string[], timestamps?: string[], qa?: { question: string, answer: string }[] }): string {
  let out = `### ${video.name}\n`;
  if (video.summary) out += `\n**AI Summary:**\n${video.summary}\n`;
  if (video.quotes && video.quotes.length > 0) {
    out += '\n**Key Quotes:**\n' + video.quotes.map(q => `- "${q}"`).join('\n');
  }
  if (video.timestamps && video.timestamps.length > 0) {
    out += '\n**Timestamps:**\n' + video.timestamps.map(ts => `- ${ts}`).join('\n');
  }
  if (video.qa && video.qa.length > 0) {
    out += '\n**Q&A:**\n' + video.qa.map(qa => `**Q:** ${qa.question}\n**A:** ${qa.answer}`).join('\n\n');
  }
  return out;
} 