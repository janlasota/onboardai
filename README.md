# onboardai

**Auto-generate AI coding assistant context files from your codebase.**

One command. Every AI tool. Stop manually writing `.cursorrules`, `CLAUDE.md`, and `copilot-instructions.md` — let your codebase speak for itself.

```bash
npx onboardai
```

## What It Does

`onboardai` scans your project and generates properly formatted context files for every major AI coding assistant:

| Tool | Output File | Status |
|------|------------|--------|
| **Cursor** | `.cursorrules` | ✅ |
| **Claude Code** | `CLAUDE.md` | ✅ |
| **GitHub Copilot** | `.github/copilot-instructions.md` | ✅ |
| **Windsurf** | `.windsurfrules` | ✅ |
| **Continue.dev** | `.continuerc.json` | ✅ |
| **Aider** | `.aider.conventions.md` | ✅ |

## How It Works

The CLI performs four analysis passes on your codebase:

1. **Stack Detection** — reads `package.json`, `go.mod`, `Cargo.toml`, `requirements.txt`, etc. to identify languages, frameworks, and dependencies.

2. **Structure Analysis** — walks your file tree to detect architectural patterns (App Router, MVC, feature-based, etc.) and key directories.

3. **Convention Inference** — samples source files to detect patterns like export style, quote style, semicolons, naming conventions, indentation, and TypeScript preferences.

4. **Rule Generation** — combines detected signals with framework-specific templates to produce tailored context files for each AI tool.

No API keys required. No network calls. Everything runs locally.

## Quick Start

```bash
# Generate all context files in the current directory
npx onboardai

# Generate only Cursor and Claude files
npx onboardai init --format cursor,claude

# Scan without generating (preview what would be detected)
npx onboardai scan

# Target a different project directory
npx onboardai init ../my-other-project
```

## Installation

```bash
# Use directly with npx (no install needed)
npx onboardai

# Or install globally
npm install -g onboardai

# Or as a dev dependency
npm install -D onboardai
```

## CLI Reference

```
Usage:
  onboardai [command] [directory] [options]
  obi [command] [directory] [options]

Commands:
  init, generate    Scan project and generate context files (default)
  scan              Scan and show analysis without generating files

Options:
  -f, --format <formats>  Target formats (comma-separated)
                           cursor, claude, copilot, windsurf, continue, aider, all
                           Default: all
  -o, --output <dir>      Output directory (default: same as scanned directory)
  -e, --enhance           Use LLM to enhance generated rules (requires ONBOARDAI_API_KEY)
  -v, --version           Show version
  -h, --help              Show help
  --verbose               Show detailed scan output
  --dry-run               Scan without generating files
```

## What Gets Detected

### Languages
JavaScript, TypeScript, Python, Ruby, Go, Rust, Java, Kotlin, C#, PHP, Swift, Dart, Elixir, and more.

### Frameworks

**Frontend:** React, Next.js, Vue, Nuxt, Svelte, SvelteKit, Angular, Astro, Remix, Gatsby

**Backend:** Express, Fastify, Hono, Django, Flask, FastAPI, Rails, Gin, Echo, Fiber, Actix, Axum

**Mobile:** React Native, Expo, Flutter

**CSS:** Tailwind CSS

**ORM:** Prisma, Drizzle

**Monorepo:** Turborepo, Nx

**Tooling:** Vite, Docker

### Conventions
- Export style (default vs named)
- Function style (arrow vs declaration)
- Semicolons vs ASI
- Quote style (single vs double)
- Indentation (tabs, 2-space, 4-space)
- TypeScript preferences (interface vs type)
- File naming (kebab-case, PascalCase, camelCase, snake_case)
- Barrel file usage
- Linting/formatting tools (ESLint, Prettier, Biome)

### Testing
- Runner detection (Vitest, Jest, Mocha, pytest, RSpec, go test, cargo test)
- E2E tools (Playwright, Cypress)
- Testing Library integration
- Test file patterns and location (colocated vs separate directory)

### Structure
- Architecture patterns (App Router, MVC, feature-based, component-based, etc.)
- Key directory identification
- Package manager detection (npm, yarn, pnpm, bun, pip, poetry, cargo, go modules, etc.)

## Example Output

Running against a Next.js 14 + Prisma + Tailwind project:

```
  ┌──────────────────────────────────────────┐
  │            onboardai v0.1.0              │
  │   Onboard AI to your codebase in seconds │
  └──────────────────────────────────────────┘

  Scanning: /home/user/my-saas-app

  Project Analysis
  ─────────────────────────────────────
  Name:        my-saas-app
  Languages:   TypeScript, JavaScript
  Frameworks:  Next.js, Tailwind CSS, Prisma
  Package Mgr: pnpm
  Test Runner: vitest
  Structure:   component-based (src/)
  Files:       127 files in 34 directories

  Detected Conventions
  ─────────────────────────────────────
  ● Prefers named exports over default exports
  ● No semicolons (ASI style)
  ● Single quotes for strings
  ● Uses const/let (no var)
  ● TypeScript: prefers interface over type
  ● Uses Prettier for formatting
  ● File naming: kebab-case

  Generated files:
    ✓ .cursorrules
    ✓ CLAUDE.md
    ✓ .github/copilot-instructions.md
    ✓ .windsurfrules
    ✓ .continuerc.json
    ✓ .aider.conventions.md
```

## Customizing Generated Files

The generated files are meant to be a **starting point**. Each includes placeholder sections for your custom rules:

```markdown
## Custom Rules

<!-- Add your project-specific rules below -->
- Always use server actions for mutations
- Use our custom `AppError` class for error handling
- All API responses must use the `ApiResponse<T>` wrapper type
```

After generating, review the files and add domain-specific knowledge that can't be auto-detected: business logic patterns, architecture decisions, naming conventions for domain entities, etc.

## LLM Enhancement (--enhance)

The base CLI is fully deterministic and works offline. For deeper, more nuanced rules, you can optionally use LLM-powered enhancement:

```bash
# Set your API key
export ONBOARDAI_API_KEY=your_key_here

# Run with enhancement
obi init --enhance
```

Enhancement analyzes your actual code patterns to generate:
- Architecture documentation from file relationships
- Domain-specific coding rules
- Error handling and state management patterns
- Security and performance guidelines

API keys coming soon — follow the repo for updates.

## GitHub Action

Keep your context files automatically in sync with your codebase.

### Option 1: Copy the example workflow

Copy [`.github/workflows/ai-context-sync.yml`](.github/workflows/ai-context-sync.yml) from this repo into your own project. It runs on every push to `main`, detects whether any context files changed, and opens a PR for review when they do.

### Option 2: Use the reusable action

```yaml
name: Sync AI Context Files

on:
  push:
    branches: [main]
  workflow_dispatch:

permissions:
  contents: write
  pull-requests: write

jobs:
  sync-context:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: janlasota/onboardai@main
        with:
          formats: all        # or cursor,claude,copilot etc.
          create-pr: 'true'   # open a PR instead of committing directly
          # enhance: 'true'   # uncomment + add ONBOARDAI_API_KEY secret for LLM enhancement
          # api-key: ${{ secrets.ONBOARDAI_API_KEY }}
```

When your codebase changes in ways that affect context (new dependencies, restructured directories, changed conventions), it opens a PR with the updated files for review.

## Roadmap

- [x] `--enhance` flag: LLM-powered rule generation for deeper, more nuanced context
- [x] CI integration: GitHub Action for keeping context files in sync
- [ ] `obi update`: diff-aware incremental updates
- [ ] Custom overrides file (`.ai-context.overrides.yml`)
- [ ] Plugin system for community-contributed framework templates
- [ ] Monorepo support (per-package context files)
- [ ] `.gitignore`-aware file tree in generated context
- [ ] `obi diff`: show what changed since last generation

## Contributing

Contributions are welcome! The best ways to help:

1. **Add framework detection** — see `src/detectors/frameworks.js`
2. **Improve convention inference** — see `src/analyzers/conventions.js`
3. **Add generator formats** — see `src/generators/` for examples
4. **Report bugs** — open an issue with your project structure (anonymized)