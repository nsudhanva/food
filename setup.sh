#!/usr/bin/env bash
set -e

echo "Setting up Indian Food Companion..."

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

command -v docker >/dev/null 2>&1 || { echo "Docker is required. Install: https://docs.docker.com/get-docker/"; exit 1; }

if [ ! -f .env ]; then
    echo -e "${YELLOW}Creating .env from template...${NC}"
    cp .env.example .env
    echo -e "${YELLOW}[!] Please set your OPENAI_API_KEY in .env${NC}"
fi

if grep -q "sk-your-openai-api-key-here" .env 2>/dev/null; then
    echo -e "${YELLOW}[!] You need to set your OpenAI API key in .env${NC}"
    echo "Edit .env and replace 'sk-your-openai-api-key-here' with your actual key"
    read -p "Press Enter after updating .env, or Ctrl+C to exit..."
fi

echo -e "${GREEN}Starting Docker services...${NC}"
docker compose up -d --build

echo -e "${GREEN}Waiting for services to be healthy...${NC}"
sleep 5

max_attempts=30
attempt=0
until curl -s http://localhost:8080/health > /dev/null 2>&1; do
    attempt=$((attempt + 1))
    if [ $attempt -ge $max_attempts ]; then
        echo "API failed to start. Check logs: docker compose logs api"
        exit 1
    fi
    echo "Waiting for API... ($attempt/$max_attempts)"
    sleep 2
done

echo -e "${GREEN}Seeding food database...${NC}"
curl -s -X POST http://localhost:8080/api/admin/ingest > /dev/null

echo ""
echo -e "${GREEN}Setup complete!${NC}"
echo ""
echo "Frontend: http://localhost:5173"
echo "API:      http://localhost:8080"
echo "API Docs: http://localhost:8080/docs"
echo ""
echo "Run 'docker compose logs -f' to view logs"
