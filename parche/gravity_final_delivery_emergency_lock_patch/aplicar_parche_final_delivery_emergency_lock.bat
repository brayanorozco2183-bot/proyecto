@echo off
setlocal EnableExtensions EnableDelayedExpansion
chcp 65001 >nul

set "PATCH_ZIP=gravity_final_delivery_emergency_lock_patch.zip"
set "PATCH_DIR=.gravity_final_delivery_emergency_lock_patch_tmp"
set "BACKUP_DIR=.gravity_backup_final_delivery_lock_%DATE:~-4%%DATE:~3,2%%DATE:~0,2%_%TIME:~0,2%%TIME:~3,2%%TIME:~6,2%"
set "BACKUP_DIR=%BACKUP_DIR: =0%"

echo.
echo === Gravity Final Delivery Emergency Lock Patch ===
echo.

if not exist package.json (
  echo ERROR: Ejecuta este .bat desde la raiz del proyecto Gravity, donde esta package.json.
  pause
  exit /b 1
)

if exist "%PATCH_DIR%" rmdir /s /q "%PATCH_DIR%"
mkdir "%PATCH_DIR%" >nul 2>nul

if exist "%PATCH_ZIP%" (
  echo Descomprimiendo %PATCH_ZIP%...
  powershell -NoProfile -ExecutionPolicy Bypass -Command "Expand-Archive -LiteralPath '%PATCH_ZIP%' -DestinationPath '%PATCH_DIR%' -Force"
  if errorlevel 1 (
    echo ERROR: No se pudo descomprimir el parche.
    pause
    exit /b 1
  )
) else (
  echo No se encontro %PATCH_ZIP%. Se asumira que los archivos del parche ya fueron extraidos junto a este .bat.
  set "PATCH_DIR=%~dp0"
)

mkdir "%BACKUP_DIR%" >nul 2>nul
for %%F in (
  "src\design-system\finalDeliveryEmergencyCss.ts"
  "src\utils\finalDeliveryDomFixes.ts"
  "src\utils\finalDocumentSanitizer.ts"
  "scripts\verify_final_delivery_emergency_lock.mjs"
  "scripts\patch_package_final_delivery_lock.mjs"
  "docs\PATCH_FINAL_DELIVERY_EMERGENCY_LOCK.md"
  "package.json"
) do (
  if exist "%%~F" (
    if not exist "%BACKUP_DIR%\%%~dpF" mkdir "%BACKUP_DIR%\%%~dpF" >nul 2>nul
    copy /Y "%%~F" "%BACKUP_DIR%\%%~F" >nul
  )
)

echo Aplicando archivos...
xcopy /E /I /Y "%PATCH_DIR%\src" "src" >nul
xcopy /E /I /Y "%PATCH_DIR%\scripts" "scripts" >nul
xcopy /E /I /Y "%PATCH_DIR%\docs" "docs" >nul
node scripts\patch_package_final_delivery_lock.mjs
if errorlevel 1 (
  echo ERROR: No se pudo actualizar package.json.
  pause
  exit /b 1
)

echo.
echo Verificando instalacion...
node scripts\verify_final_delivery_emergency_lock.mjs
if errorlevel 1 (
  echo.
  echo ERROR: La verificacion fallo. Revisa los mensajes anteriores.
  echo Backup creado en: %BACKUP_DIR%
  pause
  exit /b 1
)

echo.
echo Parche aplicado correctamente.
echo Backup creado en: %BACKUP_DIR%
echo.
echo Siguiente paso recomendado:
echo   npm start
echo o vuelve a generar una pagina y revisa el HTML final.
echo.
pause
