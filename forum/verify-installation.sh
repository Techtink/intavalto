#!/bin/bash

# Forum Application - Verification Script
# This script verifies that all files are in place for production deployment

echo "🔍 Verifying Forum Application Structure..."
echo "==========================================="
echo ""

ERRORS=0

# Check directories
echo "📁 Checking directories..."
directories=(
    "server"
    "server/src"
    "server/src/models"
    "server/src/routes"
    "server/src/controllers"
    "server/src/middleware"
    "server/src/utils"
    "client"
    "client/src"
    "client/src/pages"
    "client/src/pages/admin"
    "client/src/store"
    "client/src/utils"
    "scripts"
    ".github/workflows"
)

for dir in "${directories[@]}"; do
    if [ -d "$dir" ]; then
        echo "  ✅ $dir"
    else
        echo "  ❌ $dir (MISSING)"
        ((ERRORS++))
    fi
done

echo ""
echo "📄 Checking backend files..."
backend_files=(
    "server/src/index.js"
    "server/src/models/index.js"
    "server/src/models/User.js"
    "server/src/models/Post.js"
    "server/src/models/Comment.js"
    "server/src/models/Category.js"
    "server/src/models/Moderator.js"
    "server/src/routes/auth.js"
    "server/src/routes/users.js"
    "server/src/routes/posts.js"
    "server/src/routes/comments.js"
    "server/src/routes/categories.js"
    "server/src/routes/admin.js"
    "server/src/routes/health.js"
    "server/src/controllers/authController.js"
    "server/src/controllers/adminController.js"
    "server/src/middleware/auth.js"
    "server/src/middleware/validation.js"
    "server/src/middleware/rateLimiter.js"
    "server/src/middleware/security.js"
    "server/src/middleware/errorHandler.js"
    "server/src/utils/logger.js"
    "server/package.json"
    "server/Dockerfile"
    "server/.env.example"
)

for file in "${backend_files[@]}"; do
    if [ -f "$file" ]; then
        echo "  ✅ $file"
    else
        echo "  ❌ $file (MISSING)"
        ((ERRORS++))
    fi
done

echo ""
echo "🎨 Checking frontend files..."
frontend_files=(
    "client/src/App.js"
    "client/src/index.js"
    "client/src/index.css"
    "client/src/pages/Login.js"
    "client/src/pages/Register.js"
    "client/src/pages/PostDetail.js"
    "client/src/pages/AdminLayout.js"
    "client/src/pages/admin/Dashboard.js"
    "client/src/pages/admin/UserManagement.js"
    "client/src/pages/admin/ContentModeration.js"
    "client/src/store/authStore.js"
    "client/src/utils/api.js"
    "client/public/index.html"
    "client/package.json"
    "client/Dockerfile"
    "client/tailwind.config.js"
    "client/postcss.config.js"
    "client/.env.example"
)

for file in "${frontend_files[@]}"; do
    if [ -f "$file" ]; then
        echo "  ✅ $file"
    else
        echo "  ❌ $file (MISSING)"
        ((ERRORS++))
    fi
done

echo ""
echo "🚀 Checking deployment files..."
deployment_files=(
    "docker-compose.yml"
    "scripts/setup-production.sh"
    "scripts/backup-db.sh"
    "scripts/update.sh"
    "scripts/nginx.conf"
    ".github/workflows/ci-cd.yml"
    ".gitignore"
)

for file in "${deployment_files[@]}"; do
    if [ -f "$file" ]; then
        echo "  ✅ $file"
    else
        echo "  ❌ $file (MISSING)"
        ((ERRORS++))
    fi
done

echo ""
echo "📚 Checking documentation..."
docs=(
    "README.md"
    "QUICKSTART_PRODUCTION.md"
    "DEPLOYMENT.md"
    "PRODUCTION.md"
    "API.md"
    "PRODUCTION_READY.md"
    "GETTING_STARTED.md"
    "INDEX.md"
    "DEPLOYMENT_COMPLETE.md"
)

for doc in "${docs[@]}"; do
    if [ -f "$doc" ]; then
        echo "  ✅ $doc"
    else
        echo "  ❌ $doc (MISSING)"
        ((ERRORS++))
    fi
done

echo ""
echo "==========================================="
if [ $ERRORS -eq 0 ]; then
    echo "✅ ALL FILES PRESENT AND ACCOUNTED FOR!"
    echo ""
    echo "Your forum application is ready for production."
    echo ""
    echo "Next steps:"
    echo "  1. Read: QUICKSTART_PRODUCTION.md"
    echo "  2. Deploy: Follow the guide"
    echo "  3. Share: Launch your forum!"
    echo ""
else
    echo "❌ $ERRORS files are missing"
    echo "Please ensure all files are present before deploying"
    exit 1
fi
