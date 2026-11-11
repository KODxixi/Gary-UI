@echo off
setlocal
where py >nul 2>nul
if %errorlevel% equ 0 (
  py -3 "%~dp0scripts\gary_ui.py" %*
) else (
  python "%~dp0scripts\gary_ui.py" %*
)
exit /b %errorlevel%
