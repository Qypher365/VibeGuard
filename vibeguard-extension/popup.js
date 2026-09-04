document.getElementById('scanBtn').addEventListener('click', runAudit);
document.getElementById('grabBtn').addEventListener('click', grabSelection);

async function grabSelection() {
  const statusDiv = document.getElementById('status');
  try {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (!tab) return;
    const [{ result }] = await chrome.scripting.executeScript({
      target: { tabId: tab.id },
      func: () => window.getSelection().toString()
    });
    if (result && result.trim()) {
      document.getElementById('code').value = result;
      statusDiv.innerText = 'Captured text from page!';
    } else {
      statusDiv.innerText = 'No text selected on webpage.';
    }
  } catch (e) {
    statusDiv.innerText = 'Select text on web page first.';
  }
}

async function runAudit() {
  const code = document.getElementById('code').value;
  const statusDiv = document.getElementById('status');
  const resultDiv = document.getElementById('result');
  const findingsList = document.getElementById('findingsList');
  
  if (!code.trim()) {
    statusDiv.innerText = 'Please paste or select code first.';
    return;
  }

  statusDiv.innerText = 'Scanning multi-engine pipeline...';
  resultDiv.style.display = 'none';

  try {
    const res = await fetch('http://localhost:5000/api/scan', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        filename: 'extension-scan.js',
        code: code,
        files: [{ filename: 'extension-scan.js', code: code }]
      }),
    });

    const data = await res.json();
    statusDiv.innerText = '';
    resultDiv.style.display = 'block';

    const score = data.score ?? 100;
    const findings = data.findings || data.issues || [];

    const scoreVal = document.getElementById('scoreVal');
    const riskBadge = document.getElementById('riskBadge');

    scoreVal.innerText = `${score} / 100`;
    if (score < 70) {
      scoreVal.className = 'score-val score-bad';
      riskBadge.innerText = 'CRITICAL';
      riskBadge.style.background = '#da3633';
    } else {
      scoreVal.className = 'score-val score-good';
      riskBadge.innerText = 'SECURE';
      riskBadge.style.background = '#238636';
    }
    if (score >= 70 && score < 90) {
      scoreVal.className = 'score-val';
      scoreVal.style.color = '#e3b341';
      riskBadge.innerText = 'WARNING';
      riskBadge.style.background = '#d29922';
    }

    findingsList.innerHTML = '';
    if (findings.length === 0) {
      findingsList.innerHTML = `<div style="font-size: 11px; color: #3fb950; text-align: center; padding: 6px;">✓ Zero vulnerabilities detected!</div>`;
    } else {
      findings.forEach(item => {
        const div = document.createElement('div');
        div.className = 'finding-item';
        div.innerHTML = `
          <div class="finding-title">
            <span>${item.type || item.title || 'Security Risk'}</span>
            <span class="engine-tag">${item.engine || 'Analyzer'}</span>
          </div>
          <div class="finding-desc">${item.message || item.description || 'Unsafe execution pattern or package detected.'}</div>
          ${item.line ? `<div style="font-size: 10px; color: #58a6ff; margin-top: 3px;">Line ${item.line}</div>` : ''}
        `;
        findingsList.appendChild(div);
      });
    }
  } catch (err) {
    statusDiv.innerText = 'Error: VibeGuard Backend offline (:5000)';
  }
}