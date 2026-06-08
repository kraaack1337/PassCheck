.PHONY: dev prod build stop logs lint format test clean shell-backend shell-frontend

# ─── Docker Development ───

# Start development environment with hot-reload
dev:
	docker compose up --build

# Start development environment in background
dev-d:
	docker compose up -d --build

# ─── Docker Production ───

# Start production environment
prod:
	docker compose -f docker-compose.prod.yml up -d --build

# ─── General Docker Commands ───

# Stop all containers
stop:
	docker compose down
	docker compose -f docker-compose.prod.yml down

# View logs of all containers
logs:
	docker compose logs -f

# Clean up all containers, volumes, and dangling images
clean: stop
	docker compose down -v
	docker compose rm -f
	docker volume prune -f
	docker image prune -f

# ─── Utilities ───

# Shell into backend container
shell-backend:
	docker compose exec backend sh

# Shell into frontend container
shell-frontend:
	docker compose exec frontend sh

# Shell into redis container
shell-redis:
	docker compose exec redis redis-cli

# ─── Local Development (Without Docker) ───

# Install dependencies for the workspace
install:
	npm install

# Run backend locally
dev-backend:
	npm run start:dev -w backend

# Run frontend locally
dev-frontend:
	npm run dev -w frontend

# Format code
format:
	npm run format -w backend

# Lint code
lint:
	npm run lint -w backend

# Run tests
test:
	npm run test -w backend
