#!/bin/bash

# Playwright Screenshotter Installation Script

set -e

echo "🚀 Installing Playwright Screenshotter..."

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js 14+ first."
    exit 1
fi

# Check if npm is installed
if ! command -v npm &> /dev/null; then
    echo "❌ npm is not installed. Please install npm first."
    exit 1
fi

# Create installation directory
INSTALL_DIR="$HOME/.playwright-screenshotter"
echo "📁 Creating installation directory: $INSTALL_DIR"
mkdir -p "$INSTALL_DIR"

# Download the package
echo "📥 Downloading Playwright Screenshotter..."
curl -L https://github.com/your-username/playwright-screenshotter/archive/main.tar.gz | tar -xz -C "$INSTALL_DIR" --strip-components=1

# Navigate to installation directory
cd "$INSTALL_DIR"

# Install dependencies
echo "📦 Installing dependencies..."
npm install --production

# Install Playwright browsers
echo "🌐 Installing Playwright browsers..."
npx playwright install chromium

# Make scripts executable
chmod +x index.js server-only.js

# Create global symlink
echo "🔗 Creating global command..."
sudo ln -sf "$INSTALL_DIR/index.js" /usr/local/bin/screenshot
sudo ln -sf "$INSTALL_DIR/server-only.js" /usr/local/bin/screenshot-server

echo "✅ Installation complete!"
echo ""
echo "📋 Usage:"
echo "  screenshot https://example.com --port 3000"
echo "  screenshot-server 3001"
echo ""
echo "🔗 More info: https://github.com/your-username/playwright-screenshotter"
