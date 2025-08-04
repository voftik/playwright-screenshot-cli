const fs = require('fs');

let content = fs.readFileSync('index.js', 'utf8');

// Fix the session URL generation - extract only domain and timestamp from sessionDir
content = content.replace(
    /const sessionUrl = sessionPath \? `\${baseUrl}\/view\/\${sessionPath\.replace\(\/\[\\\\\\\\\\\\\/\]\/g, '\/'\)\}` : baseUrl;/,
    `// Extract domain and timestamp from sessionDir path
        let sessionUrl = baseUrl;
        if (options.sessionDir) {
            const pathParts = options.sessionDir.split(path.sep);
            const domain = pathParts[pathParts.length - 2]; // second to last part
            const timestamp = pathParts[pathParts.length - 1]; // last part
            sessionUrl = \`\${baseUrl}/view/\${domain}/\${timestamp}\`;
        }`
);

fs.writeFileSync('index.js', content);
console.log('Session URL generation fixed!');
