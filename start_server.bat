@echo off
title Journal Harian Mobilku - Database Server
color 0b
echo ========================================================
echo   JOURNAL HARIAN MOBILKU - DATABASE SERVER
echo ========================================================
echo.
echo Memulai server backend dan database...
echo.

start "" http://localhost:3000
node server.js

pause
