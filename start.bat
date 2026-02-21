@echo off
cd /d "%~dp0"

echo Starting Fleet Hub (database must be initialized first)...
call npm run dev

pause
