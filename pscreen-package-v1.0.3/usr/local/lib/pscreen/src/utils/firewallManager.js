/**
 * Firewall Manager - manages UFW firewall rules for screenshot server
 */

const { exec } = require('child_process');
const { promisify } = require('util');
const logger = require('./logger');

const execAsync = promisify(exec);

class FirewallManager {
  /**
   * Check if UFW is active
   */
  async isUfwActive() {
    try {
      const { stdout } = await execAsync('ufw status');
      return stdout.includes('Status: active');
    } catch (error) {
      logger.warn(`Failed to check UFW status: ${error.message}`);
      return false;
    }
  }

  /**
   * Check if a port is allowed in UFW
   */
  async isPortAllowed(port) {
    try {
      const { stdout } = await execAsync('ufw status numbered');
      // Check for exact port or port ranges that include this port
      const lines = stdout.split('\n');
      
      for (const line of lines) {
        if (line.includes(`${port}/tcp`) && line.includes('ALLOW')) {
          return true;
        }
        
        // Check port ranges like 9000:9010/tcp
        const rangeMatch = line.match(/(\d+):(\d+)\/tcp.*ALLOW/);
        if (rangeMatch) {
          const start = parseInt(rangeMatch[1]);
          const end = parseInt(rangeMatch[2]);
          if (port >= start && port <= end) {
            return true;
          }
        }
      }
      
      return false;
    } catch (error) {
      logger.warn(`Failed to check port ${port} in UFW: ${error.message}`);
      return false;
    }
  }

  /**
   * Add UFW rule to allow a port
   */
  async allowPort(port) {
    try {
      const { stdout } = await execAsync(`ufw allow ${port}/tcp`);
      logger.info(`UFW rule added for port ${port}: ${stdout.trim()}`);
      return true;
    } catch (error) {
      logger.error(`Failed to add UFW rule for port ${port}: ${error.message}`);
      return false;
    }
  }

  /**
   * Check and configure firewall for a given port
   */
  async ensurePortAccess(port) {
    const isActive = await this.isUfwActive();
    
    if (!isActive) {
      logger.info('UFW is not active, no firewall configuration needed');
      return { success: true, message: 'UFW is not active' };
    }

    const isAllowed = await this.isPortAllowed(port);
    
    if (isAllowed) {
      logger.info(`Port ${port} is already allowed in UFW`);
      return { success: true, message: `Port ${port} is already allowed` };
    }

    logger.warn(`Port ${port} is not allowed in UFW, attempting to add rule...`);
    
    const added = await this.allowPort(port);
    
    if (added) {
      return { 
        success: true, 
        message: `Port ${port} has been added to UFW rules`,
        ruleAdded: true 
      };
    } else {
      return { 
        success: false, 
        message: `Failed to add UFW rule for port ${port}. Please run: sudo ufw allow ${port}/tcp`,
        ruleAdded: false 
      };
    }
  }

  /**
   * Get current UFW status with port information
   */
  async getFirewallStatus() {
    try {
      const isActive = await this.isUfwActive();
      const { stdout } = await execAsync('ufw status');
      
      return {
        active: isActive,
        rules: stdout,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      logger.error(`Failed to get firewall status: ${error.message}`);
      return {
        active: false,
        rules: 'Error getting UFW status',
        error: error.message
      };
    }
  }
}

module.exports = new FirewallManager();
