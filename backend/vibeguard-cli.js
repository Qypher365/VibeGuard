import fs from 'fs';
import path from 'path';

let targetPath = process.argv[2];

// Fallback logic if no file argument is passed
if (!targetPath) {
  targetPath = fs.existsSync('app.js') ? 'app.js' : 'src';
}

if (!fs.existsSync(targetPath)) {
  console.error(`❌ Path not found: ${targetPath}`);
  process.exit(1);
}

const stats = fs.statSync(targetPath);
let payload = {};

if (stats.isDirectory()) {
  const dirFiles = fs.readdirSync(targetPath)
    .filter((file) => file.endsWith('.js') || file.endsWith('.json') || file.endsWith('.ts') || file.endsWith('.py'))
    .map((file) => {
      const fullPath = path.join(targetPath, file);
      return {
        filename: file,
        code: fs.readFileSync(fullPath, 'utf8'),
      };
    });

  if (dirFiles.length === 0) {
    console.log(`⚠️ No supported source files found in directory: ${targetPath}`);
    process.exit(0);
  }

  payload = { files: dirFiles };
  console.log(`🛡️ VibeGuard CLI: Scanning directory "${targetPath}" (${dirFiles.length} file(s))...`);
} else {
  const code = fs.readFileSync(targetPath, 'utf8');
  payload = { filename: path.basename(targetPath), code };
  console.log(`🛡️ VibeGuard CLI: Scanning file "${targetPath}"...`);
}

fetch('http://localhost:5000/api/scan', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(payload),
})
  .then(async (res) => {
    if (!res.ok) {
      const errText = await res.text();
      throw new Error(`Server returned status ${res.status}: ${errText}`);
    }
    return res.json();
  })
  .then((data) => {
    console.log(`\n========================================`);
    console.log(`✨ Security Score: ${data.score_display || data.score + '/100'}`);
    console.log(`🔍 Total Findings: ${data.scope?.total_findings ?? data.findings?.length ?? 0}`);
    console.log(`========================================\n`);

    if (data.findings && data.findings.length > 0) {
      console.table(
        data.findings.map((f) => ({
          Severity: f.severity,
          File: f.file || 'N/A',
          Line: f.line || 1,
          Title: f.title,
          Rule: typeof f.rule === 'object' ? f.rule?.id || f.rule?.name : f.rule,
        }))
      );
    } else {
      console.log('✅ Clean scan! No security vulnerabilities detected.');
    }
  })
  .catch((err) => {
    console.error('❌ CLI Scan failed:', err.message);
    console.error('👉 Make sure the backend server is running (`node src/index.js`) on http://localhost:5000');
  });