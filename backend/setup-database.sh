#!/bin/bash

# Database Setup Script for LumenShake
echo "🚀 Setting up LumenShake PostgreSQL Database..."

# Check if PostgreSQL is running
if ! systemctl is-active --quiet postgresql; then
    echo "❌ PostgreSQL is not running. Starting PostgreSQL..."
    sudo systemctl start postgresql
fi

# Create database if it doesn't exist
echo "📦 Checking if database 'lumenshake' exists..."
DB_EXISTS=$(sudo -u postgres psql -t -c "SELECT 1 FROM pg_database WHERE datname = 'lumenshake'" | grep -c 1)

if [ "$DB_EXISTS" -eq 0 ]; then
    echo "📦 Creating database 'lumenshake'..."
    sudo -u postgres psql -c "CREATE DATABASE lumenshake;"
    echo "✅ Database created successfully"
else
    echo "✅ Database 'lumenshake' already exists"
fi

# Set password for postgres user (if needed)
echo "🔐 Setting up database user credentials..."
sudo -u postgres psql -c "ALTER USER postgres WITH PASSWORD 'postgres';" 2>/dev/null || true

# Run migrations
echo "📄 Running database migrations..."
cd "$(dirname "$0")"
npm run migrate

echo ""
echo "✅ Database setup complete!"
echo "📊 Database: lumenshake"
echo "🔗 Connection: postgresql://postgres:postgres@localhost:5432/lumenshake"
echo ""
echo "Next steps:"
echo "  1. Verify tables: psql -U postgres -d lumenshake -c '\dt'"
echo "  2. Start backend: npm start"
echo "  3. Test connection: curl http://localhost:4000/health"
