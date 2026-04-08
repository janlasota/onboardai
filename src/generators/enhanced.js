/**
 * Build additional sections from LLM-enhanced scan data.
 * These only appear when --enhance was used successfully.
 */

export function buildEnhancedSections(scan) {
  if (!scan._enhanced) return '';

  const sections = [];

  if (scan._enhanced.architectureNotes) {
    sections.push('## Architecture Notes');
    sections.push('');
    sections.push(scan._enhanced.architectureNotes);
    sections.push('');
  }

  if (scan._enhanced.domainRules?.length > 0) {
    sections.push('## Domain-Specific Rules');
    sections.push('');
    for (const rule of scan._enhanced.domainRules) {
      sections.push(`- ${rule}`);
    }
    sections.push('');
  }

  if (scan._enhanced.codePatterns?.length > 0) {
    sections.push('## Detected Code Patterns');
    sections.push('');
    for (const pattern of scan._enhanced.codePatterns) {
      sections.push(`- ${pattern}`);
    }
    sections.push('');
  }

  if (scan._enhanced.securityNotes?.length > 0) {
    sections.push('## Security Considerations');
    sections.push('');
    for (const note of scan._enhanced.securityNotes) {
      sections.push(`- ${note}`);
    }
    sections.push('');
  }

  if (scan._enhanced.performanceNotes?.length > 0) {
    sections.push('## Performance Guidelines');
    sections.push('');
    for (const note of scan._enhanced.performanceNotes) {
      sections.push(`- ${note}`);
    }
    sections.push('');
  }

  return sections.join('\n');
}
