@echo off
title Automated Pytest Suite - Disease Surveillance
echo =====================================================================
echo  DISEASE SURVEILLANCE SYSTEM - AUTOMATED TESTING SUITE
echo =====================================================================
cd /d "%~dp0backend"
python -m pytest -v
echo.
pause
