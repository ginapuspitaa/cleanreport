# 🚀 CleanReport Deployment Guide

Panduan lengkap untuk deploy aplikasi CleanReport ke production environment.

## 📋 Daftar Isi

- [File Deployment](#file-deployment)
- [Quick Start](#quick-start)
- [Environment Setup](#environment-setup)
- [Deployment Options](#deployment-options)
- [Monitoring & Maintenance](#monitoring--maintenance)
- [Troubleshooting](#troubleshooting)

## 📁 File Deployment

Project ini menyediakan beberapa file untuk deployment:

```
📦 Deployment Files:
├── 📄 .github/workflows/deploy.yml     # GitHub Actions deployment
├── 📄 docker-compose.prod.yml          # Production Docker setup
├── 📄 nginx.conf                       # Reverse proxy config
├── 📄 .env.prod.example                # Environment template
├── 📄 deploy.sh                        # Deployment script
├── 📄 init.sql                         # Database initialization
└── 📄 DEPLOYMENT_README.md             # This guide
```

## 🚀 Quick Start

### 1. Persiapan Environment

```bash
# Clone repository
git clone https://github.com/ginapuspitaa/cleanreport.git
cd cleanreport

# Setup environment variables
cp .env.prod.example .env.production
# Edit .env.production dengan nilai yang benar
```

### 2. Deploy dengan Docker (Simplest)

```bash
# Jalankan deployment script
./deploy.sh production docker

# Atau manual dengan docker-compose
docker-compose -f docker-compose.prod.yml up -d
```

### 3. Verifikasi Deployment

```bash
# Check container status
docker-compose -f docker-compose.prod.yml ps

# Check health
curl http://localhost:3000/health

# Check logs
docker-compose -f docker-compose.prod.yml logs -f
```

## ⚙️ Environment Setup

### Environment Variables

Edit file `.env.production` dengan konfigurasi yang benar:

```bash
# Database
DB_DIALECT=postgres
DB_HOST=localhost
DB_PORT=5432
DB_USER=your_db_user
DB_PASSWORD=your_secure_password
DB_NAME=cleanreport_prod

# AWS S3
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=your_access_key
AWS_SECRET_ACCESS_KEY=your_secret_key
AWS_S3_BUCKET=your-bucket-name

# Application
NODE_ENV=production
PORT=3000
```

### Database Setup

```bash
# Untuk PostgreSQL
psql -U postgres -h localhost
CREATE DATABASE cleanreport_prod;
CREATE USER cleanreport_user WITH PASSWORD 'secure_password';
GRANT ALL PRIVILEGES ON DATABASE cleanreport_prod TO cleanreport_user;
```

## 🖥️ Deployment Options

### Option 1: Docker Compose (Recommended)

```bash
# Production deployment
docker-compose -f docker-compose.prod.yml up -d

# Dengan custom env file
docker-compose -f docker-compose.prod.yml --env-file .env.production up -d

# Scale services
docker-compose -f docker-compose.prod.yml up -d --scale cleanreport-backend=3
```

### Option 2: GitHub Actions Auto-Deploy

1. **Setup Secrets di GitHub:**
   - Go to Repository Settings → Secrets and variables → Actions
   - Add secrets: `AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY`, etc.

2. **Configure Deployment Target:**
   - Edit `.github/workflows/deploy.yml`
   - Uncomment dan configure deployment method (SSH/AWS/Webhook)

3. **Auto-Deploy:**
   - Push ke branch `main`
   - GitHub Actions akan otomatis deploy

### Option 3: Manual Server Deployment

```bash
# 1. Setup server (Ubuntu/Debian)
sudo apt update
sudo apt install docker.io docker-compose nginx certbot

# 2. Clone dan setup
git clone https://github.com/ginapuspitaa/cleanreport.git
cd cleanreport
cp .env.prod.example .env.production

# 3. Configure environment
nano .env.production

# 4. Deploy
./deploy.sh production docker

# 5. Setup nginx reverse proxy
sudo cp nginx.conf /etc/nginx/sites-available/cleanreport
sudo ln -s /etc/nginx/sites-available/cleanreport /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

### Option 4: AWS EC2 Deployment

```bash
# 1. Launch EC2 instance
# - Ubuntu 22.04 LTS
# - t3.micro atau t3.small
# - Security group: 22, 80, 443

# 2. Connect via SSH
ssh -i your-key.pem ubuntu@your-instance-ip

# 3. Install dependencies
sudo apt update
sudo apt install docker.io docker-compose nginx

# 4. Clone dan deploy
git clone https://github.com/ginapuspitaa/cleanreport.git
cd cleanreport
./deploy.sh production docker

# 5. Setup domain (optional)
# Configure Route 53 dan SSL dengan certbot
```

## 📊 Monitoring & Maintenance

### Health Checks

```bash
# Application health
curl http://your-domain.com/health

# Docker containers
docker ps

# Logs
docker-compose -f docker-compose.prod.yml logs -f cleanreport-backend

# Resource usage
docker stats
```

### Backup Database

```bash
# PostgreSQL backup
docker exec cleanreport-postgres-prod pg_dump -U your_user cleanreport_prod > backup_$(date +%Y%m%d).sql

# Automated backup (add to crontab)
# 0 2 * * * docker exec cleanreport-postgres-prod pg_dump -U user db > /backups/backup_$(date +%Y%m%d).sql
```

### Updates

```bash
# Update application
git pull origin main
docker-compose -f docker-compose.prod.yml build --no-cache
docker-compose -f docker-compose.prod.yml up -d

# Update dependencies
docker-compose -f docker-compose.prod.yml exec cleanreport-backend npm audit fix
```

## 🔧 Troubleshooting

### Common Issues

**1. Port 3000 already in use:**

```bash
# Find process using port
sudo lsof -i :3000
# Kill process
sudo kill -9 PID
```

**2. Database connection failed:**

```bash
# Check database container
docker logs cleanreport-postgres-prod

# Test connection
docker exec -it cleanreport-postgres-prod psql -U your_user -d cleanreport_prod
```

**3. Application not responding:**

```bash
# Check application logs
docker logs cleanreport-backend-prod

# Restart service
docker-compose -f docker-compose.prod.yml restart cleanreport-backend
```

**4. SSL Certificate issues:**

```bash
# Renew Let's Encrypt certificate
sudo certbot renew
sudo systemctl reload nginx
```

### Logs & Debugging

```bash
# Application logs
docker-compose -f docker-compose.prod.yml logs -f

# Nginx access logs
sudo tail -f /var/log/nginx/access.log

# System logs
sudo journalctl -u nginx -f
```

## 🔒 Security Checklist

- [ ] ✅ Environment variables tidak hardcoded
- [ ] ✅ Database credentials secure
- [ ] ✅ AWS credentials menggunakan IAM roles
- [ ] ✅ SSL/TLS enabled
- [ ] ✅ Firewall configured (UFW/iptables)
- [ ] ✅ Regular security updates
- [ ] ✅ Backup strategy implemented
- [ ] ✅ Monitoring alerts setup

## 📞 Support

Jika mengalami masalah deployment:

1. **Check logs** menggunakan commands di atas
2. **Verify environment variables** di `.env.production`
3. **Test locally** dengan `docker-compose up -d`
4. **Check GitHub Issues** untuk masalah umum
5. **Create new issue** jika masalah belum terdokumentasi

## 🎯 Performance Tuning

### Database Optimization

```sql
-- Create indexes
CREATE INDEX CONCURRENTLY idx_reports_status_created ON reports(status, created_at DESC);
CREATE INDEX CONCURRENTLY idx_reports_location_gist ON reports USING GIST(ST_Point(longitude, latitude));

-- Analyze tables
ANALYZE reports;
```

### Application Scaling

```bash
# Scale backend services
docker-compose -f docker-compose.prod.yml up -d --scale cleanreport-backend=3

# Add Redis for caching (future enhancement)
# docker run -d --name redis -p 6379:6379 redis:alpine
```

---

**🎉 Happy Deploying!**

**Aplikasi CleanReport siap untuk production deployment.**
