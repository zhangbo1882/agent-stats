#!/bin/bash

# Local development script for agent-stats

set -e

# Color output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if node_modules exists
if [ ! -d "node_modules" ]; then
  echo -e "${YELLOW}⚠️  node_modules not found. Installing dependencies...${NC}"
  npm install
  echo -e "${GREEN}✅ Dependencies installed.${NC}"
fi

# Default port
PORT=${PORT:-3000}

# Function to find and kill process using the port
kill_existing_instance() {
  local port=$1
  local pid=$(lsof -ti:$port 2>/dev/null)

  if [ -n "$pid" ]; then
    echo -e "${YELLOW}⚠️  Found existing process on port $port (PID: $pid)${NC}"
    echo -e "${YELLOW}🔄 Terminating existing instance...${NC}"
    kill -9 $pid 2>/dev/null
    sleep 1
    echo -e "${GREEN}✅ Existing instance terminated.${NC}"
  fi
}

# Kill existing instance if any
kill_existing_instance $PORT

echo -e "${BLUE}🚀 Starting development server on http://localhost:$PORT${NC}"
echo -e "${BLUE}Press Ctrl+C to stop${NC}\n"

# Run Next.js dev server
npm run dev
