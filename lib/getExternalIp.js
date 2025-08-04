const axios = require('axios');
const fs = require('fs');
const path = require('path');

class ExternalIpService {
    constructor() {
        this.cacheFile = path.join(__dirname, '../.ip-cache.json');
        this.cacheTimeout = 300000; // 5 minutes
    }

    async getExternalIp(force = false) {
        try {
            // Check cache first
            if (!force && fs.existsSync(this.cacheFile)) {
                const cache = JSON.parse(fs.readFileSync(this.cacheFile, 'utf8'));
                if (Date.now() - cache.timestamp < this.cacheTimeout) {
                    return cache;
                }
            }

            // Try multiple services
            const services = [
                'https://api.ipify.org?format=json',
                'https://httpbin.org/ip',
                'https://jsonip.com'
            ];

            for (const service of services) {
                try {
                    const response = await axios.get(service, { timeout: 5000 });
                    let ip = null;
                    
                    if (response.data.ip) {
                        ip = response.data.ip;
                    } else if (response.data.origin) {
                        ip = response.data.origin;
                    }

                    if (ip) {
                        const result = {
                            ip,
                            source: service,
                            timestamp: Date.now()
                        };
                        
                        // Cache the result
                        fs.writeFileSync(this.cacheFile, JSON.stringify(result, null, 2));
                        return result;
                    }
                } catch (error) {
                    console.warn(`Failed to get IP from ${service}:`, error.message);
                }
            }

            // Fallback to hardcoded IP if all services fail
            console.warn('All IP services failed, using fallback');
            return {
                ip: '77.73.238.240',
                source: 'fallback',
                timestamp: Date.now(),
                warning: 'Using fallback IP'
            };

        } catch (error) {
            console.error('Error getting external IP:', error);
            return {
                ip: '77.73.238.240',
                source: 'fallback',
                timestamp: Date.now(),
                warning: 'Error occurred, using fallback IP'
            };
        }
    }
}

const externalIpService = new ExternalIpService();

module.exports = {
    getExternalIp: (force) => externalIpService.getExternalIp(force)
};
