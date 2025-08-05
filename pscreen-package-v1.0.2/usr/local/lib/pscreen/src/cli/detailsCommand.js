const chalk = require('chalk');
const path = require('path');
const fs = require('fs');
const logger = require('../utils/logger');

class DetailsCommand {
  /**
   * Display detailed results with URLs and paths
   * @param {string} sessionDir - Path to screenshot directory
   * @param {string} baseUrl - Base URL for web links (optional)
   */
  async displayDetailedResults(sessionDir, baseUrl = null) {
    try {
      const { getFilesByExtension } = require('../utils/fileSystem');
      
      console.log(chalk.green.bold('\n📸 Detailed Screenshot Information:'));
      console.log(chalk.cyan(`📂 Session Directory: ${sessionDir}`));
      console.log(chalk.cyan(`📂 Relative Path: ${path.relative(process.cwd(), sessionDir)}`));
      
      if (baseUrl) {
        // Extract domain and timestamp for URL construction
        const pathParts = sessionDir.split(path.sep);
        const domain = pathParts[pathParts.length - 2];
        const timestamp = pathParts[pathParts.length - 1];
        console.log(chalk.blue(`🌐 Web Interface: ${baseUrl}/view/${domain}/${timestamp}`));
      }
      
      // Get all PNG files in the directory
      const screenshots = await getFilesByExtension(sessionDir, '.png');
      
      console.log(chalk.yellow.bold(`\n📊 Found ${screenshots.length} screenshots:`));
      
      for (const screenshot of screenshots) {
        const filePath = path.join(sessionDir, screenshot);
        
        if (fs.existsSync(filePath)) {
          const stats = fs.statSync(filePath);
          const fileSize = (stats.size / 1024).toFixed(1);
          
          console.log(chalk.green(`  ✅ ${screenshot} (${fileSize} KB)`));
          console.log(chalk.gray(`     📍 Local: ${filePath}`));
          
          if (baseUrl) {
            const pathParts = sessionDir.split(path.sep);
            const domain = pathParts[pathParts.length - 2];
            const timestamp = pathParts[pathParts.length - 1];
            const webUrl = `${baseUrl}/${domain}/${timestamp}/${screenshot}`;
            console.log(chalk.blue(`     🌐 Web: ${webUrl}`));
          }
        }
      }
      
    } catch (error) {
      logger.error(`Error displaying detailed results: ${error.message}`);
    }
  }

  /**
   * Find the most recent session directory
   */
  async findMostRecentSession() {
    try {
      const { getFilesByExtension } = require('../utils/fileSystem');
      const resultsDir = path.join(process.cwd(), 'results');
      
      if (!fs.existsSync(resultsDir)) {
        return null;
      }
      
      const siteDirs = await getFilesByExtension(resultsDir, '/');
      
      if (siteDirs.length === 0) {
        return null;
      }
      
      // Get the most recent session from all sites
      let mostRecentSession = null;
      let mostRecentTime = 0;
      
      for (const siteDir of siteDirs) {
        const fullSiteDir = path.join(resultsDir, siteDir);
        const sessionDirs = await getFilesByExtension(fullSiteDir, '/');
        
        for (const session of sessionDirs) {
          const sessionTime = new Date(session).getTime();
          if (sessionTime > mostRecentTime) {
            mostRecentTime = sessionTime;
            mostRecentSession = path.join(fullSiteDir, session);
          }
        }
      }
      
      return mostRecentSession;
    } catch (error) {
      logger.error(`Error finding recent session: ${error.message}`);
      return null;
    }
  }
}

module.exports = new DetailsCommand();
