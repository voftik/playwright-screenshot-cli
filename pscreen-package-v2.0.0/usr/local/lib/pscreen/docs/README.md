# PScreen v2.0.0 - Enhanced Screenshot CLI

## Features

- **Full Automation Support**: Non-interactive operation perfect for CI/CD
- **Batch Processing**: Process multiple URLs from files
- **Parallel Processing**: Configure concurrent screenshot capture
- **Retry Logic**: Automatic retries on failure
- **Environment Variables**: Full environment variable support
- **Configuration Files**: JSON-based configuration
- **JSON Output**: Structured output for automation
- **Enhanced Logging**: Multiple log levels and formats
- **Web Server**: Built-in server with modern UI

## Quick Start

### Basic Usage
```bash
# Take a single screenshot
pscreen screenshot https://example.com

# Start web server to view results
pscreen serve

# Non-interactive with custom settings
pscreen screenshot --url https://example.com --width 1280 --height 720 --no-web-server --quiet
```

### Automation Examples
```bash
# Batch processing
pscreen screenshot --batch urls.txt --parallel 3 --continue-on-error

# CI/CD friendly
pscreen screenshot https://example.com --json --quiet --no-web-server

# With retry logic
pscreen screenshot https://example.com --retries 5 --timeout 60000
```

### Environment Variables
```bash
export PSCREEN_OUTPUT_DIR="/var/screenshots"
export PSCREEN_PORT="8080"
export PSCREEN_LOG_LEVEL="debug"
export PSCREEN_RETRIES="5"

pscreen screenshot https://example.com
```

### Configuration File
Create `.pscreen.json` in your project directory:
```bash
pscreen config --init
```

## Commands

### screenshot (take)
Take screenshots of websites with full automation support.

**Options:**
- `--url <url>` - URL to screenshot
- `--output <dir>` - Output directory
- `--width <number>` - Viewport width (default: 1920)
- `--height <number>` - Viewport height (default: 1080)
- `--full-page` - Take full page screenshot
- `--browser <browser>` - Browser (chromium, firefox, webkit)
- `--timeout <number>` - Page load timeout in ms
- `--format <format>` - Screenshot format (png, jpeg)
- `--web-server` - Start web server after screenshots
- `--no-web-server` - Do not start web server
- `--port <number>` - Web server port
- `--batch <file>` - Batch mode: read URLs from file
- `--parallel <number>` - Parallel processing limit
- `--retries <number>` - Retry attempts on failure
- `--continue-on-error` - Continue processing on errors
- `--json` - Output results in JSON format
- `--quiet` - Suppress non-essential output
- `--verbose` - Verbose output

### serve
Start web server to view screenshots.

**Options:**
- `--port <number>` - Server port
- `--host <host>` - Server host
- `--json` - Output server info in JSON format

### config
Manage configuration.

**Options:**
- `--init` - Create sample configuration file
- `--show` - Show current configuration
- `--get <path>` - Get configuration value
- `--json` - Output in JSON format

### debug
Show debugging information.

**Options:**
- `--json` - Output in JSON format

## Environment Variables

- `PSCREEN_OUTPUT_DIR` - Output directory for screenshots
- `PSCREEN_WIDTH` - Default viewport width
- `PSCREEN_HEIGHT` - Default viewport height
- `PSCREEN_BROWSER` - Default browser
- `PSCREEN_PORT` - Default server port
- `PSCREEN_HOST` - Default server host
- `PSCREEN_LOG_LEVEL` - Log level (debug, info, warn, error)
- `PSCREEN_RETRIES` - Default retry count
- `PSCREEN_PARALLEL` - Default parallel limit
- `PSCREEN_CONTINUE_ON_ERROR` - Continue on errors (true/false)

## Configuration File Format

```json
{
  "screenshot": {
    "outputDir": "./screenshots",
    "width": 1920,
    "height": 1080,
    "fullPage": true,
    "browser": "chromium",
    "timeout": 30000,
    "format": "png"
  },
  "server": {
    "enabled": true,
    "port": 9000,
    "host": "0.0.0.0",
    "autoStart": true
  },
  "logging": {
    "level": "info",
    "console": true,
    "json": false
  },
  "automation": {
    "retries": 3,
    "parallelLimit": 1,
    "continueOnError": false
  }
}
```

## API Usage

PScreen can also be used as a library:

```javascript
const { PScreen } = require('pscreen');

const pscreen = new PScreen({
  outputDir: './screenshots',
  width: 1920,
  height: 1080
});

// Take screenshot
const result = await pscreen.screenshot('https://example.com');

// Start server
const server = await pscreen.startServer({ port: 9000 });
```
