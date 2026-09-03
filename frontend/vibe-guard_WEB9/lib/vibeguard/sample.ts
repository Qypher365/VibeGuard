import type { ScanResult } from './types'

// Raw AI-generated code a developer might paste in.
export const SAMPLE_CODE = `import fakePkg from 'non-existent-hallucinated-pkg-12345';
const key = 'sk_live_51H8xYzABCDEF1234567890';

export function boot() {
  return fakePkg.init(key);
}`

/**
 * Sample scan object, matching the backend JSON contract exactly.
 * Used as the offline fallback when the live engine is unreachable.
 */
export const SAMPLE_SCAN: ScanResult = {
  timestamp: '2026-09-03T14:34:32.907Z',
  file: 'test.js',
  summary: { totalFlags: 1, critical: 1, high: 0, medium: 0, low: 0 },
  redacted_code:
    "import fakePkg from 'non-existent-hallucinated-pkg-12345';\nconst key = '████████';",
  flags: [
    {
      id: 'registry-1-non-existent-hallucinated-pkg-12345',
      engine: 'registry',
      severity: 'critical',
      file: 'test.js',
      line: 1,
      snippet: 'import fakePkg from "non-existent-hallucinated-pkg-12345";',
      message:
        "Unregistered / Hallucinated Package: 'non-existent-hallucinated-pkg-12345'",
      explanation:
        "The imported package 'non-existent-hallucinated-pkg-12345' does not exist on npm. LLMs frequently hallucinate package names.",
      citation: {
        source: 'npm Registry API',
        id: '404-PACKAGE-NOT-FOUND',
        url: 'https://registry.npmjs.org/non-existent-hallucinated-pkg-12345',
      },
      suggestedFix: 'Verify the package name against official documentation.',
      confirmed: false,
    },
  ],
}
