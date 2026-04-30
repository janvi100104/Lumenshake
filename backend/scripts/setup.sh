#\!/bin/bash

echo "🚀 LumenShake Backend Setup"
echo "============================"

# Check if PostgreSQL is installed
if \! command -v psql &> /dev/null; then
    echo "❌ PostgreSQL not found. Installing..."
    sudo apt update
    sudo apt install -y postgresql postgresql-contrib
fi

# Start PostgreSQL service
echo "📦 Starting PostgreSQL..."
sudo systemctl start postgresql
sudo systemctl enable postgresql

# Create database and user
echo "🗄️  Setting up database..."
sudo -u postgres psql << 'SQL'
CREATE DATABASE lumenshake;
CREATE USER lumenshake_user WITH PASSWORD 'lumenshake_pass';
GRANT ALL PRIVILEGES ON DATABASE lumenshake TO lumenshake_user;
\c lumenshake
GRANT ALL ON SCHEMA public TO lumenshake_user;
SQL

# Update .env file
echo "⚙️  Updating .env configuration..."
sed -i 's/DB_USER=postgres/DB_USER=lumenshake_user/' .env
sed -i 's/DB_PASSWORD=postgres/DB_PASSWORD=lumenshake_pass/' .env

# Run migrations
echo "�� Running database migrations..."
npm run migrate

echo ""
echo "✅ Backend setup complete\!"
echo "🚀 Start the server with: npm run dev"
echo "📡 API will be available at: http://localhost:4000/api"
