# Money Manager - Complete Setup Guide for Required Credentials

## Goal
Provide a comprehensive guide on all required environment variables and step-by-step instructions on how to obtain them to run the Money Manager application.

## Required Environment Variables

Based on the codebase analysis, the following environment variables are required:

### 1. **DATABASE_URL** (Required)
- **Purpose**: PostgreSQL database connection string
- **Used by**: Drizzle ORM, database queries
- **Format**: `postgresql://username:password@host:port/database_name`
- **Example**: `postgresql://postgres:mypassword@localhost:5432/money_manager`

### 2. **NEXT_PUBLIC_SUPABASE_URL** (Required)
- **Purpose**: Supabase project URL for authentication and real-time features
- **Used by**: Auth, Supabase client (both server and browser)
- **Format**: `https://your-project-id.supabase.co`
- **Example**: `https://abcdefghijklmnop.supabase.co`

### 3. **NEXT_PUBLIC_SUPABASE_ANON_KEY** (Required)
- **Purpose**: Supabase anonymous/public API key for client-side authentication
- **Used by**: Auth, Supabase client (both server and browser)
- **Format**: Long JWT token string
- **Example**: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...`

### 4. **NEXT_PUBLIC_BASE_URL** (Required for Auth)
- **Purpose**: Base URL of your application for authentication redirects
- **Used by**: Email confirmation redirects
- **Format**: Full URL with protocol
- **Development**: `http://localhost:3000`
- **Production**: `https://your-domain.com`

### 5. **CRON_SECRET** (Optional but Recommended)
- **Purpose**: Secret token to protect recurring transaction execution endpoint
- **Used by**: `/api/cron/execute-recurring` endpoint authorization
- **Format**: Random secret string
- **How to generate**: Any random string (min 32 characters recommended)

### 6. **NODE_ENV** (Optional)
- **Purpose**: Environment mode
- **Values**: `development`, `production`, `test`
- **Default**: Automatically set by Next.js

---

## Step-by-Step Setup Guide

### Part 1: Set Up Supabase (Free Tier Available)

#### Step 1.1: Create Supabase Account
1. Go to https://supabase.com
2. Click "Start your project" or "Sign Up"
3. Sign up using:
   - GitHub account (recommended), OR
   - Email and password
4. Verify your email if using email signup

#### Step 1.2: Create a New Project
1. After login, click "New Project"
2. Select your organization (or create a new one)
3. Fill in project details:
   - **Project Name**: `money-manager` (or any name you prefer)
   - **Database Password**: Create a strong password **SAVE THIS!** You'll need it for DATABASE_URL
   - **Region**: Choose closest to your users (e.g., `us-east-1`, `eu-west-1`)
   - **Pricing Plan**: Free (includes 500MB database, 50MB storage, 2GB bandwidth)
4. Click "Create new project"
5. Wait 2-3 minutes for project provisioning

#### Step 1.3: Get Supabase Credentials
Once your project is created:

1. Go to **Project Settings** (gear icon in sidebar)
2. Click **API** tab
3. Copy the following:
   - **Project URL** → This is your `NEXT_PUBLIC_SUPABASE_URL`
     - Example: `https://abcdefghijklmnop.supabase.co`
   - **anon/public key** → This is your `NEXT_PUBLIC_SUPABASE_ANON_KEY`
     - It's a long JWT token starting with `eyJ...`

#### Step 1.4: Get Database Connection String
1. Still in **Project Settings** → **Database** tab
2. Scroll to "Connection string"
3. Select **URI** tab
4. Copy the connection string
5. Replace `[YOUR-PASSWORD]` with the password you created in Step 1.2
6. This is your `DATABASE_URL`
   - Format: `postgresql://postgres:[YOUR-PASSWORD]@db.abcdefghijklmnop.supabase.co:5432/postgres`

#### Step 1.5: Enable Email Authentication (Important!)
1. Go to **Authentication** in sidebar
2. Click **Providers**
3. Find **Email** provider
4. Make sure it's **Enabled**
5. Configure email settings:
   - **Enable Email Confirmations**: Turn ON if you want users to verify email
   - **Secure Email Change**: Recommended to keep ON
   - **Secure Password Change**: Recommended to keep ON

---

### Part 2: Set Up Environment Variables

#### Step 2.1: Create .env.local File
In your project root directory `/Users/bene/Documents/bene/nextjs/money-manager/`:

1. Copy the `.env.example` file:
   ```bash
   cp .env.example .env.local
   ```

2. Or create `.env.local` manually with this content:
   ```env
   # Database Connection (from Supabase Step 1.4)
   DATABASE_URL=postgresql://postgres:YOUR_PASSWORD@db.xxxxxx.supabase.co:5432/postgres

   # Supabase Configuration (from Supabase Step 1.3)
   NEXT_PUBLIC_SUPABASE_URL=https://xxxxxx.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.xxxxx

   # Application URL
   NEXT_PUBLIC_BASE_URL=http://localhost:3000

   # Optional: Cron Secret (generate random string)
   CRON_SECRET=your-random-secret-key-min-32-chars-recommended

   # Node Environment
   NODE_ENV=development
   ```

#### Step 2.2: Fill in Your Actual Values
Replace the placeholder values with your actual credentials from Supabase:

- Replace `YOUR_PASSWORD` with your Supabase database password
- Replace `xxxxxx` in URLs with your actual project ID
- Replace the `ANON_KEY` with your actual anon key

#### Step 2.3: Generate CRON_SECRET (Optional)
You can generate a random secret using:

**On macOS/Linux:**
```bash
openssl rand -base64 32
```

**On Windows (PowerShell):**
```powershell
-join ((65..90) + (97..122) + (48..57) | Get-Random -Count 32 | % {[char]$_})
```

**Or use an online generator:**
- Go to https://randomkeygen.com/
- Copy a "Fort Knox Password" (256-bit key)

---

### Part 3: Initialize Database Schema

#### Step 3.1: Install Dependencies
```bash
bun install
```

#### Step 3.2: Generate Database Migrations
```bash
bunx drizzle-kit generate
```

#### Step 3.3: Push Schema to Database
```bash
bunx drizzle-kit push
```

This will:
- Create all required tables (users, accounts, transactions, categories, budgets, etc.)
- Set up foreign keys and relationships
- Initialize the database structure

#### Step 3.4: (Optional) Seed Default Data
If you want to add default categories and currencies:
```bash
bun run lib/db/seed.ts
```

---

### Part 4: Run the Application

#### Step 4.1: Development Mode
```bash
bun dev
```

The app will be available at http://localhost:3000

#### Step 4.2: Production Build (Local)
```bash
bun run build
bun start
```

#### Step 4.3: Docker Deployment
If deploying to k3s:

1. Update `.env.local` for production:
   ```env
   DATABASE_URL=postgresql://postgres:PASSWORD@your-supabase-host:5432/postgres
   NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
   NEXT_PUBLIC_BASE_URL=https://your-production-domain.com
   CRON_SECRET=your-production-secret
   NODE_ENV=production
   ```

2. Build Docker image:
   ```bash
   docker build -t money-manager:latest .
   ```

3. Run with environment variables:
   ```bash
   docker run -p 3000:3000 --env-file .env.local money-manager:latest
   ```

---

## Summary of Required Steps

### Quick Checklist:
- [ ] Create Supabase account at https://supabase.com
- [ ] Create new Supabase project
- [ ] Copy Project URL → `NEXT_PUBLIC_SUPABASE_URL`
- [ ] Copy anon/public key → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- [ ] Copy database connection string → `DATABASE_URL`
- [ ] Enable Email authentication in Supabase
- [ ] Create `.env.local` file in project root
- [ ] Fill in all environment variables
- [ ] Generate `CRON_SECRET` (optional)
- [ ] Run `bun install`
- [ ] Run `bunx drizzle-kit push` to initialize database
- [ ] Run `bun dev` to start development server

---

## Important Notes

### For Local Development:
- Use `http://localhost:3000` for `NEXT_PUBLIC_BASE_URL`
- Keep `NODE_ENV=development`
- Supabase Free Tier is sufficient

### For Production/k3s Deployment:
- Use your production domain for `NEXT_PUBLIC_BASE_URL`
- Set `NODE_ENV=production`
- Ensure CRON_SECRET is set for security
- Consider Supabase Pro for production (starting at $25/month) for better limits

### Security Considerations:
- **NEVER** commit `.env.local` to git (it's in .gitignore)
- Keep database password secure
- Rotate CRON_SECRET if compromised
- Use environment-specific credentials (different for dev/staging/prod)

### Supabase Free Tier Limits:
- 500 MB database space
- 50,000 monthly active users
- 2 GB bandwidth
- 1 GB file storage
- Unlimited API requests

---

## Troubleshooting

### Issue: "Cannot connect to database"
- Verify DATABASE_URL is correct
- Check Supabase project is active (not paused)
- Ensure password in connection string is correct

### Issue: "Authentication not working"
- Verify NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY
- Check Email provider is enabled in Supabase
- Ensure NEXT_PUBLIC_BASE_URL matches your actual URL

### Issue: "Database tables not found"
- Run `bunx drizzle-kit push` to create tables
- Check Supabase → SQL Editor to verify tables exist

---

## Next Steps After Setup

Once all credentials are configured and the application runs:

1. **Create your first user** by signing up at `/login`
2. **Set up your profile** with currency preferences
3. **Add accounts** (bank, cash, credit cards)
4. **Create categories** for income and expenses
5. **Start tracking transactions**
6. **Set budgets** for spending control
7. **Configure recurring transactions** for subscriptions

The application is now ready to use!
