@echo off
setlocal
title Sistema de Gestion Academica - Web

echo ====================================================================
echo             SISTEMA DE GESTION ACADEMICA - WEB
echo ====================================================================
echo.
echo [1] Iniciar Sistema Web (Recomendado - Inicia en 3 seg...)
echo [2] Iniciar Modo Desarrollo (React Vite HMR + API)
echo.

choice /C 12 /T 3 /D 1 /M "Seleccione una opcion [1-2]"
set opcion=%ERRORLEVEL%

if "%opcion%"=="2" goto dev
goto web

:web
call "%~dp0iniciar_web.bat"
goto fin

:dev
call "%~dp0iniciar_dev.bat"
goto fin

:fin
