const RESET = '\x1b[0m';
const BOLD = '\x1b[1m';
const DIM = '\x1b[2m';
const CYAN = '\x1b[36m';
const GREEN = '\x1b[32m';
const YELLOW = '\x1b[33m';
const RED = '\x1b[31m';
const MAGENTA = '\x1b[35m';

export function printBanner() {
  console.log(`
  ${CYAN}${BOLD}┌──────────────────────────────────────────┐${RESET}
  ${CYAN}${BOLD}│            onboardai v0.1.0              │${RESET}
  ${CYAN}${BOLD}│   Onboard AI to your codebase in seconds │${RESET}
  ${CYAN}${BOLD}└──────────────────────────────────────────┘${RESET}`);
}

export function printSummary(scan) {
  console.log(`
  ${BOLD}Project Analysis${RESET}
  ${'─'.repeat(37)}
  ${DIM}Name:${RESET}        ${scan.project.name}
  ${DIM}Languages:${RESET}   ${scan.languages.map(l => l.name).join(', ') || 'unknown'}
  ${DIM}Frameworks:${RESET}  ${scan.frameworks.map(f => f.name).join(', ') || 'none detected'}
  ${DIM}Package Mgr:${RESET} ${scan.packageManager || 'unknown'}
  ${DIM}Test Runner:${RESET} ${scan.testing.runner || 'none detected'}
  ${DIM}Structure:${RESET}   ${scan.structure.pattern}
  ${DIM}Files:${RESET}       ${scan.structure.totalFiles} files in ${scan.structure.totalDirs} directories`);

  if (scan.conventions.length > 0) {
    console.log(`\n  ${BOLD}Detected Conventions${RESET}`);
    console.log(`  ${'─'.repeat(37)}`);
    for (const conv of scan.conventions) {
      console.log(`  ${GREEN}●${RESET} ${conv}`);
    }
  }
}

export function printError(msg) {
  console.error(`\n  ${RED}${BOLD}Error:${RESET} ${msg}\n`);
}

export function printHelp() {
  console.log(`
  ${BOLD}Usage:${RESET}
    onboardai [command] [directory] [options]
    obi [command] [directory] [options]

  ${BOLD}Commands:${RESET}
    init, generate    Scan project and generate context files (default)
    scan              Scan project and show analysis without generating

  ${BOLD}Options:${RESET}
    -f, --format <formats>  Target formats (comma-separated)
                            cursor, claude, copilot, windsurf, continue, aider, all
                            Default: all
    -o, --output <dir>      Output directory (default: same as scanned directory)
    -e, --enhance           Use LLM to enhance generated rules (requires API key)
    -v, --version           Show version
    -h, --help              Show this help
    --verbose               Show detailed scan output
    --dry-run               Scan without generating files

  ${BOLD}Examples:${RESET}
    ${DIM}# Generate all context files for current directory${RESET}
    obi

    ${DIM}# Generate only Cursor and Claude files${RESET}
    obi init --format cursor,claude

    ${DIM}# Scan a specific project${RESET}
    obi scan ../my-project

    ${DIM}# Enhanced generation with LLM${RESET}
    obi init --enhance
  `);
}
