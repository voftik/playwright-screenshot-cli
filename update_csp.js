const fs = require('fs');

let content = fs.readFileSync('final_server.js', 'utf8');

// Add the correct CSP header
content = content.replace(
    'next();',
    `res.header('Content-Security-Policy', "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com;");\n    next();`
);

// Add stylesheet link in HTML (if missing)
if (!content.includes('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap')) {
    content = content.replace(
        '<title>',
        "<link href='https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap' rel='stylesheet'><title>"
    );
}

fs.writeFileSync('final_server.js', content);
console.log('CSP and HTML updated!');
