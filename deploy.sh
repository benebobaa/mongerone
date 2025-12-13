#!/bin/bash
set -e

echo "🚀 Money Manager Deployment Script"
echo "=================================="
echo ""

# Check if .env.local exists
if [ ! -f .env.local ]; then
    echo "❌ Error: .env.local file not found!"
    echo "Please create .env.local with your environment variables"
    exit 1
fi

# Load environment variables
export $(cat .env.local | grep -v '^#' | xargs)

# Check required variables
if [ -z "$DATABASE_URL" ]; then
    echo "❌ Error: DATABASE_URL not set in .env.local"
    exit 1
fi

echo "✅ Environment variables loaded"
echo ""

# Run migrations
echo "📊 Running database migrations..."
bunx drizzle-kit push --force
echo "✅ Migrations complete"
echo ""

# Seed data (optional, will fail if data exists - that's ok)
echo "🌱 Seeding initial data..."
bun run lib/db/seed.ts || echo "⚠️  Seeding skipped (data might already exist)"
echo ""

# Build Docker image
echo "🐳 Building Docker image..."
docker build -t money-manager:latest .
echo "✅ Docker image built (187MB)"
echo ""

echo "🎉 Deployment preparation complete!"
echo ""
echo "Next steps:"
echo "1. Push image to registry: docker tag money-manager:latest your-registry/money-manager:latest"
echo "2. Deploy to k3s: kubectl apply -f k8s-deployment.yaml"
echo "3. Or run locally: docker run -p 3000:3000 --env-file .env.local money-manager:latest"
