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

export function formatTestSupportOutput(strategy: string): string {
  return `## Test Strategy\n${strategy}`;
}

export function formatImpactAnalyzerOutput(result: { 
  impact_analysis: string, 
  risk_score?: number, 
  risk_level?: string, 
  lines_added?: number, 
  lines_removed?: number, 
  files_changed?: number, 
  percentage_change?: number 
}): string {
  let out = '## Impact Analysis\n\n';
  out += result.impact_analysis;
  
  if (result.risk_score !== undefined || result.risk_level) {
    out += '\n\n## Risk Assessment\n';
    if (result.risk_level) out += `- **Risk Level**: ${result.risk_level.toUpperCase()}\n`;
    if (result.risk_score !== undefined) out += `- **Risk Score**: ${result.risk_score}/10\n`;
  }
  
  if (result.lines_added !== undefined || result.lines_removed !== undefined || result.files_changed !== undefined || result.percentage_change !== undefined) {
    out += '\n## Metrics\n';
    if (result.lines_added !== undefined) out += `- Lines Added: ${result.lines_added}\n`;
    if (result.lines_removed !== undefined) out += `- Lines Removed: ${result.lines_removed}\n`;
    if (result.files_changed !== undefined) out += `- Files Changed: ${result.files_changed}\n`;
    if (result.percentage_change !== undefined) out += `- Percentage Changed: ${result.percentage_change}%\n`;
  }
  
  return out;
}

export function formatImageInsightsOutput(summary: string): string {
  return `## Image Analysis\n\n${summary}`;
}

export function formatVideoSummarizerOutput(summary: string): string {
  return `## Video Summary\n\n${summary}`;
} 