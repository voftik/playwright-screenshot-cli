# 🔧 PScreen CLI - Troubleshooting Guide

## ❌ Problem: "Session not found" or "404 Not Found" on Web Interface

### 🔍 Symptoms:
- Web page shows "Session not found"
- Browser console shows: `Failed to load resource: the server responded with a status of 404 (Not Found)`
- Images don't load in the web interface

### 🛠️ Solution:

#### Step 1: Update the package
```bash
# Download the latest version with fixes
wget https://github.com/voftik/playwright-screenshot-cli/raw/master/debian-package/pscreen-cli.deb

# Reinstall the package
sudo dpkg -r pscreen-cli
sudo dpkg -i pscreen-cli.deb
sudo apt-get install -f
```

#### Step 2: Check file locations
```bash
# Verify screenshots are saved in the correct location
ls -la /var/lib/pscreen/results/

# Example structure should be:
# /var/lib/pscreen/results/domain.com/2025-08-05T00:15:30.123Z/full_page.png
```

#### Step 3: Restart web server
```bash
# Stop any running servers
pkill -f "pscreen.*serve"

# Start server on a free port
pscreen --serve 9000
```

#### Step 4: Test static file access directly
```bash
# Test direct image access (replace with actual paths)
curl -I http://localhost:9000/domain.com/timestamp/full_page.png
```

### 🔧 Manual Fix (if package update doesn't work):

If you still have issues, apply this manual fix:

```bash
# Create a backup
sudo cp /usr/local/lib/pscreen/src/server/index.js /usr/local/lib/pscreen/src/server/index.js.backup

# Apply the fix
sudo tee /tmp/fix_static.patch << 'PATCH'
--- a/src/server/index.js
+++ b/src/server/index.js
@@ -45,8 +45,15 @@ class ScreenshotServer {
     if (false && cspConfig.enabled) {
       this.app.use(helmet.contentSecurityPolicy({ directives: cspConfig.directives }));
     }
     
-    // Serve static files from results directory
-    this.app.use(express.static(path.join(process.cwd(), config.screenshot.outputDir)));
+    // Serve static files from results directory with proper paths
+    const resultsDir = config.screenshot.outputDir;
+    this.app.use('/', express.static(resultsDir, {
+      dotfiles: 'ignore',
+      etag: false,
+      extensions: ['png', 'jpg', 'jpeg'],
+      index: false,
+      maxAge: '1d'
+    }));
     this.app.use(express.static('static'));
     this.app.use(express.json());
PATCH

# Apply the patch (manual editing)
sudo nano /usr/local/lib/pscreen/src/server/index.js
```

## ❌ Problem: Web Server Won't Start

### 🔍 Symptoms:
- Error: "EADDRINUSE: address already in use"
- Server fails to start

### 🛠️ Solution:
```bash
# Find what's using the port
sudo netstat -tlnp | grep :9000

# Kill the process
sudo pkill -f "node.*serve"

# Or use a different port
pscreen --serve 9001
```

## ❌ Problem: Screenshots Not Created

### 🔍 Symptoms:
- Command completes but no files are created
- Permission errors

### 🛠️ Solution:
```bash
# Check permissions
sudo chown -R $USER:$USER /var/lib/pscreen
sudo chmod -R 755 /var/lib/pscreen

# Check disk space
df -h /var/lib/pscreen

# Check logs
sudo tail -f /var/log/pscreen.log
```

## ❌ Problem: Missing Dependencies

### 🔍 Symptoms:
- "Cannot find module" errors
- Playwright browser not found

### 🛠️ Solution:
```bash
# Reinstall dependencies
cd /usr/local/lib/pscreen
sudo npm install --production

# Install Playwright browser
sudo npx playwright install chromium

# Check Node.js version
node --version  # Should be 16+
```

## 🧪 **Testing After Fixes**

### Test 1: Create a screenshot
```bash
pscreen --url https://example.com
```

### Test 2: Check files were created
```bash
ls -la /var/lib/pscreen/results/
```

### Test 3: Start web server
```bash
pscreen --serve 9000
```

### Test 4: Test direct image access
```bash
# Replace with actual domain/timestamp/filename
curl -I http://localhost:9000/example.com/2025-08-05T00:15:30.123Z/full_page.png
```

## 📞 **Getting Help**

If problems persist:

1. **Check logs**:
   ```bash
   sudo tail -f /var/log/pscreen.log
   ```

2. **System information**:
   ```bash
   pscreen --help
   node --version
   npm --version
   which pscreen
   ```

3. **File permissions**:
   ```bash
   ls -la /usr/local/bin/pscreen
   ls -la /var/lib/pscreen/
   ```

4. **Submit an issue** with the output of above commands:
   https://github.com/voftik/playwright-screenshot-cli/issues

## ✅ **Quick Verification Checklist**

After applying fixes, verify:
- [ ] `pscreen --help` works
- [ ] `pscreen --url https://example.com` creates files
- [ ] Files appear in `/var/lib/pscreen/results/`
- [ ] `pscreen --serve 9000` starts web server
- [ ] Web interface shows screenshots
- [ ] Direct image URLs work

---

**💡 Tip**: Always use the latest version from GitHub for the most recent fixes!
