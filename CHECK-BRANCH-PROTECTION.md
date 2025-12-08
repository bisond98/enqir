# How to Check and Disable Branch Protection on GitHub

## Repository: https://github.com/bisond98/enqir

## Steps to Check Branch Protection Rules:

1. **Go to GitHub Repository Settings:**
   - Visit: https://github.com/bisond98/enqir/settings
   - Or: Repository → Settings → Branches

2. **Check Branch Protection Rules:**
   - Look for "Branch protection rules" section
   - Check if `main` branch has protection enabled
   - Common protection rules that block pushes:
     - ✅ Require pull request reviews before merging
     - ✅ Require status checks to pass before merging
     - ✅ Require branches to be up to date before merging
     - ✅ Restrict pushes that create files larger than X MB
     - ✅ Do not allow bypassing the above settings

3. **To Disable Branch Protection (if needed):**
   - Go to: https://github.com/bisond98/enqir/settings/branches
   - Find the rule for `main` branch
   - Click "Edit" or "Delete"
   - Remove/disable the protection rules
   - Save changes

## Alternative: Push to Feature Branch

If branch protection is enabled on `main`, you can:
1. Create a feature branch
2. Push to that branch
3. Create a Pull Request
4. Merge via GitHub UI

## Current Status:

- Local git config shows: `receive.denyNonFastForwards = true`
- This prevents force pushes locally, but GitHub branch protection is separate
- Need to check GitHub web interface for actual protection rules

