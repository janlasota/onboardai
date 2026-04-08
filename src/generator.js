import { mkdir, writeFile } from 'node:fs/promises';
import { join, dirname } from 'node:path';
import { generateCursorRules } from './generators/cursor.js';
import { generateClaudeMd } from './generators/claude.js';
import { generateCopilotInstructions } from './generators/copilot.js';
import { generateWindsurfRules } from './generators/windsurf.js';
import { generateContinueConfig } from './generators/continue.js';
import { generateAiderConventions } from './generators/aider.js';

const GENERATORS = {
  cursor: { fn: generateCursorRules, desc: 'Cursor rules' },
  claude: { fn: generateClaudeMd, desc: 'Claude CLAUDE.md' },
  copilot: { fn: generateCopilotInstructions, desc: 'GitHub Copilot instructions' },
  windsurf: { fn: generateWindsurfRules, desc: 'Windsurf rules' },
  continue: { fn: generateContinueConfig, desc: 'Continue.dev config' },
  aider: { fn: generateAiderConventions, desc: 'Aider conventions' },
};

/**
 * Generate context files for the specified formats
 */
export async function generateContextFiles(scan, opts = {}) {
  const { formats = ['cursor', 'claude', 'copilot'], outputDir = '.' } = opts;
  const generated = [];

  for (const format of formats) {
    const generator = GENERATORS[format];
    if (!generator) continue;

    const { path: filePath, content } = generator.fn(scan);
    const fullPath = join(outputDir, filePath);

    // Ensure directory exists
    await mkdir(dirname(fullPath), { recursive: true });
    await writeFile(fullPath, content, 'utf-8');
    generated.push(filePath);
  }

  return generated;
}
