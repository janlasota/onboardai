#!/usr/bin/env node

import { parseArgs } from 'node:util';
import { resolve } from 'node:path';
import { existsSync } from 'node:fs';
import { scanProject } from '../src/scanner.js';
import { generateContextFiles } from '../src/generator.js';
import { enhanceScanResults, mergeEnhanced } from '../src/enhance.js';
import { printBanner, printSummary, printError, printHelp } from '../src/ui.js';

const SUPPORTED_FORMATS = ['cursor', 'claude', 'copilot', 'windsurf', 'continue', 'aider', 'all'];

const options = {
  help:    { type: 'boolean', short: 'h', default: false },
  version: { type: 'boolean', short: 'v', default: false },
  format:  { type: 'string',  short: 'f', default: 'all' },
  output:  { type: 'string',  short: 'o' },
  enhance: { type: 'boolean', short: 'e', default: false },
  verbose: { type: 'boolean', default: false },
  'dry-run': { type: 'boolean', default: false },
};

async function main() {
  let args;
  try {
    args = parseArgs({ options, allowPositionals: true });
  } catch (err) {
    printError(`Invalid arguments: ${err.message}`);
    printHelp();
    process.exit(1);
  }

  if (args.values.version) {
    console.log('onboardai v0.1.2');
    process.exit(0);
  }

  if (args.values.help) {
    printHelp();
    process.exit(0);
  }

  const command = args.positionals[0] || 'init';
  const targetDir = resolve(args.positionals[1] || '.');

  if (!existsSync(targetDir)) {
    printError(`Directory not found: ${targetDir}`);
    process.exit(1);
  }

  // Parse formats
  const formats = args.values.format === 'all'
    ? SUPPORTED_FORMATS.filter(f => f !== 'all')
    : args.values.format.split(',').map(f => f.trim().toLowerCase());

  // Validate formats
  for (const f of formats) {
    if (!SUPPORTED_FORMATS.includes(f)) {
      printError(`Unknown format: "${f}". Supported: ${SUPPORTED_FORMATS.join(', ')}`);
      process.exit(1);
    }
  }

  printBanner();

  switch (command) {
    case 'init':
    case 'generate': {
      console.log(`\n  Scanning: ${targetDir}\n`);

      const scanResult = await scanProject(targetDir, { verbose: args.values.verbose });

      if (args.values.verbose) {
        console.log('\n  Scan result:');
        console.log(JSON.stringify(scanResult, null, 2));
      }

      if (args.values['dry-run']) {
        console.log('\n  [dry run] Would generate files for:', formats.join(', '));
        printSummary(scanResult);
        break;
      }

      // LLM enhancement (optional, requires API key)
      let finalScan = scanResult;
      if (args.values.enhance) {
        console.log('  Enhancing with LLM analysis...\n');
        const enhanceResult = await enhanceScanResults(scanResult);

        if (enhanceResult.success) {
          finalScan = mergeEnhanced(scanResult, enhanceResult.enhanced);
          console.log('  ✓ Enhancement applied\n');
        } else {
          // Print the error/upsell message but continue with base rules
          console.log(enhanceResult.message);
          if (enhanceResult.error !== 'missing_key') {
            console.log('  Continuing with base rules...\n');
          } else {
            // Missing key — still generate base rules
            console.log('  Generating base rules (without enhancement)...\n');
          }
        }
      }

      const outputDir =
        args.values.output !== undefined
          ? resolve(args.values.output)
          : targetDir;
      const generated = await generateContextFiles(finalScan, {
        formats,
        outputDir,
      });

      printSummary(scanResult);

      console.log('\n  Generated files:');
      for (const file of generated) {
        console.log(`    ✓ ${file}`);
      }
      console.log('');
      break;
    }

    case 'scan': {
      console.log(`\n  Scanning: ${targetDir}\n`);
      const scanResult = await scanProject(targetDir, { verbose: args.values.verbose });
      printSummary(scanResult);
      break;
    }

    default:
      printError(`Unknown command: "${command}". Use "init", "generate", or "scan".`);
      printHelp();
      process.exit(1);
  }
}

main().catch(err => {
  printError(err.message);
  process.exit(1);
});
