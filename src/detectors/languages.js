const LANG_MAP = {
  '.js':     { name: 'JavaScript', category: 'frontend' },
  '.jsx':    { name: 'JavaScript (JSX)', category: 'frontend' },
  '.ts':     { name: 'TypeScript', category: 'frontend' },
  '.tsx':    { name: 'TypeScript (TSX)', category: 'frontend' },
  '.mjs':    { name: 'JavaScript (ESM)', category: 'frontend' },
  '.cjs':    { name: 'JavaScript (CJS)', category: 'frontend' },
  '.vue':    { name: 'Vue', category: 'frontend' },
  '.svelte': { name: 'Svelte', category: 'frontend' },
  '.py':     { name: 'Python', category: 'backend' },
  '.rb':     { name: 'Ruby', category: 'backend' },
  '.go':     { name: 'Go', category: 'backend' },
  '.rs':     { name: 'Rust', category: 'backend' },
  '.java':   { name: 'Java', category: 'backend' },
  '.kt':     { name: 'Kotlin', category: 'backend' },
  '.scala':  { name: 'Scala', category: 'backend' },
  '.cs':     { name: 'C#', category: 'backend' },
  '.php':    { name: 'PHP', category: 'backend' },
  '.swift':  { name: 'Swift', category: 'mobile' },
  '.dart':   { name: 'Dart', category: 'mobile' },
  '.ex':     { name: 'Elixir', category: 'backend' },
  '.exs':    { name: 'Elixir', category: 'backend' },
  '.erl':    { name: 'Erlang', category: 'backend' },
  '.zig':    { name: 'Zig', category: 'systems' },
  '.c':      { name: 'C', category: 'systems' },
  '.cpp':    { name: 'C++', category: 'systems' },
  '.h':      { name: 'C/C++ Header', category: 'systems' },
  '.lua':    { name: 'Lua', category: 'scripting' },
  '.r':      { name: 'R', category: 'data' },
  '.sql':    { name: 'SQL', category: 'data' },
  '.html':   { name: 'HTML', category: 'markup' },
  '.css':    { name: 'CSS', category: 'styles' },
  '.scss':   { name: 'SCSS', category: 'styles' },
  '.less':   { name: 'Less', category: 'styles' },
  '.md':     { name: 'Markdown', category: 'docs' },
  '.mdx':    { name: 'MDX', category: 'docs' },
  '.yaml':   { name: 'YAML', category: 'config' },
  '.yml':    { name: 'YAML', category: 'config' },
  '.toml':   { name: 'TOML', category: 'config' },
  '.json':   { name: 'JSON', category: 'config' },
  '.sh':     { name: 'Shell', category: 'scripting' },
  '.bash':   { name: 'Bash', category: 'scripting' },
};

/**
 * Detect languages used in the project, sorted by file count
 */
export function detectLanguages(files, configs) {
  const counts = new Map();

  for (const file of files) {
    const lang = LANG_MAP[file.ext];
    if (!lang) continue;

    const key = lang.name.replace(/ \(.*\)/, ''); // Normalize JSX/CJS/ESM variants
    if (!counts.has(key)) {
      counts.set(key, { name: key, category: lang.category, fileCount: 0, totalSize: 0 });
    }
    const entry = counts.get(key);
    entry.fileCount++;
    entry.totalSize += file.size;
  }

  // Check for TypeScript config
  if (configs['tsconfig.json'] || configs['jsconfig.json']) {
    const ts = counts.get('TypeScript');
    if (ts) ts.primary = true;
  }

  return Array.from(counts.values())
    .filter(l => !['Markdown', 'JSON', 'YAML', 'TOML', 'HTML', 'CSS', 'SCSS', 'Less'].includes(l.name))
    .sort((a, b) => b.fileCount - a.fileCount)
    .slice(0, 5);
}
