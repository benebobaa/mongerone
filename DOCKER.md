# Docker Deployment Guide

## Overview

This Money Manager application is optimized for Docker deployment with:
- **Image size**: ~150MB (vs 500-700MB unoptimized)
- **Multi-stage build**: Only includes runtime dependencies
- **Security**: Runs as non-root user
- **Health checks**: Built-in container health monitoring
- **Fast builds**: Optimized layer caching

## Prerequisites

- Docker installed (version 20.10+)
- Docker BuildKit enabled (for better caching)
- Environment variables configured

## Build the Docker Image

### Using BuildKit (Recommended)

```bash
# Build with BuildKit for better performance
DOCKER_BUILDKIT=1 docker build -t money-manager:latest .

# Build with specific version tag
DOCKER_BUILDKIT=1 docker build -t money-manager:v1.0.0 .
```

### Without BuildKit

```bash
docker build -t money-manager:latest .
```

## Run Locally

### Using environment variables

```bash
docker run -p 3000:3000 \
  -e DATABASE_URL="postgresql://user:password@host:5432/dbname" \
  -e NEXT_PUBLIC_SUPABASE_URL="https://your-project.supabase.co" \
  -e NEXT_PUBLIC_SUPABASE_ANON_KEY="your-anon-key" \
  -e NEXT_PUBLIC_BASE_URL="http://localhost:3000" \
  money-manager:latest
```

### Using .env file

```bash
# Create .env file with your variables
docker run -p 3000:3000 --env-file .env.local money-manager:latest
```

### Run in detached mode

```bash
docker run -d \
  --name money-manager \
  -p 3000:3000 \
  --env-file .env.local \
  --restart unless-stopped \
  money-manager:latest
```

## Deploy to k3s

### 1. Tag for your registry

```bash
# Docker Hub
docker tag money-manager:latest your-dockerhub-username/money-manager:latest

# Private registry
docker tag money-manager:latest registry.example.com/money-manager:latest
```

### 2. Push to registry

```bash
# Docker Hub
docker push your-dockerhub-username/money-manager:latest

# Private registry
docker push registry.example.com/money-manager:latest
```

### 3. Deploy to k3s

```bash
# Create deployment
kubectl create deployment money-manager \
  --image=your-registry.com/money-manager:latest \
  --port=3000

# Expose as service
kubectl expose deployment money-manager \
  --type=ClusterIP \
  --port=80 \
  --target-port=3000

# Create ingress (adjust domain as needed)
kubectl create ingress money-manager \
  --rule="money-manager.example.com/*=money-manager:80"
```

## Environment Variables

Required environment variables:

```env
# Database
DATABASE_URL=postgresql://user:password@host:5432/dbname

# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key

# Application
NEXT_PUBLIC_BASE_URL=https://your-domain.com

# Optional: Cron secret for recurring transactions
CRON_SECRET=your-secret-key
```

## Docker Commands Reference

### View logs

```bash
docker logs -f money-manager
```

### Stop container

```bash
docker stop money-manager
```

### Remove container

```bash
docker rm money-manager
```

### Check container health

```bash
docker inspect --format='{{.State.Health.Status}}' money-manager
```

### Execute command in running container

```bash
docker exec -it money-manager sh
```

## Optimization Details

### Image Size

- **Unoptimized**: 500-700MB
- **Optimized (with standalone)**: 150-200MB
- **Size reduction**: ~75-80%

### Build Time

- **First build**: 5-8 minutes
- **Cached (no deps change)**: 1-2 minutes
- **Cached (deps changed)**: 2-4 minutes

### Multi-Stage Build

1. **base**: Bun runtime image
2. **deps**: Install all dependencies
3. **builder**: Build Next.js application
4. **runner**: Minimal production runtime (final image)

### Security Features

- Non-root user (uid 1001)
- Minimal dependencies
- Health checks
- No unnecessary tools in production image

## Troubleshooting

### Build fails

```bash
# Clear Docker build cache
docker builder prune -a

# Rebuild without cache
docker build --no-cache -t money-manager:latest .
```

### Container won't start

```bash
# Check logs
docker logs money-manager

# Check environment variables
docker inspect money-manager | grep -A 20 Env
```

### Health check fails

```bash
# Test health endpoint manually
curl http://localhost:3000/api/health

# Check container health status
docker inspect money-manager | grep -A 10 Health
```

## Production Best Practices

1. **Use specific version tags**: `v1.0.0` instead of `latest`
2. **Set resource limits**: Memory and CPU limits in k3s
3. **Configure logging**: Centralized logging (Loki, CloudWatch, etc.)
4. **Monitor**: Set up Prometheus/Grafana monitoring
5. **Backup database**: Regular PostgreSQL backups
6. **Use secrets management**: Kubernetes Secrets or HashiCorp Vault
7. **Enable HTTPS**: Use cert-manager for SSL/TLS
8. **Set up CI/CD**: Automate builds and deployments

## Next Steps

- Set up k3s ingress with SSL/TLS
- Configure horizontal pod autoscaling
- Set up monitoring and alerting
- Implement database backup strategy
- Configure recurring transaction cron job
