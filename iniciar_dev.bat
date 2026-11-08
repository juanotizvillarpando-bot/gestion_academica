@echo off
setlocal
title Modo Desarrollo - Gestion Academica

echo ====================================================================
echo        MODO DESARROLLO (VITE HMR 5173 + ASP.NET CORE API 5000)
echo ====================================================================
echo.

where dotnet >nul 2>&1
if %ERRORLEVEL% neq 0 (
    if exist "C:\Program Files\dotnet\dotnet.exe" set "PATH=C:\Program Files\dotnet;%PATH%"
)

echo [1/2] Iniciando Backend API en http://localhost:5000...
start "Backend API (ASP.NET Core)" cmd /k "cd /d %~dp0GestionAcademica.Api && dotnet run --no-restore --urls http://localhost:5000"

echo [2/2] Iniciando Frontend React (Vite Hot-Reload) en http://localhost:5173...
start "" powershell -NoProfile -Command "Start-Sleep -Seconds 3; Start-Process 'http://localhost:5173'"

cd /d "%~dp0GestionAcademica.Web"
npm run dev

