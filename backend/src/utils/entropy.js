function calculateEntropy(str) {
  if (!str || str.length === 0) return 0;

  const freq = new Map();
  for (const char of str) {
    freq.set(char, (freq.get(char) || 0) + 1);
  }

  const len = str.length;
  let entropy = 0;

  for (const count of freq.values()) {
    const p = count / len;
    entropy -= p * Math.log2(p);
  }

  return entropy;
}

const HEX_REGEX = /^[0-9a-fA-F]+$/;
const HEX_ENTROPY_THRESHOLD = 3.85;
const GENERAL_ENTROPY_THRESHOLD = 4.2;

function findHighEntropyStrings(code) {
  const results = [];
  const lines = code.split('\n');

  const candidateRegex = /'([^'\n]{21,})'|"([^"\n]{21,})"|`([^`\n]{21,})`|(?<![\w'"`])([A-Za-z0-9+/_.=-]{21,})(?![\w'"`])/g;

  const seen = new Set();

  lines.forEach((lineText, idx) => {
    const lineNumber = idx + 1;
    let match;
    candidateRegex.lastIndex = 0;

    while ((match = candidateRegex.exec(lineText)) !== null) {
      const token = match[1] || match[2] || match[3] || match[4];
      if (!token) continue;

      const entropy = calculateEntropy(token);
      const type = HEX_REGEX.test(token) ? 'hex' : 'general';
      const threshold = type === 'hex' ? HEX_ENTROPY_THRESHOLD : GENERAL_ENTROPY_THRESHOLD;

      if (entropy > threshold) {
        const key = `${lineNumber}:${token}`;
        if (!seen.has(key)) {
          seen.add(key);
          results.push({ token, entropy: Number(entropy.toFixed(3)), line: lineNumber, type });
        }
      }
    }
  });

  return results;
}

export { calculateEntropy, findHighEntropyStrings };
export default { calculateEntropy, findHighEntropyStrings };