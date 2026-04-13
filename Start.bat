@echo off
TITLE SEO Maestro V20 - Command Center (ESTABLE)
SETLOCAL EnableExtensions
COLOR 0B

:: Directorio del Proyecto
SET PROJECT_DIR=C:\Users\Bryan\Desktop\pruebaGravity
SET DASHBOARD_DIR=%PROJECT_DIR%\maestro-dashboard

echo ===================================================
echo    SEO MAESTRO V20 - SISTEMA ULTRA-BLINDADO
echo    (Correccion Post-Pull 04/03/2026)
echo ===================================================
echo.

cd /d "%PROJECT_DIR%"

:: 0. Limpieza de Puertos (Prevenir EADDRINUSE)
echo [0/5] Liberando puertos 8081 y 8085...
for /f "tokens=5" %%a in ('netstat -aon ^| findstr /r ":8081 :8085"') do taskkill /f /pid %%a >nul 2>&1

:: 1. Verificación de Dependencias (Crítico tras Pull)
echo [1/5] Sincronizando dependencias del nucleo...
if not exist "node_modules" (
    echo [WAIT] node_modules no detectado. Instalando
    call npm.cmd install
) else (
    echo [OK] node_modules detectado. Sincronizando
    call npm.cmd install --no-audit
)
if %ERRORLEVEL% NEQ 0 (
    echo [ERROR] Fallo al instalar dependencias en el root.
    pause
    exit /b
)

:: 2. Verificación de Infraestructura Redis
echo [2/5] Verificando infraestructura Redis...
docker --version >nul 2>&1
if %ERRORLEVEL% NEQ 0 (
    echo [ADVERTENCIA] Docker no detectado o no iniciado. Activando Modo Failsafe
    goto START_SERVICES
)

echo [STEALTH] Asegurando contenedor Redis...
docker stop seo-redis >nul 2>&1
docker rm seo-redis >nul 2>&1
docker run -d --name seo-redis -p 6379:6379 redis:alpine >nul 2>&1
if %ERRORLEVEL% NEQ 0 (
    echo [ADVERTENCIA] No se pudo iniciar Redis en Docker. Modo Failsafe Activo
) else (
    docker start seo-redis >nul 2>&1
    echo [OK] Redis iniciado correctamente
)

:START_SERVICES
echo [OK] Infraestructura preparada.

:: 3. Iniciar Orquestador (Nodo Central)
echo [3/5] Iniciando Orquestador de Agentes...
start "SEO Maestro - ORCHESTRATOR" cmd /k "cd /d %PROJECT_DIR% && echo INICIANDO ORQUESTADOR && call npm.cmd start"

:: 4. Iniciar API del Dashboard
echo [4/5] Iniciando API de Monitoreo (Puerto 8081)...
start "SEO Maestro - API" cmd /k "cd /d %PROJECT_DIR% && echo INICIANDO API && call npm.cmd run dashboard"

:: 5. Iniciar Dashboard Frontend (Next.js)
echo [5/5] Iniciando Interfaz Humana V20 (Puerto 8085)...
if not exist "%DASHBOARD_DIR%\node_modules" (
    echo [WAIT] Instalando dependencias del Dashboard
    cd /d "%DASHBOARD_DIR%" && call npm.cmd install
)
start "SEO Maestro - DASHBOARD" cmd /k "cd /d %DASHBOARD_DIR% && echo INICIANDO FRONTEND && call npm.cmd run dev"

echo.
echo ===================================================
echo    SISTEMA INICIADO - LISTO PARA PRODUCCION
echo    Dashboard: http://localhost:8085
echo ===================================================
echo.

echo Estabilizando servicios (10s)...
timeout /t 10 >nul
start http://localhost:8085

echo [INFO] Puedes cerrar esta ventana si los servicios estan activos.
if "%1"=="--no-pause" goto END
pause
:END
