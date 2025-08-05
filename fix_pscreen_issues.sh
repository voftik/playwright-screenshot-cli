#!/bin/bash

# Fix PScreen CLI Issues Script
echo "🔧 PScreen CLI - Fixing common issues..."

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[0;33m'
NC='\033[0m'

print_status() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

# Step 1: Download and reinstall latest package
echo "📦 Downloading latest package..."
wget -q https://github.com/voftik/playwright-screenshot-cli/raw/master/debian-package/pscreen-cli.deb

if [ $? -eq 0 ]; then
    print_status "Package downloaded successfully"
    
    echo "🔄 Reinstalling package..."
    sudo dpkg -r pscreen-cli 2>/dev/null
    sudo dpkg -i pscreen-cli.deb
    sudo apt-get install -f -y
    
    print_status "Package reinstalled"
else
    print_error "Failed to download package"
    exit 1
fi

# Step 2: Fix permissions
echo "🔐 Fixing permissions..."
sudo mkdir -p /var/lib/pscreen/results
sudo chown -R root:root /usr/local/lib/pscreen
sudo chmod -R 755 /usr/local/lib/pscreen
sudo chmod +x /usr/local/bin/pscreen
sudo chown -R $USER:$USER /var/lib/pscreen 2>/dev/null || sudo chmod 777 /var/lib/pscreen/results
print_status "Permissions fixed"

# Step 3: Stop conflicting processes
echo "🛑 Stopping conflicting processes..."
sudo pkill -f "pscreen.*serve" 2>/dev/null || true
print_status "Processes cleaned up"

# Step 4: Test installation
echo "🧪 Testing installation..."
if command -v pscreen >/dev/null 2>&1; then
    print_status "pscreen command is available"
    
    # Test basic functionality
    echo "📸 Testing screenshot creation..."
    if pscreen --url https://example.com 2>/dev/null; then
        print_status "Screenshot test passed"
    else
        print_warning "Screenshot test failed, but package is installed"
    fi
else
    print_error "pscreen command not found"
    exit 1
fi

# Clean up
rm -f pscreen-cli.deb

echo ""
print_status "PScreen CLI issues have been fixed!"
echo ""
echo "Usage:"
echo "  pscreen                    # Interactive mode"
echo "  pscreen --url <URL>        # Direct screenshot"
echo "  pscreen --serve 9000       # Start web server"
echo ""
echo "If you still have issues, check: /var/log/pscreen.log"
