#!/bin/bash

# LumenShake - Quick Start Script
# Run this to start the project

echo "🚀 LumenShake Quick Start"
echo "======================="
echo ""

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Check if Soroban CLI is installed
if command -v soroban &> /dev/null; then
    echo -e "${GREEN}✅ Soroban CLI: Installed$(soroban --version)${NC}"
    
    # Check if contract is deployed
    if [ -f .contract_id ]; then
        CONTRACT_ID=$(cat .contract_id)
        echo -e "${GREEN}✅ Contract deployed: $CONTRACT_ID${NC}"
    else
        echo -e "${YELLOW}⚠️  Contract not deployed yet${NC}"
        echo ""
        echo "To deploy, run: ./scripts/deploy.sh"
    fi
else
    echo -e "${YELLOW}⏳ Soroban CLI: Still installing...${NC}"
    echo ""
    echo "You can still run the web app in demo mode!"
fi

echo ""
echo "Starting web app..."
echo ""

# Start web app
cd web
npm run dev
