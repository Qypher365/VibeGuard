import { parse } from '@babel/parser';

export async function runRegistryScan(codeContent, filePath = 'uploaded_file.js', language = 'javascript') {
  const findings = [];
  const packagesToVerify = [];

  try {
    const ast = parse(codeContent, {
      sourceType: 'module',
      plugins: ['jsx', 'typescript'],
    });

    const lines = codeContent.split('\n');

    ast.program.body.forEach((node) => {
      if (node.type === 'ImportDeclaration') {
        const pkgName = node.source.value;
        const line = node.loc ? node.loc.start.line : 1;
        if (!pkgName.startsWith('.') && !pkgName.startsWith('/')) {
          packagesToVerify.push({ name: pkgName, line, snippet: lines[line - 1] || '' });
        }
      }
    });
  } catch (err) {
    const importRegex = /(?:import\s+.*?\s+from\s+['"]([^'"]+)['"]|require\(['"]([^'"]+)['"]\))/g;
    let match;
    while ((match = importRegex.exec(codeContent)) !== null) {
      const pkgName = match[1] || match[2];
      if (pkgName && !pkgName.startsWith('.') && !pkgName.startsWith('/')) {
        packagesToVerify.push({ name: pkgName, line: 1, snippet: match[0] });
      }
    }
  }

  for (const pkg of packagesToVerify) {
    const cleanPkgName = pkg.name.startsWith('@') 
      ? pkg.name.split('/').slice(0, 2).join('/') 
      : pkg.name.split('/')[0];

    try {
      const res = await fetch(`https://registry.npmjs.org/${cleanPkgName}`);
      if (res.status === 404) {
        findings.push({
          id: `registry-${pkg.line}-${cleanPkgName}`,
          type: 'registry',
          severity: 'critical',
          title: `Unregistered / Hallucinated Package: '${cleanPkgName}'`,
          message: `The imported package '${cleanPkgName}' does not exist on npm. LLMs frequently hallucinate package names.`,
          file: filePath,
          line: pkg.line,
          rule: '404-PACKAGE-NOT-FOUND',
          source: 'npm Registry API',
          confidence: 'high',
          evidence: pkg.snippet.trim(),
          suggestion: 'Verify the package name against official documentation or replace it.',
          understanding_required: true,
          understanding_confirmed: false,
          details: {
            registryUrl: `https://registry.npmjs.org/${cleanPkgName}`,
            packageName: cleanPkgName,
          },
        });
      }
    } catch (apiErr) {
      console.warn(`Failed to query npm for ${cleanPkgName}:`, apiErr.message);
    }
  }

  return { findings };
}