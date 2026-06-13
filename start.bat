@echo off
title Lab System
cd /d "%~dp0"

:: ── Check if already running ──────────────────────────────────────────────────
netstat -ano | findstr ":5173 " | findstr "LISTENING" > nul
if %errorlevel% == 0 (
    echo Lab system is already running.
    choice /c YN /m "Open the browser anyway?"
    if errorlevel 2 exit
    start http://localhost:5173
    exit
)

:: ── Start the Express API server ─────────────────────────────────────────────
echo Starting server...
start "Lab System Server" cmd /k "cd /d "%~dp0" && node server/index.js"

:: ── Start the Vite frontend ───────────────────────────────────────────────────
echo Starting frontend...
start "Lab System Client" cmd /k "cd /d "%~dp0client" && npm run dev"

:: ── Wait until Vite is ready before opening the browser ──────────────────────
echo Waiting for system to start...
:waitloop
timeout /t 1 /nobreak > nul
curl -s http://localhost:5173 > nul 2>&1
if %errorlevel% neq 0 goto waitloop

start http://localhost:5173

echo.
echo System is running. Keep both windows open while using the system.
echo Close both windows to shut down.
timeout /t 4 /nobreak > nul
exit
