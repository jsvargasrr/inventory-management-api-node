#!/bin/sh
set -e

echo "Preparing database..."
cp prisma/schema.postgresql.prisma prisma/schema.prisma
npx prisma generate
npx prisma db push
npx prisma db seed

echo "Starting API..."
exec node dist/main.js
