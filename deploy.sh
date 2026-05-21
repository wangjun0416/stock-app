#!/bin/bash

# Deploy script for iPhone PWA
# This script helps you deploy the stock monitor to various platforms

echo "🚀 Deploy Stock Monitor for iPhone"
echo "==================================="
echo ""

# Build the application
echo "📦 Building application..."
cd "$(dirname "$0")"
npm run build

if [ $? -ne 0 ]; then
    echo "❌ Build failed"
    exit 1
fi

echo "✅ Build successful"
echo ""

# Option 1: Local deployment for testing
echo "📱 Deployment Options:"
echo ""
echo "1. Local Network (for testing on same WiFi)"
echo "   - Your iPhone must be on the same WiFi network"
echo "   - Run: ./start.sh"
echo "   - Access: http://YOUR_COMPUTER_IP:3000"
echo ""

# Get local IP
LOCAL_IP=$(hostname -I | awk '{print $1}')
echo "   Your local IP: $LOCAL_IP"
echo ""

echo "2. Deploy to Cloud (recommended for remote access)"
echo ""
echo "   Option A: Vercel (easiest)"
echo "   - Install Vercel CLI: npm i -g vercel"
echo "   - Run: vercel"
echo "   - Your app will be deployed to: https://your-app.vercel.app"
echo ""
echo "   Option B: Netlify"
echo "   - Install Netlify CLI: npm i -g netlify-cli"
echo "   - Run: netlify deploy --prod --dir=build"
echo ""
echo "   Option C: GitHub Pages"
echo "   - Push to GitHub"
echo "   - Enable GitHub Pages in repository settings"
echo "   - Your app will be at: https://yourusername.github.io/repo-name"
echo ""

echo "3. Deploy to VPS/Server"
echo "   - Copy build/ folder to your web server"
echo "   - Or use Docker deployment"
echo ""

echo "📝 iPhone Installation Instructions:"
echo "===================================="
echo "1. Open Safari and navigate to your deployed URL"
echo "2. Tap the Share button (square with arrow)"
echo "3. Scroll down and tap 'Add to Home Screen'"
echo "4. Tap 'Add' in the top right"
echo "5. The app icon will appear on your home screen"
echo ""
echo "✨ Features on iPhone:"
echo "- Full-screen app experience (no Safari UI)"
echo "- Works offline"
echo "- Push notifications for price alerts (iOS 16.4+)"
echo "- Native app-like feel"
echo ""

# Ask if user wants to start local server
read -p "Start local server now for testing? (y/n) " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    echo "🌐 Starting local server..."
    echo "Access from iPhone on same WiFi: http://$LOCAL_IP:3000"
    echo ""
    ./start.sh
fi
