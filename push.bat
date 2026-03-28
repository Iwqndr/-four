@echo off
setlocal
set REPO_URL=https://github.com/Iwqndr/-four

echo.
echo ==========================================
echo       WONDER DIRECTS DEPLOYMENT
echo ==========================================
echo.
echo 1) Test (Run Local - Port 999)
echo 2) Push (Deploy to GitHub/Cloudflare)
echo.
set /p choice="Selection [1-2]: "

if "%choice%"=="1" goto test
if "%choice%"=="2" goto push
goto end

:test
if not exist node_modules (
    echo [!] Installing dependencies first...
    call npm install
)
echo [*] Starting test server on Port 999...
call npm run test
goto end

:push
if not exist .git (
    echo Initializing Git repository...
    git init
    git branch -M main
    git remote add origin %REPO_URL%
) else (
    git remote set-url origin %REPO_URL%
)
echo Adding files...
git add .
echo Committing...
git commit -m "Updated site and auth system"
echo Pushing to GitHub...
git push -u origin main
echo Done! Build should start in Cloudflare now.
pause
goto end

:end
endlocal
