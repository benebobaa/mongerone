# Stage 1: Base image with Bun Alpine (smaller base)
FROM oven/bun:1-alpine AS base

# Stage 2: Install dependencies
FROM base AS deps
WORKDIR /app

# Copy package files
COPY package.json bun.lock ./

# Install all dependencies (needed for build)
RUN bun install --frozen-lockfile

# Stage 3: Build the application
FROM base AS builder
WORKDIR /app

# Copy dependencies from deps stage
COPY --from=deps /app/node_modules ./node_modules

# Copy application source
COPY . .

# Set environment variables for build
ENV NEXT_TELEMETRY_DISABLED=1
ENV NODE_ENV=production

# Build Next.js application (standalone output includes all runtime deps)
RUN bun run build

# Stage 4: Production runtime (Alpine for smallest size)
FROM oven/bun:1-alpine AS runner
WORKDIR /app

# Set production environment
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

# Create non-root user for security (Alpine uses addgroup/adduser)
RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 --ingroup nodejs nextjs

# Copy public assets
COPY --from=builder /app/public ./public

# Create .next directory with correct permissions
RUN mkdir .next && chown nextjs:nodejs .next

# Copy standalone build output (already includes all runtime dependencies)
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

# Copy ONLY the generated SQL migrations (lightweight! ~10KB instead of 800MB)
COPY --from=builder --chown=nextjs:nodejs /app/drizzle ./drizzle

# Copy the migration and seed scripts
COPY --from=builder --chown=nextjs:nodejs /app/scripts/migrate.ts ./scripts/migrate.ts
COPY --from=builder --chown=nextjs:nodejs /app/scripts/seed.ts ./scripts/seed.ts

# Copy production runtime dependencies for migrations (drizzle-orm + postgres only)
# These are already in standalone's node_modules, but we need them accessible
COPY --from=builder --chown=nextjs:nodejs /app/node_modules/drizzle-orm ./node_modules/drizzle-orm
COPY --from=builder --chown=nextjs:nodejs /app/node_modules/postgres ./node_modules/postgres

# Switch to non-root user
USER nextjs

# Expose application port
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD bun --eval "fetch('http://localhost:3000/api/health').then(r => r.ok ? process.exit(0) : process.exit(1)).catch(() => process.exit(1))"

# Start the application (migrations should be run via pre-deploy command or init container)
# For simple setups, you can use: CMD ["sh", "-c", "bun scripts/migrate.ts && bun server.js"]
CMD ["bun", "server.js"]
