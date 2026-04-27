#!/bin/bash

# Simple SEP-10 Authentication Script
# This will guide you through the complete flow

echo "========================================="
echo "  Lumenshake SEP-10 Authentication"
echo "========================================="
echo ""

# Your Stellar Address - CHANGE THIS
YOUR_ADDRESS="${1}"

if [ -z "$YOUR_ADDRESS" ]; then
  echo "❌ Please provide your Stellar address"
  echo ""
  echo "Usage: ./simple-auth.sh YOUR_STELLAR_ADDRESS"
  echo ""
  echo "Example: ./simple-auth.sh GABC123..."
  echo ""
  echo "Your address starts with 'G' and is about 56 characters long"
  exit 1
fi

echo "✅ Stellar Address: $YOUR_ADDRESS"
echo ""

# Step 1: Get Challenge
echo "📝 Step 1: Getting authentication challenge..."
CHALLENGE=$(curl -s "http://localhost:4000/api/auth/challenge?account=$YOUR_ADDRESS")

# Check if challenge was successful
if echo "$CHALLENGE" | grep -q "error"; then
  echo "❌ Failed to get challenge"
  echo "$CHALLENGE"
  exit 1
fi

# Extract the transaction XDR
TX_XDR=$(echo "$CHALLENGE" | python3 -c "import sys, json; print(json.load(sys.stdin)['transaction'])")

echo "✅ Challenge received!"
echo ""
echo "========================================="
echo "📋 Step 2: Sign this challenge"
echo "========================================="
echo ""
echo "You have 2 options:"
echo ""
echo "Option A: Use Freighter Wallet (Browser Extension)"
echo "  1. Open Freighter extension"
echo "  2. Click 'Sign Transaction'"
echo "  3. Paste this XDR:"
echo ""
echo "$TX_XDR"
echo ""
echo "Option B: Use Stellar Laboratory"
echo "  1. Go to: https://laboratory.stellar.org/"
echo "  2. Switch to Testnet"
echo "  3. Go to 'Sign Transaction' tab"
echo "  4. Paste the XDR above"
echo "  5. Sign with your secret key"
echo ""
echo "========================================="
echo ""
echo "After signing, paste the SIGNED XDR below:"
echo ""
read SIGNED_XDR

if [ -z "$SIGNED_XDR" ]; then
  echo "❌ No signed XDR provided"
  exit 1
fi

echo ""
echo "🔐 Step 3: Verifying and getting JWT token..."
echo ""

# Step 3: Verify and get JWT
AUTH_RESPONSE=$(curl -s -X POST "http://localhost:4000/api/auth/auth" \
  -H "Content-Type: application/json" \
  -d "{\"transaction\": \"$SIGNED_XDR\"}")

# Check if auth was successful
if echo "$AUTH_RESPONSE" | grep -q "error"; then
  echo "❌ Authentication failed"
  echo "$AUTH_RESPONSE"
  echo ""
  echo "Common issues:"
  echo "  - Wrong account used for signing"
  echo "  - Challenge expired (waited too long)"
  echo "  - Invalid signature"
  exit 1
fi

# Extract JWT token
JWT_TOKEN=$(echo "$AUTH_RESPONSE" | python3 -c "import sys, json; print(json.load(sys.stdin)['token'])")
ACCOUNT=$(echo "$AUTH_RESPONSE" | python3 -c "import sys, json; print(json.load(sys.stdin)['account'])")

echo "✅✅✅ SUCCESS! ✅✅✅"
echo ""
echo "========================================="
echo "  Authentication Complete!"
echo "========================================="
echo ""
echo "Account: $ACCOUNT"
echo ""
echo "Your JWT Token:"
echo "$JWT_TOKEN"
echo ""
echo "========================================="
echo ""
echo "📝 Step 4: Create a Deposit (Optional)"
echo ""
echo "Would you like to create a test deposit now? (y/n)"
read CREATE_DEPOSIT

if [ "$CREATE_DEPOSIT" = "y" ] || [ "$CREATE_DEPOSIT" = "Y" ]; then
  echo ""
  echo "Enter deposit amount (default: 1000):"
  read AMOUNT
  AMOUNT=${AMOUNT:-1000}
  
  echo ""
  echo "Creating deposit for $AMOUNT USDC..."
  
  DEPOSIT_RESPONSE=$(curl -s -X POST "http://localhost:4000/api/sep24/deposit" \
    -H "Content-Type: application/json" \
    -H "Authorization: Bearer $JWT_TOKEN" \
    -d "{
      \"asset_code\": \"USDC\",
      \"asset_issuer\": \"GBBD47IF6LWK7P7MDEVSCWR7DPUWV3NY3DTQEVFL4NAT4AQH3ZLLFLA5\",
      \"amount\": \"$AMOUNT\"
    }")
  
  echo ""
  echo "Deposit Response:"
  echo "$DEPOSIT_RESPONSE" | python3 -m json.tool
fi

echo ""
echo "========================================="
echo "✅ Done!"
echo "========================================="
echo ""
echo "Save your JWT token for future authenticated requests:"
echo "  Authorization: Bearer $JWT_TOKEN"
echo ""
echo "Example usage:"
echo "  curl -X POST http://localhost:4000/api/sep24/deposit \\"
echo "    -H 'Content-Type: application/json' \\"
echo "    -H 'Authorization: Bearer $JWT_TOKEN' \\"
echo "    -d '{\"asset_code\": \"USDC\", \"amount\": \"1000\"}'"
echo ""
