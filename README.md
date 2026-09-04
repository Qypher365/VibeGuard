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

VibeGuard is available as a **CLI**, a **web dashboard**, and a **browser extension**.

## How It Works

```
                        backend/src/index.js
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
              ┌──────────────┼──────────────┐
              ▼              ▼              ▼
            CLI          Dashboard       Extension
      (vibeguard-cli.js)  (Next.js)      (popup.js)
```

Every engine returns findings in a shared JSON contract, so every consumer — CLI, dashboard, extension — reads one consistent object regardless of which engine flagged what.

## Project Structure

```
VibeGuard/
├── backend/
│   ├── rules/
│   │   └── cwe_rules.json        # CWE grounding for semantic checks
│   ├── src/
│   │   ├── engines/               # secretEngine, semanticEngine, registryEngine
│   │   ├── rules/                 # rule loading/parsing logic
│   │   ├── utils/                 # patterns.js, entropy.js, allowlists, etc.
│   │   └── index.js               # combines engine findings into final scan object
│   ├── main.py                    # Python-side component (registry/semantic support)
│   ├── vibeguard-cli.js           # CLI entry point
│   ├── .env.example.env
│   └── package.json
│
├── frontend/vibe-guard_WEB9/      # Next.js dashboard
│   ├── app/
│   │   ├── history/                # past scan history view
│   │   ├── results/                # scan results view
│   │   ├── layout.tsx
│   │   └── page.tsx
│   ├── components/
│   │   ├── ui/                     # base UI components
│   │   └── vibeguard/               # VibeGuard-specific components
│   ├── lib/
│   │   ├── vibeguard/               # frontend-side API/client logic
│   │   └── utils.ts
│   ├── public/
│   └── package.json
│
├── vibeguard-extension/           # Browser extension
│   ├── manifest.json
│   ├── popup.html
│   └── popup.js
│
├── tests/
│   ├── secret.test.js
│   └── semantic.test.js
│
├── LICENSE
├── package.json
├── pnpm-lock.yaml
├── pnpm-workspace.yaml
└── README.md
```

## Tech Stack

- **Backend:** Node.js, Python
- **Secret Detection:** Regex pattern matching + Shannon entropy analysis
- **Semantic Analysis:** Gemini Flash API, grounded via JSON schema + CWE rule set (`cwe_rules.json`)
- **Registry Validation:** npm/PyPI REST APIs, AST parsing (`@babel/parser`)
- **Frontend:** Next.js, TypeScript, Tailwind
- **Browser Extension:** Chrome Extension (Manifest-based)
- **Package Management:** pnpm (workspace monorepo)

## Getting Started

### 1. Clone & install

```bash
git clone https://github.com/Qypher365/VibeGuard.git
cd VibeGuard
pnpm install
```

### 2. Set up environment variables

```bash
cd backend
cp .env.example.env .env
# fill in your API keys (e.g. Gemini Flash API key)
```

### 3. Run the scanner (CLI)

```bash
# from backend/
node vibeguard-cli.js <path-to-code>
```

### 4. Run the dashboard

```bash
cd frontend/vibe-guard_WEB9
pnpm dev
```

### 5. Load the browser extension

1. Go to `chrome://extensions`
2. Enable **Developer mode**
3. Click **Load unpacked** and select the `vibeguard-extension/` folder

## Testing

```bash
# from repo root
node tests/secret.test.js
node tests/semantic.test.js
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
