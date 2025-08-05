#!/bin/bash

# Quick Install Script for PScreen CLI
echo "🖼️  Installing PScreen CLI..."

# Update package list
sudo apt update

# Install prerequisites
sudo apt install -y wget nodejs npm ufw

# Download and install PScreen CLI
wget -q https://github.com/voftik/playwright-screenshot-cli/raw/master/debian-package/pscreen-cli.deb
sudo dpkg -i pscreen-cli.deb
sudo apt-get install -f -y

# Clean up
rm pscreen-cli.deb

echo ""
echo "🎉 PScreen CLI installed successfully!"
echo ""
echo "Usage:"
echo "  pscreen                    # Interactive mode"
echo "  pscreen --url <URL>        # Direct screenshot"
echo "  pscreen --help             # Show help"
echo ""
echo "Test it: pscreen --url https://example.com"
