/**
 * Infer coding conventions from sampled source files
 */
export function inferConventions(samples, configs, frameworks) {
  const conventions = [];
  const jsFiles = samples.filter(f => ['.js', '.jsx', '.ts', '.tsx', '.mjs'].includes(f.ext));
  const pyFiles = samples.filter(f => f.ext === '.py');

  if (jsFiles.length > 0) {
    conventions.push(...analyzeJsConventions(jsFiles, configs, frameworks));
  }

  if (pyFiles.length > 0) {
    conventions.push(...analyzePyConventions(pyFiles, configs));
  }

  // File naming conventions (language-agnostic)
  conventions.push(...analyzeFileNaming(samples));

  return conventions;
}

function analyzeJsConventions(files, configs, frameworks) {
  const conventions = [];
  let defaultExports = 0;
  let namedExports = 0;
  let arrowFunctions = 0;
  let regularFunctions = 0;
  let semicolons = 0;
  let noSemicolons = 0;
  let singleQuotes = 0;
  let doubleQuotes = 0;
  let constCount = 0;
  let letCount = 0;
  let varCount = 0;
  let asyncAwait = 0;
  let thenChains = 0;
  let interfaceCount = 0;
  let typeCount = 0;
  let tabIndent = 0;
  let spaceIndent2 = 0;
  let spaceIndent4 = 0;

  for (const file of files) {
    const c = file.content;
    const lines = c.split('\n');

    // Export style
    if (c.includes('export default')) defaultExports++;
    if (/export\s+(const|function|class|enum|interface|type)\s/.test(c)) namedExports++;

    // Function style
    const arrowMatches = c.match(/=>\s*[{(]/g);
    const funcMatches = c.match(/function\s+\w/g);
    if (arrowMatches) arrowFunctions += arrowMatches.length;
    if (funcMatches) regularFunctions += funcMatches.length;

    // Semicolons (check non-empty, non-comment lines)
    const codeLines = lines.filter(l => l.trim() && !l.trim().startsWith('//') && !l.trim().startsWith('*'));
    const endingSemicolon = codeLines.filter(l => l.trimEnd().endsWith(';')).length;
    const notEndingSemicolon = codeLines.filter(l => {
      const t = l.trimEnd();
      return t && !t.endsWith(';') && !t.endsWith('{') && !t.endsWith('}') && !t.endsWith(',') && !t.endsWith('(') && !t.endsWith(')');
    }).length;
    semicolons += endingSemicolon;
    noSemicolons += notEndingSemicolon;

    // Quote style
    const singles = (c.match(/'/g) || []).length;
    const doubles = (c.match(/"/g) || []).length;
    singleQuotes += singles;
    doubleQuotes += doubles;

    // Variable declarations
    constCount += (c.match(/\bconst\s/g) || []).length;
    letCount += (c.match(/\blet\s/g) || []).length;
    varCount += (c.match(/\bvar\s/g) || []).length;

    // Async patterns
    if (c.includes('async ') || c.includes('await ')) asyncAwait++;
    if (c.includes('.then(')) thenChains++;

    // TypeScript: interface vs type
    if (file.ext === '.ts' || file.ext === '.tsx') {
      interfaceCount += (c.match(/\binterface\s+\w/g) || []).length;
      typeCount += (c.match(/\btype\s+\w+\s*=/g) || []).length;
    }

    // Indentation
    for (const line of lines.slice(0, 50)) {
      if (line.startsWith('\t')) tabIndent++;
      else if (line.startsWith('  ') && !line.startsWith('    ')) spaceIndent2++;
      else if (line.startsWith('    ')) spaceIndent4++;
    }
  }

  // Determine conventions
  if (defaultExports > namedExports * 1.5) {
    conventions.push('Prefers default exports');
  } else if (namedExports > defaultExports * 1.5) {
    conventions.push('Prefers named exports over default exports');
  }

  if (arrowFunctions > regularFunctions * 2) {
    conventions.push('Uses arrow functions predominantly');
  } else if (regularFunctions > arrowFunctions * 2) {
    conventions.push('Uses function declarations predominantly');
  }

  if (semicolons > noSemicolons * 3) {
    conventions.push('Uses semicolons');
  } else if (noSemicolons > semicolons) {
    conventions.push('No semicolons (ASI style)');
  }

  if (singleQuotes > doubleQuotes * 1.5) {
    conventions.push('Single quotes for strings');
  } else if (doubleQuotes > singleQuotes * 1.5) {
    conventions.push('Double quotes for strings');
  }

  if (constCount > 0 && letCount >= 0 && varCount === 0) {
    conventions.push('Uses const/let (no var)');
  }

  if (asyncAwait > thenChains * 2) {
    conventions.push('Prefers async/await over .then() chains');
  }

  if (interfaceCount > 0 || typeCount > 0) {
    if (interfaceCount > typeCount * 2) {
      conventions.push('TypeScript: prefers interface over type');
    } else if (typeCount > interfaceCount * 2) {
      conventions.push('TypeScript: prefers type aliases over interface');
    }
  }

  if (tabIndent > spaceIndent2 + spaceIndent4) {
    conventions.push('Tab indentation');
  } else if (spaceIndent2 > spaceIndent4 * 1.5) {
    conventions.push('2-space indentation');
  } else if (spaceIndent4 > spaceIndent2 * 1.5) {
    conventions.push('4-space indentation');
  }

  // Linting / formatting tools
  if (configs['.eslintrc'] || configs['.eslintrc.js'] || configs['.eslintrc.json'] || configs['.eslintrc.yml']) {
    conventions.push('Uses ESLint for linting');
  }
  if (configs['.prettierrc'] || configs['.prettierrc.js'] || configs['.prettierrc.json']) {
    conventions.push('Uses Prettier for formatting');
  }
  if (configs['biome.json']) {
    conventions.push('Uses Biome for linting and formatting');
  }

  return conventions;
}

function analyzePyConventions(files, configs) {
  const conventions = [];
  let typehints = 0;
  let noTypehints = 0;
  let dataclasses = 0;
  let pydantic = 0;
  let fstrings = 0;
  let formatStrings = 0;

  for (const file of files) {
    const c = file.content;

    // Type hints
    if (/def\s+\w+\(.*:\s*\w/.test(c) || /\)\s*->\s*\w/.test(c)) typehints++;
    else if (/def\s+\w+\(/.test(c)) noTypehints++;

    if (c.includes('@dataclass')) dataclasses++;
    if (c.includes('BaseModel') || c.includes('pydantic')) pydantic++;
    if (c.includes("f'") || c.includes('f"')) fstrings++;
    if (c.includes('.format(')) formatStrings++;
  }

  if (typehints > noTypehints) conventions.push('Uses Python type hints');
  if (dataclasses > 0) conventions.push('Uses dataclasses');
  if (pydantic > 0) conventions.push('Uses Pydantic models');
  if (fstrings > formatStrings) conventions.push('Uses f-strings for formatting');

  return conventions;
}

function analyzeFileNaming(samples) {
  const conventions = [];
  const names = samples.map(f => f.name.replace(f.ext, ''));

  const kebab = names.filter(n => /^[a-z][a-z0-9-]*$/.test(n)).length;
  const camel = names.filter(n => /^[a-z][a-zA-Z0-9]*$/.test(n) && /[A-Z]/.test(n)).length;
  const pascal = names.filter(n => /^[A-Z][a-zA-Z0-9]*$/.test(n)).length;
  const snake = names.filter(n => /^[a-z][a-z0-9_]*$/.test(n) && n.includes('_')).length;

  const total = names.length;
  if (total === 0) return conventions;

  if (kebab / total > 0.5) conventions.push('File naming: kebab-case');
  else if (pascal / total > 0.4) conventions.push('File naming: PascalCase');
  else if (camel / total > 0.4) conventions.push('File naming: camelCase');
  else if (snake / total > 0.4) conventions.push('File naming: snake_case');

  // Check for barrel files (index.ts/js pattern)
  const indexFiles = samples.filter(f => f.name.startsWith('index.'));
  if (indexFiles.length > 2) {
    conventions.push('Uses barrel files (index.ts/js) for module exports');
  }

  return conventions;
}
