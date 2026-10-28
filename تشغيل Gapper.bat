@echo off
cd /d "%~dp0"
title Gapper
where node >nul 2>nul || (echo Node.js is not installed. Download it from https://nodejs.org & pause & exit /b 1)
if not exist node_modules (echo Installing packages... & call npm install || (pause & exit /b 1))
if not exist dist\index.html (echo Building the site... & call npm run build || (pause & exit /b 1))
echo Gapper is starting. Keep this window open while you use it.
start "" cmd /c "ping -n 3 127.0.0.1 >nul & start http://localhost:3400"
node --disable-warning=ExperimentalWarning server/index.js
pause
