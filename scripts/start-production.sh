#!/bin/sh
set -e

if echo "$DATABASE_URL" | grep -q "^postgresql"; then
  echo "Using PostgreSQL schema..."
  cp prisma/schema.postgresql.prisma prisma/schema.prisma
fi

npx prisma generate
npx prisma db push
npx prisma db seed

echo "Starting API..."
exec node dist/main.js
