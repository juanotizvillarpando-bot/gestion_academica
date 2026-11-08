@echo off
setlocal
title Sistema de Gestion Academica - Servidor Web

echo ====================================================================
echo             SISTEMA DE GESTION ACADEMICA - MODERNO WEB
echo ====================================================================
echo.

where dotnet >nul 2>&1
if %ERRORLEVEL% neq 0 (
    if exist "C:\Program Files\dotnet\dotnet.exe" (
        set "PATH=C:\Program Files\dotnet;%PATH%"
    ) else (
        echo [ERROR] No se encontro .NET 10 SDK/Runtime en el sistema.
        echo Por favor instale .NET o agreguelo al PATH.
        pause
        exit /b 1
    )
)

echo [1/2] Esperando a que el servidor este listo para abrir el navegador...
:: Abre el navegador unicamente cuando el servidor responda HTTP 200 OK
start "" powershell -NoProfile -Command "$ErrorActionPreference='SilentlyContinue'; for ($i=0; $i -lt 60; $i++) { try { $r = Invoke-WebRequest -Uri 'http://localhost:5000' -UseBasicParsing -TimeoutSec 1; if ($r.StatusCode -eq 200) { break } } catch { Start-Sleep -Milliseconds 400 } }; Start-Process 'http://localhost:5000'"

echo [2/2] Iniciando Servidor Web en http://localhost:5000...
echo.

cd /d "%~dp0GestionAcademica.Api"

:: Si la DLL ya esta compilada, iniciar directamente en milisegundos
if exist "bin\Debug\net10.0\GestionAcademica.Api.dll" (
    dotnet "bin\Debug\net10.0\GestionAcademica.Api.dll" --urls "http://localhost:5000"
) else (
    dotnet run --no-restore --urls "http://localhost:5000"
)

if %ERRORLEVEL% neq 0 (
    echo.
    echo [ERROR] El servidor finalizo con codigo %ERRORLEVEL%.
    pause
)
