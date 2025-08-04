const fs = require('fs');

// Read the server file
let content = fs.readFileSync('server-only.js', 'utf8');

// Function to properly parse timestamp from directory name
const parseTimestampFunction = `
function parseTimestamp(timestamp) {
    // Handle formats like: 2025-08-04T21_13_23_105Z or 2025_08_01T09_55_00Z
    let isoString = timestamp
        .replace(/_/g, ':')  // Replace underscores with colons
        .replace(/T(\d{2}):(\d{2}):(\d{2}):(\d{3})Z/, 'T$1:$2:$3.$4Z')  // Fix milliseconds
        .replace(/T(\d{2}):(\d{2}):(\d{2})Z/, 'T$1:$2:$3Z');  // Handle without milliseconds
    
    try {
        return new Date(isoString);
    } catch (e) {
        console.warn('Failed to parse timestamp:', timestamp, 'as', isoString);
        return new Date(); // fallback to current date
    }
}`;

// Replace the date parsing line
content = content.replace(
    /const date = new Date\(timestamp\.replace\([^)]+\)\);/,
    'const date = parseTimestamp(timestamp);'
);

// Replace the sorting line  
content = content.replace(
    /sessions\.sort\(\(a, b\) => new Date\(b\.timestamp\.replace\([^)]+\)\) - new Date\(a\.timestamp\.replace\([^)]+\)\)\);/,
    'sessions.sort((a, b) => parseTimestamp(b.timestamp) - parseTimestamp(a.timestamp));'
);

// Replace the view page date parsing
content = content.replace(
    /\$\{new Date\(timestamp\.replace\([^)]+\)\)\.toLocaleString\('ru-RU'\)\}/,
    '${parseTimestamp(timestamp).toLocaleString(\'ru-RU\')}'
);

// Add the function at the top of the file after imports
content = content.replace(
    /(const fs = require\('fs'\);)/,
    '$1\n' + parseTimestampFunction
);

fs.writeFileSync('server-only.js', content);
console.log('Date parsing fixed!');
