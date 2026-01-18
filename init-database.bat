@echo off
echo ========================================
echo Initializing Database
echo ========================================
echo.

cd back\futureintern-backend

echo Activating virtual environment...
call venv\Scripts\activate.bat

echo.
echo Creating database tables...
python init_db.py

echo.
echo ========================================
echo Database initialization complete!
echo ========================================
echo.
pause

