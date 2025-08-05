/**
 * Cleanup Manager - manages deletion of screenshots and history
 */

const fs = require('fs').promises;
const path = require('path');
const logger = require('./logger');

class CleanupManager {
  /**
   * Delete all screenshots and directories
   */
  async deleteAllScreenshots(resultsDir) {
    try {
      const stats = await this.getStorageStats(resultsDir);
      
      // Remove all contents of results directory but keep the directory itself
      const items = await fs.readdir(resultsDir);
      
      for (const item of items) {
        const itemPath = path.join(resultsDir, item);
        await this.deleteRecursive(itemPath);
      }
      
      logger.info(`Deleted all screenshots from ${resultsDir}`);
      
      return {
        success: true,
        message: `Successfully deleted ${stats.totalFiles} files (${stats.totalSizeMB.toFixed(1)} MB)`,
        stats: stats
      };
      
    } catch (error) {
      logger.error(`Failed to delete screenshots: ${error.message}`);
      return {
        success: false,
        message: `Failed to delete screenshots: ${error.message}`,
        error: error.message
      };
    }
  }

  /**
   * Recursively delete directory or file
   */
  async deleteRecursive(itemPath) {
    try {
      const stat = await fs.lstat(itemPath);
      
      if (stat.isDirectory()) {
        const items = await fs.readdir(itemPath);
        
        // Delete all items in directory
        for (const item of items) {
          await this.deleteRecursive(path.join(itemPath, item));
        }
        
        // Delete the empty directory
        await fs.rmdir(itemPath);
      } else {
        // Delete file
        await fs.unlink(itemPath);
      }
    } catch (error) {
      logger.warn(`Failed to delete ${itemPath}: ${error.message}`);
    }
  }

  /**
   * Get storage statistics
   */
  async getStorageStats(resultsDir) {
    try {
      let totalFiles = 0;
      let totalSize = 0;
      let sessions = 0;
      let domains = 0;

      try {
        const domainDirs = await fs.readdir(resultsDir);
        domains = domainDirs.length;

        for (const domainDir of domainDirs) {
          const domainPath = path.join(resultsDir, domainDir);
          const stat = await fs.lstat(domainPath);
          
          if (stat.isDirectory()) {
            const sessionDirs = await fs.readdir(domainPath);
            sessions += sessionDirs.length;

            for (const sessionDir of sessionDirs) {
              const sessionPath = path.join(domainPath, sessionDir);
              const sessionStat = await fs.lstat(sessionPath);
              
              if (sessionStat.isDirectory()) {
                const files = await fs.readdir(sessionPath);
                
                for (const file of files) {
                  const filePath = path.join(sessionPath, file);
                  const fileStat = await fs.lstat(filePath);
                  
                  if (fileStat.isFile()) {
                    totalFiles++;
                    totalSize += fileStat.size;
                  }
                }
              }
            }
          }
        }
      } catch (error) {
        // Results directory might not exist
      }

      return {
        totalFiles,
        totalSize,
        totalSizeMB: totalSize / (1024 * 1024),
        sessions,
        domains,
        timestamp: new Date().toISOString()
      };
      
    } catch (error) {
      logger.error(`Failed to get storage stats: ${error.message}`);
      return {
        totalFiles: 0,
        totalSize: 0,
        totalSizeMB: 0,
        sessions: 0,
        domains: 0,
        error: error.message
      };
    }
  }

  /**
   * Delete screenshots older than specified days
   */
  async deleteOldScreenshots(resultsDir, days = 7) {
    try {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - days);
      
      let deletedFiles = 0;
      let deletedSize = 0;

      const domainDirs = await fs.readdir(resultsDir);

      for (const domainDir of domainDirs) {
        const domainPath = path.join(resultsDir, domainDir);
        const stat = await fs.lstat(domainPath);
        
        if (stat.isDirectory()) {
          const sessionDirs = await fs.readdir(domainPath);

          for (const sessionDir of sessionDirs) {
            try {
              const sessionDate = new Date(sessionDir);
              
              if (sessionDate < cutoffDate) {
                const sessionPath = path.join(domainPath, sessionDir);
                const stats = await this.getDirectoryStats(sessionPath);
                
                await this.deleteRecursive(sessionPath);
                
                deletedFiles += stats.files;
                deletedSize += stats.size;
                
                logger.info(`Deleted old session: ${domainDir}/${sessionDir}`);
              }
            } catch (error) {
              // Skip invalid date directories
            }
          }
        }
      }

      return {
        success: true,
        message: `Deleted ${deletedFiles} old files (${(deletedSize / (1024 * 1024)).toFixed(1)} MB)`,
        deletedFiles,
        deletedSize
      };
      
    } catch (error) {
      logger.error(`Failed to delete old screenshots: ${error.message}`);
      return {
        success: false,
        message: `Failed to delete old screenshots: ${error.message}`,
        error: error.message
      };
    }
  }

  /**
   * Get directory statistics
   */
  async getDirectoryStats(dirPath) {
    let files = 0;
    let size = 0;

    try {
      const items = await fs.readdir(dirPath);
      
      for (const item of items) {
        const itemPath = path.join(dirPath, item);
        const stat = await fs.lstat(itemPath);
        
        if (stat.isFile()) {
          files++;
          size += stat.size;
        }
      }
    } catch (error) {
      // Directory might not exist
    }

    return { files, size };
  }
}

module.exports = new CleanupManager();
