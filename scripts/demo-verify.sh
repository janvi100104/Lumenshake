#!/bin/bash

# LumenShake Demo Verification Script
# Run this before your demo to ensure everything is working

echo "🔍 LumenShake Demo Pre-Check"
echo "================================"
echo ""

# Configuration
CONTRACT="CCRD5GASTD5IQQPX2ELACIYQRTHQDPWMPFG7AWNWVRP5F6CRT2L3SEAJ"
RPC="https://soroban-testnet.stellar.org"
PASSPHRASE="Test SDF Network ; September 2015"

# Check 1: Web Server
echo "1️⃣  Checking Web Server..."
if curl -s http://localhost:3000 > /dev/null; then
    echo "   ✅ Web server running on http://localhost:3000"
else
    echo "   ❌ Web server NOT running"
    echo "   → Run: cd /home/janviunix/JANVI/project/Lumenshake/web && npm run dev"
fi
echo ""

# Check 2: Contract Deployment
echo "2️⃣  Checking Smart Contract..."
RESPONSE=$(stellar contract invoke \
  --id $CONTRACT \
  --source lumenshake_admin \
  --rpc-url $RPC \
  --network-passphrase "$PASSPHRASE" \
  -- get_escrow_balance 2>&1)

if echo "$RESPONSE" | grep -q "Error\|error\|failed"; then
    echo "   ❌ Contract not responding"
    echo "   → Error: $RESPONSE"
else
    echo "   ✅ Contract deployed and responding"
    echo "   → Escrow Balance: $RESPONSE"
fi
echo ""

# Check 3: Stellar CLI
echo "3️⃣  Checking Stellar CLI..."
if command -v stellar &> /dev/null; then
    VERSION=$(stellar --version 2>&1 | head -n 1)
    echo "   ✅ Stellar CLI installed: $VERSION"
else
    echo "   ❌ Stellar CLI not found"
    echo "   → Run: cargo install stellar-cli"
fi
echo ""

# Check 4: Node.js
echo "4️⃣  Checking Node.js..."
if command -v node &> /dev/null; then
    VERSION=$(node --version)
    echo "   ✅ Node.js installed: $VERSION"
else
    echo "   ❌ Node.js not found"
    echo "   → Install Node.js v18+"
fi
echo ""

# Check 5: Freighter Wallet
echo "5️⃣  Freighter Wallet Check"
echo "   ⚠️  Manual check required:"
echo "   → Is Freighter extension installed?"
echo "   → Is it switched to Testnet?"
echo "   → Is your wallet funded with test XLM?"
echo "   → Get XLM: https://friendbot.stellar.org/?addr=YOUR_ADDRESS"
echo ""

# Summary
echo "================================"
echo "📋 Demo URLs:"
echo "   • Web Dashboard: http://localhost:3000"
echo "   • Contract Explorer: https://stellar.expert/explorer/testnet/contract/$CONTRACT"
echo "   • Get Test XLM: https://friendbot.stellar.org/?addr=YOUR_ADDRESS"
echo ""
echo "📚 Documentation:"
echo "   • Full Demo Guide: /home/janviunix/JANVI/project/Lumenshake/DEMO_GUIDE.md"
echo "   • Quick Reference: /home/janviunix/JANVI/project/Lumenshake/DEMO_QUICK_REFERENCE.md"
echo ""
echo "✅ Pre-check complete! You're ready to demo!"
echo ""
