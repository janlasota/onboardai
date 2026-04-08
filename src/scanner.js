import { readdir, stat, readFile } from 'node:fs/promises';
import { join, basename, extname, relative } from 'node:path';
import { detectLanguages } from './detectors/languages.js';
import { detectFrameworks } from './detectors/frameworks.js';
import { detectPackageManager } from './detectors/packageManager.js';
import { detectTesting } from './detectors/testing.js';
import { detectStructure } from './detectors/structure.js';
import { inferConventions } from './analyzers/conventions.js';

const IGNORE_DIRS = new Set([
  'node_modules', '.git', '.svn', '.hg', 'dist', 'build', 'out',
  '.next', '.nuxt', '.output', '__pycache__', '.venv', 'venv',
  'env', '.env', 'vendor', 'target', 'coverage', '.cache',
  '.turbo', '.vercel', '.netlify', 'tmp', 'temp',
]);

const IGNORE_FILES = new Set([
  '.DS_Store', 'Thumbs.db', 'package-lock.json', 'yarn.lock',
  'pnpm-lock.yaml', 'Cargo.lock', 'Gemfile.lock', 'poetry.lock',
]);

/**
 * Walk a directory tree and collect file metadata
 */
async function walkDir(dir, rootDir, maxDepth = 10, currentDepth = 0) {
  const files = [];
  if (currentDepth > maxDepth) return files;

  let entries;
  try {
    entries = await readdir(dir, { withFileTypes: true });
  } catch {
    return files;
  }

  for (const entry of entries) {
    const fullPath = join(dir, entry.name);
    const relPath = relative(rootDir, fullPath);

    if (entry.isDirectory()) {
      if (IGNORE_DIRS.has(entry.name) || entry.name.startsWith('.')) continue;
      const subFiles = await walkDir(fullPath, rootDir, maxDepth, currentDepth + 1);
      files.push(...subFiles);
    } else if (entry.isFile()) {
      if (IGNORE_FILES.has(entry.name)) continue;
      const ext = extname(entry.name).toLowerCase();
      const fileStat = await stat(fullPath).catch(() => null);
      files.push({
        path: fullPath,
        relativePath: relPath,
        name: entry.name,
        ext,
        size: fileStat?.size || 0,
        dir: relative(rootDir, dir),
      });
    }
  }

  return files;
}

/**
 * Read key config files from the project root
 */
async function readConfigFiles(rootDir) {
  const configFileNames = [
    'package.json', 'tsconfig.json', 'jsconfig.json',
    'requirements.txt', 'pyproject.toml', 'setup.py', 'setup.cfg',
    'go.mod', 'go.sum',
    'Cargo.toml',
    'Gemfile', 'Rakefile',
    'composer.json',
    'pubspec.yaml',
    'build.gradle', 'build.gradle.kts', 'pom.xml',
    '.eslintrc', '.eslintrc.js', '.eslintrc.json', '.eslintrc.yml',
    '.prettierrc', '.prettierrc.js', '.prettierrc.json',
    'biome.json',
    'tailwind.config.js', 'tailwind.config.ts', 'tailwind.config.mjs',
    'next.config.js', 'next.config.mjs', 'next.config.ts',
    'nuxt.config.ts', 'nuxt.config.js',
    'vite.config.js', 'vite.config.ts',
    'svelte.config.js',
    'astro.config.mjs', 'astro.config.ts',
    'angular.json',
    'docker-compose.yml', 'docker-compose.yaml', 'Dockerfile',
    '.env.example', '.env.sample',
    'Makefile',
    'turbo.json', 'nx.json', 'lerna.json',
  ];

  const configs = {};

  for (const name of configFileNames) {
    const filePath = join(rootDir, name);
    try {
      const content = await readFile(filePath, 'utf-8');
      configs[name] = content;
    } catch {
      // File doesn't exist, skip
    }
  }

  return configs;
}

/**
 * Sample a few source files for convention analysis
 */
async function sampleSourceFiles(files, maxSamples = 15) {
  const sourceExts = new Set([
    '.js', '.jsx', '.ts', '.tsx', '.vue', '.svelte',
    '.py', '.rb', '.go', '.rs', '.java', '.kt',
    '.php', '.cs', '.swift',
  ]);

  const sourceFiles = files.filter(f => sourceExts.has(f.ext) && f.size < 50000);

  // Pick a diverse sample: some from root-level dirs, some deeper
  const sampled = [];
  const byDir = new Map();

  for (const f of sourceFiles) {
    const topDir = f.dir.split('/')[0] || '_root';
    if (!byDir.has(topDir)) byDir.set(topDir, []);
    byDir.get(topDir).push(f);
  }

  for (const [, dirFiles] of byDir) {
    const take = Math.min(3, dirFiles.length);
    for (let i = 0; i < take && sampled.length < maxSamples; i++) {
      sampled.push(dirFiles[i]);
    }
  }

  const samples = [];
  for (const f of sampled) {
    try {
      const content = await readFile(f.path, 'utf-8');
      samples.push({ ...f, content });
    } catch {
      // Skip unreadable files
    }
  }

  return samples;
}

/**
 * Main scan function — orchestrates all detection
 */
export async function scanProject(rootDir, opts = {}) {
  const projectName = basename(rootDir) === '.' ? basename(process.cwd()) : basename(rootDir);

  // Step 1: Walk the file tree
  const files = await walkDir(rootDir, rootDir);

  // Step 2: Read config files
  const configs = await readConfigFiles(rootDir);

  // Step 3: Sample source files for convention analysis
  const samples = await sampleSourceFiles(files);

  // Step 4: Run detectors
  const languages = detectLanguages(files, configs);
  const frameworks = detectFrameworks(files, configs);
  const packageManager = detectPackageManager(rootDir, configs);
  const testing = detectTesting(files, configs);
  const structure = detectStructure(files, rootDir);

  // Step 5: Infer conventions from sampled files
  const conventions = inferConventions(samples, configs, frameworks);

  return {
    project: {
      name: projectName,
      rootDir,
    },
    languages,
    frameworks,
    packageManager,
    testing,
    structure,
    conventions,
    configs: Object.keys(configs),
    _raw: {
      files,
      configs,
      samples,
    },
  };
}
