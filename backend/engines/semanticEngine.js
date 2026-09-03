import "dotenv/config";
import { GoogleGenAI } from "@google/genai";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load CWE rules
const rulesPath = path.join(__dirname, "../rules/cwe_rules.json");
const cweData = JSON.parse(fs.readFileSync(rulesPath, "utf8"));

const SUPPORTED_RULES = cweData.rules;

// Gemini client
const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY
});


/**
 * Semantic Security Audit Engine
 *
 * @param {string} code
 * @param {string} filename
 * @param {object} context
 * @returns {Promise<{findings: Array}>}
 */
export async function semanticEngine(code, filename = "unknown", context = {}) {

  if (!code || typeof code !== "string") {
    return {
      findings: []
    };
  }

  if (!process.env.GEMINI_API_KEY) {
    console.error("GEMINI_API_KEY is not configured.");

    return {
      findings: []
    };
  }

  try {

    /*
     * Only give Gemini the security rules that
     * VibeGuard officially supports.
     */
    const rulesForModel = SUPPORTED_RULES.map(rule => ({
      id: rule.id,
      name: rule.name,
      category: rule.category,
      severity: rule.severity,
      description: rule.description,
      guidance: rule.guidance
    }));


    const prompt = `
You are the semantic security analysis engine of VibeGuard.

Your task is to analyze source code for SECURITY VULNERABILITIES
that cannot reliably be detected using simple regex or package checks.

IMPORTANT:

1. Only report vulnerabilities that clearly match one of the supplied CWE rules.
2. NEVER invent a CWE ID.
3. NEVER report a CWE that is not in the supplied rules.
4. Do NOT detect API keys, passwords, JWTs, tokens, or other secrets.
   A separate engine handles secrets.
5. Do NOT check whether npm/PyPI packages exist.
   A separate registry engine handles packages.
6. Do NOT make unsupported security claims.
7. Only report a finding when there is reasonable evidence in the code.
8. If the code is safe with respect to these rules, return an empty findings array.
9. Keep explanations understandable to a beginner.
10. Evidence must NEVER contain passwords, API keys, tokens, or other actual secrets.
11. The line number should refer to the most relevant line of code.
12. Confidence must be between 0 and 1.

SUPPORTED CWE RULES:

${JSON.stringify(rulesForModel, null, 2)}

CODE FILE:
${filename}

SOURCE CODE:
\`\`\`
${code}
\`\`\`

PROJECT CONTEXT:
${JSON.stringify(context)}

Analyze the code and return ONLY the requested JSON structure.
`;


    /*
     * Structured output makes Gemini return predictable JSON.
     */
    const response = await ai.models.generateContent({

      model: "gemini-3.6-flash",

      contents: prompt,

      config: {
        responseMimeType: "application/json",

        responseSchema: {
          type: "OBJECT",

          properties: {

            findings: {
              type: "ARRAY",

              items: {
                type: "OBJECT",

                properties: {

                  ruleId: {
                    type: "STRING"
                  },

                  severity: {
                    type: "STRING",
                    enum: [
                      "CRITICAL",
                      "HIGH",
                      "MEDIUM",
                      "LOW",
                      "INFO"
                    ]
                  },

                  title: {
                    type: "STRING"
                  },

                  message: {
                    type: "STRING"
                  },

                  line: {
                    type: "INTEGER"
                  },

                  confidence: {
                    type: "NUMBER"
                  },

                  evidence: {
                    type: "STRING"
                  },

                  suggestion: {
                    type: "STRING"
                  }

                },

                required: [
                  "ruleId",
                  "severity",
                  "title",
                  "message",
                  "line",
                  "confidence",
                  "evidence",
                  "suggestion"
                ]
              }
            }

          },

          required: [
            "findings"
          ]
        }
      }
    });


    const rawText = response.text;

    if (!rawText) {
      return {
        findings: []
      };
    }


    let result;

    try {
      result = JSON.parse(rawText);
    } catch (error) {

      console.error("Gemini returned invalid JSON.");

      return {
        findings: []
      };
    }


    if (!Array.isArray(result.findings)) {
      return {
        findings: []
      };
    }


    /*
     * IMPORTANT:
     * Gemini's output is NOT trusted blindly.
     *
     * We validate every CWE against our local rule database.
     */

    const validatedFindings = [];

    for (const finding of result.findings) {

      const rule = SUPPORTED_RULES.find(
        r => r.id === finding.ruleId
      );

      // Reject hallucinated / unsupported CWE IDs
      if (!rule) {
        continue;
      }


      // Clamp confidence to 0–1
      let confidence = Number(finding.confidence);

      if (!Number.isFinite(confidence)) {
        confidence = 0;
      }

      confidence = Math.max(
        0,
        Math.min(1, confidence)
      );


      // Validate line number
      let line = Number(finding.line);

      if (!Number.isInteger(line) || line < 1) {
        line = null;
      }


      /*
       * Use the severity defined by our rule database.
       * Do NOT allow Gemini to arbitrarily change it.
       */

      const severity = rule.severity;


      validatedFindings.push({

        id: `SEM-${String(validatedFindings.length + 1).padStart(3, "0")}`,

        type: "semantic",

        severity,

        title: finding.title || rule.name,

        message:
          finding.message ||
          rule.description,

        file: filename,

        line,

        rule: {
          id: rule.id,
          name: rule.name,
          authority: "CWE"
        },

        source: "semantic-engine",

        confidence,

        evidence: {
          snippet: sanitizeEvidence(
            finding.evidence
          )
        },

        suggestion:
          finding.suggestion ||
          rule.guidance,

        understanding_required: true,

        understanding_confirmed: false,

        details: {
          category: rule.category,
          grounding: "CWE"
        }

      });
    }


    return {
      findings: validatedFindings
    };


  } catch (error) {

    console.error(
      "Semantic engine error:",
      error.message
    );

    /*
     * Fail safely.
     * The overall scanner can continue even if
     * Gemini is temporarily unavailable.
     */

    return {
      findings: []
    };
  }
}


/**
 * Prevent accidental exposure of obvious secrets
 * inside Gemini's evidence field.
 */
function sanitizeEvidence(evidence) {

  if (!evidence || typeof evidence !== "string") {
    return "";
  }

  let safe = evidence;

  // API-key-like assignments
  safe = safe.replace(
    /(api[_-]?key|secret|token|password)\s*[:=]\s*["'][^"']+["']/gi,
    "$1=\"[REDACTED]\""
  );

  // Bearer tokens
  safe = safe.replace(
    /Bearer\s+[A-Za-z0-9._-]+/gi,
    "Bearer [REDACTED]"
  );

  return safe;
}


export default semanticEngine;