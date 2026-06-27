@echo off
cd /d "%~dp0"

:: Start server if port 3000 is not in use
netstat -ano | findstr ":3000" | findstr "LISTENING" > nul
if %errorlevel% neq 0 (
    echo Starting server...
    start "Lab Server" cmd /k "node server/index.js"
    timeout /t 3 /nobreak > nul
)

:: Start client if port 5173 is not in use
netstat -ano | findstr ":5173" | findstr "LISTENING" > nul
if %errorlevel% neq 0 (
    echo Starting client...
    start "Lab Client" cmd /k "cd client && npm run dev"
    timeout /t 5 /nobreak > nul
)

:: Open browser
start http://localhost:5173
