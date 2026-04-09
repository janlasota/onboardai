import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { detectLanguages } from '../src/detectors/languages.js';
import { detectFrameworks } from '../src/detectors/frameworks.js';
import { detectTesting } from '../src/detectors/testing.js';
import { detectPackageManager } from '../src/detectors/packageManager.js';

// ── Helpers ──────────────────────────────────────────────────────────────────

function makeFiles(...names) {
  return names.map(name => {
    const parts = name.split('.');
    const ext = parts.length > 1 ? '.' + parts.at(-1) : '';
    const dir = name.includes('/') ? name.split('/').slice(0, -1).join('/') : '';
    return { name: name.split('/').at(-1), ext, dir, size: 100 };
  });
}

function pkgConfig(deps = {}, devDeps = {}) {
  return { 'package.json': JSON.stringify({ dependencies: deps, devDependencies: devDeps }) };
}

// ── Language Detection ────────────────────────────────────────────────────────

describe('detectLanguages', () => {
  test('detects JavaScript files', () => {
    const files = makeFiles('index.js', 'utils.js', 'app.js');
    const result = detectLanguages(files, {});
    assert.equal(result[0].name, 'JavaScript');
    assert.equal(result[0].fileCount, 3);
  });

  test('detects TypeScript files', () => {
    const files = makeFiles('index.ts', 'types.ts', 'app.tsx');
    const result = detectLanguages(files, {});
    assert.equal(result[0].name, 'TypeScript');
    assert.equal(result[0].fileCount, 3);
  });

  test('marks TypeScript as primary when tsconfig.json is present', () => {
    const files = makeFiles('index.ts', 'utils.ts');
    const result = detectLanguages(files, { 'tsconfig.json': '{}' });
    const ts = result.find(l => l.name === 'TypeScript');
    assert.equal(ts.primary, true);
  });

  test('detects Python files', () => {
    const files = makeFiles('main.py', 'utils.py');
    const result = detectLanguages(files, {});
    assert.equal(result[0].name, 'Python');
  });

  test('detects Go files', () => {
    const files = makeFiles('main.go', 'handler.go');
    const result = detectLanguages(files, {});
    assert.equal(result[0].name, 'Go');
  });

  test('filters out config-only files (JSON, YAML, Markdown)', () => {
    const files = makeFiles('README.md', 'config.json', 'docker-compose.yml');
    const result = detectLanguages(files, {});
    assert.equal(result.length, 0);
  });

  test('sorts languages by file count descending', () => {
    const files = makeFiles('a.py', 'b.py', 'c.py', 'x.js');
    const result = detectLanguages(files, {});
    assert.equal(result[0].name, 'Python');
    assert.equal(result[1].name, 'JavaScript');
  });

  test('handles unknown extensions gracefully', () => {
    const files = makeFiles('binary.exe', 'data.bin');
    const result = detectLanguages(files, {});
    assert.equal(result.length, 0);
  });
});

// ── Framework Detection ───────────────────────────────────────────────────────

describe('detectFrameworks', () => {
  test('detects Next.js from dependency', () => {
    const files = [];
    const configs = pkgConfig({ next: '^14.0.0' });
    const result = detectFrameworks(files, configs);
    assert.ok(result.some(f => f.name === 'Next.js'));
  });

  test('detects Next.js from config file', () => {
    const files = [];
    const configs = { 'next.config.js': 'module.exports = {}' };
    const result = detectFrameworks(files, configs);
    assert.ok(result.some(f => f.name === 'Next.js'));
  });

  test('does not detect React separately when Next.js is present', () => {
    const files = [];
    const configs = pkgConfig({ next: '^14.0.0', react: '^18.0.0' });
    const result = detectFrameworks(files, configs);
    assert.ok(result.some(f => f.name === 'Next.js'));
    assert.ok(!result.some(f => f.name === 'React'));
  });

  test('detects React without Next.js', () => {
    const files = [];
    const configs = pkgConfig({ react: '^18.0.0' });
    const result = detectFrameworks(files, configs);
    assert.ok(result.some(f => f.name === 'React'));
    assert.ok(!result.some(f => f.name === 'Next.js'));
  });

  test('detects Express', () => {
    const files = [];
    const configs = pkgConfig({ express: '^4.18.0' });
    const result = detectFrameworks(files, configs);
    assert.ok(result.some(f => f.name === 'Express'));
  });

  test('detects Vue from .vue files', () => {
    const files = makeFiles('App.vue', 'Home.vue');
    const result = detectFrameworks(files, {});
    assert.ok(result.some(f => f.name === 'Vue'));
  });

  test('detects Tailwind CSS from config file', () => {
    const files = [];
    const configs = { 'tailwind.config.js': 'module.exports = {}' };
    const result = detectFrameworks(files, configs);
    assert.ok(result.some(f => f.name === 'Tailwind CSS'));
  });

  test('detects Docker from Dockerfile', () => {
    const files = [];
    const configs = { 'Dockerfile': 'FROM node:18' };
    const result = detectFrameworks(files, configs);
    assert.ok(result.some(f => f.name === 'Docker'));
  });

  test('detects Django from manage.py', () => {
    const files = makeFiles('manage.py');
    const result = detectFrameworks(files, {});
    assert.ok(result.some(f => f.name === 'Django'));
  });

  test('detects Gin from go.mod', () => {
    const files = [];
    const configs = { 'go.mod': 'require github.com/gin-gonic/gin v1.9.0' };
    const result = detectFrameworks(files, configs);
    assert.ok(result.some(f => f.name === 'Gin'));
  });

  test('returns empty array when no frameworks detected', () => {
    const result = detectFrameworks([], {});
    assert.equal(result.length, 0);
  });
});

// ── Testing Detection ─────────────────────────────────────────────────────────

describe('detectTesting', () => {
  test('detects vitest from devDependencies', () => {
    const files = [];
    const configs = pkgConfig({}, { vitest: '^1.0.0' });
    const result = detectTesting(files, configs);
    assert.equal(result.runner, 'vitest');
  });

  test('detects jest from devDependencies', () => {
    const files = [];
    const configs = pkgConfig({}, { jest: '^29.0.0' });
    const result = detectTesting(files, configs);
    assert.equal(result.runner, 'jest');
  });

  test('detects go test from go.mod presence', () => {
    const files = [];
    const configs = { 'go.mod': 'module example.com/app\n\ngo 1.21' };
    const result = detectTesting(files, configs);
    assert.equal(result.runner, 'go test');
  });

  test('detects cargo test from Cargo.toml', () => {
    const files = [];
    const configs = { 'Cargo.toml': '[package]\nname = "myapp"\nversion = "0.1.0"' };
    const result = detectTesting(files, configs);
    assert.equal(result.runner, 'cargo test');
  });

  test('detects playwright e2e', () => {
    const files = [];
    const configs = pkgConfig({}, { '@playwright/test': '^1.40.0' });
    const result = detectTesting(files, configs);
    assert.equal(result.e2e, 'playwright');
  });

  test('detects cypress e2e', () => {
    const files = [];
    const configs = pkgConfig({}, { cypress: '^13.0.0' });
    const result = detectTesting(files, configs);
    assert.equal(result.e2e, 'cypress');
  });

  test('detects .test. file pattern', () => {
    const files = makeFiles('utils.test.js', 'helpers.test.ts');
    const configs = {};
    const result = detectTesting(files, configs);
    assert.ok(result.patterns.includes('.test.*'));
  });

  test('detects .spec. file pattern', () => {
    const files = makeFiles('utils.spec.js');
    const result = detectTesting(files, {});
    assert.ok(result.patterns.includes('.spec.*'));
  });

  test('returns null runner when no testing detected', () => {
    const result = detectTesting([], {});
    assert.equal(result.runner, null);
  });
});

// ── Package Manager Detection ─────────────────────────────────────────────────

import { mkdtempSync, writeFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

function withTmpDir(cb) {
  const dir = mkdtempSync(join(tmpdir(), 'obi-test-'));
  try {
    return cb(dir);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
}

describe('detectPackageManager', () => {
  // Lockfile-based detection (requires real filesystem)
  test('detects pnpm from lockfile', () => {
    withTmpDir(dir => {
      writeFileSync(join(dir, 'pnpm-lock.yaml'), '');
      assert.equal(detectPackageManager(dir, {}), 'pnpm');
    });
  });

  test('detects yarn from lockfile', () => {
    withTmpDir(dir => {
      writeFileSync(join(dir, 'yarn.lock'), '');
      assert.equal(detectPackageManager(dir, {}), 'yarn');
    });
  });

  test('detects bun from lockfile', () => {
    withTmpDir(dir => {
      writeFileSync(join(dir, 'bun.lockb'), '');
      assert.equal(detectPackageManager(dir, {}), 'bun');
    });
  });

  test('detects npm from package-lock.json', () => {
    withTmpDir(dir => {
      writeFileSync(join(dir, 'package-lock.json'), '{}');
      assert.equal(detectPackageManager(dir, {}), 'npm');
    });
  });

  // Config-based detection (no filesystem needed — reads configs object)
  test('detects pnpm from packageManager field in package.json', () => {
    const configs = { 'package.json': JSON.stringify({ packageManager: 'pnpm@8.0.0' }) };
    assert.equal(detectPackageManager('/nonexistent', configs), 'pnpm');
  });

  test('detects go modules from go.mod config', () => {
    const configs = { 'go.mod': 'module example.com/app' };
    assert.equal(detectPackageManager('/nonexistent', configs), 'go modules');
  });

  test('detects cargo from Cargo.toml config', () => {
    const configs = { 'Cargo.toml': '[package]\nname = "myapp"' };
    assert.equal(detectPackageManager('/nonexistent', configs), 'cargo');
  });

  test('detects poetry from pyproject.toml', () => {
    const configs = { 'pyproject.toml': '[tool.poetry]\nname = "myapp"' };
    assert.equal(detectPackageManager('/nonexistent', configs), 'poetry');
  });

  test('detects pip from requirements.txt', () => {
    const configs = { 'requirements.txt': 'flask==2.3.0' };
    assert.equal(detectPackageManager('/nonexistent', configs), 'pip');
  });

  test('returns null when nothing detected', () => {
    assert.equal(detectPackageManager('/nonexistent', {}), null);
  });
});
