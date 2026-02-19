#!/bin/bash

# ARROS Database Setup Script

echo "Setting up ARROS database..."

# Check if DATABASE_URL is set
if [ -z "$DATABASE_URL" ]; then
    echo "Error: DATABASE_URL environment variable not set"
    echo "Please set it in your .env file or export it"
    exit 1
fi

# Navigate to server directory
cd "$(dirname "$0")/../server" || exit 1

# Install dependencies if needed
if [ ! -d "node_modules" ]; then
    echo "Installing server dependencies..."
    npm install
fi

# Generate Prisma Client
echo "Generating Prisma Client..."
npx prisma generate

# Run migrations
echo "Running database migrations..."
npx prisma migrate deploy

# Or for development, use:
# npx prisma migrate dev

echo "Database setup complete!"
echo ""
echo "To start the development server:"
echo "  npm run dev"
