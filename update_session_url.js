const fs = require('fs');
let content = fs.readFileSync('index.js', 'utf8');

content = content.replace(
    /const sessionPath = path.relative\(process.cwd\(\), options\.sessionDir \|\| ''\);\n        const sessionUrl = sessionPath \? `\$\{baseUrl\}\/view\/\$\{sessionPath\.replace\(\/\[\\\\\/\]\/g, '\/'\)\}` : baseUrl;\n/,
    `// Generate correct session URL without 'results' prefix\n        const sessionPath = path.relative(options.outputDir, options.sessionDir || '');\n        const sessionUrl = sessionPath ? \
            \
            \
            \
            \
            `${baseUrl}/view/${sessionPath}` : baseUrl;\n`
);

fs.writeFileSync('index.js', content);
console.log('URL generation updated!');
