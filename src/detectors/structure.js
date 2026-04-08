/**
 * Analyze project directory structure and infer patterns
 */
export function detectStructure(files, rootDir) {
  const dirs = new Set();
  const topLevelDirs = new Set();

  for (const f of files) {
    const parts = f.dir.split('/').filter(Boolean);
    if (parts.length > 0) {
      topLevelDirs.add(parts[0]);
      for (let i = 0; i < parts.length; i++) {
        dirs.add(parts.slice(0, i + 1).join('/'));
      }
    }
  }

  // Detect common structural patterns
  let pattern = 'flat';

  const hasSrc = topLevelDirs.has('src');
  const hasApp = topLevelDirs.has('app');
  const hasPages = topLevelDirs.has('pages');
  const hasLib = topLevelDirs.has('lib');
  const hasComponents = dirs.has('src/components') || dirs.has('components') || dirs.has('app/components');
  const hasApi = dirs.has('src/api') || dirs.has('api') || dirs.has('app/api') || dirs.has('pages/api');
  const hasModels = dirs.has('src/models') || dirs.has('models') || dirs.has('app/models');
  const hasControllers = dirs.has('controllers') || dirs.has('app/controllers') || dirs.has('src/controllers');
  const hasServices = dirs.has('src/services') || dirs.has('services');
  const hasUtils = dirs.has('src/utils') || dirs.has('utils') || dirs.has('src/lib') || dirs.has('lib');
  const hasHooks = dirs.has('src/hooks') || dirs.has('hooks');
  const hasStore = dirs.has('src/store') || dirs.has('store') || dirs.has('src/stores') || dirs.has('stores');
  const hasTypes = dirs.has('src/types') || dirs.has('types');
  const hasFeatures = dirs.has('src/features') || dirs.has('features') || dirs.has('src/modules') || dirs.has('modules');

  if (hasFeatures) {
    pattern = 'feature-based';
  } else if (hasControllers && hasModels) {
    pattern = 'MVC';
  } else if (hasApp && !hasSrc && (hasComponents || hasApi)) {
    pattern = 'app-directory (Next.js-style)';
  } else if (hasPages && !hasApp) {
    pattern = 'pages-based';
  } else if (hasSrc && hasComponents) {
    pattern = 'component-based (src/)';
  } else if (hasSrc) {
    pattern = 'src-based';
  } else if (topLevelDirs.size <= 3) {
    pattern = 'flat';
  } else {
    pattern = 'custom';
  }

  // Identify key directories
  const keyDirs = [];
  if (hasComponents) keyDirs.push('components');
  if (hasApi) keyDirs.push('api');
  if (hasModels) keyDirs.push('models');
  if (hasControllers) keyDirs.push('controllers');
  if (hasServices) keyDirs.push('services');
  if (hasUtils) keyDirs.push('utils/lib');
  if (hasHooks) keyDirs.push('hooks');
  if (hasStore) keyDirs.push('store/state');
  if (hasTypes) keyDirs.push('types');
  if (hasFeatures) keyDirs.push('features/modules');

  return {
    pattern,
    hasSrc,
    topLevelDirs: Array.from(topLevelDirs).sort(),
    keyDirs,
    totalFiles: files.length,
    totalDirs: dirs.size,
  };
}
