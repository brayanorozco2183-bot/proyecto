@echo off
setlocal EnableExtensions EnableDelayedExpansion

set PATCH_NAME=gravity_clean_delivery_cascade_lock_patch
set ZIP_NAME=%PATCH_NAME%.zip
set ROOT=%CD%
set BACKUP_DIR=%ROOT%\backup_clean_delivery_cascade_lock_%DATE:~-4%%DATE:~3,2%%DATE:~0,2%_%TIME:~0,2%%TIME:~3,2%%TIME:~6,2%
set BACKUP_DIR=%BACKUP_DIR: =0%
set TMP_DIR=%ROOT%\.__gravity_clean_delivery_patch_tmp

echo.
echo ============================================================
echo  Gravity - Clean Delivery Cascade Lock Patch
echo ============================================================
echo.

if not exist package.json (
  echo [ERROR] Ejecuta este .bat desde la raiz del proyecto Gravity, donde esta package.json.
  exit /b 1
)

if not exist "%ZIP_NAME%" (
  echo [ERROR] No encuentro %ZIP_NAME% en esta carpeta.
  echo Copia este .bat y %ZIP_NAME% a la raiz del proyecto y vuelve a ejecutarlo.
  exit /b 1
)

echo [1/5] Creando backup...
mkdir "%BACKUP_DIR%" >nul 2>nul
for %%F in (
  "src\design-system\finalDeliveryCascadeLockCss.ts"
  "src\design-system\procedural-global.css"
  "src\utils\cleanDeliveryHtmlNormalizer.ts"
  "src\utils\finalDocumentSanitizer.ts"
  "src\repair\pageRepairKit.ts"
  "scripts\verify_clean_delivery_cascade_lock.mjs"
  "docs\PATCH_CLEAN_DELIVERY_CASCADE_LOCK.md"
  "package.json"
) do (
  if exist "%%~F" (
    if not exist "%BACKUP_DIR%\%%~dpF" mkdir "%BACKUP_DIR%\%%~dpF" >nul 2>nul
    copy /Y "%%~F" "%BACKUP_DIR%\%%~F" >nul
  )
)

echo [2/5] Descomprimiendo parche...
if exist "%TMP_DIR%" rmdir /S /Q "%TMP_DIR%"
mkdir "%TMP_DIR%" >nul 2>nul
powershell -NoProfile -ExecutionPolicy Bypass -Command "Expand-Archive -LiteralPath '%ROOT%\%ZIP_NAME%' -DestinationPath '%TMP_DIR%' -Force"
if errorlevel 1 (
  echo [ERROR] No se pudo descomprimir el parche.
  exit /b 1
)

echo [3/5] Aplicando archivos...
xcopy /E /I /Y "%TMP_DIR%\src" "%ROOT%\src" >nul
xcopy /E /I /Y "%TMP_DIR%\scripts" "%ROOT%\scripts" >nul
xcopy /E /I /Y "%TMP_DIR%\docs" "%ROOT%\docs" >nul
copy /Y "%TMP_DIR%\package.json" "%ROOT%\package.json" >nul

echo [4/5] Limpiando temporales...
rmdir /S /Q "%TMP_DIR%" >nul 2>nul

echo [5/5] Verificando instalacion...
node scripts\verify_clean_delivery_cascade_lock.mjs
if errorlevel 1 (
  echo.
  echo [ERROR] La verificacion fallo. Revisa el backup en:
  echo %BACKUP_DIR%
  exit /b 1
)

echo.
echo [OK] Parche aplicado correctamente.
echo Backup creado en:
echo %BACKUP_DIR%
echo.
echo Recomendado ahora:
echo   npm run typecheck
echo   npm run verify:clean-delivery-cascade-lock
echo.
endlocal
