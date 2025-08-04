/**
 * File system utilities
 * @module utils/fileSystem
 */

const fs = require('fs').promises;
const path = require('path');

/**
 * Ensure directory exists, create if not
 * @param {string} dirPath - Directory path
 */
async function ensureDir(dirPath) {
  try {
    await fs.access(dirPath);
  } catch {
    await fs.mkdir(dirPath, { recursive: true });
  }
}

/**
 * Get file size in human readable format
 * @param {string} filePath - Path to file
 * @returns {Promise<string>} Formatted file size
 */
async function getFileSize(filePath) {
  try {
    const stats = await fs.stat(filePath);
    const bytes = stats.size;
    
    if (bytes === 0) return '0 B';
    
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  } catch {
    return 'Unknown';
  }
}

/**
 * Parse timestamp from directory name
 * @param {string} timestamp - Timestamp string
 * @returns {Date} Parsed date object
 */
function parseTimestamp(timestamp) {
  try {
    let isoString = timestamp;
    
    // Handle different timestamp formats
    if (isoString.includes('_') && !isoString.includes('-')) {
      // Format: 2025_08_01T09_59_42Z
      const [datePart, timePart] = isoString.split('T');
      const dateFixed = datePart.replace(/_/g, '-');
      const timeFixed = timePart.replace(/_/g, ':');
      isoString = dateFixed + 'T' + timeFixed;
    } else if (isoString.includes('T') && isoString.includes('_')) {
      // Format: 2025-08-04T21_13_23_105Z
      const [datePart, timePart] = isoString.split('T');
      let timeFixed = timePart.replace(/_/g, ':');
      
      // Fix milliseconds format
      if (timeFixed.match(/:\d{3}Z$/)) {
        timeFixed = timeFixed.replace(/:(\d{3})Z$/, '.$1Z');
      }
      
      isoString = datePart + 'T' + timeFixed;
    }
    
    return new Date(isoString);
  } catch {
    return new Date();
  }
}

/**
 * Generate timestamp string for directory names
 * @returns {string} ISO timestamp string
 */
function generateTimestamp() {
  return new Date().toISOString();
}

/**
 * Check if file exists
 * @param {string} filePath - File path to check
 * @returns {Promise<boolean>} True if file exists
 */
async function fileExists(filePath) {
  try {
    await fs.access(filePath);
    return true;
  } catch {
    return false;
  }
}

/**
 * Get directory contents (both files and directories)
 * @param {string} dirPath - Directory path
 * @returns {Promise<string[]>} Array of directory contents
 */
async function getDirContents(dirPath) {
  try {
    return await fs.readdir(dirPath);
  } catch {
    return [];
  }
}

/**
 * Get files filtered by extension
 * @param {string} dirPath - Directory path
 * @param {string} extension - File extension to filter by
 * @returns {Promise<string[]>} Array of matching file names
 */
async function getFilesByExtension(dirPath, extension) {
  try {
    const contents = await fs.readdir(dirPath);
    if (extension === '/') {
      // Return directories only
      const directories = [];
      for (const item of contents) {
        const itemPath = path.join(dirPath, item);
        const stat = await fs.stat(itemPath);
        if (stat.isDirectory()) {
          directories.push(item);
        }
      }
      return directories;
    }
    return contents.filter(file => file.endsWith(extension));
  } catch {
    return [];
  }
}

/**
 * Check if path is directory
 * @param {string} dirPath - Path to check
 * @returns {Promise<boolean>} True if directory
 */
async function isDirectory(dirPath) {
  try {
    const stat = await fs.stat(dirPath);
    return stat.isDirectory();
  } catch {
    return false;
  }
}

module.exports = {
  ensureDir,
  getFileSize,
  parseTimestamp,
  generateTimestamp,
  fileExists,
  getFilesByExtension,
  getDirContents,
  isDirectory
};
