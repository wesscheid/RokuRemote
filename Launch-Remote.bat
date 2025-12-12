@echo off
setlocal

:: Get the absolute path to the dist directory
set "APP_DIR=%~dp0dist"
set "INDEX_FILE=%APP_DIR%\index.html"

:: Check if dist folder exists
if not exist "%INDEX_FILE%" (
    echo Error: Could not find dist\index.html
    echo Please run 'npm run build' first.
    pause
    exit /b 1
)

:: Create a unique temp directory for the user profile to isolate this instance
set "USER_DATA=%TEMP%\RokuRemoteProfile_%RANDOM%"

:: Launch Chrome in App Mode with security disabled for local network control
:: --app: Hides browser UI (address bar, tabs)
:: --user-data-dir: required for --disable-web-security to work on modern Chrome
:: --disable-web-security: Allows the local file to talk to the Roku IP (CORS bypass)
echo Launching Roku Remote...
start "" chrome.exe --app="file:///%INDEX_FILE%" --user-data-dir="%USER_DATA%" --disable-web-security --allow-file-access-from-files --window-size=550,2259

endlocal
