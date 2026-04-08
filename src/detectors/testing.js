/**
 * Detect testing setup in the project
 */
export function detectTesting(files, configs) {
  const result = {
    runner: null,
    framework: null,
    patterns: [],
    colocated: false,
    directory: null,
  };

  const pkg = configs['package.json'] ? tryParse(configs['package.json']) : null;
  const allDeps = pkg ? { ...pkg.dependencies, ...pkg.devDependencies } : {};

  // Test runner detection
  if (allDeps['vitest']) {
    result.runner = 'vitest';
    result.framework = 'vitest';
  } else if (allDeps['jest']) {
    result.runner = 'jest';
    result.framework = 'jest';
  } else if (allDeps['mocha']) {
    result.runner = 'mocha';
    result.framework = 'mocha';
  } else if (allDeps['ava']) {
    result.runner = 'ava';
    result.framework = 'ava';
  } else if (files.some(f => f.name === 'pytest.ini' || f.name === 'conftest.py') ||
    configs['pyproject.toml']?.includes('[tool.pytest')) {
    result.runner = 'pytest';
    result.framework = 'pytest';
  } else if (files.some(f => f.name === '.rspec')) {
    result.runner = 'rspec';
    result.framework = 'rspec';
  } else if (configs['go.mod']) {
    result.runner = 'go test';
    result.framework = 'go test';
  } else if (configs['Cargo.toml']) {
    result.runner = 'cargo test';
    result.framework = 'cargo test';
  }

  // E2E / integration testing
  if (allDeps['@playwright/test'] || allDeps['playwright']) {
    result.e2e = 'playwright';
  } else if (allDeps['cypress']) {
    result.e2e = 'cypress';
  }

  // Testing library
  if (allDeps['@testing-library/react']) {
    result.testingLibrary = 'react';
  } else if (allDeps['@testing-library/vue']) {
    result.testingLibrary = 'vue';
  }

  // Detect test file patterns
  const testFiles = files.filter(f =>
    f.name.includes('.test.') || f.name.includes('.spec.') ||
    f.name.includes('_test.') || f.name.startsWith('test_') ||
    f.dir.includes('__tests__') || f.dir.includes('test/') || f.dir.includes('tests/')
  );

  if (testFiles.length > 0) {
    // Check if tests are colocated with source
    const testDirs = new Set(testFiles.map(f => f.dir.split('/')[0]));
    const srcDirs = new Set(files.filter(f => !f.name.includes('.test.') && !f.name.includes('.spec.')).map(f => f.dir.split('/')[0]));
    result.colocated = [...testDirs].some(d => srcDirs.has(d) && d !== '__tests__' && d !== 'test' && d !== 'tests');

    // Detect naming pattern
    if (testFiles.some(f => f.name.includes('.test.'))) result.patterns.push('.test.*');
    if (testFiles.some(f => f.name.includes('.spec.'))) result.patterns.push('.spec.*');
    if (testFiles.some(f => f.name.includes('_test.'))) result.patterns.push('_test.*');
    if (testFiles.some(f => f.name.startsWith('test_'))) result.patterns.push('test_*');

    // Detect test directory
    if (files.some(f => f.dir.startsWith('__tests__'))) result.directory = '__tests__/';
    else if (files.some(f => f.dir.startsWith('test'))) result.directory = 'test/';
    else if (files.some(f => f.dir.startsWith('tests'))) result.directory = 'tests/';
  }

  result.fileCount = testFiles.length;

  return result;
}

function tryParse(json) {
  try { return JSON.parse(json); } catch { return null; }
}
