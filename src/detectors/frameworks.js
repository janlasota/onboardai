/**
 * Framework detection rules. Each rule has:
 * - name: display name
 * - detect: function(files, configs) => boolean
 * - version: function(configs) => string|null
 * - tags: metadata for template selection
 */
const FRAMEWORK_RULES = [
  // ── JavaScript / TypeScript Frameworks ──
  {
    name: 'Next.js',
    detect: (files, configs) =>
      !!configs['next.config.js'] || !!configs['next.config.mjs'] || !!configs['next.config.ts'] ||
      hasDep(configs, 'next'),
    version: (configs) => getDepVersion(configs, 'next'),
    tags: ['react', 'ssr', 'fullstack', 'javascript'],
    meta: (configs) => {
      const v = getDepVersion(configs, 'next');
      const major = v ? parseInt(v.replace(/[^0-9]/, '')) : null;
      return {
        appRouter: major >= 13,
        version: v,
      };
    },
  },
  {
    name: 'React',
    detect: (files, configs) => hasDep(configs, 'react') && !hasDep(configs, 'next') && !hasDep(configs, 'gatsby'),
    version: (configs) => getDepVersion(configs, 'react'),
    tags: ['react', 'frontend', 'javascript'],
  },
  {
    name: 'Vue',
    detect: (files, configs) => hasDep(configs, 'vue') || files.some(f => f.ext === '.vue'),
    version: (configs) => getDepVersion(configs, 'vue'),
    tags: ['vue', 'frontend', 'javascript'],
  },
  {
    name: 'Nuxt',
    detect: (files, configs) => !!configs['nuxt.config.ts'] || !!configs['nuxt.config.js'] || hasDep(configs, 'nuxt'),
    version: (configs) => getDepVersion(configs, 'nuxt'),
    tags: ['vue', 'ssr', 'fullstack', 'javascript'],
  },
  {
    name: 'Svelte',
    detect: (files, configs) => hasDep(configs, 'svelte') || files.some(f => f.ext === '.svelte'),
    version: (configs) => getDepVersion(configs, 'svelte'),
    tags: ['svelte', 'frontend', 'javascript'],
  },
  {
    name: 'SvelteKit',
    detect: (files, configs) => hasDep(configs, '@sveltejs/kit'),
    version: (configs) => getDepVersion(configs, '@sveltejs/kit'),
    tags: ['svelte', 'ssr', 'fullstack', 'javascript'],
  },
  {
    name: 'Astro',
    detect: (files, configs) => !!configs['astro.config.mjs'] || !!configs['astro.config.ts'] || hasDep(configs, 'astro'),
    version: (configs) => getDepVersion(configs, 'astro'),
    tags: ['astro', 'ssg', 'javascript'],
  },
  {
    name: 'Angular',
    detect: (files, configs) => !!configs['angular.json'] || hasDep(configs, '@angular/core'),
    version: (configs) => getDepVersion(configs, '@angular/core'),
    tags: ['angular', 'frontend', 'typescript'],
  },
  {
    name: 'Express',
    detect: (files, configs) => hasDep(configs, 'express'),
    version: (configs) => getDepVersion(configs, 'express'),
    tags: ['express', 'backend', 'api', 'javascript'],
  },
  {
    name: 'Fastify',
    detect: (files, configs) => hasDep(configs, 'fastify'),
    version: (configs) => getDepVersion(configs, 'fastify'),
    tags: ['fastify', 'backend', 'api', 'javascript'],
  },
  {
    name: 'Hono',
    detect: (files, configs) => hasDep(configs, 'hono'),
    version: (configs) => getDepVersion(configs, 'hono'),
    tags: ['hono', 'backend', 'api', 'javascript', 'edge'],
  },
  {
    name: 'Remix',
    detect: (files, configs) => hasDep(configs, '@remix-run/react') || hasDep(configs, 'remix'),
    version: (configs) => getDepVersion(configs, '@remix-run/react'),
    tags: ['react', 'ssr', 'fullstack', 'javascript'],
  },
  {
    name: 'Gatsby',
    detect: (files, configs) => hasDep(configs, 'gatsby'),
    version: (configs) => getDepVersion(configs, 'gatsby'),
    tags: ['react', 'ssg', 'javascript'],
  },
  {
    name: 'Vite',
    detect: (files, configs) => !!configs['vite.config.js'] || !!configs['vite.config.ts'] || hasDep(configs, 'vite'),
    version: (configs) => getDepVersion(configs, 'vite'),
    tags: ['bundler', 'javascript'],
  },

  // ── CSS / Styling ──
  {
    name: 'Tailwind CSS',
    detect: (files, configs) =>
      !!configs['tailwind.config.js'] || !!configs['tailwind.config.ts'] || !!configs['tailwind.config.mjs'] ||
      hasDep(configs, 'tailwindcss'),
    version: (configs) => getDepVersion(configs, 'tailwindcss'),
    tags: ['css', 'utility-first', 'styling'],
  },

  // ── ORMs / Database ──
  {
    name: 'Prisma',
    detect: (files, configs) => hasDep(configs, 'prisma') || hasDep(configs, '@prisma/client') ||
      files.some(f => f.name === 'schema.prisma'),
    version: (configs) => getDepVersion(configs, 'prisma') || getDepVersion(configs, '@prisma/client'),
    tags: ['orm', 'database', 'javascript'],
  },
  {
    name: 'Drizzle',
    detect: (files, configs) => hasDep(configs, 'drizzle-orm'),
    version: (configs) => getDepVersion(configs, 'drizzle-orm'),
    tags: ['orm', 'database', 'javascript'],
  },

  // ── Python Frameworks ──
  {
    name: 'Django',
    detect: (files, configs) =>
      files.some(f => f.name === 'manage.py' || f.name === 'settings.py') ||
      hasPyDep(configs, 'django') || hasPyDep(configs, 'Django'),
    tags: ['python', 'fullstack', 'backend'],
  },
  {
    name: 'Flask',
    detect: (files, configs) => hasPyDep(configs, 'flask') || hasPyDep(configs, 'Flask'),
    tags: ['python', 'backend', 'api'],
  },
  {
    name: 'FastAPI',
    detect: (files, configs) => hasPyDep(configs, 'fastapi'),
    tags: ['python', 'backend', 'api', 'async'],
  },

  // ── Ruby ──
  {
    name: 'Ruby on Rails',
    detect: (files, configs) =>
      (!!configs['Gemfile'] && configs['Gemfile'].includes('rails')) ||
      (!!configs['Gemfile'] && files.some(f => f.dir.includes('app/controllers'))),
    tags: ['ruby', 'fullstack', 'backend'],
  },

  // ── Go ──
  {
    name: 'Gin',
    detect: (files, configs) => !!configs['go.mod'] && configs['go.mod'].includes('github.com/gin-gonic/gin'),
    tags: ['go', 'backend', 'api'],
  },
  {
    name: 'Echo',
    detect: (files, configs) => !!configs['go.mod'] && configs['go.mod'].includes('github.com/labstack/echo'),
    tags: ['go', 'backend', 'api'],
  },
  {
    name: 'Fiber',
    detect: (files, configs) => !!configs['go.mod'] && configs['go.mod'].includes('github.com/gofiber/fiber'),
    tags: ['go', 'backend', 'api'],
  },

  // ── Rust ──
  {
    name: 'Actix Web',
    detect: (files, configs) => !!configs['Cargo.toml'] && configs['Cargo.toml'].includes('actix-web'),
    tags: ['rust', 'backend', 'api'],
  },
  {
    name: 'Axum',
    detect: (files, configs) => !!configs['Cargo.toml'] && configs['Cargo.toml'].includes('axum'),
    tags: ['rust', 'backend', 'api'],
  },

  // ── Mobile ──
  {
    name: 'React Native',
    detect: (files, configs) => hasDep(configs, 'react-native'),
    version: (configs) => getDepVersion(configs, 'react-native'),
    tags: ['react', 'mobile', 'javascript'],
  },
  {
    name: 'Flutter',
    detect: (files, configs) => !!configs['pubspec.yaml'] && configs['pubspec.yaml'].includes('flutter'),
    tags: ['dart', 'mobile'],
  },
  {
    name: 'Expo',
    detect: (files, configs) => hasDep(configs, 'expo'),
    version: (configs) => getDepVersion(configs, 'expo'),
    tags: ['react', 'mobile', 'javascript', 'expo'],
  },

  // ── Monorepo Tools ──
  {
    name: 'Turborepo',
    detect: (files, configs) => !!configs['turbo.json'] || hasDep(configs, 'turbo'),
    tags: ['monorepo', 'tooling'],
  },
  {
    name: 'Nx',
    detect: (files, configs) => !!configs['nx.json'] || hasDep(configs, 'nx'),
    tags: ['monorepo', 'tooling'],
  },

  // ── Containerization ──
  {
    name: 'Docker',
    detect: (files, configs) =>
      !!configs['Dockerfile'] || !!configs['docker-compose.yml'] || !!configs['docker-compose.yaml'],
    tags: ['docker', 'devops'],
  },
];

// ── Helpers ──

function getPkg(configs) {
  if (!configs['package.json']) return null;
  try { return JSON.parse(configs['package.json']); } catch { return null; }
}

function hasDep(configs, name) {
  const pkg = getPkg(configs);
  if (!pkg) return false;
  return !!(
    pkg.dependencies?.[name] ||
    pkg.devDependencies?.[name] ||
    pkg.peerDependencies?.[name]
  );
}

function getDepVersion(configs, name) {
  const pkg = getPkg(configs);
  if (!pkg) return null;
  return pkg.dependencies?.[name] || pkg.devDependencies?.[name] || pkg.peerDependencies?.[name] || null;
}

function hasPyDep(configs, name) {
  const req = configs['requirements.txt'];
  if (req && req.toLowerCase().includes(name.toLowerCase())) return true;
  const pyproject = configs['pyproject.toml'];
  if (pyproject && pyproject.toLowerCase().includes(name.toLowerCase())) return true;
  return false;
}

/**
 * Detect frameworks used in the project
 */
export function detectFrameworks(files, configs) {
  const detected = [];

  for (const rule of FRAMEWORK_RULES) {
    if (rule.detect(files, configs)) {
      const framework = {
        name: rule.name,
        tags: rule.tags,
      };
      if (rule.version) {
        framework.version = rule.version(configs);
      }
      if (rule.meta) {
        framework.meta = rule.meta(configs);
      }
      detected.push(framework);
    }
  }

  return detected;
}
