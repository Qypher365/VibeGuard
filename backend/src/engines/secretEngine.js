/**
 * backend/engines/secretRedactor.js
 * 
 * VibeGuard Secret Engine implementation.
 */

import crypto from 'crypto';
import { patterns } from '../utils/patterns.js';
import { findHighEntropyStrings } from '../utils/entropy.js';

const REGEX_CONFIDENCE = {
  aws_access_key_id: 0.97,
  aws_secret_access_key: 0.9,
  github_token: 0.97,
  openai_api_key: 0.95,
  mongodb_uri: 0.95,
  postgres_uri: 0.95,
  mysql_uri: 0.95,
  redis_uri: 0.9,
  slack_token: 0.95,
  stripe_key: 0.95,
  google_api_key: 0.95,
  jwt: 0.85,
  private_key_block: 0.99,
  generic_api_key_assignment: 0.7,
  generic_token_assignment: 0.7,
  generic_password_assignment: 0.6,
};
const DEFAULT_REGEX_CONFIDENCE = 0.8;

const ENTROPY_CONFIDENCE = {
  hex: 0.55,
  general: 0.6,
};

/**
 * Masks a secret string: keeps the first 4 characters as a type hint
 * and masks the remaining characters with asterisks.
 */
function maskSecret(str) {
  if (!str) return '****';
  if (str.length <= 4) return '*'.repeat(str.length);
  const prefix = str.slice(0, 4);
  const maskedPart = '*'.repeat(str.length - 4);
  return prefix + maskedPart;
}

/**
 * Calculates line number from character index offset.
 */
function lineNumberAt(code, offset) {
  let line = 1;
  for (let i = 0; i < offset && i < code.length; i++) {
    if (code[i] === '\n') line++;
  }
  return line;
}

/**
 * Replaces matched regex regions with spaces so entropy scan only runs on unmatched tokens.
 */
function maskMatchedRegions(code, regexMatches) {
  const chars = Array.from(code);
  for (const { start, end } of regexMatches) {
    if (start !== null && end !== null) {
      for (let i = start; i < end && i < chars.length; i++) {
        if (chars[i] !== '\n') chars[i] = ' ';
      }
    }
  }
  return chars.join('');
}

/**
 * Redacts secrets from code string by replacing each secret's real value
 * with a masked version (keeps first 4 characters, masks the rest with '*').
 */
function redactSecrets(code, rawMatches = []) {
  if (!code) return '';

  let redacted = code;
  // Sort by length descending to replace longer secrets first and prevent substring collisions
  const sortedMatches = [...rawMatches].sort((a, b) => b.rawSecret.length - a.rawSecret.length);

  for (const match of sortedMatches) {
    const rawValue = match.rawSecret;
    if (!rawValue) continue;

    const masked = maskSecret(rawValue);
    redacted = redacted.split(rawValue).join(masked);
  }

  return redacted;
}

/**
 * Main VibeGuard Secret Engine export.
 * 
 * @param {string} code - The source code to analyze.
 * @param {string} filename - Path or name of the file being scanned.
 * @returns {{ findings: Array<Object>, redacted_code: string }}
 */
function secretEngine(code, filename) {
  if (!code) return { findings: [], redacted_code: '' };

  const rawMatches = [];

  // 1. Run all patterns from utils/patterns.js
  for (const { type, regex, description } of patterns) {
    const re = new RegExp(regex.source, regex.flags.includes('g') ? regex.flags : `${regex.flags}g`);
    let match;
    while ((match = re.exec(code)) !== null) {
      const matchedText = match[0];
      if (matchedText.length === 0) {
        re.lastIndex++;
        continue;
      }

      // Capture subgroup or full match
      const targetText = match[1] || matchedText;
      const startIdx = match.index + matchedText.indexOf(targetText);

      rawMatches.push({
        rule: type,
        title: `Hardcoded ${type.replace(/_/g, ' ')}`,
        message: description || `A suspected hardcoded ${type} secret was detected.`,
        line: lineNumberAt(code, startIdx),
        rawSecret: targetText,
        fullMatch: matchedText,
        start: startIdx,
        end: startIdx + targetText.length,
        confidence: REGEX_CONFIDENCE[type] ?? DEFAULT_REGEX_CONFIDENCE,
        sourceType: 'pattern',
      });
    }
  }

  // 2. Run findHighEntropyStrings on remaining unmatched tokens
  const maskedCode = maskMatchedRegions(code, rawMatches);
  const entropyResults = findHighEntropyStrings(maskedCode);

  for (const { token, line, type, entropy } of entropyResults) {
    rawMatches.push({
      rule: `high_entropy_${type}`,
      title: 'High Entropy String Detected',
      message: 'A high-entropy string was identified, indicating a potential zero-day or unclassified secret/token.',
      line: line,
      rawSecret: token,
      fullMatch: token,
      start: null,
      end: null,
      confidence: ENTROPY_CONFIDENCE[type] ?? ENTROPY_CONFIDENCE.general,
      sourceType: 'entropy',
      entropyValue: entropy,
    });
  }

  // 3. Deduplicate overlapping and identical matches
  const seen = new Set();
  const dedupedMatches = [];

  for (const item of rawMatches) {
    const key = `${item.line}:${item.rawSecret}`;
    if (seen.has(key)) continue;
    seen.add(key);
    dedupedMatches.push(item);
  }

  // 4. Perform redaction on the raw code
  const redacted_code = redactSecrets(code, dedupedMatches);

  // 5. Format findings into strict VibeGuard JSON Schema (RAW SECRETS STRIPPED)
  const findings = dedupedMatches.map((match) => {
    const isCritical = match.confidence >= 0.85;

    return {
      id: crypto.randomUUID(),
      type: 'secret',
      severity: isCritical ? 'CRITICAL' : 'HIGH',
      title: match.title,
      message: match.message,
      file: filename, // Strictly set to filename parameter
      line: match.line,
      rule: match.rule,
      source: 'secretEngine', // Hardcoded as required
      confidence: match.confidence,
      evidence: maskSecret(match.rawSecret), // Masked value only
      suggestion: 'Remove raw secrets from source code and migrate them to an environment variable or secret manager.',
      understanding_required: true,
      understanding_confirmed: false,
      details: {
        length: match.rawSecret.length,
        detection_method: match.sourceType,
        ...(match.entropyValue ? { entropy: match.entropyValue } : {}),
      },
    };
  });

  return {
    findings,
    redacted_code,
  };
}

export { secretEngine, redactSecrets };
export default secretEngine;