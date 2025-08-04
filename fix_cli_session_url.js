const fs = require('fs');

let content = fs.readFileSync('index.js', 'utf8');

// Fix the session URL generation
content = content.replace(
    /const sessionUrl = sessionPath \? `\${baseUrl}\/view\/\${sessionPath\.replace\(\/\[\\\\\/\]\/g, '\/'\)\}` : baseUrl;/,
    `const sessionUrl = sessionPath ? \`\${baseUrl}/view/\${path.relative(options.outputDir, sessionPath).replace(/[\\\\\\\\]/g, '/')}\` : baseUrl;`
);

// Fix the external IP reference
content = content.replace(
    /🌍 Внешний IP: \$\{externalIpInfo\.ip\}/,
    '🌍 Внешний IP: ${externalIpInfo?.ip || "N/A"}'
);

// Fix the baseUrl construction
content = content.replace(
    /const baseUrl = `http:\/\/\${externalIpInfo\.ip}:\${port}`;/,
    'const baseUrl = `http://${externalIpInfo?.ip || "localhost"}:${port}`;'
);

fs.writeFileSync('index.js', content);
console.log('CLI session URL generation fixed!');
