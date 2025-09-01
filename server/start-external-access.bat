@echo off
echo ========================================
echo    Quiz App External Access Server
echo ========================================
echo.
echo Starting external access server...
echo This will allow client devices to access the quiz app
echo.
echo Access URL: http://143.167.178.160:5001
echo.
echo Press Ctrl+C to stop the server
echo ========================================
echo.

node simple-external-server.js

pause
