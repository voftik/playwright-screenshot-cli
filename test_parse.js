function parseTimestamp(timestamp) {
    try {
        let isoString = timestamp;
        
        // Handle both date formats: 2025_08_01 and 2025-08-04
        if (isoString.includes('_') && !isoString.includes('-')) {
            // Format: 2025_08_01T09_59_42Z - replace all underscores with appropriate separators
            const [datePart, timePart] = isoString.split('T');
            const dateFixed = datePart.replace(/_/g, '-');
            const timeFixed = timePart.replace(/_/g, ':');
            isoString = dateFixed + 'T' + timeFixed;
        } else if (isoString.includes('T') && isoString.includes('_')) {
            // Format: 2025-08-04T21_13_23_105Z - only replace underscores in time part
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

// Test both formats
console.log('Testing format 1:', parseTimestamp('2025_08_01T09_59_42Z'));
console.log('Formatted:', parseTimestamp('2025_08_01T09_59_42Z').toLocaleString('ru-RU'));
console.log('Testing format 2:', parseTimestamp('2025-08-04T21_13_23_105Z'));
console.log('Formatted:', parseTimestamp('2025-08-04T21_13_23_105Z').toLocaleString('ru-RU'));
