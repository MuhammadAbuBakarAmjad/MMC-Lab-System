@echo off
title Lab System Update
cd /d "%~dp0"

echo Downloading latest updates...
git pull

echo Installing any new server packages...
cd server
call npm install --silent
cd ..

echo Rebuilding frontend...
cd client
call npm install --silent
call npm run build
cd ..

echo.
echo Update complete. You can now run start.bat
timeout /t 4 /nobreak > nul
exit
