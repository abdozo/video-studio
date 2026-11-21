@echo off
setlocal

powershell.exe -NoProfile -ExecutionPolicy Bypass -File "%~dp0tools\setup-windows.ps1"
set "INSTALL_EXIT_CODE=%ERRORLEVEL%"

echo.
if not "%INSTALL_EXIT_CODE%"=="0" (
    echo Installation failed. See the error above, then double-click Windows Install.cmd to retry.
)
pause
exit /b %INSTALL_EXIT_CODE%
