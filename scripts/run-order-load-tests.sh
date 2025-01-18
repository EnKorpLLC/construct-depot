#!/bin/bash

# Set environment variables
export API_URL=${API_URL:-"http://localhost:3000/api"}
export K6_OUT="json=results/order-load-test.json,csv=results/order-load-test.csv"

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo "Starting Order Management Load Tests..."
echo "API URL: $API_URL"
echo

# Create results directory if it doesn't exist
mkdir -p results

# Run k6 load tests
echo -e "${YELLOW}Running load tests...${NC}"
k6 run src/tests/performance/order-management.perf.ts

# Check the exit status
if [ $? -eq 0 ]; then
    echo -e "${GREEN}Load tests completed successfully!${NC}"
    
    # Generate summary report
    echo -e "\n${YELLOW}Generating test summary...${NC}"
    node scripts/analyze-load-test-results.js results/order-load-test.json > results/order-load-test-summary.md
    
    echo -e "\n${GREEN}Test summary generated: results/order-load-test-summary.md${NC}"
    echo -e "\nDetailed results:"
    echo -e "- JSON: results/order-load-test.json"
    echo -e "- CSV: results/order-load-test.csv"
    echo -e "- Summary: results/order-load-test-summary.md"
else
    echo -e "${RED}Load tests failed!${NC}"
    exit 1
fi 