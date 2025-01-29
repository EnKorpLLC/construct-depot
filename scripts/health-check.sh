#!/bin/bash

API_URL=$1
MAX_RETRIES=30
RETRY_INTERVAL=10

echo "Starting health checks for $API_URL"

for i in $(seq 1 $MAX_RETRIES); do
    response=$(curl -s -o /dev/null -w "%{http_code}" $API_URL/health)
    
    if [ $response -eq 200 ]; then
        echo "Health check passed after $i attempts"
        exit 0
    fi
    
    echo "Attempt $i of $MAX_RETRIES failed with status $response"
    
    if [ $i -lt $MAX_RETRIES ]; then
        echo "Retrying in $RETRY_INTERVAL seconds..."
        sleep $RETRY_INTERVAL
    fi
done

echo "Health check failed after $MAX_RETRIES attempts"
exit 1 