#!/bin/bash

# Quick start script for GitHub Actions deployment

echo "🚀 Stock Monitor - GitHub Actions Deployment"
echo "=============================================="
echo ""

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${YELLOW}Checking prerequisites...${NC}"

# Check if git is initialized
if [ ! -d .git ]; then
    echo "Initializing git repository..."
    git init
    git add .
    git commit -m "Initial commit"
fi

# Check if remote is configured
if ! git remote get-url origin > /dev/null 2>&1; then
    echo ""
    echo "⚠️  Git remote not configured"
    echo ""
    echo "Please create a GitHub repository first:"
    echo "1. Go to https://github.com/new"
    echo "2. Create a new repository (e.g., 'stock-monitor')"
    echo "3. Do NOT initialize with README (we already have one)"
    echo ""
    read -p "Enter your GitHub repository URL: " repo_url
    
    git remote add origin $repo_url
    git branch -M main
    git push -u origin main
    
    echo -e "${GREEN}✅ Code pushed to GitHub${NC}"
else
    echo -e "${GREEN}✅ Git remote configured${NC}"
    
    # Push latest changes
    git add .
    git commit -m "Update deployment configs" 2>/dev/null || true
    git push origin main 2>/dev/null || true
    
    echo -e "${GREEN}✅ Latest changes pushed${NC}"
fi

echo ""
echo "=============================================="
echo "📋 Next Steps:"
echo "=============================================="
echo ""
echo "1. Go to your GitHub repository"
echo "   $(git remote get-url origin)"
echo ""
echo "2. Configure Secrets (Settings > Secrets and variables > Actions)"
echo "   Required for deployment to your server:"
echo "   • SSH_PRIVATE_KEY  - Your server's SSH private key"
echo "   • SSH_HOST         - Server IP or domain"
echo "   • SSH_USER         - SSH username"
echo "   • SSH_PORT         - SSH port (optional, default: 22)"
echo ""
echo "   Required for running on GitHub Actions (optional):"
echo "   • NGROK_AUTHTOKEN  - From https://ngrok.com/"
echo ""
echo "3. Trigger deployment"
echo "   Go to Actions tab > Deploy Stock Monitor > Run workflow"
echo ""
echo "=============================================="
echo "📖 Documentation:"
echo "=============================================="
echo "• README.md          - Full deployment guide"
echo "• .github/workflows/ - GitHub Actions workflows"
echo "• Dockerfile         - Docker build configuration"
echo ""
echo "🎯 Quick Links:"
echo "• GitHub Actions: $(git remote get-url origin)/actions"
echo "• Settings:       $(git remote get-url origin)/settings/secrets/actions"
echo ""
