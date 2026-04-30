#!/bin/bash
# Quick diagnostic script to check API response codes
echo "Testing API endpoints..."
echo ""

echo "1. Health Check:"
curl -s -o /dev/null -w "HTTP Status: %{http_code}\n" http://localhost:4000/health

echo "2. Exchange Rate:"
curl -s -o /dev/null -w "HTTP Status: %{http_code}\n" "http://localhost:4000/api/moneygram/exchange-rate?base=USDC&target=MXN"

echo "3. Locations:"
curl -s -o /dev/null -w "HTTP Status: %{http_code}\n" "http://localhost:4000/api/moneygram/locations?country=MX"

echo "4. Metrics Dashboard:"
curl -s -o /dev/null -w "HTTP Status: %{http_code}\n" http://localhost:4000/api/metrics/dashboard

echo ""
echo "Checking cache stats:"
curl -s http://localhost:4000/api/cache/stats 2>/dev/null || echo "Cache endpoint not available"
