@echo off
cd /d %~dp0
node node_modules/next/dist/bin/next dev %~dp0 -p 3000
