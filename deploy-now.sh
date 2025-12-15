#!/bin/bash
set -x  # Enable debugging
set -e  # Exit on error

cd "/Users/nivedsunil/Desktop/enqir 1 copy 9 untested copy 4"

echo "=== DEPLOYMENT START ===" > deploy_output.log
date >> deploy_output.log
echo "" >> deploy_output.log

echo "Step 1: Checking git status..." | tee -a deploy_output.log
git status >> deploy_output.log 2>&1
echo "" >> deploy_output.log

echo "Step 2: Adding all changes..." | tee -a deploy_output.log
git add -A >> deploy_output.log 2>&1
echo "" >> deploy_output.log

echo "Step 3: Checking what will be committed..." | tee -a deploy_output.log
git diff --cached --name-only >> deploy_output.log 2>&1
echo "" >> deploy_output.log

echo "Step 4: Committing..." | tee -a deploy_output.log
git commit --no-verify -m "Deploy: All latest updates - mobile optimizations, thinner borders, removed dividers, search bar styling" >> deploy_output.log 2>&1 || echo "No changes to commit or already committed" >> deploy_output.log
echo "" >> deploy_output.log

echo "Step 5: Checking commits ahead of remote..." | tee -a deploy_output.log
git log origin/main..HEAD --oneline >> deploy_output.log 2>&1 || echo "No commits ahead" >> deploy_output.log
echo "" >> deploy_output.log

echo "Step 6: Pushing to main..." | tee -a deploy_output.log
git push origin main >> deploy_output.log 2>&1
echo "" >> deploy_output.log

echo "=== DEPLOYMENT END ===" >> deploy_output.log
date >> deploy_output.log

cat deploy_output.log


