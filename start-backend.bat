@echo off
echo ========================================
echo Starting FutureIntern Backend Server
echo ========================================
echo.

cd back\futureintern-backend

echo Activating virtual environment...
call venv\Scripts\activate.bat

echo.
echo Installing/updating dependencies...
python -m pip install --upgrade pip
echo.
echo Installing core packages first...
pip install Flask Flask-SQLAlchemy Flask-JWT-Extended Flask-CORS PyMySQL SQLAlchemy Werkzeug Jinja2 MarkupSafe
echo.
echo Installing remaining packages (this may take a few minutes)...
pip install -r requirements.txt
if errorlevel 1 (
    echo.
    echo WARNING: Some optional packages may have failed to install.
    echo Core packages are installed. The app should still work.
    echo.
)

echo.
echo Starting Flask server on http://localhost:5000
echo Press Ctrl+C to stop the server
echo.

python run.py

pause

