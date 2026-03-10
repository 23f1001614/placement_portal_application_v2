#!/bin/bash
# ─────────────────────────────────────────────────────────────────────────────
# PPA Backend — Start Redis, Celery Worker, and Celery Beat (WSL)
# Usage:  cd backend && bash start_services.sh
# Stop:   Ctrl+C (sends SIGINT to all background processes)
# ─────────────────────────────────────────────────────────────────────────────

set -e

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

PIDS=()

cleanup() {
    echo -e "\n${YELLOW}⏹  Shutting down services...${NC}"
    for pid in "${PIDS[@]}"; do
        if kill -0 "$pid" 2>/dev/null; then
            kill "$pid" 2>/dev/null
            echo -e "   Stopped PID $pid"
        fi
    done
    echo -e "${GREEN}✔  All services stopped.${NC}"
    exit 0
}

trap cleanup SIGINT SIGTERM

# ── 1. Redis ─────────────────────────────────────────────────────────────────

echo -e "${CYAN}══════════════════════════════════════════════════════════${NC}"
echo -e "${CYAN}  PPA Backend — Service Launcher (WSL)${NC}"
echo -e "${CYAN}══════════════════════════════════════════════════════════${NC}"

echo -e "\n${YELLOW}1/3${NC}  Starting Redis server..."

if command -v redis-server &> /dev/null; then
    # Check if Redis is already running
    if redis-cli ping 2>/dev/null | grep -q PONG; then
        echo -e "     ${GREEN}✔  Redis is already running.${NC}"
    else
        redis-server --daemonize yes --loglevel warning
        sleep 1
        if redis-cli ping 2>/dev/null | grep -q PONG; then
            echo -e "     ${GREEN}✔  Redis started successfully.${NC}"
        else
            echo -e "     ${RED}✘  Redis failed to start.${NC}"
            exit 1
        fi
    fi
else
    echo -e "     ${RED}✘  redis-server not found. Install with:${NC}"
    echo -e "     ${YELLOW}sudo apt update && sudo apt install redis-server${NC}"
    exit 1
fi

# ── 2. Activate venv if present ──────────────────────────────────────────────

if [ -d "venv" ]; then
    source venv/bin/activate
    echo -e "\n     ${GREEN}✔  Virtual environment activated.${NC}"
fi

# ── 3. Celery Worker ─────────────────────────────────────────────────────────

echo -e "\n${YELLOW}2/3${NC}  Starting Celery worker..."
PYTHONPATH=".:$(pwd)" celery -A tasks.celery_config worker \
    --loglevel=info \
    --concurrency=2 \
    -Q celery \
    2>&1 | sed 's/^/     [worker] /' &
PIDS+=($!)
sleep 2
echo -e "     ${GREEN}✔  Celery worker started (PID: ${PIDS[-1]}).${NC}"

# ── 4. Celery Beat ───────────────────────────────────────────────────────────

echo -e "\n${YELLOW}3/3${NC}  Starting Celery Beat scheduler..."
PYTHONPATH=".:$(pwd)" celery -A tasks.celery_config beat \
    --loglevel=info \
    2>&1 | sed 's/^/     [beat]   /' &
PIDS+=($!)
sleep 1
echo -e "     ${GREEN}✔  Celery Beat started (PID: ${PIDS[-1]}).${NC}"

# ── Ready ────────────────────────────────────────────────────────────────────

echo -e "\n${CYAN}══════════════════════════════════════════════════════════${NC}"
echo -e "${GREEN}  ✔  All services are running!${NC}"
echo -e "${CYAN}══════════════════════════════════════════════════════════${NC}"
echo -e ""
echo -e "  Redis:         ${GREEN}redis://localhost:6379${NC}"
echo -e "  Celery Worker: ${GREEN}running (concurrency=2)${NC}"
echo -e "  Celery Beat:   ${GREEN}running (interview reminders @ 8AM, reports @ 1st of month)${NC}"
echo -e ""
echo -e "  ${YELLOW}Press Ctrl+C to stop all services.${NC}"
echo -e ""

# Wait for background processes
wait
