@echo off
cd /d "%~dp0"

echo Checking Node.js...
where node >nul 2>nul
if %errorlevel% neq 0 (
    echo Node.js not found. Install from https://nodejs.org
    pause
    exit /b 1
)

echo Installing dependencies...
call npm install
if %errorlevel% neq 0 (
    echo npm install failed
    pause
    exit /b 1
)

echo Initializing database...
call npm run db:init

echo Starting Fleet Hub...
call npm run dev

pause
