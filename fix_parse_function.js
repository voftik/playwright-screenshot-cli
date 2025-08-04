function parseTimestamp(timestamp) {
    try {
        let isoString = timestamp;
        
        if (isoString.includes('T') && isoString.includes('_')) {
            const [datePart, timePart] = isoString.split('T');
            let timeFixed = timePart.replace(/_/g, ':');
            
            // Fix milliseconds format: change last :xxx to .xxx
            if (timeFixed.match(/:\d{3}Z$/)) {
                timeFixed = timeFixed.replace(/:(\d{3})Z$/, '.$1Z');
            }
            
            isoString = datePart + 'T' + timeFixed;
        }
        
        return new Date(isoString);
    } catch (e) {
        console.warn('Failed to parse timestamp:', timestamp);
        return new Date();
    }
}

// Test it
console.log('Testing parseTimestamp function:');
console.log('Input: 2025-08-04T21_13_23_105Z');
const result = parseTimestamp('2025-08-04T21_13_23_105Z');
console.log('Output:', result);
console.log('Formatted:', result.toLocaleString('ru-RU'));
