@echo off
setlocal enabledelayedexpansion
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
    echo [!] Initializing Git...
    git init
    git branch -M main
    git remote add origin %REPO_URL%
) else (
    git remote set-url origin %REPO_URL%
)

:: Ensure secret files are NOT in the git index
git rm --cached .dev.vars -f >nul 2>&1
git rm --cached .env -f >nul 2>&1

echo [*] Adding all site files...
git add .
echo [*] Committing...
git commit -m "Updated site and auth system"

echo [*] Pushing update to GitHub...
:: Try pushing and catch errors
git push -u origin main 2> git_error.txt
type git_error.txt

:: Check if the error was a "secret" detection
findstr /C:"secret" git_error.txt >nul 2>&1
if !errorlevel! equ 0 (
    echo.
    echo [!] ERROR: GITHUB BLOCKED THE PUSH! (Secret detected)
    echo [*] Attempting to find the leaking file...
    
    :: Search for the line with the file path
    for /f "tokens=6" %%A in ('findstr /C:"detected in file:" git_error.txt') do (
        set FPATH=%%A
        echo [!] Found leaked file: !FPATH!
        echo !FPATH! >> .gitignore
        git rm --cached !FPATH! -f >nul 2>&1
        echo [*] Added !FPATH! to .gitignore successfully.
    )

    echo [*] Undoing the dangerous commit...
    git reset --soft HEAD~1
    
    del git_error.txt >nul 2>&1
    echo.
    echo [OK] Fix applied. No more secrets!
    echo Press ENTER to retry the push...
    pause >nul
    goto push
)

:: Check for other push errors
if !errorlevel! neq 0 (
    echo.
    echo [!] Push failed for another reason. Please check the error above.
    pause
    goto end
)

del git_error.txt >nul 2>&1
echo [OK] Done! Cloudflare will now build your site.
pause
goto end

:end
endlocal
