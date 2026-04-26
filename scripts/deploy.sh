#!/bin/bash

# TokenPay - Quick Deployment Script
# This script helps deploy the payroll contract to Stellar Futurenet

echo "🚀 TokenPay Contract Deployment Script"
echo "======================================"

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Check if soroban CLI is installed
if ! command -v soroban &> /dev/null; then
    if command -v stellar &> /dev/null; then
        echo -e "${GREEN}✅ Stellar CLI found (using as soroban)${NC}"
        stellar --version
        # Create alias for soroban commands
        alias soroban=stellar
    else
        echo -e "${RED}❌ Soroban/Stellar CLI not found!${NC}"
        echo "Please install it first:"
        echo "  cargo install soroban-cli"
        echo "  OR"
        echo "  cargo install stellar-cli"
        exit 1
    fi
else
    echo -e "${GREEN}✅ Soroban CLI found${NC}"
    soroban --version
fi

# Check if WASM file exists
WASM_FILE="contracts/payroll_contract/target/wasm32-unknown-unknown/release/payroll_contract.wasm"
if [ ! -f "$WASM_FILE" ]; then
    echo -e "${RED}❌ WASM file not found!${NC}"
    echo "Building contract..."
    cd contracts/payroll_contract
    cargo build --target wasm32-unknown-unknown --release
    cd ../..
fi

echo -e "${GREEN}✅ WASM file found${NC}"
ls -lh $WASM_FILE

# Check if identity exists
echo ""
echo -e "${YELLOW}📝 Step 1: Setting up identity...${NC}"
read -p "Enter identity name (default: employer): " IDENTITY
IDENTITY=${IDENTITY:-employer}

if soroban config identity list | grep -q "$IDENTITY"; then
    echo -e "${GREEN}✅ Identity '$IDENTITY' exists${NC}"
else
    echo -e "${YELLOW}Creating identity '$IDENTITY'...${NC}"
    soroban config identity generate $IDENTITY
    echo -e "${GREEN}✅ Identity created${NC}"
fi

# Get identity address
ADDRESS=$(soroban config identity address $IDENTITY)
echo -e "${GREEN}📍 Your address: $ADDRESS${NC}"

# Fund account
echo ""
echo -e "${YELLOW}💰 Step 2: Funding account via Friendbot...${NC}"
echo "Visit: https://friendbot.stellar.org/?addr=$ADDRESS"
echo "Or run:"
echo "  curl \"https://friendbot.stellar.org?addr=$ADDRESS\""
read -p "Press enter after funding your account..."

# Verify balance
echo ""
echo -e "${YELLOW}💵 Step 3: Verifying account balance...${NC}"
echo "Check your balance on Stellar Expert or Stellar Laboratory"

# Deploy contract
echo ""
echo -e "${YELLOW}🚀 Step 4: Deploying contract to Futurenet...${NC}"
CONTRACT_ID=$(soroban contract deploy \
  --wasm $WASM_FILE \
  --source $IDENTITY \
  --rpc-url https://rpc-futurenet.stellar.org/ \
  --network futurenet 2>&1)

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ Contract deployed successfully!${NC}"
    echo -e "${GREEN}📄 Contract ID: $CONTRACT_ID${NC}"
    
    # Save contract ID
    echo "$CONTRACT_ID" > .contract_id
    echo -e "${YELLOW}💾 Contract ID saved to .contract_id${NC}"
    
    # Initialize contract
    echo ""
    echo -e "${YELLOW}⚙️  Step 5: Initializing contract...${NC}"
    soroban contract invoke \
      --id $CONTRACT_ID \
      --source $IDENTITY \
      --rpc-url https://rpc-futurenet.stellar.org/ \
      --network futurenet \
      -- \
      initialize \
      --admin $ADDRESS
    
    echo -e "${GREEN}✅ Contract initialized!${NC}"
else
    echo -e "${RED}❌ Deployment failed!${NC}"
    echo "Error: $CONTRACT_ID"
    exit 1
fi

# Setup web app
echo ""
echo -e "${YELLOW}🌐 Step 6: Configuring web app...${NC}"
cd web
if [ -f .env.local ]; then
    echo "Updating .env.local..."
    sed -i "s/NEXT_PUBLIC_CONTRACT_ID=.*/NEXT_PUBLIC_CONTRACT_ID=$CONTRACT_ID/" .env.local
else
    echo "Creating .env.local..."
    echo "NEXT_PUBLIC_CONTRACT_ID=$CONTRACT_ID" > .env.local
    echo "NEXT_PUBLIC_NETWORK=futurenet" >> .env.local
    echo "NEXT_PUBLIC_RPC_URL=https://rpc-futurenet.stellar.org/" >> .env.local
fi
cd ..

echo -e "${GREEN}✅ Web app configured!${NC}"

echo ""
echo "======================================"
echo -e "${GREEN}🎉 Deployment Complete!${NC}"
echo "======================================"
echo ""
echo "Next steps:"
echo "1. cd web && npm run dev"
echo "2. Visit http://localhost:3000"
echo "3. Connect your Freighter wallet"
echo "4. Start using TokenPay!"
echo ""
echo "Contract ID: $CONTRACT_ID"
echo ""
