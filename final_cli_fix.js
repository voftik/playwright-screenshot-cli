const fs = require('fs');

let content = fs.readFileSync('index.js', 'utf8');

// Replace the problematic sessionPath generation with a proper fix
content = content.replace(
    /const sessionPath = path\.relative\(options\.outputDir, options\.sessionDir \|\| ''\);/,
    `// Extract domain and timestamp from sessionDir for proper URL
        let sessionPath = '';
        if (options.sessionDir) {
            const pathParts = options.sessionDir.split(path.sep);
            const domain = pathParts[pathParts.length - 2];
            const timestamp = pathParts[pathParts.length - 1];
            sessionPath = \`\${domain}/\${timestamp}\`;
        }`
);

fs.writeFileSync('index.js', content);
console.log('CLI URL generation properly fixed!');
