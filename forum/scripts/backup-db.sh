#!/bin/bash

# Forum Backup Script
# Creates daily backups of the database

BACKUP_DIR="/backups/forum"
DATE=$(date +%Y-%m-%d_%H-%M-%S)
BACKUP_FILE="$BACKUP_DIR/forum_backup_$DATE.sql"

# Create backup directory if it doesn't exist
mkdir -p "$BACKUP_DIR"

echo "Starting database backup..."

# Backup database
docker-compose exec -T postgres pg_dump -U forum_user forum_db > "$BACKUP_FILE"

# Compress backup
gzip "$BACKUP_FILE"

# Keep only last 30 days of backups
find "$BACKUP_DIR" -name "*.sql.gz" -mtime +30 -delete

echo "✅ Backup completed: ${BACKUP_FILE}.gz"
