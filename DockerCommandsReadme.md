# Docker Commands Guide

This guide explains how to use Docker with this project, including both Makefile shortcuts and direct Docker commands.

## Quick Start with Make Commands

The project includes a Makefile for simplified operations. Here are the available commands:

```bash
make help      # Show all available make commands
make build     # Build all Docker images
make up        # Start all services in detached mode
make down      # Stop all services
make restart   # Restart all services
make logs      # View logs from all services
make shell     # Open backend shell
make migrate   # Run database migrations
make fixtures  # Generate and load fixtures
make superuser # Create superuser
make clean     # Remove all containers and volumes
```

## Common Development Workflows

### First Time Setup
```bash
# 1. Build all services
make build

# 2. Start all services
make up

# 3. Run database migrations
make migrate

# 4. Load initial data
make fixtures

# 5. Create admin user
make superuser
```

### Daily Development
```bash
# Start services
make up

# View logs
make logs

# Access backend shell if needed
make shell

# Stop services when done
make down
```

## Detailed Docker Commands

If you prefer using Docker commands directly, here are the equivalent commands:

### Building and Running
```bash
# Build all services
docker-compose build

# Build specific service
docker-compose build backend
docker-compose build frontend

# Start all services
docker-compose up

# Start in detached mode
docker-compose up -d

# Start specific services
docker-compose up backend frontend
docker-compose up redis celery_worker celery_beat

# Start with rebuild
docker-compose up --build
```

### Container Management
```bash
# Stop all services
docker-compose down

# Stop and remove volumes
docker-compose down -v

# View running containers
docker-compose ps

# View logs
docker-compose logs -f                # All services
docker-compose logs -f backend        # Backend only
docker-compose logs -f celery_worker  # Celery worker
docker-compose logs -f celery_beat    # Celery beat
```

### Database Operations
```bash
# Run migrations
docker-compose exec backend python manage.py migrate

# Generate and load fixtures
docker-compose exec backend python scripts/generate_fixtures.py
docker-compose exec backend python manage.py loaddata fixtures/initial_data.json

# Create superuser
docker-compose exec backend python manage.py createsuperuser
```

### Shell Access
```bash
# Backend Python shell
docker-compose exec backend python manage.py shell

# Backend bash shell
docker-compose exec backend bash

# Frontend shell
docker-compose exec frontend sh
```

### Dependency Management
```bash
# Update backend dependencies
docker-compose exec backend pip install -r requirements.txt

# Update frontend dependencies
docker-compose exec frontend npm install
```

### Cleanup Commands
```bash
# Remove all stopped containers
docker-compose rm -f

# Remove all unused images
docker system prune -a

# Remove unused volumes
docker volume prune
```

### Redis Management
```bash
# Access Redis CLI
docker-compose exec redis redis-cli

# Monitor Redis
docker-compose exec redis redis-cli monitor

# Clear Redis cache
docker-compose exec redis redis-cli FLUSHALL
```

## Service-Specific Commands

### Backend Service
```bash
# Restart backend
docker-compose restart backend

# View backend logs
docker-compose logs -f backend

# Run Django management commands
docker-compose exec backend python manage.py [command]
```

### Celery Services
```bash
# Restart Celery worker
docker-compose restart celery_worker

# Restart Celery beat
docker-compose restart celery_beat

# View Celery logs
docker-compose logs -f celery_worker
docker-compose logs -f celery_beat
```

### Frontend Service
```bash
# Restart frontend
docker-compose restart frontend

# View frontend logs
docker-compose logs -f frontend

# Run npm commands
docker-compose exec frontend npm [command]
```

## Troubleshooting

### Common Issues and Solutions

1. **Services won't start**
   ```bash
   # Check service status
   docker-compose ps
   
   # View error logs
   docker-compose logs -f
   ```

2. **Database issues**
   ```bash
   # Reset database
   make down
   make up
   make migrate
   make fixtures
   ```

3. **Redis connection issues**
   ```bash
   # Clear Redis cache
   docker-compose exec redis redis-cli FLUSHALL
   
   # Restart Redis
   docker-compose restart redis
   ```

4. **Container taking up too much space**
   ```bash
   # Clean up unused resources
   make clean
   ```

## Environment Variables

The project uses environment variables from `.env` file. Make sure this file exists and contains the necessary configurations:

- Backend settings (Django, Celery)
- Frontend settings (API URLs)
- Redis connection settings

## Additional Notes

- The `make` commands are shortcuts for commonly used Docker commands
- Use `docker-compose ps` to check the status of your services
- Use `docker-compose logs -f [service]` to debug specific services
- Always use `make down` before switching branches or making major changes 