#!/bin/bash

# SEP-10 Authentication & Deposit Demo Script
# This script demonstrates the complete SEP-10 auth flow

set -e

# Configuration
BACKEND_URL="http://localhost:4000"
YOUR_ADDRESS="${1:-}"  # Pass as first argument or set below
NETWORK_PASSPHRASE="Test SDF Network ; September 2015"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}"
echo "========================================="
echo "  TokenPay SEP-10 Authentication Demo"
echo "========================================="
echo -e "${NC}"

# Check if address is provided
if [ -z "$YOUR_ADDRESS" ]; then
  echo -e "${YELLOW}Usage: $0 YOUR_STELLAR_ADDRESS${NC}"
  echo -e "${YELLOW}Or set YOUR_ADDRESS variable in the script${NC}"
  echo ""
  echo -e "${RED}Example: ./sep10-auth-demo.sh GABC123...${NC}"
  exit 1
fi

echo -e "${BLUE}📍 Stellar Address: ${YOUR_ADDRESS}${NC}"
echo ""

# Step 1: Check Backend
echo -e "${BLUE}Step 1: Checking backend server...${NC}"
if curl -s "$BACKEND_URL/api/auth/challenge?account=$YOUR_ADDRESS" > /dev/null; then
  echo -e "${GREEN}✅ Backend server is running${NC}"
else
  echo -e "${RED}❌ Backend server is not running on $BACKEND_URL${NC}"
  echo -e "${YELLOW}→ Start it with: cd backend && npm start${NC}"
  exit 1
fi
echo ""

# Step 2: Get Challenge
echo -e "${BLUE}Step 2: Getting SEP-10 authentication challenge...${NC}"
CHALLENGE_RESPONSE=$(curl -s -X GET "$BACKEND_URL/api/auth/challenge?account=$YOUR_ADDRESS")

# Check for errors
if echo "$CHALLENGE_RESPONSE" | jq -e '.error' > /dev/null 2>&1; then
  echo -e "${RED}❌ Failed to get challenge${NC}"
  echo "$CHALLENGE_RESPONSE" | jq .
  exit 1
fi

CHALLENGE_XDR=$(echo "$CHALLENGE_RESPONSE" | jq -r '.transaction')
echo -e "${GREEN}✅ Challenge received${NC}"
echo -e "${YELLOW}Challenge XDR (first 80 chars): ${CHALLENGE_XDR:0:80}...${NC}"
echo ""

# Step 3: Sign Challenge
echo -e "${BLUE}Step 3: Signing challenge with your wallet...${NC}"
echo -e "${YELLOW}You have two options:${NC}"
echo ""
echo -e "${GREEN}Option A: Using Freighter (Browser Extension)${NC}"
echo "  1. Open browser console (F12)"
echo "  2. Run:"
echo "     const { signTransaction } = await import('@stellar/freighter-api');"
echo "     const signed = await signTransaction('$CHALLENGE_XDR', {"
echo "       address: '$YOUR_ADDRESS',"
echo "       networkPassphrase: '$NETWORK_PASSPHRASE'"
echo "     });"
echo "     console.log(signed);"
echo ""
echo -e "${GREEN}Option B: Using Stellar CLI${NC}"
echo "  stellar transaction sign \\"
echo "    --xdr '$CHALLENGE_XDR' \\"
echo "    --source $YOUR_ADDRESS \\"
echo "    --rpc-url https://soroban-testnet.stellar.org \\"
echo "    --network-passphrase '$NETWORK_PASSPHRASE'"
echo ""
echo -e "${YELLOW}Paste your SIGNED XDR below:${NC}"
read -r SIGNED_XDR

if [ -z "$SIGNED_XDR" ]; then
  echo -e "${RED}❌ No signed XDR provided${NC}"
  exit 1
fi

echo ""

# Step 4: Verify and Get JWT
echo -e "${BLUE}Step 4: Verifying challenge and getting JWT token...${NC}"
AUTH_RESPONSE=$(curl -s -X POST "$BACKEND_URL/api/auth/auth" \
  -H "Content-Type: application/json" \
  -d "{\"transaction\": \"$SIGNED_XDR\"}")

# Check for errors
if echo "$AUTH_RESPONSE" | jq -e '.error' > /dev/null 2>&1; then
  echo -e "${RED}❌ Authentication failed${NC}"
  echo "$AUTH_RESPONSE" | jq .
  exit 1
fi

JWT_TOKEN=$(echo "$AUTH_RESPONSE" | jq -r '.token')
ACCOUNT=$(echo "$AUTH_RESPONSE" | jq -r '.account')
EXPIRES_IN=$(echo "$AUTH_RESPONSE" | jq -r '.expires_in')

echo -e "${GREEN}✅ Authentication successful!${NC}"
echo -e "${GREEN}   Account: $ACCOUNT${NC}"
echo -e "${GREEN}   Token expires in: $EXPIRES_IN${NC}"
echo ""

# Step 5: Create Deposit Transaction
echo -e "${BLUE}Step 5: Creating SEP-24 deposit transaction...${NC}"
DEPOSIT_RESPONSE=$(curl -s -X POST "$BACKEND_URL/api/sep24/deposit" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $JWT_TOKEN" \
  -d '{
    "asset_code": "USDC",
    "asset_issuer": "GBBD47IF6LWK7P7MDEVSCWR7DPUWV3NY3DTQEVFL4NAT4AQH3ZLLFLA5",
    "amount": "1000"
  }')

if echo "$DEPOSIT_RESPONSE" | jq -e '.error' > /dev/null 2>&1; then
  echo -e "${RED}❌ Failed to create deposit${NC}"
  echo "$DEPOSIT_RESPONSE" | jq .
  exit 1
fi

echo -e "${GREEN}✅ Deposit transaction created!${NC}"
echo "$DEPOSIT_RESPONSE" | jq .
echo ""

# Step 6: Verify Token Works
echo -e "${BLUE}Step 6: Verifying JWT token is valid...${NC}"
VERIFY_RESPONSE=$(curl -s -X POST "$BACKEND_URL/api/auth/auth/verify" \
  -H "Content-Type: application/json" \
  -d "{\"token\": \"$JWT_TOKEN\"}")

echo "$VERIFY_RESPONSE" | jq .
echo ""

# Summary
echo -e "${BLUE}=========================================${NC}"
echo -e "${GREEN}✅ SEP-10 Authentication Complete!${NC}"
echo -e "${BLUE}=========================================${NC}"
echo ""
echo -e "${YELLOW}Your JWT Token (save this for future requests):${NC}"
echo "$JWT_TOKEN"
echo ""
echo -e "${YELLOW}Use this token in Authorization header:${NC}"
echo "  Authorization: Bearer $JWT_TOKEN"
echo ""
echo -e "${YELLOW}Example authenticated request:${NC}"
echo "  curl -X POST $BACKEND_URL/api/sep24/deposit \\"
echo "    -H 'Content-Type: application/json' \\"
echo "    -H 'Authorization: Bearer $JWT_TOKEN' \\"
echo "    -d '{\"asset_code\": \"USDC\", \"amount\": \"1000\"}'"
echo ""
echo -e "${GREEN}🎉 You're now authenticated and ready to use deposits/withdrawals!${NC}"
