const fs = require('fs');

let content = fs.readFileSync('server-only.js', 'utf8');

// Add parseTimestamp function at the top after fs require
const parseFunction = `

function parseTimestamp(timestamp) {
    // Handle formats like: 2025-08-04T21_13_23_105Z or 2025_08_01T09_55_00Z
    try {
        let isoString = timestamp;
        
        // Replace underscores with colons for time part
        if (isoString.includes('T') && isoString.includes('_')) {
            const [datePart, timePart] = isoString.split('T');
            const timeFixed = timePart.replace(/_/g, ':');
            
            // Handle milliseconds format (123Z -> .123Z)
            const msMatch = timeFixed.match(/:(\\d{3})Z$/);
            if (msMatch) {
                isoString = datePart + 'T' + timeFixed.replace(/:(\\d{3})Z$/, '.$1Z');
            } else {
                isoString = datePart + 'T' + timeFixed;
            }
        }
        
        return new Date(isoString);
    } catch (e) {
        console.warn('Failed to parse timestamp:', timestamp);
        return new Date(); // fallback to current date
    }
}`;

// Insert function after fs require
content = content.replace(
    /(const fs = require\('fs'\);)/,
    '$1' + parseFunction
);

// Replace the problematic date parsing line
content = content.replace(
    /const date = new Date\(timestamp\.replace\([^)]+\)\);/,
    'const date = parseTimestamp(timestamp);'
);

// Replace the sorting line
content = content.replace(
    /sessions\.sort\(\(a, b\) => new Date\(b\.timestamp\.replace\([^)]+\)\) - new Date\(a\.timestamp\.replace\([^)]+\)\)\);/,
    'sessions.sort((a, b) => parseTimestamp(b.timestamp) - parseTimestamp(a.timestamp));'
);

// Replace view page timestamp formatting
content = content.replace(
    /new Date\(timestamp\.replace\([^)]+\)\)\.toLocaleString\('ru-RU'\)/,
    "parseTimestamp(timestamp).toLocaleString('ru-RU')"
);

fs.writeFileSync('server-only.js', content);
console.log('Date parsing properly fixed!');
