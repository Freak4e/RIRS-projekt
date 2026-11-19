#!/bin/sh
set -eu
: "${DATABASE_URL:?DATABASE_URL is required}"
: "${JWT_SECRET:?JWT_SECRET is required}"
./node_modules/.bin/prisma migrate deploy --config prisma7.config.ts
if [ -n "${ADMIN_EMAIL:-}" ] && [ -n "${ADMIN_PASSWORD:-}" ]; then
  node dist/seed-admin.js
fi
exec node dist/index.js
