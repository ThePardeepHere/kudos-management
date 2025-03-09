.PHONY: build up down restart logs shell migrate fixtures superuser clean help

help:
	@echo "Available commands:"
	@echo "  make build      - Build all Docker images"
	@echo "  make up         - Start all services"
	@echo "  make down       - Stop all services"
	@echo "  make restart    - Restart all services"
	@echo "  make logs       - View logs from all services"
	@echo "  make shell      - Open backend shell"
	@echo "  make migrate    - Run database migrations"
	@echo "  make fixtures   - Generate and load fixtures"
	@echo "  make superuser  - Create superuser"
	@echo "  make clean      - Remove all containers and volumes"

build:
	docker-compose build

up:
	docker-compose up -d

down:
	docker-compose down

restart:
	docker-compose restart

logs:
	docker-compose logs -f

shell:
	docker-compose exec backend bash

migrate:
	docker-compose exec backend python manage.py migrate

fixtures:
	docker-compose exec backend python scripts/generate_fixtures.py
	docker-compose exec backend python manage.py loaddata fixtures/initial_data.json

superuser:
	docker-compose exec backend python manage.py createsuperuser

clean:
	docker-compose down -v
	docker system prune -f 