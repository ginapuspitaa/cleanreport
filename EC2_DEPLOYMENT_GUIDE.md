# 🚀 Deploy CleanReport ke AWS EC2 - Panduan Lengkap

Panduan step-by-step untuk deploy aplikasi CleanReport ke AWS EC2 instance.

## 📋 Prerequisites

- AWS Account dengan akses ke EC2
- Terminal/SSH client
- Git terinstall di local machine
- GitHub repository CleanReport

## 🎯 Step 1: Setup AWS EC2 Instance

### 1.1 Launch EC2 Instance

```bash
# Dari AWS Console:
# 1. Go to EC2 Dashboard
# 2. Click "Launch Instance"
# 3. Select:
#    - Image: Ubuntu 22.04 LTS (Free tier eligible)
#    - Instance Type: t3.micro atau t2.micro (Free tier)
#    - Storage: 30GB (Free tier)
# 4. Configure Security Group:
#    - SSH (22) - from your IP
#    - HTTP (80) - from anywhere (0.0.0.0/0)
#    - HTTPS (443) - from anywhere (0.0.0.0/0)
#    - Custom TCP (3000) - from anywhere (untuk testing)
# 5. Create & download keypair (.pem file)
```

### 1.2 Connect ke Instance

```bash
# Set keypair permission
chmod 400 your-keypair.pem

# SSH ke instance
ssh -i your-keypair.pem ubuntu@your-instance-public-ip

# Contoh:
# ssh -i cleanreport.pem ubuntu@54.123.45.67
```

---

## 🔧 Step 2: Setup Server Environment

Jalankan commands ini di EC2 instance:

```bash
# Update system
sudo apt update
sudo apt upgrade -y

# Install Docker & Docker Compose
sudo apt install -y docker.io docker-compose git curl

# Add ubuntu ke docker group (agar tidak perlu sudo)
sudo usermod -aG docker ubuntu
newgrp docker

# Install Node.js (opsional, jika ingin test lokal)
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt install -y nodejs

# Verify installations
docker --version
docker-compose --version
node --version
npm --version
```

---

## 📥 Step 3: Clone & Setup CleanReport

```bash
# Clone repository
git clone https://github.com/ginapuspitaa/cleanreport.git
cd cleanreport

# Copy production environment file
cp .env.prod.example .env.production

# Edit environment variables
nano .env.production
# atau
vim .env.production

# Set yang PENTING:
# DB_HOST=localhost
# DB_USER=cleanreport
# DB_PASSWORD=your_secure_password
# AWS_ACCESS_KEY_ID=your_aws_key
# AWS_SECRET_ACCESS_KEY=your_aws_secret
# AWS_S3_BUCKET=your-bucket-name
```

---

## 🐳 Step 4: Deploy dengan Docker Compose

### Option A: Manual Docker Compose

```bash
# Build Docker image lokal
docker-compose -f docker-compose.prod.yml build

# Start services
docker-compose -f docker-compose.prod.yml up -d

# Check status
docker-compose -f docker-compose.prod.yml ps

# View logs
docker-compose -f docker-compose.prod.yml logs -f

# Test endpoint
curl http://localhost:3000/health
```

### Option B: Gunakan Docker Image dari GHCR

```bash
# Login ke GitHub Container Registry
echo $YOUR_GITHUB_TOKEN | docker login ghcr.io -u your-username --password-stdin

# Pull image
docker pull ghcr.io/ginapuspitaa/cleanreport:latest

# Run container
docker run -d \
  --name cleanreport-api \
  -p 3000:3000 \
  --env-file .env.production \
  ghcr.io/ginapuspitaa/cleanreport:latest

# Check logs
docker logs -f cleanreport-api
```

---

## 🌐 Step 5: Setup Nginx Reverse Proxy

```bash
# Install Nginx
sudo apt install -y nginx

# Copy Nginx config
sudo cp nginx.conf /etc/nginx/sites-available/cleanreport

# Enable site
sudo ln -s /etc/nginx/sites-available/cleanreport /etc/nginx/sites-enabled/

# Test config
sudo nginx -t

# Reload Nginx
sudo systemctl reload nginx

# Start Nginx
sudo systemctl enable nginx
sudo systemctl start nginx
```

### Nginx Config untuk CleanReport

Edit `/etc/nginx/sites-available/cleanreport`:

```nginx
server {
    listen 80;
    server_name your-domain.com;  # Ganti dengan domain Anda

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

---

## 🔒 Step 6: Setup SSL (HTTPS) dengan Let's Encrypt

```bash
# Install Certbot
sudo apt install -y certbot python3-certbot-nginx

# Generate certificate
sudo certbot certonly --nginx -d your-domain.com

# Auto-renew certificates
sudo systemctl enable certbot.timer
sudo systemctl start certbot.timer

# Test renewal
sudo certbot renew --dry-run
```

---

## 📊 Step 7: Monitoring & Maintenance

### Health Check

```bash
# Test aplikasi
curl http://your-domain.com/health

# Check Docker containers
docker ps -a

# View logs
docker-compose -f docker-compose.prod.yml logs -f
```

### Backup Database

```bash
# Backup PostgreSQL
docker exec cleanreport-postgres-prod pg_dump -U your_user cleanreport_prod > backup_$(date +%Y%m%d).sql

# Restore dari backup
docker exec -i cleanreport-postgres-prod psql -U your_user cleanreport_prod < backup_20240418.sql
```

### Update Aplikasi

```bash
# Pull latest code
git pull origin main

# Pull latest Docker image
docker pull ghcr.io/ginapuspitaa/cleanreport:latest

# Restart services
docker-compose -f docker-compose.prod.yml restart
```

---

## 🔧 Step 8: Auto-Deploy dengan GitHub Actions (Optional)

Konfigurasi GitHub Actions agar auto-deploy ke EC2 saat push ke main:

### 1. Generate SSH Key Pair di EC2

```bash
# Di EC2 instance
ssh-keygen -t rsa -b 4096 -f ~/.ssh/github-actions -N ""

# Lihat public key
cat ~/.ssh/github-actions.pub >> ~/.ssh/authorized_keys

# Lihat private key untuk GitHub Secrets
cat ~/.ssh/github-actions
```

### 2. Setup GitHub Secrets

```
Repository Settings → Secrets and variables → Actions
Add Secrets:
- SERVER_HOST: your-instance-public-ip
- SERVER_USER: ubuntu
- SERVER_SSH_KEY: (paste isi file ~/.ssh/github-actions)
```

### 3. Update GitHub Actions Workflow

Edit `.github/workflows/deploy.yml` bagian "Deploy to server":

```yaml
- name: Deploy to server
  if: ${{ github.event.workflow_run.conclusion == 'success' }}
  run: |
    mkdir -p ~/.ssh
    echo "${{ secrets.SERVER_SSH_KEY }}" > ~/.ssh/github-actions
    chmod 600 ~/.ssh/github-actions
    ssh -o StrictHostKeyChecking=no -i ~/.ssh/github-actions ${{ secrets.SERVER_USER }}@${{ secrets.SERVER_HOST }} << 'EOF'
      cd ~/cleanreport
      git pull origin main
      docker pull ghcr.io/ginapuspitaa/cleanreport:latest
      docker-compose -f docker-compose.prod.yml down
      docker-compose -f docker-compose.prod.yml up -d
      docker system prune -f
    EOF
```

---

## 🚨 Troubleshooting

### Port 3000 sudah digunakan

```bash
# Find process using port 3000
sudo lsof -i :3000

# Kill process
sudo kill -9 PID
```

### Docker login failed

```bash
# Pastikan GITHUB_TOKEN sudah benar
# Generate baru dari GitHub Settings → Developer settings → Personal access tokens
# Grant: repo, write:packages, read:packages

echo $GITHUB_TOKEN | docker login ghcr.io -u USERNAME --password-stdin
```

### Database connection failed

```bash
# Check database container
docker logs cleanreport-postgres-prod

# Verify connection string di .env.production
# Format: postgresql://user:password@host:port/database
```

### Nginx tidak redirect ke backend

```bash
# Test Nginx config
sudo nginx -t

# Check Nginx logs
sudo tail -f /var/log/nginx/error.log
sudo tail -f /var/log/nginx/access.log

# Reload Nginx
sudo systemctl reload nginx
```

---

## ✅ Verification Checklist

- [ ] EC2 instance running
- [ ] Security group configured (22, 80, 443, 3000)
- [ ] Docker installed & running
- [ ] CleanReport pulled dari GitHub
- [ ] .env.production dikonfigurasi
- [ ] Docker containers running (`docker ps`)
- [ ] Health check berhasil (`curl /health`)
- [ ] Nginx configured & running
- [ ] Domain pointing ke instance IP
- [ ] SSL certificate installed (opsional)

---

## 🎯 Quick Reference

```bash
# SSH ke instance
ssh -i keypair.pem ubuntu@your-ip

# Update aplikasi
cd cleanreport && git pull origin main

# Restart services
docker-compose -f docker-compose.prod.yml restart

# View logs
docker-compose -f docker-compose.prod.yml logs -f

# Stop services
docker-compose -f docker-compose.prod.yml down

# Check health
curl http://your-domain.com/health
```

---

## 📞 Support

Jika mengalami masalah:

1. Check logs: `docker-compose logs -f`
2. Verify env vars: `docker exec container-name env`
3. Test connectivity: `curl http://localhost:3000`
4. Check GitHub Actions untuk auto-deploy logs

**Repository**: https://github.com/ginapuspitaa/cleanreport