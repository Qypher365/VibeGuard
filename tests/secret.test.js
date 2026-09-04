/**
 * backend/tests/secretRedactor.test.js
 * 
 * Test suite for secretEngine validating findings against vulnerable
 * and clean samples according to the VibeGuard contract schema.
 */

const fs = require('fs');
const path = require('path');
const { secretEngine } = require('../engines/secretRedactor');

const VULNERABLE_DIR = path.join(__dirname, '../samples/vulnerable');
const CLEAN_DIR = path.join(__dirname, '../samples/clean');

const REQUIRED_CONTRACT_FIELDS = [
  'id',
  'type',
  'severity',
  'title',
  'message',
  'file',
  'line',
  'rule',
  'source',
  'confidence',
  'evidence',
  'suggestion',
  'understanding_required',
  'understanding_confirmed',
  'details',
];

describe('Secret Engine (secretRedactor.js)', () => {
  describe('Vulnerable Samples Suite', () => {
    const vulnerableFiles = [
      { filename: 'aws.js', expectedRulePart: 'aws' },
      { filename: 'openai.js', expectedRulePart: 'openai' },
      { filename: 'db_uri.js', expectedRulePart: 'mongodb' },
      { filename: 'jwt.js', expectedRulePart: 'jwt' },
      { filename: 'password.js', expectedRulePart: 'password' },
      { filename: 'private_key.js', expectedRulePart: 'private_key' },
    ];

    vulnerableFiles.forEach(({ filename, expectedRulePart }) => {
      test(`detects intended secret in vulnerable/${filename}`, () => {
        const filePath = path.join(VULNERABLE_DIR, filename);
        const code = fs.readFileSync(filePath, 'utf8');

        const result = secretEngine(code, `samples/vulnerable/${filename}`);

        expect(result).toHaveProperty('findings');
        expect(result).toHaveProperty('redacted_code');
        expect(result.findings.length).toBeGreaterThan(0);

        // Verify at least one finding matches the expected type/rule
        const matchingFinding = result.findings.find((f) =>
          f.rule.toLowerCase().includes(expectedRulePart)
        );
        expect(matchingFinding).toBeDefined();

        // Verify every finding object strictly satisfies the contract schema
        result.findings.forEach((finding) => {
          REQUIRED_CONTRACT_FIELDS.forEach((field) => {
            expect(finding).toHaveProperty(field);
            expect(finding[field]).not.toBeUndefined();
          });

          expect(finding.source).toBe('secretEngine');
          expect(finding.file).toBe(`samples/vulnerable/${filename}`);
          expect(finding.type).toBe('secret');
          expect(finding.understanding_required).toBe(true);
          expect(finding.understanding_confirmed).toBe(false);
          expect(typeof finding.confidence).toBe('number');
          expect(finding.evidence).not.toContain('AKIAIOSFODNN7EXAMPLE'); // Ensure evidence is masked
        });
      });
    });
  });

  describe('Clean Samples Suite', () => {
    const cleanFiles = ['uuids.js', 'long_strings.js', 'placeholders.js', 'hashes.js'];

    cleanFiles.forEach((filename) => {
      test(`produces zero findings for clean/${filename}`, () => {
        const filePath = path.join(CLEAN_DIR, filename);
        const code = fs.readFileSync(filePath, 'utf8');

        const result = secretEngine(code, `samples/clean/${filename}`);

        expect(result).toHaveProperty('findings');
        expect(result).toHaveProperty('redacted_code');
        expect(result.findings).toHaveLength(0);
        expect(result.redacted_code).toBe(code);
      });
    });
  });

  describe('Contract Field Strictness Check', () => {
    test('validates exact 15-field contract schema on findings', () => {
      const sampleCode = 'const awsKey = "AKIAIOSFODNN7EXAMPLE";';
      const filename = 'config/aws.js';

      const { findings, redacted_code } = secretEngine(sampleCode, filename);

      expect(findings.length).toBe(1);
      const finding = findings[0];

      // Exact field presence check
      const findingKeys = Object.keys(finding);
      expect(findingKeys.sort()).toEqual([...REQUIRED_CONTRACT_FIELDS].sort());

      // Contract property invariants
      expect(typeof finding.id).toBe('string');
      expect(finding.type).toBe('secret');
      expect(['CRITICAL', 'HIGH']).includes(finding.severity).toBe(true);
      expect(finding.file).toBe(filename);
      expect(finding.source).toBe('secretEngine');
      expect(finding.understanding_required).toBe(true);
      expect(finding.understanding_confirmed).toBe(false);
      expect(redacted_code).toContain('AKIA****************');
      expect(redacted_code).not.toContain('AKIAIOSFODNN7EXAMPLE');
    });
  });
});
