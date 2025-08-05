# 📦 PScreen CLI - Installation Guide

## Method 1: Direct Package Installation (Recommended)

### Download and Install
```bash
# Download the package
wget https://github.com/voftik/playwright-screenshot-cli/releases/latest/download/pscreen-cli.deb

# Install the package
sudo dpkg -i pscreen-cli.deb

# Install any missing dependencies
sudo apt-get install -f
```

### Alternative: Local Installation
```bash
# If you have the .deb file locally
sudo dpkg -i pscreen-cli.deb
sudo apt-get install -f
```

## Method 2: From Source

### Prerequisites
```bash
sudo apt update
sudo apt install nodejs npm git ufw chromium-browser
```

### Install from source
```bash
git clone https://github.com/voftik/playwright-screenshot-cli.git
cd playwright-screenshot-cli
sudo cp debian-package/pscreen-cli/usr/local/bin/pscreen /usr/local/bin/
sudo cp -r . /usr/local/lib/pscreen/
cd /usr/local/lib/pscreen
sudo npm install --production
sudo npx playwright install chromium
```

## Usage

### Interactive Mode (Recommended)
```bash
pscreen
```

The program will interactively ask you:
1. 🌐 **Website URL** - Enter the site you want to screenshot
2. 📱 **Viewport Size** - Choose from preset sizes or enter custom
3. 🖥️ **Web Server** - Whether to start the web interface

### Direct Mode
```bash
# Take screenshot directly
pscreen --url https://example.com

# Start web server only
pscreen --serve 9000

# Cleanup old screenshots
pscreen --cleanup
```

### Command Options
```bash
pscreen --help                    # Show help
pscreen --url <URL>              # Direct screenshot
pscreen --serve [PORT]           # Start web server
pscreen --cleanup                # Clean old files
```

## Example Session

```bash
$ pscreen

🖼️  PScreen - Professional Screenshot CLI
================================================
ℹ️  Checking dependencies...
✅ All dependencies are ready!
ℹ️  Configure your screenshot session:

📝 Enter the website URL to screenshot:
URL: example.com

📱 Select viewport size:
1) 1280x720 (HD Ready)
2) 1920x1080 (Full HD)
3) 1366x768 (Laptop)
4) 1440x900 (MacBook)
5) Custom size
Choice [1]: 2

🌐 Start web server after taking screenshots?
Start web server? [Y/n]: Y
Web server port [9000]: 

ℹ️  Starting screenshot capture...
📊 Configuration:
   🌐 URL: https://example.com
   📱 Size: 1920x1080
   📁 Output: /var/lib/pscreen/results

🚀 Playwright Screenshot CLI
🌐 URL: https://example.com
📁 Output: /var/lib/pscreen/results
📱 Viewport: 1920x1080
🌐 Browser: chromium
⏱️  Timeout: 30000ms

████████████████████████████████████████ | 100% | Complete!

✅ Screenshots completed successfully!
📂 Relative Path: results/example.com/2025-08-05T00:05:27.123Z
📁 Absolute Server Path: /var/lib/pscreen/results/example.com/2025-08-05T00:05:27.123Z
⏱️  Duration: 3.2s
📊 Created: 1 full page + 2 viewport screenshots

🌐 External URLs:
📋 Main Dashboard: http://77.73.238.240:9000
📸 Session Gallery: http://77.73.238.240:9000/view/example.com/2025-08-05T00:05:27.123Z
🖼️  Direct Image URLs:
   • full_page.png: http://77.73.238.240:9000/example.com/2025-08-05T00:05:27.123Z/full_page.png
   • viewport_00.png: http://77.73.238.240:9000/example.com/2025-08-05T00:05:27.123Z/viewport_00.png

🌐 Веб-сервер успешно запущен!
📋 Главная страница: http://77.73.238.240:9000
```

## Configuration

### System Configuration
- **Config File**: `/etc/pscreen/config.json`
- **Results Directory**: `/var/lib/pscreen/results`
- **Log File**: `/var/log/pscreen.log`

### Default Settings
```json
{
  "screenshot": {
    "defaultTimeout": 30000,
    "defaultWidth": 1280, 
    "defaultHeight": 720,
    "defaultBrowser": "chromium"
  },
  "server": {
    "defaultPort": 9000,
    "host": "0.0.0.0"
  }
}
```

## Web Interface

After taking screenshots with `--server` option, you can:

1. **View Dashboard**: Access the main page at the provided URL
2. **Browse Screenshots**: Click on any session to view all images
3. **Manage Data**: Use the web interface buttons:
   - 📊 **Update Statistics** - Shows storage usage
   - 🗑️ **Delete All Screenshots** - Cleans all data

## Troubleshooting

### Permission Issues
```bash
sudo chown -R $USER:$USER /var/lib/pscreen
sudo chmod -R 755 /var/lib/pscreen
```

### Missing Dependencies
```bash
sudo apt install nodejs npm chromium-browser
sudo npm install --prefix /usr/local/lib/pscreen
sudo npx playwright install chromium
```

### Firewall Issues
```bash
sudo ufw allow 9000
sudo ufw status
```

### Check Installation
```bash
which pscreen
pscreen --help
ls -la /usr/local/lib/pscreen
```

## Uninstallation

```bash
sudo dpkg -r pscreen-cli
sudo rm -rf /var/lib/pscreen
sudo rm -f /var/log/pscreen.log
sudo rm -f /etc/pscreen/config.json
```

## Support

- **GitHub**: https://github.com/voftik/playwright-screenshot-cli
- **Issues**: https://github.com/voftik/playwright-screenshot-cli/issues
- **Documentation**: See README.md and TECHNICAL_GUIDE.md

---

🎉 **Enjoy using PScreen CLI for professional web screenshots!**
