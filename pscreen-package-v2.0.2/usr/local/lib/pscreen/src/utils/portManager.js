/**
 * Port management utility
 * @module utils/portManager
 */

const net = require('net');
const config = require('../../config/default');

class PortManager {
  /**
   * Find an available port in the specified range
   * @param {number} startPort - Starting port number
   * @param {number} endPort - Ending port number
   * @returns {Promise<number>} Available port number
   */
  async findAvailablePort(startPort = config.server.portRange.start, endPort = config.server.portRange.end) {
    for (let port = startPort; port <= endPort; port++) {
      if (await this.isPortAvailable(port)) {
        return port;
      }
    }
    
    throw new Error(`No available port found in range ${startPort}-${endPort}`);
  }

  /**
   * Check if a port is available
   * @param {number} port - Port number to check
   * @returns {Promise<boolean>} True if port is available
   */
  async isPortAvailable(port) {
    return new Promise((resolve) => {
      const server = net.createServer();
      
      server.once('error', (err) => {
        resolve(err.code !== 'EADDRINUSE');
      });
      
      server.once('listening', () => {
        server.close(() => {
          resolve(true);
        });
      });
      
      server.listen(port);
    });
  }

  /**
   * Get the default port with fallback to available port
   * @returns {Promise<number>} Port number
   */
  async getPort() {
    const preferredPort = config.server.port;
    
    if (await this.isPortAvailable(preferredPort)) {
      return preferredPort;
    }
    
    return this.findAvailablePort();
  }
}

module.exports = new PortManager();
