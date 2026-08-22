@echo off
setlocal
cd /d "%~dp0"
where pyw >nul 2>nul
if %errorlevel%==0 (
  start "" pyw -3 editor_app.py
  exit /b 0
)
where pythonw >nul 2>nul
if %errorlevel%==0 (
  start "" pythonw editor_app.py
  exit /b 0
)
echo Python 3 with Tkinter is required.
pause
