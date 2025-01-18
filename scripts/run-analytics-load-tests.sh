#!/bin/bash

# Set environment variables
export API_URL=${API_URL:-"http://localhost:3000/api"}

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
NC='\033[0m'

echo "Starting Analytics System Load Tests..."
echo "API URL: $API_URL"
echo

# Run k6 load tests
k6 run src/tests/performance/analytics.perf.ts

# Check the exit status
if [ $? -eq 0 ]; then
    echo -e "${GREEN}Load tests completed successfully!${NC}"
else
    echo -e "${RED}Load tests failed!${NC}"
    exit 1
fi 