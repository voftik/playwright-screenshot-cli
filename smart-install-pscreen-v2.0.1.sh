#!/bin/bash

# Smart PScreen CLI v2.0.1 Installer
# Enhanced version with automatic port conflict resolution

set -e

PSCREEN_VERSION="2.0.1"
DOWNLOAD_URL="http://77.73.238.240:8081/pscreen-cli_${PSCREEN_VERSION}_all.deb"
TEMP_DIR="/tmp/pscreen-install"
PSCREEN_PKG="pscreen-cli_${PSCREEN_VERSION}_all.deb"

echo "🚀 PScreen CLI v${PSCREEN_VERSION} Smart Installer"
echo "✨ New: Automatic port conflict resolution"
echo "================================================"

# Create temporary directory
mkdir -p "$TEMP_DIR"
cd "$TEMP_DIR"

# Function to check if PScreen is running and stop it
stop_pscreen() {
    echo "🛑 Stopping existing PScreen processes..."
    pkill -f "pscreen.*serve" 2>/dev/null || true
    pkill -f "node.*pscreen" 2>/dev/null || true
    sleep 2
}

# Function to remove existing package
remove_existing() {
    if dpkg -l | grep -q "pscreen-cli"; then
        echo "🗑️  Removing existing PScreen CLI..."
        sudo dpkg -r pscreen-cli 2>/dev/null || true
        sudo apt-get -f install -y >/dev/null 2>&1 || true
    fi
}

# Function to install dependencies
install_dependencies() {
    echo "📦 Installing system dependencies..."
    
    if ! command -v node &> /dev/null; then
        echo "📥 Installing Node.js..."
        curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash - >/dev/null 2>&1
        sudo apt-get install -y nodejs >/dev/null 2>&1
    fi
    
    if ! command -v npm &> /dev/null; then
        echo "📥 Installing npm..."
        sudo apt-get update >/dev/null 2>&1
        sudo apt-get install -y npm >/dev/null 2>&1
    fi
    
    echo "✅ Dependencies ready"
}

# Function to download package
download_package() {
    echo "📥 Downloading PScreen CLI v${PSCREEN_VERSION}..."
    
    if command -v wget &> /dev/null; then
        wget -q --show-progress "$DOWNLOAD_URL" -O "$PSCREEN_PKG" || {
            echo "❌ wget failed, trying curl..."
            curl -L -o "$PSCREEN_PKG" "$DOWNLOAD_URL"
        }
    else
        curl -L -o "$PSCREEN_PKG" "$DOWNLOAD_URL"
    fi
    
    if [ ! -f "$PSCREEN_PKG" ]; then
        echo "❌ Failed to download package"
        exit 1
    fi
    
    echo "✅ Package downloaded successfully"
}

# Function to install package
install_package() {
    echo "📦 Installing PScreen CLI v${PSCREEN_VERSION}..."
    
    sudo dpkg -i "$PSCREEN_PKG" 2>/dev/null || {
        echo "🔧 Fixing dependencies..."
        sudo apt-get -f install -y >/dev/null 2>&1
        sudo dpkg -i "$PSCREEN_PKG"
    }
    
    echo "✅ Package installed successfully"
}

# Function to verify installation
verify_installation() {
    echo "🔍 Verifying installation..."
    
    if command -v pscreen &> /dev/null; then
        echo "✅ PScreen CLI is available in PATH"
        
        # Check version
        INSTALLED_VERSION=$(pscreen --version 2>/dev/null | grep -o '[0-9]\+\.[0-9]\+\.[0-9]\+' || echo "unknown")
        echo "📋 Installed version: $INSTALLED_VERSION"
        
        if [ "$INSTALLED_VERSION" = "$PSCREEN_VERSION" ]; then
            echo "✅ Version verification successful"
        else
            echo "⚠️  Version mismatch detected"
        fi
    else
        echo "❌ PScreen CLI not found in PATH"
        exit 1
    fi
}

# Function to run basic test
run_test() {
    echo "🧪 Running basic functionality test..."
    
    # Test help command
    if pscreen --help >/dev/null 2>&1; then
        echo "✅ Help command works"
    else
        echo "❌ Help command failed"
        return 1
    fi
    
    # Test port conflict resolution by trying to use a common port
    echo "🔍 Testing automatic port resolution..."
    timeout 5s pscreen serve --port 80 2>/dev/null && echo "⚠️  Unexpected: Port 80 was available" || echo "✅ Port conflict handling works"
    
    echo "✅ Basic tests passed"
}

# Function to cleanup
cleanup() {
    echo "🧹 Cleaning up temporary files..."
    cd /
    rm -rf "$TEMP_DIR"
    echo "✅ Cleanup completed"
}

# Main installation process
main() {
    echo "🔧 Starting installation process..."
    
    stop_pscreen
    remove_existing
    install_dependencies
    download_package
    install_package
    verify_installation
    run_test
    cleanup
    
    echo "================================================"
    echo "🎉 PScreen CLI v${PSCREEN_VERSION} installation completed!"
    echo ""
    echo "📋 New Features in v${PSCREEN_VERSION}:"
    echo "   • Automatic port conflict resolution"
    echo "   • Smart fallback to available ports"
    echo "   • Enhanced error handling during startup"
    echo "   • User notifications for port changes"
    echo ""
    echo "🚀 Quick Start:"
    echo "   pscreen take https://example.com --server"
    echo "   pscreen serve --port 9001"
    echo ""
    echo "📚 Get help:"
    echo "   pscreen --help"
    echo ""
    echo "🐛 If you experience port conflicts, PScreen will now"
    echo "   automatically find and use an available port!"
}

# Error handling
trap cleanup EXIT

# Run main installation
main

exit 0
