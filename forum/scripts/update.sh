#!/bin/bash

# Forum Update Script
# Updates and restarts the forum application

set -e

echo "🔄 Updating Forum Application"
echo "=============================="

# Pull latest changes
echo "📥 Pulling latest changes..."
git pull origin main

# Rebuild Docker images
echo "🔨 Building Docker images..."
docker-compose build

# Stop current services
echo "⏹️  Stopping services..."
docker-compose down

# Start services
echo "▶️  Starting services..."
docker-compose up -d

# Run migrations
echo "🗄️  Running database migrations..."
docker-compose exec -T backend npm run migrate

# Health check
echo "🏥 Checking health..."
sleep 5
curl -f http://localhost:5000/api/health || exit 1

echo "✅ Update completed successfully!"
