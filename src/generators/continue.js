/**
 * Generate .continuerc.json
 * Continue.dev uses a JSON config file for project-specific context.
 */
export function generateContinueConfig(scan) {
  const config = {
    $schema: 'https://continue.dev/schemas/config.json',
    name: scan.project.name,
    description: buildDescription(scan),
    rules: buildRules(scan),
  };

  return {
    path: '.continuerc.json',
    content: JSON.stringify(config, null, 2) + '\n',
  };
}

function buildDescription(scan) {
  const parts = [];
  if (scan.languages.length > 0) parts.push(scan.languages.map(l => l.name).join(', '));
  if (scan.frameworks.length > 0) parts.push(scan.frameworks.map(f => f.name).join(', '));
  return parts.join(' — ') || scan.project.name;
}

function buildRules(scan) {
  const rules = [];

  rules.push('Follow existing code patterns and conventions in this codebase.');

  if (scan.conventions.length > 0) {
    rules.push(`Conventions: ${scan.conventions.join('; ')}.`);
  }

  if (scan.testing.runner) {
    rules.push(`Write tests using ${scan.testing.runner}.`);
  }

  if (scan.languages.some(l => l.name === 'TypeScript')) {
    rules.push('Use proper TypeScript types. Avoid `any`.');
  }

  for (const fw of scan.frameworks) {
    if (fw.name === 'Next.js' && fw.meta?.appRouter) {
      rules.push('This is a Next.js App Router project. Default to Server Components.');
    }
    if (fw.name === 'Tailwind CSS') {
      rules.push('Use Tailwind CSS utility classes for styling.');
    }
  }

  // Add LLM-enhanced rules if present
  if (scan._enhanced) {
    if (scan._enhanced.domainRules) rules.push(...scan._enhanced.domainRules);
    if (scan._enhanced.codePatterns) rules.push(...scan._enhanced.codePatterns);
  }

  return rules;
}
