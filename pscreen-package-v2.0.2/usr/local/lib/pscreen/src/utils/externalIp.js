/**
 * External IP detection utility
 * @module utils/externalIp
 */

const axios = require('axios');
const { execSync } = require('child_process');
const fs = require('fs').promises;
const path = require('path');
const config = require('../../config/default');

class ExternalIpService {
  constructor() {
    this.cacheFile = path.join(process.cwd(), '.ip-cache.json');
    this.config = config.externalIp;
  }

  /**
   * Get external IP address with caching
   * @param {boolean} force - Force refresh cache
   * @returns {Promise<Object>} IP information object
   */
  async getExternalIp(force = false) {
    try {
      // Check cache first
      if (!force) {
        const cached = await this.getCachedIp();
        if (cached && this.isCacheValid(cached)) {
          return cached;
        }
      }

      // Try curl first (most reliable)
      let ipInfo = await this.fetchByCurl();
      if (!ipInfo) {
        // Try to fetch from services
        ipInfo = await this.fetchFromServices();
      }
      
      // Cache the result
      await this.cacheIpInfo(ipInfo);
      
      return ipInfo;
    } catch (error) {
      console.warn('Failed to get external IP:', error.message);
      return this.getFallbackIp();
    }
  }

  /**
   * Fetch IP using curl command (most reliable)
   * @private
   */
  async fetchByCurl() {
    try {
      const ip = execSync('curl -s --max-time 5 ifconfig.me', { encoding: 'utf8' }).trim();
      if (ip && this.isValidIp(ip)) {
        return {
          ip,
          source: 'curl-ifconfig.me',
          timestamp: Date.now()
        };
      }
    } catch (error) {
      // Try alternative curl services
      const curlServices = [
        'ipinfo.io/ip',
        'api.ipify.org',
        'ident.me',
        'checkip.amazonaws.com'
      ];

      for (const service of curlServices) {
        try {
          const ip = execSync(`curl -s --max-time 5 ${service}`, { encoding: 'utf8' }).trim();
          if (ip && this.isValidIp(ip)) {
            return {
              ip,
              source: `curl-${service}`,
              timestamp: Date.now()
            };
          }
        } catch {}
      }
    }
    return null;
  }

  /**
   * Get cached IP information
   * @private
   */
  async getCachedIp() {
    try {
      const data = await fs.readFile(this.cacheFile, 'utf8');
      return JSON.parse(data);
    } catch {
      return null;
    }
  }

  /**
   * Check if cache is still valid
   * @private
   */
  isCacheValid(cached) {
    return Date.now() - cached.timestamp < this.config.cacheTimeout;
  }

  /**
   * Fetch IP from external services
   * @private
   */
  async fetchFromServices() {
    const errors = [];

    for (const service of this.config.services) {
      try {
        const response = await axios.get(service, { 
          timeout: 5000,
          headers: { 'User-Agent': 'PlaywrightScreenshotCLI/2.0.2' }
        });
        
        const ip = this.extractIpFromResponse(response.data);
        
        if (ip && this.isValidIp(ip)) {
          return {
            ip,
            source: service,
            timestamp: Date.now()
          };
        }
      } catch (error) {
        errors.push({ service, error: error.message });
      }
    }

    throw new Error(`All IP services failed: ${errors.map(e => e.error).join(', ')}`);
  }

  /**
   * Extract IP from service response
   * @private
   */
  extractIpFromResponse(data) {
    if (typeof data === 'string') {
      return data.trim();
    }
    
    return data.ip || data.origin || null;
  }

  /**
   * Validate IP address format
   * @private
   */
  isValidIp(ip) {
    const ipv4Regex = /^(\d{1,3}\.){3}\d{1,3}$/;
    const ipv6Regex = /^([0-9a-fA-F]{1,4}:){7}[0-9a-fA-F]{1,4}$/;
    
    return ipv4Regex.test(ip) || ipv6Regex.test(ip);
  }

  /**
   * Cache IP information
   * @private
   */
  async cacheIpInfo(ipInfo) {
    try {
      await fs.writeFile(this.cacheFile, JSON.stringify(ipInfo, null, 2));
    } catch (error) {
      console.warn('Failed to cache IP info:', error.message);
    }
  }

  /**
   * Get fallback IP when all services fail
   * @private
   */
  getFallbackIp() {
    return {
      ip: this.config.fallbackIp,
      source: 'fallback',
      timestamp: Date.now(),
      warning: 'Using fallback IP - external services unavailable'
    };
  }

  /**
   * Clear IP cache
   */
  async clearCache() {
    try {
      await fs.unlink(this.cacheFile);
      return true;
    } catch {
      return false;
    }
  }
}

module.exports = new ExternalIpService();
