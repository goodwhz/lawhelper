@echo off
cd /d %~dp0
echo Starting Next.js dev server...
echo.
npx next dev -p 3000
pause
