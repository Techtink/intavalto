#!/bin/bash

# Forum Production Setup Script
# This script helps setup the forum for production deployment

set -e

echo "🚀 Forum Production Setup"
echo "========================"

# Check if .env exists
if [ -f ".env" ]; then
    echo "⚠️  .env file already exists. Skipping setup."
    read -p "Do you want to reconfigure? (y/n) " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        exit 1
    fi
fi

# Generate secure secrets
JWT_SECRET=$(openssl rand -hex 32)
DB_PASSWORD=$(openssl rand -base64 32)

echo "📝 Configuring production environment..."

cat > .env << EOF
NODE_ENV=production
PORT=5000

# Database
DB_HOST=postgres
DB_PORT=5432
DB_USER=forum_user
DB_PASSWORD=${DB_PASSWORD}
DB_NAME=forum_db
DB_SSL=true

# JWT
JWT_SECRET=${JWT_SECRET}
JWT_EXPIRE=7d

# CORS
CORS_ORIGIN=https://yourdomain.com

# Admin
ADMIN_EMAIL=admin@yourdomain.com
ADMIN_PASSWORD=change_this_in_production

# Email (optional)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your_email@gmail.com
SMTP_PASS=your_app_password

# AWS S3 (optional)
AWS_ACCESS_KEY_ID=
AWS_SECRET_ACCESS_KEY=
AWS_REGION=us-east-1
AWS_S3_BUCKET=

# Sentry (optional)
SENTRY_DSN=

# Redis
REDIS_URL=redis://redis:6379
EOF

echo "✅ .env file created with secure values"
echo ""
echo "⚠️  IMPORTANT: Review and update the following in .env:"
echo "   - CORS_ORIGIN: Set to your production domain"
echo "   - ADMIN_EMAIL: Set admin email"
echo "   - ADMIN_PASSWORD: Set a strong password"
echo ""
echo "To start production deployment:"
echo "   docker-compose up -d"
echo ""
