# 🚀 Fresh Setup Guide - GitHub + Vercel

Complete guide to set up your project from scratch with NEW GitHub and Vercel accounts.

---

## 📋 Prerequisites

✅ You have:
- Project folder ready
- New GitHub account created
- New Vercel account created (or will create)

---

## STEP 1: Create New GitHub Repository

1. Go to https://github.com/new
2. Sign in with your **NEW GitHub account**
3. Create a new repository:
   - **Repository name**: `enqir` (or any name you like)
   - **Description**: (optional)
   - **Visibility**: Public or Private (your choice)
   - ⚠️ **DO NOT** check "Initialize with README"
   - Click **"Create repository"**

4. **Copy the repository URL** - you'll need it (looks like: `https://github.com/YOUR_USERNAME/enqir.git`)

---

## STEP 2: Initialize Git in Your Project

Open terminal in your project folder and run:

```bash
cd "/Users/nivedsunil/Desktop/enqir 1 copy 9 untested copy 4"

# Initialize git (if not already done)
git init

# Add all files
git add .

# Make first commit
git commit -m "Initial commit - production ready"

# Add your NEW GitHub repository
git remote add origin https://github.com/YOUR_USERNAME/enqir.git
# ⚠️ Replace YOUR_USERNAME with your actual GitHub username

# Push to GitHub
git branch -M main
git push -u origin main
```

**Note**: When pushing, GitHub will ask for authentication. Choose one:
- **Option A**: Use GitHub CLI (recommended)
- **Option B**: Use Personal Access Token (see below)

---

## STEP 3: GitHub Authentication

### Option A: GitHub CLI (Easiest)

```bash
# Install GitHub CLI (if not installed)
brew install gh

# Login to GitHub
gh auth login

# Follow prompts:
# - GitHub.com
# - HTTPS
# - Authenticate Git with your GitHub credentials
# - Login with web browser
```

### Option B: Personal Access Token

1. Go to: https://github.com/settings/tokens
2. Click **"Generate new token (classic)"**
3. Name it: `Vercel Deployment`
4. Check **"repo"** scope
5. Click **"Generate token"**
6. **Copy the token** (you'll only see it once!)
7. When pushing, use token as password:
   ```bash
   git push -u origin main
   # Username: YOUR_GITHUB_USERNAME
   # Password: YOUR_TOKEN (paste the token)
   ```

---

## STEP 4: Deploy to Vercel

### Create Vercel Account

1. Go to https://vercel.com/signup
2. Sign up with your email (or GitHub - connect your NEW GitHub account)
3. Complete verification

### Deploy Your Project

1. Go to https://vercel.com/dashboard
2. Click **"Add New"** → **"Project"**
3. Click **"Import Git Repository"**
4. Find your repository: `YOUR_USERNAME/enqir`
5. Click **"Import"**
6. Vercel will auto-detect settings:
   - **Framework Preset**: Vite
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
   - **Install Command**: `npm install`
7. Click **"Deploy"**
8. Wait 1-2 minutes for deployment

---

## STEP 5: Connect Your Domain

1. In Vercel dashboard, go to your project
2. Click **"Settings"** → **"Domains"**
3. Enter your domain name
4. Follow DNS configuration instructions
5. Wait 5-10 minutes for DNS propagation

---

## STEP 6: Update Firebase Settings

1. Go to Firebase Console: https://console.firebase.google.com
2. Select your project
3. Go to **Authentication** → **Settings** → **Authorized domains**
4. Click **"Add domain"**
5. Add your Vercel domain (e.g., `yourdomain.com`)
6. Save

---

## ✅ Verification Checklist

- [ ] GitHub repository created
- [ ] Code pushed to GitHub
- [ ] Vercel account created
- [ ] Project deployed on Vercel
- [ ] Domain connected (if you have one)
- [ ] Firebase domain added
- [ ] Site is live and working

---

## 🔄 Future Updates

To update your site after making changes:

```bash
# Make your changes in the code
git add .
git commit -m "Description of changes"
git push origin main

# Vercel will automatically deploy in 1-2 minutes!
```

---

## 📞 Need Help?

- **GitHub Issues**: Check https://github.com/settings/tokens
- **Vercel Docs**: https://vercel.com/docs
- **Build Errors**: Check Vercel deployment logs

---

## 🎉 You're Done!

Your site will be live at:
- Vercel URL: `your-project.vercel.app`
- Your domain: `yourdomain.com` (if connected)

