# VibeGuard

**Real-time security auditing for AI-generated ("vibe coded") software.**

VibeGuard scans AI-generated code before it reaches production, catching three of the most common — and most overlooked — classes of risk: leaked credentials, hallucinated packages, and vulnerable boilerplate that slips through when code is written faster than it's reviewed.

Built at **RECURSION — Edition II**, TechnoVIT's flagship hackathon.

---

## The Problem

AI coding assistants ship fast, but they also:
- **Hardcode secrets** — API keys, DB URIs, and tokens left directly in source
- **Hallucinate package names** — imports that don't exist or resolve to unclaimed/malicious packages
- **Reproduce vulnerable patterns** — boilerplate copied from training data with no security review

These issues are easy to miss in a quick glance and easy to ship straight to production. VibeGuard catches them before that happens.

## What It Does

VibeGuard runs three independent detection engines over a codebase and combines their output into a single, scored security report:

| Engine | Detects |
|---|---|
| **Secret Engine** | Hardcoded credentials — AWS/OpenAI keys, DB connection strings, tokens, private keys — via regex + Shannon entropy analysis, then auto-redacts them |
| **Registry Engine** | Hallucinated or non-existent package imports, checked against live npm/PyPI registries |
| **Semantic Engine** | Vulnerable code patterns, analyzed and grounded against a CWE rule set |

Findings from all three engines are merged, scored, and returned as a single scan object — including a severity breakdown and a "confirm understanding" flag on high-risk findings, so flagged issues can't be silently dismissed.

## How It Works

```
                          index.js
                             │
      ┌──────────────────────┼──────────────────────┐
      ▼                      ▼                       ▼
 registryEngine()      semanticEngine()        secretEngine()
 (hallucinated          (CWE-grounded            (regex + entropy
  packages)              vulnerabilities)         secret detection)
      │                      │                       │
      └──────────────────────┴───────────────────────┘
                             ▼
                    combine findings
                             ▼
                     calculate score
                             ▼
                 calculate severity counts
                             ▼
                      attach scope
                             ▼
                return final scan object
                             ▼
                        Frontend
              (scorecard + "confirm understanding" UI)
```

Every engine returns findings in a shared JSON contract, so the frontend consumes one consistent object regardless of which engine flagged what.

## Project Structure

```
VibeGuard/
├── backend/
│   ├── engines/          # secretEngine.js, semanticEngine.js, registry engine
│   ├── rules/            # cwe_rules.json — CWE grounding for semantic checks
│   ├── utils/            # patterns.js, entropy.js, allowlists
│   ├── cli/commands/     # CLI entry points
│   ├── docs/             # per-engine documentation
│   ├── samples/          # clean/ and vulnerable/ test fixtures
│   └── tests/            # engine test suites
├── frontend/
│   └── vibe-guard_WEB9/  # dashboard, scorecard UI
├── tests/
├── contract.json         # shared JSON schema all engines must output
└── package.json
```

## Tech Stack

- **Backend:** Node.js
- **Secret Detection:** Regex pattern matching + Shannon entropy analysis
- **Semantic Analysis:** Gemini Flash API, grounded via JSON schema + CWE rule set
- **Registry Validation:** npm/PyPI REST APIs, AST parsing (`@babel/parser`)
- **Frontend:** Next.js / Tailwind
- **Package Management:** pnpm (workspace monorepo)

## Getting Started

```bash
git clone https://github.com/Qypher365/VibeGuard.git
cd VibeGuard
pnpm install
```

Run the scanner against a file or directory:

```bash
# from backend/
node cli/commands/scan.js <path-to-code>
```

Run the frontend dashboard:

```bash
cd frontend/vibe-guard_WEB9
pnpm dev
```

## Team

| Member | Role |
|---|---|
| Shlok *(Team Lead)* | Registry Engine & System Glue |
| Himanshu | Semantic Audit & Grounding |
| Sameer | Secret Redactor Engine |
| Swastik | Dashboard, Scorecard & README |

## License

MIT — see [LICENSE](./LICENSE).
