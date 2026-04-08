/**
 * Build common context sections from scan data.
 * Each generator can pick which sections to include and customize the wrapper.
 */

export function buildProjectOverview(scan) {
  const lines = [];
  lines.push(`## Project Overview`);
  lines.push('');
  lines.push(`This is a ${describeStack(scan)} project.`);
  lines.push('');

  if (scan.languages.length > 0) {
    const langs = scan.languages.map(l => l.name).join(', ');
    lines.push(`**Languages:** ${langs}`);
  }

  if (scan.frameworks.length > 0) {
    const fws = scan.frameworks.map(f => f.version ? `${f.name} (${f.version})` : f.name).join(', ');
    lines.push(`**Frameworks & Libraries:** ${fws}`);
  }

  if (scan.packageManager) {
    lines.push(`**Package Manager:** ${scan.packageManager}`);
  }

  lines.push('');
  return lines.join('\n');
}

export function buildStructureSection(scan) {
  const lines = [];
  lines.push(`## Project Structure`);
  lines.push('');
  lines.push(`Architecture pattern: **${scan.structure.pattern}**`);
  lines.push('');

  if (scan.structure.keyDirs.length > 0) {
    lines.push('Key directories:');
    for (const dir of scan.structure.keyDirs) {
      lines.push(`- \`${dir}/\``);
    }
    lines.push('');
  }

  if (scan.structure.topLevelDirs.length > 0) {
    lines.push('Top-level structure:');
    for (const dir of scan.structure.topLevelDirs.slice(0, 15)) {
      lines.push(`- \`${dir}/\``);
    }
    lines.push('');
  }

  return lines.join('\n');
}

export function buildConventionsSection(scan) {
  if (scan.conventions.length === 0) return '';

  const lines = [];
  lines.push(`## Coding Conventions`);
  lines.push('');
  for (const conv of scan.conventions) {
    lines.push(`- ${conv}`);
  }
  lines.push('');
  return lines.join('\n');
}

export function buildTestingSection(scan) {
  if (!scan.testing.runner) return '';

  const lines = [];
  lines.push(`## Testing`);
  lines.push('');
  lines.push(`- Test runner: **${scan.testing.runner}**`);

  if (scan.testing.e2e) {
    lines.push(`- E2E testing: **${scan.testing.e2e}**`);
  }
  if (scan.testing.testingLibrary) {
    lines.push(`- Testing library: **@testing-library/${scan.testing.testingLibrary}**`);
  }
  if (scan.testing.patterns.length > 0) {
    lines.push(`- Test file patterns: ${scan.testing.patterns.map(p => `\`${p}\``).join(', ')}`);
  }
  if (scan.testing.colocated) {
    lines.push(`- Tests are colocated with source files`);
  } else if (scan.testing.directory) {
    lines.push(`- Tests are in \`${scan.testing.directory}\``);
  }

  lines.push('');
  return lines.join('\n');
}

export function buildFrameworkGuidelines(scan) {
  const lines = [];
  const frameworkNames = scan.frameworks.map(f => f.name);

  // Next.js specific
  const nextjs = scan.frameworks.find(f => f.name === 'Next.js');
  if (nextjs) {
    lines.push(`## Next.js Guidelines`);
    lines.push('');
    if (nextjs.meta?.appRouter) {
      lines.push('- This project uses the **App Router** (Next.js 13+)');
      lines.push('- Default to Server Components; add `"use client"` only when needed (hooks, event handlers, browser APIs)');
      lines.push('- Use `app/` directory routing with `page.tsx`, `layout.tsx`, `loading.tsx`, `error.tsx` conventions');
      lines.push('- Prefer Server Actions for form handling and mutations');
      lines.push('- Use `next/image` for images and `next/link` for navigation');
    } else {
      lines.push('- This project uses the **Pages Router**');
      lines.push('- Use `getServerSideProps` / `getStaticProps` for data fetching');
    }
    lines.push('');
  }

  // React specific
  if (frameworkNames.includes('React') && !frameworkNames.includes('Next.js')) {
    lines.push(`## React Guidelines`);
    lines.push('');
    lines.push('- Use functional components with hooks');
    lines.push('- Prefer composition over inheritance');
    lines.push('- Keep components focused on a single responsibility');
    lines.push('');
  }

  // Vue specific
  if (frameworkNames.includes('Vue') || frameworkNames.includes('Nuxt')) {
    lines.push(`## Vue Guidelines`);
    lines.push('');
    lines.push('- Use Composition API with `<script setup>` syntax');
    lines.push('- Use `ref()` and `reactive()` for state management');
    lines.push('');
  }

  // Tailwind
  if (frameworkNames.includes('Tailwind CSS')) {
    lines.push(`## Styling`);
    lines.push('');
    lines.push('- Use **Tailwind CSS** utility classes for styling');
    lines.push('- Avoid custom CSS unless absolutely necessary');
    lines.push('- Use Tailwind config for theme customization');
    lines.push('');
  }

  // Prisma
  if (frameworkNames.includes('Prisma')) {
    lines.push(`## Database`);
    lines.push('');
    lines.push('- ORM: **Prisma**');
    lines.push('- Schema defined in `prisma/schema.prisma`');
    lines.push('- Run `npx prisma generate` after schema changes');
    lines.push('- Use Prisma Client for all database operations');
    lines.push('');
  }

  // Drizzle
  if (frameworkNames.includes('Drizzle')) {
    lines.push(`## Database`);
    lines.push('');
    lines.push('- ORM: **Drizzle ORM**');
    lines.push('- Use Drizzle schema definitions and query builder');
    lines.push('');
  }

  // Python frameworks
  if (frameworkNames.includes('FastAPI')) {
    lines.push(`## FastAPI Guidelines`);
    lines.push('');
    lines.push('- Use Pydantic models for request/response validation');
    lines.push('- Use dependency injection for shared resources');
    lines.push('- Use async endpoints where possible');
    lines.push('');
  }

  if (frameworkNames.includes('Django')) {
    lines.push(`## Django Guidelines`);
    lines.push('');
    lines.push('- Follow Django project conventions (apps, models, views, urls)');
    lines.push('- Use Django ORM for database operations');
    lines.push('- Use class-based views where appropriate');
    lines.push('');
  }

  // Rails
  if (frameworkNames.includes('Ruby on Rails')) {
    lines.push(`## Rails Guidelines`);
    lines.push('');
    lines.push('- Follow Rails conventions (MVC, RESTful routes, Active Record)');
    lines.push('- Use Rails generators for scaffolding');
    lines.push('- Keep controllers thin, models fat');
    lines.push('');
  }

  return lines.join('\n');
}

/**
 * Describe the tech stack in a human-readable string
 */
function describeStack(scan) {
  const parts = [];

  const primaryLang = scan.languages[0];
  if (primaryLang) parts.push(primaryLang.name);

  const mainFramework = scan.frameworks.find(f =>
    f.tags?.includes('fullstack') || f.tags?.includes('frontend') || f.tags?.includes('backend')
  );
  if (mainFramework) parts.push(mainFramework.name);

  if (parts.length === 0) return 'software';
  return parts.join(' / ');
}
