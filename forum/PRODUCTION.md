# Production Checklist & Operations Guide

## Pre-Deployment Checklist

### Application Setup
- [ ] All environment variables configured in `.env`
- [ ] Database credentials set to strong passwords
- [ ] JWT_SECRET generated with `openssl rand -hex 32`
- [ ] CORS_ORIGIN set to production domain
- [ ] NODE_ENV set to `production`
- [ ] API documentation reviewed
- [ ] Error handling tested

### Security
- [ ] SSL/TLS certificate obtained (Let's Encrypt)
- [ ] Firewall rules configured
- [ ] Rate limiting enabled and tested
- [ ] Input validation enabled
- [ ] Admin password set to strong value
- [ ] Initial admin user created
- [ ] CORS properly configured for domain

### Database
- [ ] PostgreSQL 12+ installed
- [ ] Database user with limited privileges created
- [ ] Backups strategy defined
- [ ] Backup script tested
- [ ] Database indexes created
- [ ] Connection pooling configured

### Docker
- [ ] Docker and Docker Compose installed
- [ ] Images built and tested locally
- [ ] Health checks configured
- [ ] Resource limits set
- [ ] Volume mounts verified
- [ ] .dockerignore files configured

### Frontend
- [ ] React build tested and optimized
- [ ] API URL points to production backend
- [ ] Service worker configured (if using PWA)
- [ ] Analytics configured (optional)
- [ ] Build artifacts verified

### Monitoring
- [ ] Logging configured
- [ ] Error tracking (Sentry) setup
- [ ] Uptime monitoring configured
- [ ] Performance monitoring enabled
- [ ] Alert thresholds set

### DNS & Domain
- [ ] Domain DNS records updated
- [ ] A record points to server IP
- [ ] MX records configured (if email enabled)
- [ ] SSL certificate issued

## Deployment Steps

### 1. Server Preparation
```bash
# Update system
sudo apt-get update && sudo apt-get upgrade -y

# Install Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh

# Add current user to docker group
sudo usermod -aG docker $USER

# Install Docker Compose
sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose
```

### 2. Application Deployment
```bash
# Clone repository
git clone <your-repo-url> /app/forum
cd /app/forum

# Setup environment
bash scripts/setup-production.sh

# Update .env with your values
nano .env

# Start services
docker-compose up -d

# Verify health
curl http://localhost:5000/api/health
```

### 3. SSL Configuration
```bash
# Install Certbot
sudo apt-get install certbot python3-certbot-nginx -y

# Generate certificate
sudo certbot certonly --standalone -d yourdomain.com

# Setup auto-renewal
sudo systemctl enable certbot.timer
sudo systemctl start certbot.timer
```

### 4. Nginx Setup
```bash
# Install Nginx
sudo apt-get install nginx -y

# Copy nginx config
sudo cp scripts/nginx.conf /etc/nginx/sites-available/forum

# Enable site
sudo ln -s /etc/nginx/sites-available/forum /etc/nginx/sites-enabled/

# Test and reload
sudo nginx -t
sudo systemctl reload nginx
```

### 5. Setup Automated Backups
```bash
# Add to crontab
crontab -e

# Add line for daily backups at 2 AM
0 2 * * * /app/forum/scripts/backup-db.sh >> /var/log/forum-backup.log 2>&1
```

## Operations Guide

### Daily Operations

#### Check System Health
```bash
# Check all containers running
docker-compose ps

# View recent logs
docker-compose logs --tail=50 -f

# Check resource usage
docker stats
```

#### Monitor Application
```bash
# Frontend health
curl https://yourdomain.com

# Backend health
curl https://yourdomain.com/api/health

# Database connection
docker-compose exec postgres psql -U forum_user -c "SELECT 1"
```

### Maintenance Tasks

#### Update Application
```bash
cd /app/forum
bash scripts/update.sh
```

#### Backup Database
```bash
bash scripts/backup-db.sh
```

#### Restore from Backup
```bash
# List available backups
ls -lh /backups/forum/

# Restore specific backup
docker-compose exec -T postgres psql -U forum_user forum_db < /backups/forum/forum_backup_2024-01-15_02-00-00.sql.gz
```

#### Scale Services
```bash
# Increase backend instances
docker-compose up -d --scale backend=3

# Update load balancer config accordingly
```

### Troubleshooting

#### High CPU Usage
```bash
# Identify problematic container
docker stats

# Check application logs
docker-compose logs backend | grep -i error

# Restart container
docker-compose restart backend
```

#### Database Connection Issues
```bash
# Check database container
docker-compose ps postgres

# Check database logs
docker-compose logs postgres

# Test connection
docker-compose exec postgres psql -U forum_user -c "SELECT version();"
```

#### Memory Issues
```bash
# Check memory usage
free -h

# Restart container
docker-compose restart backend

# Update resource limits in docker-compose.yml if needed
```

#### Port Already in Use
```bash
# Find process on port
lsof -i :5000

# Kill process (if safe)
kill -9 <PID>
```

## Performance Optimization

### Database Optimization
```sql
-- Create indexes for common queries
CREATE INDEX idx_posts_category ON posts(category_id);
CREATE INDEX idx_posts_user ON posts(user_id);
CREATE INDEX idx_posts_approved ON posts(is_approved);
CREATE INDEX idx_comments_post ON comments(post_id);
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_username ON users(username);

-- Vacuum and analyze
VACUUM ANALYZE;
```

### Caching Strategy
```bash
# Monitor Redis
docker-compose exec redis redis-cli INFO

# Clear cache if needed
docker-compose exec redis redis-cli FLUSHALL
```

### Load Testing
```bash
# Install Apache Bench
sudo apt-get install apache2-utils -y

# Test endpoint
ab -n 1000 -c 10 https://yourdomain.com/api/health
```

## Security Maintenance

### Regular Updates
```bash
# Update base images
docker pull node:18-alpine
docker pull postgres:15-alpine
docker pull redis:7-alpine

# Rebuild and restart
docker-compose build --pull
docker-compose up -d
```

### Security Scanning
```bash
# Scan images for vulnerabilities
docker scan forum-backend
docker scan forum-frontend

# Check dependencies
npm audit
```

### Access Control
- [ ] Review and limit SSH access
- [ ] Disable root login
- [ ] Use SSH key authentication
- [ ] Configure fail2ban
- [ ] Review sudo access

## Incident Response

### Application Down
1. Check Docker status: `docker-compose ps`
2. View error logs: `docker-compose logs --tail=100`
3. Check system resources: `docker stats`
4. Restart service: `docker-compose restart backend`
5. If persists, restart all: `docker-compose restart`

### Database Issues
1. Check database logs: `docker-compose logs postgres`
2. Test connection: `docker-compose exec postgres psql -U forum_user -c "SELECT 1"`
3. Check disk space: `df -h`
4. Review recent changes/migrations

### High Traffic/Load
1. Check current load: `docker stats`
2. Scale services: `docker-compose up -d --scale backend=5`
3. Implement caching
4. Review and optimize queries

### Security Breach
1. Check logs for suspicious activity
2. Review user access logs
3. Rotate credentials
4. Update firewall rules
5. Consider service restart

## Monitoring Setup

### Prometheus Metrics (Optional)
Add to docker-compose.yml:
```yaml
prometheus:
  image: prom/prometheus
  volumes:
    - ./prometheus.yml:/etc/prometheus/prometheus.yml
  ports:
    - "9090:9090"
```

### Alert Examples
- CPU usage > 80%
- Memory usage > 85%
- Disk space < 10%
- API response time > 1s
- Error rate > 1%
- Database query time > 5s

## Documentation Links
- [Deployment Guide](DEPLOYMENT.md)
- [API Documentation](API.md)
- [Architecture Overview](ARCHITECTURE.md)

## Support Contacts
- DevOps: devops@yourdomain.com
- Security: security@yourdomain.com
- Admin: admin@yourdomain.com
