@echo off
title Initialize Disease Surveillance Database
echo =====================================================================
echo  DISEASE SURVEILLANCE AND EPIDEMIOLOGY DATABASE
echo  Database Initialization and Seeder (Target: MySQL on Port 3306)
echo =====================================================================
python scripts\init_database.py
echo.
echo Database setup completed. View in phpMyAdmin: http://localhost/phpmyadmin/
pause
