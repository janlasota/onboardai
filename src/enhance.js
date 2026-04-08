/**
 * LLM Enhancement Module
 * 
 * This module handles the --enhance flag, which sends scan results
 * to the onboardai API for LLM-powered rule enrichment.
 * 
 * The enhancement produces deeper, more nuanced context rules by:
 * - Analyzing actual code patterns beyond simple heuristics
 * - Generating domain-specific guidelines from code semantics
 * - Producing architecture documentation from file relationships
 * - Inferring error handling patterns, state management approaches, etc.
 * 
 * Free tier: 3 scans/month
 * Pro tier: unlimited scans + auto-sync
 */

const API_BASE = process.env.ONBOARDAI_API_URL || 'https://api.onboardai.dev';
const API_VERSION = 'v1';

/**
 * Check if the user has an API key configured
 */
export function getApiKey() {
  return process.env.ONBOARDAI_API_KEY || null;
}

/**
 * Prepare scan data for the API (strip raw file contents for privacy)
 */
function prepareScanPayload(scan) {
  return {
    project: scan.project,
    languages: scan.languages,
    frameworks: scan.frameworks,
    packageManager: scan.packageManager,
    testing: scan.testing,
    structure: scan.structure,
    conventions: scan.conventions,
    configs: scan.configs, // just the filenames, not contents
    // Send sampled snippets (first 100 lines of each) for deeper analysis
    samples: scan._raw.samples.map(s => ({
      relativePath: s.relativePath,
      ext: s.ext,
      snippet: s.content.split('\n').slice(0, 100).join('\n'),
    })),
  };
}

/**
 * Call the enhancement API to get LLM-enriched rules
 */
export async function enhanceScanResults(scan, opts = {}) {
  const apiKey = opts.apiKey || getApiKey();

  if (!apiKey) {
    return {
      success: false,
      error: 'missing_key',
      message: [
        '',
        '  ┌──────────────────────────────────────────────────────────┐',
        '  │  --enhance requires an OnboardAI API key                 │',
        '  │                                                          │',
        '  │  LLM enhancement analyzes your codebase deeper           │',
        '  │  to generate smarter, more nuanced context rules.        │',
        '  │                                                          │',
        '  │  Get your free API key (3 scans/month):                  │',
        '  │  → https://onboardai.dev/signup                          │',
        '  │                                                          │',
        '  │  Then set it:                                            │',
        '  │  export ONBOARDAI_API_KEY=your_key_here                  │',
        '  │                                                          │',
        '  │  Or pass it inline:                                      │',
        '  │  ONBOARDAI_API_KEY=key obi init --enhance                │',
        '  └──────────────────────────────────────────────────────────┘',
        '',
      ].join('\n'),
    };
  }

  const payload = prepareScanPayload(scan);

  try {
    const response = await fetch(`${API_BASE}/${API_VERSION}/enhance`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
        'X-ACG-Version': '0.1.0',
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const err = await response.json().catch(() => ({}));

      if (response.status === 401) {
        return {
          success: false,
          error: 'invalid_key',
          message: '  Error: Invalid API key. Check your ONBOARDAI_API_KEY or get a new one at https://onboardai.dev',
        };
      }

      if (response.status === 429) {
        return {
          success: false,
          error: 'rate_limited',
          message: '  You\'ve reached your monthly scan limit. Upgrade to Pro for unlimited scans: https://onboardai.dev/pro',
        };
      }

      return {
        success: false,
        error: 'api_error',
        message: `  Enhancement API error: ${err.message || response.statusText}`,
      };
    }

    const data = await response.json();

    return {
      success: true,
      enhanced: data.enhanced, // enriched scan data with additional rules
    };
  } catch (err) {
    // Network errors — fail gracefully, still generate base rules
    return {
      success: false,
      error: 'network',
      message: `  Could not reach enhancement API (${err.message}). Generating base rules instead.`,
    };
  }
}

/**
 * Merge enhanced results back into the scan data
 */
export function mergeEnhanced(scan, enhanced) {
  return {
    ...scan,
    conventions: [
      ...scan.conventions,
      ...(enhanced.additionalConventions || []),
    ],
    _enhanced: {
      architectureNotes: enhanced.architectureNotes || null,
      domainRules: enhanced.domainRules || [],
      codePatterns: enhanced.codePatterns || [],
      securityNotes: enhanced.securityNotes || [],
      performanceNotes: enhanced.performanceNotes || [],
    },
  };
}
