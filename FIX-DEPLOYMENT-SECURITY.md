# Fix Deployment Security Code Issue

## Problem
Deployment is blocked due to GitHub authentication requiring a security code/token.

## Solution: Use Personal Access Token (PAT)

### Step 1: Create GitHub Personal Access Token

1. **Go to GitHub Settings:**
   - Visit: https://github.com/settings/tokens
   - Or: GitHub → Your Profile → Settings → Developer settings → Personal access tokens → Tokens (classic)

2. **Generate New Token:**
   - Click "Generate new token" → "Generate new token (classic)"
   - Give it a name: `enqir-deployment`
   - Set expiration: `90 days` (or `No expiration` if preferred)
   - Select scopes:
     - ✅ **repo** (Full control of private repositories)
     - ✅ **workflow** (if using GitHub Actions)
   - Click "Generate token"
   - **COPY THE TOKEN IMMEDIATELY** (you won't see it again!)

### Step 2: Push Using Token

**Option A: Use Token as Password**
```bash
cd "/Users/nivedsunil/Desktop/enqir 1 copy 9 untested copy 4"
git add -A
git commit -m "Update: EnquiryResponsesPage - sort order, thin borders, Seller text"
git push origin main
# When prompted:
# Username: YOUR_GITHUB_USERNAME
# Password: PASTE_YOUR_TOKEN_HERE (not your GitHub password!)
```

**Option B: Store Token in Git Credential Helper**
```bash
# Configure Git to store credentials
git config --global credential.helper osxkeychain

# Push (will prompt once, then remember)
git push origin main
# Username: YOUR_GITHUB_USERNAME
# Password: PASTE_YOUR_TOKEN_HERE
```

**Option C: Use Token in Remote URL (Less Secure)**
```bash
# Replace YOUR_TOKEN and YOUR_USERNAME
git remote set-url origin https://YOUR_TOKEN@github.com/bisond98/enqir.git
git push origin main
```

### Step 3: Verify Push

```bash
git log origin/main..HEAD --oneline
# Should show no commits (everything pushed)
```

### Step 4: Check Vercel Deployment

1. Go to: https://vercel.com/dashboard
2. Find your "enqir" project
3. Check deployment status
4. Should auto-deploy within 1-2 minutes after push

## Alternative: Use SSH Instead of HTTPS

If you prefer SSH:

1. **Generate SSH Key** (if you don't have one):
```bash
ssh-keygen -t ed25519 -C "your_email@example.com"
# Press Enter to accept default location
# Set a passphrase (optional)
```

2. **Add SSH Key to GitHub:**
   - Copy your public key:
   ```bash
   cat ~/.ssh/id_ed25519.pub
   ```
   - Go to: https://github.com/settings/keys
   - Click "New SSH key"
   - Paste the key and save

3. **Change Remote to SSH:**
```bash
git remote set-url origin git@github.com:bisond98/enqir.git
git push origin main
```

## Troubleshooting

### If Token Still Doesn't Work:
1. Make sure token has `repo` scope
2. Check token hasn't expired
3. Try regenerating token

### If Branch Protection Blocks Push:
1. Go to: https://github.com/bisond98/enqir/settings/branches
2. Check if `main` branch has protection rules
3. Either:
   - Temporarily disable protection
   - Push to a feature branch and create PR
   - Add yourself as an admin to bypass

### If Vercel Not Auto-Deploying:
1. Check Vercel dashboard → Project → Settings → Git
2. Verify GitHub connection is active
3. Check deployment logs for errors
4. Manually trigger deployment if needed

## Quick Command Summary

```bash
# 1. Stage all changes
git add -A

# 2. Commit
git commit -m "Update: EnquiryResponsesPage updates"

# 3. Push (will prompt for username/token)
git push origin main

# 4. Check status
git status
```

## Security Note

- Never commit tokens to git
- Use environment variables for sensitive data
- Rotate tokens periodically
- Use SSH keys for better security




