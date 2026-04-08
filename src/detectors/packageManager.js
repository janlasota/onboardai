import { existsSync } from 'node:fs';
import { join } from 'node:path';

/**
 * Detect which package manager the project uses
 */
export function detectPackageManager(rootDir, configs) {
  // Lock file detection (most reliable)
  if (existsSync(join(rootDir, 'pnpm-lock.yaml'))) return 'pnpm';
  if (existsSync(join(rootDir, 'bun.lockb')) || existsSync(join(rootDir, 'bun.lock'))) return 'bun';
  if (existsSync(join(rootDir, 'yarn.lock'))) return 'yarn';
  if (existsSync(join(rootDir, 'package-lock.json'))) return 'npm';

  // packageManager field in package.json
  if (configs['package.json']) {
    try {
      const pkg = JSON.parse(configs['package.json']);
      if (pkg.packageManager) {
        if (pkg.packageManager.startsWith('pnpm')) return 'pnpm';
        if (pkg.packageManager.startsWith('yarn')) return 'yarn';
        if (pkg.packageManager.startsWith('bun')) return 'bun';
        if (pkg.packageManager.startsWith('npm')) return 'npm';
      }
    } catch {}
  }

  // Python
  if (configs['pyproject.toml']) {
    if (configs['pyproject.toml'].includes('[tool.poetry]')) return 'poetry';
    if (configs['pyproject.toml'].includes('[tool.pdm]')) return 'pdm';
    return 'pip';
  }
  if (configs['requirements.txt']) return 'pip';

  // Ruby
  if (configs['Gemfile']) return 'bundler';

  // Go
  if (configs['go.mod']) return 'go modules';

  // Rust
  if (configs['Cargo.toml']) return 'cargo';

  // PHP
  if (configs['composer.json']) return 'composer';

  // Dart
  if (configs['pubspec.yaml']) return 'pub';

  // Java/Kotlin
  if (configs['build.gradle'] || configs['build.gradle.kts']) return 'gradle';
  if (configs['pom.xml']) return 'maven';

  return null;
}
