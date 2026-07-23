#!/bin/sh
set -e

echo "Running database migrations..."
npx tsx scripts/migrate-up.ts

echo "Starting application..."
exec node dist/src/main.js
