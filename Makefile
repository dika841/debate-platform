COMPOSE_DEV := docker compose -f docker-compose.dev.yml
COMPOSE_PROD := docker compose
DOCKER_BUILD_NETWORK ?= host

.PHONY: help install services services-stop services-logs up down logs image image-web image-run \
	dev api web worker db-migrate db-seed db-generate db-push db-studio \
	check lint format typecheck test build ci deploy-dry-run clean arch

help: ## List available targets
	@grep -E '^[a-zA-Z0-9_-]+:.*?## .*$$' $(MAKEFILE_LIST) | sort | awk 'BEGIN {FS = ":.*?## "}; {printf "  %-18s %s\n", $$1, $$2}'

install: ## Install workspace dependencies
	pnpm install

services: ## Start local dependencies (postgres, mailpit)
	$(COMPOSE_DEV) up -d

services-stop: ## Stop local dependencies
	$(COMPOSE_DEV) down

services-logs: ## Tail local dependency logs
	$(COMPOSE_DEV) logs -f

dev: ## Start api and web on the host
	moon run api:dev web:dev

api: ## Run the api on :3001
	moon run api:dev

web: ## Run the web app on :5173
	moon run web:dev

worker: ## Run the worker loop
	moon run worker:dev

db-migrate: ## Apply pending migrations
	moon run api:migrate

db-seed: ## Seed demo users, rooms, votes and reports
	moon run api:db-seed

db-generate: ## Generate a migration from the Drizzle schema
	moon run api:db-generate

db-push: ## Push the schema directly (dev only)
	moon run api:db-push

db-studio: ## Open Drizzle Studio
	moon run api:db-studio

arch: ## Check architecture boundaries
	pnpm --filter @app/api arch

check: ## Biome check
	moon run :check

lint: ## Biome lint
	moon run :lint

format: ## Format sources
	moon run :format

typecheck: ## TypeScript typecheck all projects
	moon run :typecheck

test: ## Run all tests
	moon run :test

build: ## Build all projects
	moon run :build

ci: check typecheck test build ## Run the CI suite locally

up: ## Build and start the full Docker stack
	$(COMPOSE_PROD) up -d --build

down: ## Stop the full Docker stack
	$(COMPOSE_PROD) down

logs: ## Tail full stack logs
	$(COMPOSE_PROD) logs -f

image: ## Build the api/worker production image
	docker build --network=$(DOCKER_BUILD_NETWORK) -t debate-platform:$(shell node -p "require('./package.json').version") -t debate-platform:latest .

image-web: ## Build the web production image
	docker build --network=$(DOCKER_BUILD_NETWORK) -f apps/web/Dockerfile -t debate-platform-web:$(shell node -p "require('./package.json').version") -t debate-platform-web:latest .

image-run: ## Run the production image against local services
	docker run --rm -p 3001:3001 --env-file apps/api/.env debate-platform:latest

deploy-dry-run: ## Validate the Cloudflare Workers bundles
	pnpm --filter @app/api deploy:dry-run
	pnpm --filter @app/web deploy:dry-run
	pnpm --filter @app/worker deploy:dry-run

clean: ## Remove build artifacts and caches
	rm -rf apps/*/dist apps/*/coverage packages/*/dist .moon/cache
