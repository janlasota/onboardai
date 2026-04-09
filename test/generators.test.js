import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { generateClaudeMd } from '../src/generators/claude.js';
import { generateCursorRules } from '../src/generators/cursor.js';
import { generateCopilotInstructions } from '../src/generators/copilot.js';
import { generateContinueConfig } from '../src/generators/continue.js';
import { generateAiderConventions } from '../src/generators/aider.js';
import { generateWindsurfRules } from '../src/generators/windsurf.js';

// ── Shared minimal scan fixture ───────────────────────────────────────────────

function makeScan(overrides = {}) {
  return {
    project: { name: 'test-project', rootDir: '/tmp/test' },
    languages: [{ name: 'TypeScript', category: 'frontend', fileCount: 10 }],
    frameworks: [{ name: 'Next.js', tags: ['react', 'ssr'], version: '^14.0.0', meta: { appRouter: true } }],
    packageManager: 'pnpm',
    testing: { runner: 'vitest', e2e: 'playwright', patterns: ['.test.*'], colocated: true },
    structure: { pattern: 'src-based', keyDirs: ['src', 'components', 'lib'], topLevelDirs: ['src', 'public'] },
    conventions: [
      'Prefers named exports',
      'Uses semicolons',
      'Single quotes for strings',
      '2-space indentation',
    ],
    fileCount: 120,
    dirCount: 15,
    ...overrides,
  };
}

// ── CLAUDE.md ─────────────────────────────────────────────────────────────────

describe('generateClaudeMd', () => {
  test('returns correct file path', () => {
    const result = generateClaudeMd(makeScan());
    assert.equal(result.path, 'CLAUDE.md');
  });

  test('content starts with correct header', () => {
    const result = generateClaudeMd(makeScan());
    assert.ok(result.content.startsWith('# CLAUDE.md — test-project'));
  });

  test('includes project name', () => {
    const result = generateClaudeMd(makeScan());
    assert.ok(result.content.includes('test-project'));
  });

  test('includes TypeScript note when TypeScript is detected', () => {
    const result = generateClaudeMd(makeScan());
    assert.ok(result.content.includes('TypeScript'));
  });

  test('includes test runner in style guidelines', () => {
    const result = generateClaudeMd(makeScan());
    assert.ok(result.content.includes('vitest'));
  });

  test('includes common commands for pnpm', () => {
    const result = generateClaudeMd(makeScan());
    assert.ok(result.content.includes('pnpm install'));
  });

  test('includes additional context placeholder', () => {
    const result = generateClaudeMd(makeScan());
    assert.ok(result.content.includes('## Additional Context'));
  });

  test('works with minimal scan (no frameworks, no testing)', () => {
    const scan = makeScan({ frameworks: [], testing: { runner: null, patterns: [] } });
    const result = generateClaudeMd(scan);
    assert.ok(result.content.length > 0);
    assert.equal(result.path, 'CLAUDE.md');
  });
});

// ── .cursorrules ──────────────────────────────────────────────────────────────

describe('generateCursorRules', () => {
  test('returns correct file path', () => {
    const result = generateCursorRules(makeScan());
    assert.equal(result.path, '.cursorrules');
  });

  test('content includes project name', () => {
    const result = generateCursorRules(makeScan());
    assert.ok(result.content.includes('test-project'));
  });

  test('content includes detected conventions', () => {
    const result = generateCursorRules(makeScan());
    assert.ok(result.content.includes('named exports'));
  });
});

// ── copilot-instructions.md ───────────────────────────────────────────────────

describe('generateCopilotInstructions', () => {
  test('returns correct file path', () => {
    const result = generateCopilotInstructions(makeScan());
    assert.equal(result.path, '.github/copilot-instructions.md');
  });

  test('content includes project name', () => {
    const result = generateCopilotInstructions(makeScan());
    assert.ok(result.content.includes('test-project'));
  });
});

// ── .continuerc.json ──────────────────────────────────────────────────────────

describe('generateContinueConfig', () => {
  test('returns correct file path', () => {
    const result = generateContinueConfig(makeScan());
    assert.equal(result.path, '.continuerc.json');
  });

  test('content is valid JSON', () => {
    const result = generateContinueConfig(makeScan());
    assert.doesNotThrow(() => JSON.parse(result.content));
  });

  test('JSON has required fields', () => {
    const result = generateContinueConfig(makeScan());
    const parsed = JSON.parse(result.content);
    assert.ok(parsed.name);
    assert.ok(Array.isArray(parsed.rules));
    assert.ok(parsed.rules.length > 0);
  });

  test('project name matches scan', () => {
    const result = generateContinueConfig(makeScan());
    const parsed = JSON.parse(result.content);
    assert.equal(parsed.name, 'test-project');
  });

  test('includes TypeScript rule', () => {
    const result = generateContinueConfig(makeScan());
    const parsed = JSON.parse(result.content);
    assert.ok(parsed.rules.some(r => r.includes('TypeScript')));
  });
});

// ── .aider.conventions.md ────────────────────────────────────────────────────

describe('generateAiderConventions', () => {
  test('returns correct file path', () => {
    const result = generateAiderConventions(makeScan());
    assert.equal(result.path, '.aider.conventions.md');
  });

  test('content includes project name', () => {
    const result = generateAiderConventions(makeScan());
    assert.ok(result.content.includes('test-project'));
  });
});

// ── .windsurfrules ────────────────────────────────────────────────────────────

describe('generateWindsurfRules', () => {
  test('returns correct file path', () => {
    const result = generateWindsurfRules(makeScan());
    assert.equal(result.path, '.windsurfrules');
  });

  test('content includes project name', () => {
    const result = generateWindsurfRules(makeScan());
    assert.ok(result.content.includes('test-project'));
  });
});
