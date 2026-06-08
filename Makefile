.PHONY: dev prod build stop logs lint format test clean shell-backend shell-frontend

# ─── Docker Development ───

# Start development environment with hot-reload
dev:
	docker-compose up --build

# Start development environment in background
dev-d:
	docker-compose up -d --build

# ─── Docker Production ───

# Start production environment
prod:
	docker-compose -f docker-compose.prod.yml up -d --build

# ─── General Docker Commands ───

# Stop all containers
stop:
	docker-compose down
	docker-compose -f docker-compose.prod.yml down

# View logs of all containers
logs:
	docker-compose logs -f

# Clean up all containers, volumes, and dangling images
clean: stop
	docker-compose rm -f
	docker volume prune -f
	docker image prune -f

# ─── Utilities ───

# Shell into backend container
shell-backend:
	docker exec -it project-backend-1 sh

# Shell into frontend container
shell-frontend:
	docker exec -it project-frontend-1 sh

# Shell into redis container
shell-redis:
	docker exec -it project-redis-1 redis-cli

# ─── Local Development (Without Docker) ───

# Install dependencies for the workspace
install:
	npm install

# Run backend locally
dev-backend:
	cd backend && npm run start:dev

# Run frontend locally
dev-frontend:
	cd frontend && npm run dev

# Format code
format:
	cd backend && npm run format
	cd frontend && npm run format

# Lint code
lint:
	cd backend && npm run lint
	cd frontend && npm run lint

# Run tests
test:
	cd backend && npm run test
