# Changelog

## [2.0.0] - 2025-08-04

### 🚀 Major New Features

#### Web Interface Enhancements
- ✅ **Functional Statistics Button** - "📊 Обновить статистику" now works correctly
- ✅ **Functional Delete Button** - "🗑️ Удалить все скриншоты" with confirmation dialog
- ✅ **Auto-loading Statistics** - Statistics load automatically on page load
- ✅ **Real-time Data Display** - Shows domains, sessions, files count, and storage size

#### Enhanced CLI Output
- ✅ **External URLs Generation** - CLI now outputs full external URLs for web access
- ✅ **Absolute Server Paths** - Shows complete file system paths
- ✅ **Direct Image Links** - Provides direct URLs for each screenshot
- ✅ **Server Auto-detection** - Automatically detects running web server

#### New Management Features
- ✅ **Cleanup Manager** - Smart cleanup with storage statistics
- ✅ **Firewall Manager** - Automatic UFW port configuration
- ✅ **External IP Service** - Automatic external IP detection
- ✅ **Port Manager** - Intelligent port selection and management

### 🔧 Technical Improvements

#### JavaScript & API Fixes
- 🐛 Fixed JavaScript syntax errors in web interface
- 🐛 Added missing API endpoints: `/api/stats` and `/api/screenshots`
- 🐛 Proper error handling and user feedback
- 🐛 CORS and security headers configuration

#### Enhanced Architecture
- 📦 Modular utility system with dedicated managers
- 📦 Improved file system operations
- 📦 Better error handling and logging
- 📦 Enhanced validation system

#### CLI Enhancements
- 🎯 Detailed output with all necessary information
- 🎯 Port detection and URL generation
- 🎯 Better progress reporting
- 🎯 Enhanced screenshot metadata

### 🌐 Web Interface Features

#### Working Buttons
```javascript
// Statistics Button - loads real data
📊 Обновить статистику -> Shows: Domains, Sessions, Files, Storage Size

// Delete Button - with confirmation
🗑️ Удалить все скриншоты -> Confirms -> Deletes -> Updates display
```

#### API Endpoints
```
GET  /api/stats        - Get storage statistics
DELETE /api/screenshots - Delete all screenshots
GET  /health           - Health check
```

### 📊 Example CLI Output

```
✅ Screenshots completed successfully!
📂 Relative Path: results/example.com/2025-08-04T23:56:27.768Z
📁 Absolute Server Path: /root/tools/scripts/playwright_screenshotter/results/example.com/2025-08-04T23:56:27.768Z
⏱️  Duration: 12.4s
📊 Created: 1 full page + 9 viewport screenshots

🌐 External URLs:
📋 Main Dashboard: http://77.73.238.240:9009
📸 Session Gallery: http://77.73.238.240:9009/view/example.com/2025-08-04T23:56:27.768Z
🖼️  Direct Image URLs:
   • full_page.png: http://77.73.238.240:9009/example.com/2025-08-04T23:56:27.768Z/full_page.png
   • viewport_00.png: http://77.73.238.240:9009/example.com/2025-08-04T23:56:27.768Z/viewport_00.png
```

### 🛠️ Files Changed

#### New Files
- `src/utils/cleanupManager.js` - Data cleanup and statistics
- `src/utils/firewallManager.js` - UFW firewall management
- `src/cli/detailsCommand.js` - Enhanced command details

#### Modified Files
- `src/server/index.js` - Added API endpoints and fixed JavaScript
- `src/cli/screenshotService.js` - Enhanced output with URLs and paths
- `src/cli/index.js` - Improved CLI interface
- `src/utils/fileSystem.js` - Better file operations

### 🔒 Security & Configuration
- Added proper CORS configuration
- Enhanced CSP headers
- Automatic firewall port management
- Input validation improvements

### 🐛 Bug Fixes
- Fixed JavaScript syntax errors in web template
- Resolved template literal conflicts
- Fixed port detection issues
- Corrected path resolution problems
- Fixed button event handling

### ⚡ Performance
- Optimized file system operations
- Better memory management
- Reduced startup time
- Improved error recovery

---

## [1.0.0] - Previous Version

Initial release with basic screenshot functionality and web server.
