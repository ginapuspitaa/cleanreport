#!/bin/bash

# CleanReport EC2 Deployment Script
# Usage: ./deploy-ec2.sh <ec2-instance-ip> <ssh-keypair-path>
# Example: ./deploy-ec2.sh 54.123.45.67 ~/cleanreport.pem

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
INSTANCE_IP=${1:-}
SSH_KEY=${2:-}
SSH_USER="ubuntu"
APP_DIR="/home/ubuntu/cleanreport"
GITHUB_REPO="https://github.com/ginapuspitaa/cleanreport.git"

# Validate inputs
if [ -z "$INSTANCE_IP" ] || [ -z "$SSH_KEY" ]; then
    echo -e "${RED}[ERROR]${NC} Usage: $0 <ec2-instance-ip> <ssh-keypair-path>"
    echo -e "${YELLOW}Example:${NC} $0 54.123.45.67 ~/cleanreport.pem"
    exit 1
fi

if [ ! -f "$SSH_KEY" ]; then
    echo -e "${RED}[ERROR]${NC} SSH keypair not found: $SSH_KEY"
    exit 1
fi

# Set SSH key permissions
chmod 400 "$SSH_KEY"

log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Step 1: Test SSH Connection
log_info "Testing SSH connection to $INSTANCE_IP..."
if ssh -i "$SSH_KEY" -o ConnectTimeout=5 "$SSH_USER@$INSTANCE_IP" "echo 'SSH connection successful'" > /dev/null 2>&1; then
    log_success "SSH connection successful"
else
    log_error "Cannot connect to $INSTANCE_IP via SSH"
    exit 1
fi

# Step 2: Setup Server Environment
log_info "Setting up server environment..."
ssh -i "$SSH_KEY" "$SSH_USER@$INSTANCE_IP" << 'SETUP_EOF'
set -e

echo "Installing system packages..."
sudo apt update
sudo apt upgrade -y
sudo apt install -y docker.io docker-compose git curl nginx certbot python3-certbot-nginx

echo "Adding user to docker group..."
sudo usermod -aG docker ubuntu
newgrp docker

echo "Starting Docker service..."
sudo systemctl enable docker
sudo systemctl start docker

echo "Server setup completed"
SETUP_EOF
log_success "Server environment setup completed"

# Step 3: Clone Repository
log_info "Cloning CleanReport repository..."
ssh -i "$SSH_KEY" "$SSH_USER@$INSTANCE_IP" << CLONE_EOF
set -e

if [ -d "$APP_DIR" ]; then
    log_warning "Repository already exists, updating..."
    cd "$APP_DIR"
    git pull origin main
else
    echo "Cloning repository..."
    git clone "$GITHUB_REPO" "$APP_DIR"
fi

echo "Repository setup completed"
CLONE_EOF
log_success "Repository cloned/updated"

# Step 4: Setup Environment Variables
log_info "Setting up environment variables..."
echo -e "${YELLOW}Configure your environment variables:${NC}"
echo "SSH to instance: ssh -i $SSH_KEY $SSH_USER@$INSTANCE_IP"
echo "Then: nano $APP_DIR/.env.production"
echo ""
read -p "Press Enter after configuring environment variables... "

# Step 5: Deploy Docker Containers
log_info "Deploying Docker containers..."
ssh -i "$SSH_KEY" "$SSH_USER@$INSTANCE_IP" << DEPLOY_EOF
set -e

cd "$APP_DIR"

echo "Pulling latest Docker image..."
docker pull ghcr.io/ginapuspitaa/cleanreport:latest

echo "Starting docker-compose services..."
docker-compose -f docker-compose.prod.yml up -d

echo "Waiting for services to be ready..."
sleep 10

echo "Docker containers deployed"
DEPLOY_EOF
log_success "Docker containers deployed"

# Step 6: Setup Nginx
log_info "Setting up Nginx reverse proxy..."
ssh -i "$SSH_KEY" "$SSH_USER@$INSTANCE_IP" << NGINX_EOF
set -e

DOMAIN="${3:-localhost}"

echo "Backing up nginx config..."
sudo cp /etc/nginx/nginx.conf /etc/nginx/nginx.conf.backup

echo "Configuring nginx..."
sudo cp "$APP_DIR/nginx.conf" /etc/nginx/sites-available/cleanreport
sudo ln -sf /etc/nginx/sites-available/cleanreport /etc/nginx/sites-enabled/cleanreport

echo "Testing nginx configuration..."
sudo nginx -t

echo "Restarting nginx..."
sudo systemctl restart nginx

echo "Nginx configuration completed"
NGINX_EOF
log_success "Nginx reverse proxy configured"

# Step 7: Verify Deployment
log_info "Verifying deployment..."
ssh -i "$SSH_KEY" "$SSH_USER@$INSTANCE_IP" << VERIFY_EOF
set -e

echo "Checking Docker containers..."
docker-compose -f "$APP_DIR/docker-compose.prod.yml" ps

echo "Testing health endpoint..."
if curl -f http://localhost:3000/health > /dev/null 2>&1; then
    echo "Health check passed!"
else
    echo "Warning: Health check failed (might be starting up)"
fi

echo "Deployment verification completed"
VERIFY_EOF
log_success "Deployment verified"

# Summary
log_success "🎉 CleanReport deployment to EC2 completed!"
echo ""
echo -e "${BLUE}=== Deployment Summary ===${NC}"
echo "Instance IP: $INSTANCE_IP"
echo "SSH Command: ssh -i $SSH_KEY $SSH_USER@$INSTANCE_IP"
echo "App Directory: $APP_DIR"
echo ""
echo -e "${BLUE}=== Next Steps ===${NC}"
echo "1. Configure your domain to point to $INSTANCE_IP"
echo "2. Setup SSL certificate: certbot certonly --nginx -d your-domain.com"
echo "3. Test application: curl http://$INSTANCE_IP/health"
echo ""
echo -e "${BLUE}=== Useful Commands ===${NC}"
echo "View logs: ssh -i $SSH_KEY $SSH_USER@$INSTANCE_IP 'docker-compose -f $APP_DIR/docker-compose.prod.yml logs -f'"
echo "Restart services: ssh -i $SSH_KEY $SSH_USER@$INSTANCE_IP 'docker-compose -f $APP_DIR/docker-compose.prod.yml restart'"
echo "Update app: ssh -i $SSH_KEY $SSH_USER@$INSTANCE_IP 'cd $APP_DIR && git pull origin main && docker pull ghcr.io/ginapuspitaa/cleanreport:latest && docker-compose -f docker-compose.prod.yml up -d'"
echo ""