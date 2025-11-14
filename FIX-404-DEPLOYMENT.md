# Fix 404 Error on enqir.in

## Quick Fix Steps

### Option 1: Deploy via Vercel Dashboard (Easiest)

1. **Go to Vercel Dashboard:**
   - Visit: https://vercel.com/dashboard
   - Sign in with your account

2. **Check Your Project:**
   - Look for your "enqir" project
   - Check if it's deployed or shows errors

3. **If Project Doesn't Exist:**
   - Click "Add New" → "Project"
   - Import from GitHub (if connected)
   - OR upload the project folder

4. **If Project Exists but Shows 404:**
   - Go to project settings
   - Check "Domains" section
   - Verify `enqir.in` is connected
   - Check deployment logs for errors

### Option 2: Deploy via CLI

```bash
# Install Vercel CLI (if needed)
npm install -g vercel

# Login
vercel login

# Deploy
vercel --prod
```

### Option 3: Push to GitHub (Auto-Deploy)

If your repo is connected to Vercel:

```bash
git add .
git commit -m "Fix deployment"
git push origin main
```

Vercel will auto-deploy in 1-2 minutes.

---

## Common Issues & Fixes

### Issue 1: Domain Not Connected
**Fix:**
1. Go to Vercel Dashboard → Your Project → Settings → Domains
2. Add `enqir.in` and `www.enqir.in`
3. Update DNS records if needed

### Issue 2: Build Failed
**Fix:**
1. Check Vercel deployment logs
2. Look for build errors
3. Common issues:
   - Missing environment variables
   - Build command errors
   - Node version mismatch

### Issue 3: Routing Not Working
**Fix:**
Your `vercel.json` is correct, but verify:
- File exists in root directory
- Contains the rewrite rule
- Deployed with the build

---

## Verify Configuration

Your `vercel.json` should be:
```json
{
  "rewrites": [
    {
      "source": "/(.*)",
      "destination": "/index.html"
    }
  ]
}
```

This is already correct! ✅

---

## Next Steps

1. Check Vercel Dashboard for deployment status
2. If not deployed, deploy using one of the options above
3. Verify domain is connected in Vercel
4. Check deployment logs for any errors

