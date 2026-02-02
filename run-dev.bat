@echo off
cd /d %~dp0
echo Starting Next.js dev server...
echo.
set TURBOPACK=0
npx next dev -p 3000
pause
