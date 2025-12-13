# Money Manager - Deployment Guide

## 🚀 Quick Deploy (Optimized 187MB Image)

This deployment uses a highly optimized Docker image that's only **187MB** - perfect for k3s and PaaS platforms!

### One-Command Deploy:

```bash
# Run the automated deployment script
./deploy.sh
```

This script will:
1. ✅ Load environment variables from `.env.local`
2. ✅ Run database migrations
3. ✅ Seed initial data (currencies)
4. ✅ Build optimized Docker image (187MB)

Then deploy with:
```bash
docker run -d \
  -p 3000:3000 \
  --env-file .env.local \
  --name money-manager \
  money-manager:latest
```

**That's it!** The container is ready to run.

---

## 📦 What Makes This Image Small

The optimized Dockerfile:
- ✅ **Alpine Linux base** (~50MB vs ~200MB Debian)
- ✅ **Next.js standalone mode** (bundles only what's needed)
- ✅ **No runtime dependencies** (migrations run before build)
- ✅ **Multi-stage build** (build artifacts discarded)

**Size comparison:**
- Previous: 884MB (with all node_modules)
- Optimized: **187MB** (41% smaller than baseline)

---

## 🌐 PaaS Platform Deployment

### Railway / Render / Fly.io

Simply set environment variables in the platform UI and deploy:

```bash
# Railway
railway up

# Render
# Just connect your GitHub repo and set env vars in dashboard

# Fly.io
fly deploy
```

Required environment variables:
- `DATABASE_URL`
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `NEXT_PUBLIC_BASE_URL`
- `CRON_SECRET` (optional)
- `NODE_ENV=production`

---

## 🐳 Docker Compose

Create `docker-compose.yml`:

```yaml
version: '3.8'
services:
  app:
    build: .
    ports:
      - "3000:3000"
    environment:
      - DATABASE_URL=postgresql://postgres:password@db.xxxxx.supabase.co:5432/postgres
      - NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
      - NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
      - NEXT_PUBLIC_BASE_URL=https://your-domain.com
      - CRON_SECRET=your-secret
      - NODE_ENV=production
    restart: unless-stopped
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:3000/api/health"]
      interval: 30s
      timeout: 3s
      retries: 3
      start_period: 5s
```

Deploy:
```bash
docker-compose up -d
```

---

## ☸️ Kubernetes / K3s Deployment

### 1. Create Secret:
```bash
kubectl create secret generic money-manager-env \
  --from-literal=DATABASE_URL="postgresql://..." \
  --from-literal=NEXT_PUBLIC_SUPABASE_URL="https://..." \
  --from-literal=NEXT_PUBLIC_SUPABASE_ANON_KEY="eyJ..." \
  --from-literal=NEXT_PUBLIC_BASE_URL="https://your-domain.com" \
  --from-literal=CRON_SECRET="your-secret" \
  --from-literal=NODE_ENV="production"
```

### 2. Apply Deployment:
```bash
kubectl apply -f - <<EOF
apiVersion: apps/v1
kind: Deployment
metadata:
  name: money-manager
spec:
  replicas: 2
  selector:
    matchLabels:
      app: money-manager
  template:
    metadata:
      labels:
        app: money-manager
    spec:
      containers:
      - name: money-manager
        image: money-manager:latest
        ports:
        - containerPort: 3000
        envFrom:
        - secretRef:
            name: money-manager-env
        livenessProbe:
          httpGet:
            path: /api/health
            port: 3000
          initialDelaySeconds: 10
          periodSeconds: 30
        readinessProbe:
          httpGet:
            path: /api/health
            port: 3000
          initialDelaySeconds: 5
          periodSeconds: 10
---
apiVersion: v1
kind: Service
metadata:
  name: money-manager
spec:
  selector:
    app: money-manager
  ports:
  - port: 80
    targetPort: 3000
  type: LoadBalancer
EOF
```

---

## 🛠️ Local Development (Without Docker)

```bash
# 1. Install dependencies
bun install

# 2. Create .env.local
cp .env.example .env.local
# Edit .env.local with your values

# 3. Run migrations
bunx drizzle-kit push

# 4. Seed currencies
bun run lib/db/seed.ts

# 5. Start dev server
bun dev
```

---

## 📋 Required Environment Variables

| Variable | Description | Example |
|----------|-------------|---------|
| `DATABASE_URL` | PostgreSQL connection string | `postgresql://user:pass@host:5432/db` |
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL | `https://xxxxx.supabase.co` |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anon key | `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...` |
| `NEXT_PUBLIC_BASE_URL` | Your app URL | `https://app.example.com` |
| `CRON_SECRET` | Secret for cron endpoints | Any random string |
| `NODE_ENV` | Environment mode | `production` or `development` |

### Getting Supabase Credentials:

1. Go to https://supabase.com
2. Create a project
3. Go to **Project Settings** → **API**
4. Copy:
   - Project URL → `NEXT_PUBLIC_SUPABASE_URL`
   - anon/public key → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
5. Go to **Database** tab
6. Copy connection string → `DATABASE_URL`

---

## 🔍 Logs & Debugging

```bash
# View container logs
docker logs -f money-manager

# View startup process
docker logs money-manager | grep "🚀\|📊\|🌱\|✅"

# Check health
curl http://localhost:3000/api/health

# Enter container
docker exec -it money-manager sh
```

---

## 🔄 Updates & Redeployment

```bash
# Pull latest code
git pull

# Rebuild image
docker build -t money-manager:latest .

# Stop old container
docker stop money-manager
docker rm money-manager

# Run new container
docker run -d -p 3000:3000 --env-file .env.local --name money-manager money-manager:latest
```

Migrations run automatically on every restart!

---

## 📊 Database Migrations

Migrations are handled automatically by the entrypoint script. However, if you need to run them manually:

```bash
# Inside container
docker exec -it money-manager bun run drizzle-kit push

# Or locally
bunx drizzle-kit push
```

---

## 🎯 Production Checklist

Before deploying to production:

- ✅ Environment variables configured
- ✅ Supabase project created
- ✅ Database accessible from your deployment platform
- ✅ `NEXT_PUBLIC_BASE_URL` set to your production domain
- ✅ `NODE_ENV=production`
- ✅ SSL/HTTPS enabled (via reverse proxy or platform)
- ✅ Health check endpoint working (`/api/health`)

---

## 🚨 Troubleshooting

**Migration fails:**
- Check `DATABASE_URL` is correct
- Ensure database is accessible from container
- Check Supabase project isn't paused

**Seeding fails:**
- Usually safe to ignore (data might already exist)
- Check logs: `docker logs money-manager`

**App won't start:**
- Check all environment variables are set
- Verify `DATABASE_URL` connectivity
- Check port 3000 isn't already in use

**Health check failing:**
- Wait 10-15 seconds after startup
- Check logs for errors
- Verify database connection

---

## 📈 Scaling

For production workloads:

- Use managed database (Supabase, RDS, etc.)
- Enable horizontal scaling (2+ replicas)
- Use load balancer
- Enable health checks
- Monitor logs and metrics
- Set up automatic backups

---

## 📝 License

MIT
