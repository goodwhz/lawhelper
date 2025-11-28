@echo off
echo Starting LawHelper Application...
cd /d "e:/Workplace/AI/PBL2/lawhelper-39改版"
echo Current directory: %CD%
echo.
echo Installing dependencies...
call npm install
echo.
echo Building application...
call npx next build
echo.
echo Starting production server on port 3025...
call npx next start -p 3025
pause