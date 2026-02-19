@echo off
REM ARROS Database Setup Script for Windows

echo Setting up ARROS database...

REM Check if DATABASE_URL is set
if "%DATABASE_URL%"=="" (
    echo Error: DATABASE_URL environment variable not set
    echo Please set it in your .env file
    pause
    exit /b 1
)

REM Navigate to server directory
cd /d "%~dp0..\server" || exit /b 1

REM Install dependencies if needed
if not exist "node_modules" (
    echo Installing server dependencies...
    call npm install
)

REM Generate Prisma Client
echo Generating Prisma Client...
call npx prisma generate

REM Run migrations
echo Running database migrations...
call npx prisma migrate deploy

echo.
echo Database setup complete!
echo.
echo To start the development server:
echo   npm run dev
pause
