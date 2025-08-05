# 🔧 Technical Guide - Playwright Screenshot CLI

## Architecture Overview

The application follows a modular architecture with clear separation of concerns:

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   CLI Interface │────│  Screenshot     │────│  Web Server     │
│   (Commander)   │    │  Service        │    │  (Express)      │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │                       │
         │                       │                       │
         ▼                       ▼                       ▼
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Validation    │    │  File System    │    │  API Endpoints  │
│   & Logging     │    │  Operations     │    │  & Static Files │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │                       │
         └───────────────────────┼───────────────────────┘
                                 ▼
                    ┌─────────────────┐
                    │  Utility Layer  │
                    │  (Managers)     │
                    └─────────────────┘
```

## Core Components

### 1. CLI Interface (`src/cli/index.js`)

**Purpose**: Command-line interface using Commander.js

**Key Features**:
- `take` command for creating screenshots
- `serve` command for starting web server
- `cleanup` command for data management
- Enhanced output with external URLs and absolute paths

**Example Usage**:
```bash
node src/cli/index.js take https://example.com --width 1920 --height 1080
node src/cli/index.js serve --port 9000
node src/cli/index.js cleanup --days 30
```

### 2. Screenshot Service (`src/cli/screenshotService.js`)

**Purpose**: Core screenshot creation logic using Playwright

**Key Methods**:
```javascript
async takeScreenshot(url, options)           // Main screenshot function
async takeViewportScreenshots(page, dir)    // Multiple viewport captures
async displaySuccessInfo(sessionDir, data)  // Enhanced CLI output with URLs
async findActiveWebServerPort()              // Detect running server
```

**Enhanced Output Features**:
- Absolute server paths
- External URL generation
- Direct image links
- Server auto-detection

### 3. Web Server (`src/server/index.js`)

**Purpose**: Express.js server for web interface and API

**API Endpoints**:
```javascript
GET    /                           // Main dashboard
GET    /view/:domain/:timestamp    // Session gallery
GET    /api/stats                  // Storage statistics
DELETE /api/screenshots            // Delete all screenshots
GET    /health                     // Health check
```

**Web Interface Features**:
- Working statistics button with real-time data
- Working delete button with confirmation
- Auto-loading statistics on page load
- Responsive design with progress indicators

## Utility Managers

### 1. Cleanup Manager (`src/utils/cleanupManager.js`)

**Purpose**: Data management and cleanup operations

```javascript
async getStorageStats(resultsDir)           // Get detailed statistics
async deleteAllScreenshots(resultsDir)     // Delete all data
async deleteOldScreenshots(resultsDir, days) // Delete old files
```

**Statistics Output**:
```json
{
  "totalFiles": 128,
  "totalSize": 23177672,
  "totalSizeMB": 22.1,
  "sessions": 45,
  "domains": 13,
  "timestamp": "2025-08-04T23:37:58.367Z"
}
```

### 2. Firewall Manager (`src/utils/firewallManager.js`)

**Purpose**: Automatic UFW firewall configuration

```javascript
async ensurePortAccess(port)     // Ensure port is open
async checkPortStatus(port)      // Check if port is allowed
async addPortRule(port, protocol) // Add UFW rule
```

**Automatic Port Management**:
- Checks UFW status
- Adds rules for required ports (9000-9010)
- Provides feedback on rule addition

### 3. External IP Service (`src/utils/externalIp.js`)

**Purpose**: Automatic external IP detection with caching

```javascript
async getExternalIp()            // Get external IP with caching
async updateIpCache()            // Update cached IP
```

**Features**:
- Multiple IP detection services
- Caching mechanism
- Fallback to environment variable

### 4. Port Manager (`src/utils/portManager.js`)

**Purpose**: Intelligent port selection and management

```javascript
async getPort(preferredPort)     // Get available port
async isPortAvailable(port)      // Check port availability
```

**Smart Port Selection**:
- Tries preferred port first
- Falls back to range 9000-9010
- Avoids conflicts with running services

## File System Structure

```
results/
├── domain1.com/
│   ├── 2025-08-04T12:30:45.123Z/
│   │   ├── full_page.png
│   │   ├── viewport_00.png
│   │   ├── viewport_01.png
│   │   └── ...
│   └── 2025-08-04T15:22:18.456Z/
│       └── ...
└── domain2.com/
    └── ...
```

**Naming Convention**:
- Domains as folder names
- ISO timestamps for sessions
- Consistent file naming (full_page.png, viewport_XX.png)

## Web Interface Architecture

### HTML Generation
The server generates dynamic HTML with embedded JavaScript:

```javascript
generateMainPageHtml({ baseUrl, sites }) {
  return `
    <!DOCTYPE html>
    <html>
      <head>...</head>
      <body>
        <!-- Dashboard content -->
        <script>
          // Functional JavaScript code
          async function loadStats() { ... }
          function confirmDeleteAll() { ... }
          // Auto-load on page ready
          document.addEventListener('DOMContentLoaded', loadStats);
        </script>
      </body>
    </html>
  `;
}
```

### JavaScript Functionality
```javascript
// Statistics Loading
async function loadStats() {
  const response = await fetch('/api/stats');
  const data = await response.json();
  // Update UI with real data
}

// Delete with Confirmation
function confirmDeleteAll() {
  if (confirm('ВНИМАНИЕ! Удалить ВСЕ скриншоты?')) {
    deleteAllScreenshots();
  }
}
```

## Configuration System

### Main Config (`config/default.js`)
```javascript
module.exports = {
  screenshot: {
    outputDir: 'results',
    defaultTimeout: 30000,
    browsers: ['chromium', 'firefox', 'webkit']
  },
  server: {
    defaultPort: 9000,
    portRange: [9000, 9010],
    host: '0.0.0.0'
  },
  security: {
    cors: { enabled: true, origin: '*' },
    csp: { enabled: true }
  }
};
```

## Enhanced CLI Output System

### Before (Old)
```
✅ Screenshots completed successfully!
📂 Results: results/example.com/2025-08-04T23:56:27.768Z
⏱️  Duration: 12.4s
```

### After (New)
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

## Security Implementation

### CORS Configuration
```javascript
app.use(cors({ 
  origin: '*',  // Configurable
  methods: ['GET', 'POST', 'DELETE'],
  allowedHeaders: ['Content-Type']
}));
```

### Input Validation
```javascript
const validateScreenshotOptions = (options) => {
  const schema = z.object({
    url: z.string().url(),
    width: z.number().int().min(100).max(3840),
    height: z.number().int().min(100).max(2160),
    // ...
  });
  return schema.parse(options);
};
```

### Firewall Integration
```javascript
// Automatic UFW rule addition
const result = await firewallManager.ensurePortAccess(port);
if (result.ruleAdded) {
  console.log(`🔥 Added firewall rule: ${result.message}`);
}
```

## Error Handling

### Graceful Error Recovery
```javascript
try {
  const screenshots = await takeScreenshots(url, options);
  await displaySuccessInfo(sessionDir, screenshots, duration);
} catch (error) {
  logger.error(`Screenshot failed: ${error.message}`);
  throw error;
} finally {
  await cleanup();
}
```

### User-Friendly Messages
- Progress bars with emoji indicators
- Colored output using chalk
- Detailed error descriptions
- Helpful suggestions for fixes

## Performance Optimizations

### Caching
- External IP caching (5-minute expiry)
- Port availability caching
- File system operation optimization

### Resource Management
- Proper browser cleanup
- Memory leak prevention
- Concurrent operation limits

### File Operations
- Efficient directory traversal
- Batch file operations
- Smart file size calculations

## Development Workflow

### Testing
```bash
# Run all tests
npm test

# Test specific functionality
node test_buttons.js
node test_delete_button.js
```

### Debugging
```bash
# Enable debug mode
DEBUG=true node src/cli/index.js serve

# Check logs
tail -f logs/application.log
```

### Code Quality
- ESLint configuration
- Proper error handling
- JSDoc documentation
- Modular architecture

---

This technical guide provides comprehensive information about the internal architecture and implementation details of the Playwright Screenshot CLI tool.
