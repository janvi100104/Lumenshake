#!/bin/bash

# Stellar Testnet Deployment Script
echo "🚀 Deploying Payroll Contract to Stellar Testnet..."

cd /home/janviunix/JANVI/project/Lumenshake/contracts/payroll_contract

# Check if WASM file exists
WASM_FILE="target/wasm32-unknown-unknown/release/payroll_contract.wasm"
if [ ! -f "$WASM_FILE" ]; then
    echo "❌ WASM file not found. Building contract..."
    cargo build --target wasm32-unknown-unknown --release
fi

echo "✅ WASM file found: $(ls -lh $WASM_FILE | awk '{print $5}')"

# Check if stellar CLI is installed
if ! command -v stellar &> /dev/null; then
    echo "❌ Stellar CLI not found. Install with: cargo install stellar-cli"
    exit 1
fi

echo "✅ Stellar CLI version: $(stellar --version)"

# Step 1: Fund identity (if not already funded)
echo ""
echo "📝 Step 1: Checking testnet identity..."
stellar keys ls 2>/dev/null || echo "No identities found"

# Generate identity if it doesn't exist
if ! stellar keys show admin 2>/dev/null; then
    echo "📝 Generating 'admin' identity..."
    stellar keys generate admin --network testnet
fi

ADMIN_ADDRESS=$(stellar keys address admin)
echo "✅ Admin address: $ADMIN_ADDRESS"

# Check balance
echo "💰 Checking balance..."
stellar keys balance admin --network testnet 2>/dev/null || echo "⚠️  Need to fund account"

# Step 2: Deploy WASM
echo ""
echo "📦 Step 2: Deploying WASM to testnet..."
WASM_HASH=$(stellar contract deploy \
    --wasm $WASM_FILE \
    --source admin \
    --network testnet \
    2>&1)

if [ $? -eq 0 ]; then
    echo "✅ Contract deployed successfully!"
    echo "Contract ID: $WASM_HASH"
    
    # Save contract ID
    echo "$WASM_HASH" > /home/janviunix/JANVI/project/Lumenshake/.contract_id
    
    # Update .env.stellar
    echo ""
    echo "📝 Updating .env.stellar..."
    cd /home/janviunix/JANVI/project/Lumenshake
    if [ -f .env.stellar ]; then
        sed -i "s/CONTRACT_ID=.*/CONTRACT_ID=$WASM_HASH/" .env.stellar
    fi
    
    # Update backend .env
    echo "📝 Updating backend .env..."
    sed -i "s/CONTRACT_ID=.*/CONTRACT_ID=$WASM_HASH/" backend/.env
    
    echo ""
    echo "✅ Deployment complete!"
    echo "📊 Contract ID: $WASM_HASH"
    echo "🔗 Explorer: https://stellar.expert/explorer/testnet/contract/$WASM_HASH"
else
    echo "❌ Deployment failed!"
    echo "$WASM_HASH"
    exit 1
fi
