# Production Deployment Guide

This guide covers deploying the Forum application to production.

## Deployment Options

### Option 1: Docker Compose (Recommended for VPS/Cloud)

#### Prerequisites
- Docker and Docker Compose installed
- Server with at least 2GB RAM
- Domain name (for SSL)

#### Deployment Steps

1. **Clone repository and setup**
```bash
git clone <your-repo-url>
cd forum
cp .env.example .env
```

2. **Configure environment variables**
```bash
# Edit .env with production values
nano .env
```

Required production variables:
- `NODE_ENV=production`
- `DB_PASSWORD=<strong-password>`
- `JWT_SECRET=<generate-strong-key>`
- `CORS_ORIGIN=https://yourdomain.com`

3. **Generate JWT Secret**
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

4. **Start with Docker Compose**
```bash
docker-compose up -d
```

5. **Verify services are running**
```bash
docker-compose ps
docker-compose logs -f backend
```

#### SSL with Let's Encrypt

1. **Install Certbot**
```bash
sudo apt-get install certbot python3-certbot-nginx
```

2. **Generate certificate**
```bash
sudo certbot certonly --standalone -d yourdomain.com
```

3. **Setup Nginx reverse proxy** (see nginx.conf example below)

4. **Auto-renewal**
```bash
sudo systemctl enable certbot.timer
sudo systemctl start certbot.timer
```

#### Nginx Configuration Example
```nginx
upstream backend {
    server backend:5000;
}

upstream frontend {
    server frontend:3000;
}

server {
    listen 443 ssl http2;
    server_name yourdomain.com;

    ssl_certificate /etc/letsencrypt/live/yourdomain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/yourdomain.com/privkey.pem;

    # Security headers
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;

    # Frontend
    location / {
        proxy_pass http://frontend;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }

    # API
    location /api {
        proxy_pass http://backend;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}

server {
    listen 80;
    server_name yourdomain.com;
    return 301 https://$server_name$request_uri;
}
```

### Option 2: Heroku

1. **Install Heroku CLI**
```bash
curl https://cli.heroku.com/install.sh | sh
```

2. **Login and create apps**
```bash
heroku login
heroku create your-app-name-api
heroku create your-app-name-frontend
```

3. **Add PostgreSQL**
```bash
heroku addons:create heroku-postgresql:standard-0 --app your-app-name-api
```

4. **Set environment variables**
```bash
heroku config:set NODE_ENV=production --app your-app-name-api
heroku config:set JWT_SECRET=$(node -e "console.log(require('crypto').randomBytes(32).toString('hex'))") --app your-app-name-api
```

5. **Deploy backend**
```bash
cd server
git subtree push --prefix server heroku-backend main
```

6. **Deploy frontend**
```bash
cd ../client
git subtree push --prefix client heroku-frontend main
```

### Option 3: AWS

#### RDS Database
1. Create RDS PostgreSQL instance
2. Note connection details
3. Update `.env` with RDS endpoint

#### EC2 Server
1. Launch Ubuntu 22.04 instance
2. Install Docker and Docker Compose
3. Clone repo and follow Docker Compose steps

#### CloudFront + S3
- Store frontend builds in S3
- Use CloudFront for CDN

### Option 4: DigitalOcean

1. **Create Droplet**
   - Ubuntu 22.04
   - 2GB+ RAM
   - Enable backups

2. **Initial setup**
```bash
ssh root@your_droplet_ip
apt-get update && apt-get upgrade -y
apt-get install -y docker.io docker-compose curl
usermod -aG docker $USER
```

3. **Deploy**
```bash
git clone <repo>
cd forum
cp .env.example .env
# Edit .env
docker-compose up -d
```

4. **Setup domain**
   - Point domain A record to droplet IP
   - Use Certbot for SSL

## Post-Deployment Checklist

- [ ] Database backups configured
- [ ] SSL certificate installed
- [ ] DNS pointing to server
- [ ] Environment variables set correctly
- [ ] Logs being collected
- [ ] Monitoring alerts setup
- [ ] Firewall rules configured
- [ ] Rate limiting tested
- [ ] Admin user created
- [ ] CORS properly configured
- [ ] Email service (if using) configured
- [ ] Error tracking (Sentry) configured

## Monitoring & Maintenance

### Log Monitoring
```bash
# Backend logs
docker-compose logs -f backend

# Database logs
docker-compose logs -f postgres

# View specific date
docker-compose logs --since 2024-01-01
```

### Database Backups
```bash
# Manual backup
docker-compose exec postgres pg_dump -U forum_user forum_db > backup.sql

# Restore from backup
docker-compose exec -T postgres psql -U forum_user forum_db < backup.sql

# Automated daily backups
0 2 * * * docker-compose -f /path/to/docker-compose.yml exec -T postgres pg_dump -U forum_user forum_db > /backups/forum_$(date +\%Y\%m\%d).sql
```

### Update Application
```bash
# Pull latest changes
git pull origin main

# Rebuild images
docker-compose build

# Restart services
docker-compose down
docker-compose up -d
```

## Security Best Practices

1. **Database**
   - Use strong passwords
   - Enable SSL connections
   - Regular backups
   - Principle of least privilege

2. **Application**
   - Keep dependencies updated
   - Use environment variables
   - Enable rate limiting
   - CORS configured properly

3. **Server**
   - Firewall enabled
   - SSH key authentication
   - Regular security updates
   - Fail2ban for brute force protection

4. **Secrets Management**
   - Never commit `.env` files
   - Use secret vaults (AWS Secrets Manager, Vault)
   - Rotate secrets regularly
   - Limit secret access

## Performance Optimization

1. **Enable Redis caching**
   - Cache user sessions
   - Cache frequently accessed posts
   - Update `.env`: `REDIS_URL=redis://redis:6379`

2. **Database optimization**
   - Add indexes on frequently queried fields
   - Archive old posts/comments
   - Regular vacuum and analyze

3. **CDN for static assets**
   - Use CloudFront, Cloudflare, or similar
   - Minify and compress assets
   - Cache headers configured

4. **Load balancing**
   - Use load balancer (AWS ALB, Nginx)
   - Scale backend horizontally
   - Use sticky sessions for WebSockets

## Troubleshooting

### Container won't start
```bash
docker-compose logs backend
# Check environment variables and database connection
```

### Database connection errors
```bash
docker-compose exec postgres psql -U forum_user -c "SELECT 1"
```

### Port already in use
```bash
# Kill process on port
lsof -i :5000
kill -9 <PID>
```

### SSL certificate expired
```bash
sudo certbot renew --force-renewal
docker-compose restart backend frontend
```

## Support & Issues

- Check application logs
- Verify environment variables
- Test connectivity between services
- Check database availability
- Review firewall rules

For more help, see the main [README.md](../README.md)
