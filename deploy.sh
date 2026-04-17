#!/bin/bash

# CleanReport Production Deployment Script
# Usage: ./deploy.sh [environment] [platform]
# Example: ./deploy.sh production aws
# Example: ./deploy.sh staging docker

set -e

ENVIRONMENT=${1:-production}
PLATFORM=${2:-docker}
PROJECT_NAME="cleanreport"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)

echo "🚀 Starting deployment for $PROJECT_NAME"
echo "📅 Timestamp: $TIMESTAMP"
echo "🌍 Environment: $ENVIRONMENT"
echo "🖥️  Platform: $PLATFORM"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

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

# Check prerequisites
check_prerequisites() {
    log_info "Checking prerequisites..."

    if ! command -v docker &> /dev/null; then
        log_error "Docker is not installed. Please install Docker first."
        exit 1
    fi

    if ! command -v docker-compose &> /dev/null; then
        log_error "Docker Compose is not installed. Please install Docker Compose first."
        exit 1
    fi

    log_success "Prerequisites check passed"
}

# Backup current deployment
backup_current() {
    log_info "Creating backup..."

    if [ -d "backup" ]; then
        rm -rf backup
    fi

    mkdir -p backup
    cp -r docker-compose.yml backup/ 2>/dev/null || true
    cp -r .env* backup/ 2>/dev/null || true

    log_success "Backup created in backup/ directory"
}

# Setup environment
setup_environment() {
    log_info "Setting up environment variables..."

    if [ ! -f ".env.$ENVIRONMENT" ]; then
        if [ -f ".env.prod.example" ]; then
            cp .env.prod.example .env.$ENVIRONMENT
            log_warning "Created .env.$ENVIRONMENT from template. Please configure your environment variables!"
            log_warning "Edit .env.$ENVIRONMENT with your actual values before running deployment again."
            exit 1
        else
            log_error "Environment file .env.$ENVIRONMENT not found!"
            exit 1
        fi
    fi

    log_success "Environment setup completed"
}

# Deploy to Docker
deploy_docker() {
    log_info "Deploying to Docker..."

    # Pull latest images
    docker-compose pull

    # Stop existing containers
    docker-compose down

    # Start new containers
    docker-compose up -d

    # Wait for services to be healthy
    log_info "Waiting for services to be healthy..."
    sleep 30

    # Health check
    if curl -f http://localhost:3000/health &>/dev/null; then
        log_success "Health check passed!"
    else
        log_error "Health check failed!"
        exit 1
    fi

    # Clean up
    docker system prune -f

    log_success "Docker deployment completed"
}

# Deploy to AWS EC2
deploy_aws() {
    log_info "Deploying to AWS EC2..."

    # Check AWS CLI
    if ! command -v aws &> /dev/null; then
        log_error "AWS CLI is not installed. Please install AWS CLI first."
        exit 1
    fi

    # Check AWS credentials
    if [ -z "$AWS_ACCESS_KEY_ID" ] || [ -z "$AWS_SECRET_ACCESS_KEY" ]; then
        log_error "AWS credentials not found. Please configure AWS CLI or set environment variables."
        exit 1
    fi

    # AWS deployment commands would go here
    # This is a template - customize based on your AWS setup

    log_info "AWS deployment commands (customize as needed):"
    echo "1. Update EC2 instance"
    echo "2. Pull latest Docker image"
    echo "3. Run docker-compose"
    echo "4. Update load balancer"
    echo "5. Run health checks"

    log_success "AWS deployment template ready (needs customization)"
}

# Deploy to Kubernetes
deploy_k8s() {
    log_info "Deploying to Kubernetes..."

    # Check kubectl
    if ! command -v kubectl &> /dev/null; then
        log_error "kubectl is not installed. Please install kubectl first."
        exit 1
    fi

    # Apply Kubernetes manifests
    kubectl apply -f k8s/

    # Wait for rollout
    kubectl rollout status deployment/cleanreport-backend

    log_success "Kubernetes deployment completed"
}

# Main deployment logic
main() {
    check_prerequisites
    backup_current
    setup_environment

    case $PLATFORM in
        docker)
            deploy_docker
            ;;
        aws)
            deploy_aws
            ;;
        k8s)
            deploy_k8s
            ;;
        *)
            log_error "Unsupported platform: $PLATFORM"
            log_info "Supported platforms: docker, aws, k8s"
            exit 1
            ;;
    esac

    log_success "🎉 Deployment completed successfully!"
    log_info "📊 Check your application at: http://localhost:3000"
    log_info "🔍 Health check: http://localhost:3000/health"
}

# Run main function
main "$@"