#!/bin/bash

# Monitoring Setup Script
# Starts Prometheus, Grafana, and Alertmanager for Lumenshake

echo "🚀 Setting up Lumenshake Monitoring Stack..."
echo ""

# Check if Docker is installed
if ! command -v docker &> /dev/null; then
    echo "❌ Docker is not installed. Please install Docker first."
    exit 1
fi

# Check if Docker Compose is installed
if ! command -v docker-compose &> /dev/null; then
    echo "❌ Docker Compose is not installed. Please install Docker Compose first."
    exit 1
fi

echo "✅ Docker and Docker Compose found"
echo ""

# Create monitoring directory if it doesn't exist
MONITORING_DIR="$(cd "$(dirname "$0")" && pwd)"
cd "$MONITORING_DIR"

echo "📁 Monitoring directory: $MONITORING_DIR"
echo ""

# Start monitoring stack
echo "📦 Starting monitoring services..."
docker-compose up -d

if [ $? -eq 0 ]; then
    echo ""
    echo "✅ Monitoring stack started successfully!"
    echo ""
    echo "📊 Services:"
    echo "   - Prometheus:  http://localhost:9090"
    echo "   - Grafana:     http://localhost:3001 (admin/admin)"
    echo "   - Alertmanager: http://localhost:9093"
    echo "   - Node Exporter: http://localhost:9100"
    echo ""
    echo "📝 Next steps:"
    echo "   1. Visit http://localhost:9090 to verify Prometheus is scraping metrics"
    echo "   2. Visit http://localhost:3001 and login with admin/admin"
    echo "   3. Import the dashboard from grafana-dashboard.json"
    echo "   4. Configure alert notifications in alertmanager.yml"
    echo ""
    echo "🔍 Check status:"
    echo "   docker-compose ps"
    echo ""
    echo "📖 View logs:"
    echo "   docker-compose logs -f"
    echo ""
    echo "🛑 Stop services:"
    echo "   docker-compose down"
    echo ""
else
    echo ""
    echo "❌ Failed to start monitoring stack"
    exit 1
fi
