#!/bin/bash

# Deployment script for pixi-glass.jurrejan.com

set -e

# Configuration
DOMAIN="pixi-glass.jurrejan.com"
BUILD_DIR="demo-dist"
TARGET_DIR="/Volumes/Container/caddy/www/$DOMAIN"

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

# Build application
echo -e "${YELLOW}Building application...${NC}"
npx vite build --config demo/vite.config.ts

# Check volume mounted
if [ ! -d "/Volumes/Container/caddy/www" ]; then
    echo -e "${RED}Error: Caddy volume not mounted${NC}"
    exit 1
fi

# Deploy
echo -e "${YELLOW}Deploying to NAS...${NC}"
mkdir -p "$TARGET_DIR"
rsync -av --delete --exclude='.DS_Store' --exclude='._*' --exclude='*.caddy' "$BUILD_DIR/" "$TARGET_DIR/"

# Copy Caddyfile
cp Caddyfile.local "$TARGET_DIR/$DOMAIN.caddy"

if [ -f "$TARGET_DIR/index.html" ]; then
    echo -e "${GREEN}✓ Deployment complete${NC}"
    echo -e "${GREEN}✓ Available at: https://$DOMAIN${NC}"
else
    echo -e "${RED}✗ Deployment failed${NC}"
    exit 1
fi
