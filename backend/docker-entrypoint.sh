#!/bin/bash

# Wait for Redis to be ready
until python -c "import redis; redis.Redis(host='redis', port=6379).ping()" 2>/dev/null; do
  echo "Waiting for Redis..."
  sleep 1
done

# Apply database migrations
python manage.py migrate



# Start the application based on the command
exec "$@" 