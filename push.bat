@echo off
set REPO_URL=https://github.com/Iwqndr/-four

if not exist .git (
    echo Initializing Git repository...
    git init
    git branch -M main
    git remote add origin %REPO_URL%
) else (
    echo Git repository found. Checking remote...
    git remote set-url origin %REPO_URL%
)

echo Adding files...
git add .

echo Committing...
git commit -m "Cloudflare Pages compatibility update"

echo Pushing to GitHub...
git push -u origin main

echo Done! If push failed, make sure you have authenticated your GitHub account.
pause
