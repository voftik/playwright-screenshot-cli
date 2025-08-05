const axios = require('axios');
const config = require('../../config/default.js');

class ExternalIpService {
  constructor() {
    this.cachedIp = null;
    this.cacheExpiry = null;
    this.ipServices = [
      'https://api.ipify.org?format=json',
      'https://ipinfo.io/json',
      'https://api.ip.sb/jsonip'
    ];
  }

  /**
   * Get external IP with caching
   */
  async getExternalIp() {
    // Check if cached IP is still valid
    if (this.cachedIp && this.cacheExpiry && Date.now() < this.cacheExpiry) {
      return { ip: this.cachedIp, cached: true };
    }

    // Try to get IP from services
    for (const service of this.ipServices) {
      try {
        const response = await axios.get(service, { 
          timeout: 5000,
          validateStatus: status => status === 200
        });
        
        let ip;
        if (response.data.ip) {
          ip = response.data.ip;
        } else if (response.data.query) {
          ip = response.data.query;
        } else if (typeof response.data === 'string') {
          ip = response.data.trim();
        }

        if (ip && this.isValidIp(ip)) {
          this.cachedIp = ip;
          this.cacheExpiry = Date.now() + (5 * 60 * 1000); // 5 minutes
          return { ip, cached: false, source: service };
        }
      } catch (error) {
        // Continue to next service
        continue;
      }
    }

    // Fallback to environment variable or default
    const fallbackIp = process.env.EXTERNAL_IP || '127.0.0.1';
    return { ip: fallbackIp, cached: false, fallback: true };
  }

  /**
   * Validate IP address format
   */
  isValidIp(ip) {
    const ipRegex = /^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/;
    return ipRegex.test(ip);
  }

  /**
   * Clear cached IP
   */
  clearCache() {
    this.cachedIp = null;
    this.cacheExpiry = null;
  }
}

module.exports = new ExternalIpService();
