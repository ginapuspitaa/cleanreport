# 🗑️ CleanReport - Sistem Pelaporan Sampah Berbasis Masyarakat

Aplikasi web berbasis cloud untuk pelaporan sampah secara real-time dengan integrasi AWS.

## 📋 Daftar Isi

- [Fitur Utama](#fitur-utama)
- [Tech Stack](#tech-stack)
- [Prasyarat](#prasyarat)
- [Instalasi Lokal](#instalasi-lokal)
- [Konfigurasi AWS](#konfigurasi-aws)
- [Docker & Docker Compose](#docker--docker-compose)
- [Deployment ke AWS EC2](#deployment-ke-aws-ec2)
- [REST API Endpoints](#rest-api-endpoints)
- [Troubleshooting](#troubleshooting)

## 🎯 Fitur Utama

- ✅ **Buat Laporan**: User dapat membuat laporan sampah dengan deskripsi, lokasi, dan gambar
- ✅ **Upload Gambar**: Integrasi AWS S3 untuk penyimpanan gambar teraman
- ✅ **Daftar Laporan**: Menampilkan semua laporan dari database RDS
- ✅ **Filter Status**: Filter laporan berdasarkan status (pending, diproses, selesai)
- ✅ **Admin Dashboard**: Kelola dan ubah status laporan
- ✅ **REST API**: Full RESTful API dengan dokumentasi lengkap
- ✅ **Responsive Design**: Aplikasi responsif untuk desktop dan mobile
- ✅ **Docker Ready**: Siap untuk containerisasi dan deployment

## 🛠️ Tech Stack

**Backend:**

- Node.js 18+ dengan Express.js
- Multer untuk file upload
- AWS SDK untuk integrasi S3 dan RDS
- PostgreSQL/MySQL di AWS RDS

**Frontend:**

- HTML5, CSS3, Vanilla JavaScript
- Responsive design dengan CSS Grid & Flexbox
- No dependencies - Pure JavaScript

**Infrastructure:**

- Docker & Docker Compose
- AWS EC2 untuk compute
- AWS S3 untuk file storage
- AWS RDS untuk database
- AWS Security Groups untuk networking

## 📦 Prasyarat

### Local Development

- Node.js 18+ dan npm
- Docker dan Docker Compose
- Git
- PostgreSQL/MySQL (jika tidak menggunakan Docker)

### AWS Setup

- AWS Account
- AWS IAM User dengan permissions untuk S3, RDS, dan EC2
- AWS Access Key ID dan Secret Access Key

## 🚀 Instalasi Lokal

### 1. Clone/Download Project

```bash
cd cleanreport
```

### 2. Setup Backend

```bash
cd backend

# Copy file environment
cp .env.example .env

# Edit .env dengan konfigurasi lokal Anda
# nano .env
```

**File .env untuk lokal:**

```env
PORT=3000
NODE_ENV=development
DB_HOST=localhost
DB_PORT=5432
DB_USER=postgres
DB_PASSWORD=postgres_password
DB_NAME=cleanreport
DB_DIALECT=postgres
AWS_REGION=ap-southeast-1
AWS_ACCESS_KEY_ID=your_access_key
AWS_SECRET_ACCESS_KEY=your_secret_key
AWS_S3_BUCKET=your-bucket-name
AWS_S3_REGION=ap-southeast-1
```

### 3. Install Dependencies

```bash
npm install
```

### 4. Run Server Lokal

```bash
# Development mode dengan auto-reload
npm run dev

# Atau production mode
npm start
```

Server akan berjalan di `http://localhost:3000`

## 🐳 Docker & Docker Compose

### Quick Start dengan Docker Compose

```bash
# Build dan start semua services
docker-compose up -d

# Check status
docker-compose ps

# View logs
docker-compose logs -f backend
docker-compose logs -f postgres

# Stop services
docker-compose down
```

**Services yang berjalan:**

- Backend API: `http://localhost:3000`
- PostgreSQL: `localhost:5432`

### Build Docker Image Sendiri

```bash
cd backend

# Build image
docker build -t cleanreport-api:latest .

# Run container
docker run -p 3000:3000 \
  -e DB_HOST=host.docker.internal \
  -e DB_PORT=5432 \
  -e DB_USER=postgres \
  -e DB_PASSWORD=postgres_password \
  -e DB_NAME=cleanreport \
  -e AWS_ACCESS_KEY_ID=your_key \
  -e AWS_SECRET_ACCESS_KEY=your_secret \
  -e AWS_S3_BUCKET=your-bucket \
  cleanreport-api:latest
```

## ☁️ Konfigurasi AWS

### 1. Setup S3 Bucket

```bash
# Create bucket dengan AWS CLI
aws s3api create-bucket \
  --bucket cleanreport-bucket \
  --region ap-southeast-1 \
  --create-bucket-configuration LocationConstraint=ap-southeast-1

# Enable public read untuk images
aws s3api put-bucket-acl \
  --bucket cleanreport-bucket \
  --acl public-read
```

### 2. Setup RDS Database

**Via AWS Management Console:**

1. Buka RDS Dashboard
2. Create Database → PostgreSQL
3. Database Name: `cleanreport`
4. Username: `postgres`
5. Password: `your-secure-password`
6. Instance type: `db.t3.micro` (free tier)
7. Storage: `20GB`
8. Enable public accessibility: Yes
9. Backup retention: 7 days
10. Create database

**Get RDS Endpoint:**

```bash
aws rds describe-db-instances \
  --query 'DBInstances[0].Endpoint.Address' \
  --output text
```

### 3. Setup Security Groups

**EC2 Security Group Rules:**

```
Inbound Rules:
- Port 22 (SSH) from your IP
- Port 3000 (HTTP) from 0.0.0.0/0 (atau specific IPs)
- Port 80 (HTTP) from 0.0.0.0/0
- Port 443 (HTTPS) from 0.0.0.0/0

Outbound Rules:
- All traffic to 0.0.0.0/0
```

**RDS Security Group Rules:**

```
Inbound Rules:
- Port 5432 (PostgreSQL) from EC2 security group
```

## 🚀 Deployment ke AWS EC2

### 1. Launch EC2 Instance

```bash
# Launch instance (Amazon Linux 2 atau Ubuntu 20.04)
aws ec2 run-instances \
  --image-id ami-0c55b159cbfafe1f0 \
  --instance-type t2.micro \
  --key-name your-key-pair \
  --security-group-ids sg-xxxxxx \
  --subnet-id subnet-xxxxx
```

### 2. Connect ke Instance

```bash
ssh -i your-key.pem ec2-user@your-ec2-ip
# atau untuk Ubuntu:
ssh -i your-key.pem ubuntu@your-ec2-ip
```

### 3. Install Prerequisites

**Untuk Amazon Linux 2:**

```bash
sudo yum update -y
sudo yum install -y git docker

# Start Docker
sudo systemctl start docker
sudo systemctl enable docker
sudo usermod -aG docker $USER
newgrp docker
```

**Untuk Ubuntu 20.04:**

```bash
sudo apt update
sudo apt install -y git curl apt-transport-https ca-certificates curl software-properties-common

# Install Docker
curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo apt-key add -
sudo add-apt-repository "deb [arch=amd64] https://download.docker.com/linux/ubuntu focal stable"
sudo apt install -y docker-ce docker-ce-cli containerd.io
sudo usermod -aG docker $USER
newgrp docker

# Install Docker Compose
sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose
```

### 4. Clone Project

```bash
git clone https://github.com/your-repo/cleanreport.git
cd cleanreport
```

### 5. Setup Environment Variables

```bash
cd backend

# Create .env file
cat > .env << EOF
PORT=3000
NODE_ENV=production
DB_HOST=your-rds-endpoint.amazonaws.com
DB_PORT=5432
DB_USER=postgres
DB_PASSWORD=your-rds-password
DB_NAME=cleanreport
DB_DIALECT=postgres
AWS_REGION=ap-southeast-1
AWS_ACCESS_KEY_ID=your-aws-access-key
AWS_SECRET_ACCESS_KEY=your-aws-secret-key
AWS_S3_BUCKET=cleanreport-bucket
AWS_S3_REGION=ap-southeast-1
API_URL=http://your-ec2-ip:3000
FRONTEND_URL=http://your-ec2-ip
EOF
```

### 6. Run dengan Docker Compose

```bash
cd ..  # Back to root directory

# Update docker-compose.yml untuk production
# Remove postgres service dari docker-compose.yml atau gunakan external RDS

# Build dan start
docker-compose up -d

# Check status
docker-compose ps

# View logs
docker-compose logs -f backend
```

### 7. Setup Reverse Proxy dengan Nginx (Optional)

```bash
sudo yum install -y nginx
# atau untuk Ubuntu:
sudo apt install -y nginx
```

**Create nginx config:**

```bash
sudo cat > /etc/nginx/conf.d/cleanreport.conf << 'EOF'
upstream cleanreport_api {
    server 127.0.0.1:3000;
}

server {
    listen 80;
    server_name your-domain.com;

    location / {
        proxy_pass http://cleanreport_api;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
EOF

# Start nginx
sudo systemctl start nginx
sudo systemctl enable nginx
```

### 8. Access Aplikasi

```
Frontend: http://your-ec2-public-ip
Backend API: http://your-ec2-public-ip:3000
Health Check: http://your-ec2-public-ip:3000/health
```

## 📡 REST API Endpoints

### Base URL

```
http://your-ec2-ip:3000/api
```

### 1. Create Report (POST)

```bash
POST /api/report

Content-Type: multipart/form-data

Body:
{
  "title": "Tumpukan Sampah di Taman",
  "description": "Ditemukan tumpukan sampah plastik yang menggunung",
  "location": "Taman Bundaran HI, Jakarta",
  "latitude": "-6.195435",
  "longitude": "106.820675",
  "image": <file>
}

Response:
{
  "success": true,
  "message": "Report created successfully",
  "data": {
    "id": "uuid-xxxx",
    "title": "...",
    "description": "...",
    "location": "...",
    "latitude": "-6.195435",
    "longitude": "106.820675",
    "image_url": "https://s3.amazonaws.com/...",
    "status": "pending",
    "created_at": "2024-04-17T10:00:00Z",
    "updated_at": "2024-04-17T10:00:00Z"
  }
}
```

### 2. Get All Reports (GET)

```bash
GET /api/reports?status=pending

Query Parameters:
- status: pending | diproses | selesai (optional)

Response:
{
  "success": true,
  "message": "Reports retrieved successfully",
  "count": 5,
  "data": [
    {
      "id": "uuid-xxxx",
      "title": "...",
      ...
    }
  ]
}
```

### 3. Get Report by ID (GET)

```bash
GET /api/report/:id

Response:
{
  "success": true,
  "message": "Report retrieved successfully",
  "data": {
    "id": "uuid-xxxx",
    ...
  }
}
```

### 4. Update Report Status (PUT)

```bash
PUT /api/report/:id

Content-Type: application/json

Body:
{
  "status": "diproses"
}

Valid statuses: pending | diproses | selesai

Response:
{
  "success": true,
  "message": "Report status updated successfully",
  "data": {
    "id": "uuid-xxxx",
    "status": "diproses",
    ...
  }
}
```

### 5. Delete Report (DELETE)

```bash
DELETE /api/report/:id

Response:
{
  "success": true,
  "message": "Report deleted successfully"
}
```

### 6. Health Check (GET)

```bash
GET /health

Response:
{
  "status": "OK",
  "message": "CleanReport API is running",
  "timestamp": "2024-04-17T10:00:00Z"
}
```

## 🧪 Testing API dengan cURL

```bash
# 1. Health Check
curl http://localhost:3000/health

# 2. Get All Reports
curl http://localhost:3000/api/reports

# 3. Create Report
curl -X POST http://localhost:3000/api/report \
  -F "title=Sampah di Jalan Raya" \
  -F "description=Banyak sampah di tepi jalan" \
  -F "location=Jalan Sudirman, Jakarta" \
  -F "latitude=-6.195435" \
  -F "longitude=106.820675" \
  -F "image=@/path/to/image.jpg"

# 4. Get Specific Report
curl http://localhost:3000/api/report/report-id-here

# 5. Update Status
curl -X PUT http://localhost:3000/api/report/report-id-here \
  -H "Content-Type: application/json" \
  -d '{"status": "diproses"}'

# 6. Delete Report
curl -X DELETE http://localhost:3000/api/report/report-id-here
```

## 📁 Project Structure

```
cleanreport/
├── backend/
│   ├── src/
│   │   ├── config/
│   │   │   ├── database.js        # Database connection
│   │   │   └── aws.js             # AWS S3 configuration
│   │   ├── controllers/
│   │   │   └── reportController.js # Report logic
│   │   ├── models/
│   │   │   └── Report.js          # Report model
│   │   ├── routes/
│   │   │   └── reports.js         # API routes
│   │   └── server.js              # Express app setup
│   ├── package.json
│   ├── .env.example
│   ├── .dockerignore
│   └── Dockerfile
├── frontend/
│   ├── index.html
│   ├── css/
│   │   └── style.css
│   └── js/
│       └── app.js
├── docker-compose.yml
└── README.md
```

## 🔒 Security Best Practices

1. **Environment Variables**: Jangan commit `.env` file
2. **AWS Credentials**: Gunakan IAM roles di EC2 daripada access keys
3. **Database Password**: Gunakan password yang kuat
4. **S3 Bucket**: Restrict public access ke sensitive files
5. **CORS**: Konfigurasi CORS dengan proper domain
6. **HTTPS**: Setup SSL certificate dengan Let's Encrypt
7. **Rate Limiting**: Implementasikan rate limiting untuk API

## 🛠️ Maintenance

### Backup Database

```bash
# Backup RDS manual
aws rds create-db-snapshot \
  --db-instance-identifier cleanreport-db \
  --db-snapshot-identifier cleanreport-backup-$(date +%Y%m%d)
```

### Monitor Logs

```bash
# EC2 logs
docker-compose logs -f backend

# Check container health
docker ps --format "table {{.ID}}\t{{.Names}}\t{{.Status}}"
```

### Update Application

```bash
# Pull latest changes
git pull origin main

# Rebuild dan restart
docker-compose down
docker-compose build
docker-compose up -d
```

## 🐛 Troubleshooting

### Backend tidak connect ke RDS

```bash
# Check security groups
aws ec2 describe-security-groups --group-ids sg-xxxxx

# Test database connection
psql -h your-rds-endpoint -U postgres -d cleanreport

# Check environment variables
docker-compose config
```

### S3 upload error

```bash
# Verify S3 bucket exists
aws s3 ls s3://cleanreport-bucket/

# Check IAM permissions
aws iam get-user-policy --user-name your-user --policy-name AmazonS3FullAccess
```

### Port already in use

```bash
# Find process using port 3000
lsof -i :3000
# atau Windows:
netstat -ano | findstr :3000

# Kill process
kill -9 <PID>
```

### Docker container exit immediately

```bash
# Check logs
docker-compose logs backend

# Rebuild
docker-compose build --no-cache
docker-compose up -d
```

## 📊 Environment Variables Checklist

Sebelum deployment, pastikan semua variable sudah di-set:

- [ ] `PORT` - Default: 3000
- [ ] `NODE_ENV` - production/development
- [ ] `DB_HOST` - RDS endpoint
- [ ] `DB_PORT` - Database port
- [ ] `DB_USER` - Database username
- [ ] `DB_PASSWORD` - Database password
- [ ] `DB_NAME` - Database name
- [ ] `DB_DIALECT` - postgres atau mysql
- [ ] `AWS_REGION` - AWS region
- [ ] `AWS_ACCESS_KEY_ID` - AWS access key
- [ ] `AWS_SECRET_ACCESS_KEY` - AWS secret key
- [ ] `AWS_S3_BUCKET` - S3 bucket name
- [ ] `AWS_S3_REGION` - S3 region

## 💡 Tips & Tricks

### Development

```bash
# Watch mode
npm run dev

# Test API
npm install -g rest-client
# Gunakan extension REST Client di VS Code
```

### Production

```bash
# Monitor metrics
docker stats

# Database maintenance
docker-compose exec postgres psql -U postgres -d cleanreport
```

## 📞 Support & Contact

Untuk pertanyaan atau bantuan:

- Create issue di repository
- Email: support@cleanreport.id

## 📝 License

MIT License - Bebas digunakan untuk personal dan commercial

---

**Last Updated**: April 2024
**Version**: 1.0.0
**Status**: Production Ready ✅
