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

function maskSecret(str) {
  if (!str || typeof str !== 'string') return '****';
  if (str.length <= 4) return '*'.repeat(str.length);
  const prefix = str.slice(0, 4);
  const maskedPart = '*'.repeat(str.length - 4);
  return prefix + maskedPart;
}

function lineNumberAt(code, offset) {
  if (typeof code !== 'string' || offset < 0) return 1;
  let line = 1;
  for (let i = 0; i < offset && i < code.length; i++) {
    if (code[i] === '\n') line++;
  }
  return line;
}

function maskMatchedRegions(code, regexMatches) {
  if (typeof code !== 'string') return '';
  const chars = Array.from(code);
  for (const { start, end } of regexMatches) {
    if (start !== null && end !== null && start >= 0) {
      for (let i = start; i < end && i < chars.length; i++) {
        if (chars[i] !== '\n') chars[i] = ' ';
      }
    }
  }
  return chars.join('');
}

function redactSecrets(code, rawMatches = []) {
  if (!code || typeof code !== 'string') return '';

  let redacted = code;
  const sortedMatches = [...rawMatches]
    .filter((m) => m && typeof m.rawSecret === 'string' && m.rawSecret.trim().length > 0)
    .sort((a, b) => b.rawSecret.length - a.rawSecret.length);

  for (const match of sortedMatches) {
    const rawValue = match.rawSecret;
    const masked = maskSecret(rawValue);
    redacted = redacted.split(rawValue).join(masked);
  }

  return redacted;
}

function secretEngine(codePayload, filename = 'raw_input.js') {
  // Safe input normalization for raw code payloads & objects
  let code = codePayload;
  if (typeof code === 'object' && code !== null) {
    code = code.code || code.content || JSON.stringify(code, null, 2);
  }
  if (typeof code !== 'string') {
    code = String(code || '');
  }

  if (!code.trim()) return { findings: [], redacted_code: '' };

  const rawMatches = [];

  // 1. Regex pattern scanning
  for (const { type, regex, description } of patterns) {
    if (!regex) continue;
    const re = new RegExp(regex.source, regex.flags.includes('g') ? regex.flags : `${regex.flags}g`);
    let match;
    while ((match = re.exec(code)) !== null) {
      const matchedText = match[0];
      if (!matchedText || matchedText.length === 0) {
        re.lastIndex++;
        continue;
      }

      const targetText = match[1] || matchedText;
      const relativeOffset = matchedText.indexOf(targetText);
      const startIdx = relativeOffset !== -1 ? match.index + relativeOffset : match.index;

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

  // 2. High-entropy scanning on unmasked regions
  const maskedCode = maskMatchedRegions(code, rawMatches);
  const entropyResults = findHighEntropyStrings(maskedCode) || [];

  for (const { token, line, type, entropy } of entropyResults) {
    if (!token || typeof token !== 'string') continue;

    // Ignore redacted asterisks, placeholders, or UUID-like safe tokens
    if (/[*]{3,}/.test(token) || token.includes('[REDACTED')) {
      continue;
    }

    rawMatches.push({
      rule: `high_entropy_${type}`,
      title: 'High Entropy String Detected',
      message: 'A high-entropy string was identified, indicating a potential zero-day or unclassified secret/token.',
      line: line || 1,
      rawSecret: token,
      fullMatch: token,
      start: null,
      end: null,
      confidence: ENTROPY_CONFIDENCE[type] ?? ENTROPY_CONFIDENCE.general,
      sourceType: 'entropy',
      entropyValue: entropy,
    });
  }

  // 3. Deduplicate overlapping matches
  const seen = new Set();
  const dedupedMatches = [];

  for (const item of rawMatches) {
    const key = `${item.line}:${item.rawSecret}`;
    if (seen.has(key)) continue;
    seen.add(key);
    dedupedMatches.push(item);
  }

  // 4. Perform redaction
  const redacted_code = redactSecrets(code, dedupedMatches);

  // 5. Format schema
  const findings = dedupedMatches.map((match) => {
    const isCritical = match.confidence >= 0.85;

    return {
      id: crypto.randomUUID(),
      type: 'secret',
      severity: isCritical ? 'CRITICAL' : 'HIGH',
      title: match.title,
      message: match.message,
      file: filename,
      line: match.line,
      rule: match.rule,
      source: 'secretEngine',
      confidence: match.confidence,
      evidence: maskSecret(match.rawSecret),
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