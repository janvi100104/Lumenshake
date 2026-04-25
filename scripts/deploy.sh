#!/bin/bash

# TokenPay - Complete Deployment Script
# This script deploys the payroll contract to Stellar Futurenet

set -e  # Exit on error

echo "🚀 TokenPay Smart Contract Deployment"
echo "======================================"
echo ""

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
RPC_URL="https://rpc-futurenet.stellar.org"
NETWORK="futurenet"
WASM_FILE="contracts/payroll_contract/target/wasm32-unknown-unknown/release/payroll_contract.wasm"

# Check if soroban CLI is installed
echo -e "${BLUE}Step 1: Checking Soroban CLI...${NC}"
if ! command -v soroban &> /dev/null; then
    echo -e "${RED}❌ Soroban CLI not found!${NC}"
    echo ""
    echo "Please wait for cargo install to complete, or run:"
    echo "  cargo install soroban-cli"
    echo ""
    echo "Current installation status:"
    ps aux | grep "cargo install" | grep -v grep
    exit 1
fi

echo -e "${GREEN}✅ Soroban CLI found${NC}"
soroban --version
echo ""

# Check if WASM file exists
echo -e "${BLUE}Step 2: Checking WASM contract...${NC}"
if [ ! -f "$WASM_FILE" ]; then
    echo -e "${RED}❌ WASM file not found at: $WASM_FILE${NC}"
    echo "Building contract..."
    cd contracts/payroll_contract
    cargo build --target wasm32-unknown-unknown --release
    cd ../..
fi

WASM_SIZE=$(ls -lh $WASM_FILE | awk '{print $5}')
echo -e "${GREEN}✅ WASM file found ($WASM_SIZE)${NC}"
echo ""

# Setup Admin Identity
echo -e "${BLUE}Step 3: Setting up admin identity...${NC}"
ADMIN_ID="tokenpay_admin"

if soroban config identity list 2>/dev/null | grep -q "$ADMIN_ID"; then
    echo -e "${YELLOW}⚠️  Identity '$ADMIN_ID' already exists${NC}"
    read -p "Use existing identity? (y/n): " use_existing
    if [ "$use_existing" != "y" ]; then
        echo "Generating new identity..."
        soroban config identity generate $ADMIN_ID
    fi
else
    echo "Creating new identity..."
    soroban config identity generate $ADMIN_ID
fi

ADMIN_ADDRESS=$(soroban config identity address $ADMIN_ID)
echo -e "${GREEN}✅ Admin address: $ADMIN_ADDRESS${NC}"
echo ""

# Fund the account
echo -e "${BLUE}Step 4: Funding admin account...${NC}"
echo "Requesting funds from Friendbot..."

FUND_RESPONSE=$(curl -s "https://friendbot.stellar.org?addr=$ADMIN_ADDRESS")

if echo "$FUND_RESPONSE" | grep -q "successful\|already"; then
    echo -e "${GREEN}✅ Account funded successfully${NC}"
else
    echo -e "${YELLOW}⚠️  Funding response: $FUND_RESPONSE${NC}"
    echo "You may need to wait a moment or try again"
fi
echo ""

# Deploy Contract
echo -e "${BLUE}Step 5: Deploying smart contract...${NC}"
echo "This may take a minute..."

CONTRACT_ID=$(soroban contract deploy \
  --wasm "$WASM_FILE" \
  --source "$ADMIN_ID" \
  --rpc-url "$RPC_URL" \
  --network "$NETWORK" 2>&1)

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ Contract deployed successfully!${NC}"
    echo -e "${GREEN}📄 Contract ID: $CONTRACT_ID${NC}"
    
    # Save contract ID
    echo "$CONTRACT_ID" > .contract_id
    echo -e "${YELLOW}💾 Contract ID saved to .contract_id${NC}"
else
    echo -e "${RED}❌ Deployment failed!${NC}"
    echo "Error: $CONTRACT_ID"
    exit 1
fi
echo ""

# Initialize Contract
echo -e "${BLUE}Step 6: Initializing contract...${NC}"
INIT_RESULT=$(soroban contract invoke \
  --id "$CONTRACT_ID" \
  --source "$ADMIN_ID" \
  --rpc-url "$RPC_URL" \
  --network "$NETWORK" \
  -- \
  initialize \
  --admin "$ADMIN_ADDRESS" 2>&1)

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ Contract initialized!${NC}"
else
    echo -e "${YELLOW}⚠️  Initialization warning: $INIT_RESULT${NC}"
fi
echo ""

# Update Web App Configuration
echo -e "${BLUE}Step 7: Configuring web app...${NC}"
cd web

if [ -f .env.local ]; then
    echo "Updating existing .env.local..."
    # Update or add CONTRACT_ID
    if grep -q "NEXT_PUBLIC_CONTRACT_ID" .env.local; then
        sed -i "s/NEXT_PUBLIC_CONTRACT_ID=.*/NEXT_PUBLIC_CONTRACT_ID=$CONTRACT_ID/" .env.local
    else
        echo "NEXT_PUBLIC_CONTRACT_ID=$CONTRACT_ID" >> .env.local
    fi
else
    echo "Creating .env.local..."
    cat > .env.local << EOF
NEXT_PUBLIC_CONTRACT_ID=$CONTRACT_ID
NEXT_PUBLIC_NETWORK=futurenet
NEXT_PUBLIC_RPC_URL=$RPC_URL
EOF
fi

cd ..

echo -e "${GREEN}✅ Web app configured!${NC}"
echo ""

# Display Summary
echo "======================================"
echo -e "${GREEN}🎉 Deployment Complete!${NC}"
echo "======================================"
echo ""
echo "📋 Summary:"
echo "  Network: $NETWORK"
echo "  Admin Address: $ADMIN_ADDRESS"
echo "  Contract ID: $CONTRACT_ID"
echo ""
echo "💾 Files created:"
echo "  - .contract_id (contains contract ID)"
echo "  - web/.env.local (web app config)"
echo ""
echo "🚀 Next steps:"
echo "  1. Start web app: cd web && npm run dev"
echo "  2. Visit: http://localhost:3000"
echo "  3. Connect your wallet"
echo "  4. Start using TokenPay!"
echo ""
echo "📝 Useful commands:"
echo "  View contract on Stellar Expert:"
echo "  https://stellar.expert/explorer/futurenet/contract/$CONTRACT_ID"
echo ""
echo "  Test contract functions:"
echo "  soroban contract invoke --id $CONTRACT_ID --source $ADMIN_ID --rpc-url $RPC_URL --network $NETWORK -- <function_name>"
echo ""
