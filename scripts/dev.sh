#!/bin/sh
# dev.sh — Start the full local development environment.

set -e

GREEN='\033[0;32m'
YELLOW='\033[0;33m'
RESET='\033[0m'

echo "${GREEN}Starting local development environment...${RESET}"

# Check Docker is running
if ! docker info > /dev/null 2>&1; then
  echo "${YELLOW}Docker is not running. Please start Docker Desktop and retry.${RESET}"
  exit 1
fi

# Start infrastructure
echo "Starting PostgreSQL and Redis ..."
docker compose -f docker/docker-compose.yml up -d postgres redis

# Wait for Postgres to be ready
echo "Waiting for PostgreSQL ..."
until docker compose -f docker/docker-compose.yml exec -T postgres pg_isready -U postgres > /dev/null 2>&1; do
  printf '.'
  sleep 1
done
echo " ready"

# Copy .env.local if it doesn't exist
if [ ! -f ".env.local" ]; then
  cp config/.env.example .env.local
  echo "${YELLOW}.env.local created from .env.example — fill in real values before proceeding.${RESET}"
fi

# Install dependencies
echo "Installing dependencies ..."
bun install

# Generate Prisma client
echo "Generating Prisma client ..."
bunx prisma generate

# Run migrations
echo "Running database migrations ..."
bunx prisma migrate dev --name init 2>/dev/null || bunx prisma migrate deploy

echo ""
echo "${GREEN}Environment ready!${RESET}"
echo "Starting app on http://localhost:3000 ..."
echo ""

# Start the app with hot-reload
bun run dev
