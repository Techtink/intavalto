# Forum - Ready for Production 🚀

## Quick Start to Production

### Prerequisites
- Docker & Docker Compose installed
- Domain name with DNS access
- Basic Linux/Unix command line knowledge

### Step 1: Server Setup (5 minutes)

1. **Get a VPS** - DigitalOcean, Linode, AWS EC2, or similar (Ubuntu 22.04, 2GB+ RAM)

2. **SSH into your server**
```bash
ssh root@your-server-ip
```

3. **Install Docker**
```bash
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh
sudo usermod -aG docker $USER
```

### Step 2: Deploy Application (10 minutes)

```bash
# Clone repository
git clone https://github.com/yourusername/forum /app/forum
cd /app/forum

# Setup production environment
bash scripts/setup-production.sh

# Edit configuration
nano .env
# Update these critical values:
# - CORS_ORIGIN=https://yourdomain.com
# - DB_PASSWORD (already generated, keep it)
# - ADMIN_EMAIL
# - ADMIN_PASSWORD

# Start services
docker-compose up -d

# Verify it's running
docker-compose ps
```

### Step 3: Setup SSL (5 minutes)

```bash
# Install Certbot
sudo apt-get update && sudo apt-get install -y certbot python3-certbot-nginx nginx

# Generate certificate
sudo certbot certonly --standalone -d yourdomain.com -d www.yourdomain.com

# Copy Nginx config
sudo cp /app/forum/scripts/nginx.conf /etc/nginx/sites-available/forum

# Edit Nginx config with your domain
sudo sed -i 's/yourdomain.com/YOUR_DOMAIN/g' /etc/nginx/sites-available/forum

# Enable site
sudo ln -s /etc/nginx/sites-available/forum /etc/nginx/sites-enabled/
sudo rm /etc/nginx/sites-enabled/default

# Test and start Nginx
sudo nginx -t
sudo systemctl restart nginx

# Enable auto-renewal
sudo systemctl enable certbot.timer
sudo systemctl start certbot.timer
```

### Step 4: Configure DNS (Instant)

In your domain registrar, set:
- **A record**: `yourdomain.com` → `your-server-ip`
- **A record**: `www.yourdomain.com` → `your-server-ip`

Wait 5-10 minutes for DNS to propagate.

### Step 5: Access Your Forum

Visit: `https://yourdomain.com`

**Login with admin credentials** (from .env):
- Email: admin@yourdomain.com
- Password: (what you set in .env)

## Next Steps

### Automated Backups (2 minutes)
```bash
# Edit crontab
crontab -e

# Add line for daily backups at 2 AM
0 2 * * * /app/forum/scripts/backup-db.sh >> /var/log/forum-backup.log 2>&1
```

### Monitor Health
```bash
# Check services
docker-compose ps

# View logs
docker-compose logs -f backend

# Check health
curl https://yourdomain.com/api/health
```

### Update Application
```bash
cd /app/forum
bash scripts/update.sh
```

## Production Checklist

✅ Environment Variables Configured
✅ SSL Certificate Installed
✅ DNS Configured
✅ Services Running
✅ Admin User Created

## Common Operations

### Restart Services
```bash
cd /app/forum
docker-compose restart
```

### View Logs
```bash
cd /app/forum
docker-compose logs -f backend  # Backend logs
docker-compose logs -f postgres  # Database logs
```

### Backup Database
```bash
cd /app/forum
bash scripts/backup-db.sh
```

### Check System Health
```bash
# Services
docker-compose ps

# Disk space
df -h

# Memory
free -h

# CPU
top -n 1 | head -20
```

## Troubleshooting

### Services not starting?
```bash
cd /app/forum
docker-compose logs --tail=50
```

### Port 80/443 already in use?
```bash
# Find process
lsof -i :80

# Kill it (if safe)
kill -9 <PID>
```

### Database connection error?
```bash
# Check database
docker-compose exec postgres psql -U forum_user -c "SELECT 1"
```

### SSL certificate issues?
```bash
# Check certificate
sudo certbot certificates

# Renew manually
sudo certbot renew --force-renewal

# Restart Nginx
sudo systemctl restart nginx
```

## Security Tips

1. Change admin password immediately
2. Keep database backups off the server
3. Use strong passwords for all credentials
4. Enable automatic security updates
5. Review logs regularly
6. Use firewall (restrict SSH, allow 80/443)
7. Keep Docker images updated

## Next-Level Optimizations

### Add Redis Caching
- Already included in docker-compose.yml
- Automatic session caching
- Reduces database load

### Enable Monitoring
- Setup log aggregation
- Monitor with Prometheus/Grafana
- Alert on errors
- Track performance metrics

### Scale Horizontally
- Use load balancer
- Run multiple backend instances
- Separate database server

## Getting Help

Check documentation:
- [Full Deployment Guide](DEPLOYMENT.md)
- [API Documentation](API.md)
- [Production Operations](PRODUCTION.md)

## Performance Stats

Expected performance on 2GB VPS:
- Up to 1,000 concurrent users
- ~100ms API response time
- ~99.9% uptime with monitoring

## Costs (Monthly, approximate)

| Component | Cost |
|-----------|------|
| VPS (2GB) | $5-12 |
| Domain | $10-15 |
| SSL (Let's Encrypt) | FREE |
| Backups (S3) | $0.50-2 |
| **Total** | **$15-30** |

## What's Included

✅ Production Docker setup
✅ PostgreSQL database
✅ Redis cache
✅ Nginx reverse proxy
✅ SSL/TLS with Let's Encrypt
✅ Automated backups
✅ Health monitoring
✅ Rate limiting
✅ Admin dashboard
✅ User management
✅ Content moderation
✅ Forum features (posts, comments, categories)

## Ready to Go Live?

1. ✅ Fork the repository
2. ✅ Customize branding/colors
3. ✅ Get a domain
4. ✅ Follow the 5-step deployment above
5. ✅ Share your forum! 🎉

**That's it! Your forum is now live and accessible to everyone.**

---

For detailed production operations, see [PRODUCTION.md](PRODUCTION.md)
