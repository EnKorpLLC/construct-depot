#!/usr/bin/env node

const fs = require('fs');

function formatDuration(ms) {
  return `${(ms / 1000).toFixed(2)}s`;
}

function formatPercentage(value) {
  return `${(value * 100).toFixed(2)}%`;
}

function analyzeResults(results) {
  const metrics = results.metrics;
  
  // Analyze HTTP metrics
  const httpMetrics = {
    totalRequests: metrics.http_reqs.values.count,
    failedRequests: metrics.http_req_failed.values.count,
    avgResponseTime: metrics.http_req_duration.values.avg,
    p95ResponseTime: metrics.http_req_duration.values.p95,
    p99ResponseTime: metrics.http_req_duration.values.p99
  };

  // Analyze custom metrics
  const orderMetrics = {
    totalOrders: metrics.order_requests.values.count,
    creationSuccess: metrics.order_creation_success.values.rate,
    avgProcessingTime: metrics.order_processing_time.values.avg,
    p95ProcessingTime: metrics.order_processing_time.values.p95,
    poolingSuccess: metrics.pooling_success.values.rate
  };

  // Analyze WebSocket metrics
  const wsMetrics = {
    totalConnections: metrics.websocket_connections.values.count
  };

  return {
    httpMetrics,
    orderMetrics,
    wsMetrics,
    duration: results.state.testRunDurationMs
  };
}

function generateMarkdownReport(analysis) {
  return `# Order Management Load Test Results

## Test Overview
- **Duration**: ${formatDuration(analysis.duration)}
- **Total Requests**: ${analysis.httpMetrics.totalRequests}
- **Failed Requests**: ${analysis.httpMetrics.failedRequests}
- **Failure Rate**: ${formatPercentage(analysis.httpMetrics.failedRequests / analysis.httpMetrics.totalRequests)}

## HTTP Performance
- **Average Response Time**: ${formatDuration(analysis.httpMetrics.avgResponseTime)}
- **P95 Response Time**: ${formatDuration(analysis.httpMetrics.p95ResponseTime)}
- **P99 Response Time**: ${formatDuration(analysis.httpMetrics.p99ResponseTime)}

## Order Processing
- **Total Orders**: ${analysis.orderMetrics.totalOrders}
- **Creation Success Rate**: ${formatPercentage(analysis.orderMetrics.creationSuccess)}
- **Average Processing Time**: ${formatDuration(analysis.orderMetrics.avgProcessingTime)}
- **P95 Processing Time**: ${formatDuration(analysis.orderMetrics.p95ProcessingTime)}
- **Pooling Success Rate**: ${formatPercentage(analysis.orderMetrics.poolingSuccess)}

## WebSocket Performance
- **Total Connections**: ${analysis.wsMetrics.totalConnections}

## Performance Analysis

### Response Time Analysis
${analysis.httpMetrics.p95ResponseTime > 1000 ? '⚠️ P95 response time exceeds 1s threshold' : '✅ Response times within acceptable range'}
${analysis.httpMetrics.failedRequests > 0 ? `⚠️ ${analysis.httpMetrics.failedRequests} failed requests detected` : '✅ No failed requests'}

### Order Processing Analysis
${analysis.orderMetrics.creationSuccess < 0.95 ? '⚠️ Order creation success rate below 95%' : '✅ Order creation success rate acceptable'}
${analysis.orderMetrics.poolingSuccess < 0.90 ? '⚠️ Order pooling success rate below 90%' : '✅ Order pooling success rate acceptable'}

## Recommendations

${generateRecommendations(analysis)}`;
}

function generateRecommendations(analysis) {
  const recommendations = [];

  if (analysis.httpMetrics.p95ResponseTime > 1000) {
    recommendations.push('- Optimize API endpoint performance');
    recommendations.push('- Consider implementing request caching');
    recommendations.push('- Review database query optimization');
  }

  if (analysis.httpMetrics.failedRequests > 0) {
    recommendations.push('- Investigate cause of failed requests');
    recommendations.push('- Implement retry mechanisms');
    recommendations.push('- Review error handling');
  }

  if (analysis.orderMetrics.creationSuccess < 0.95) {
    recommendations.push('- Review order creation validation');
    recommendations.push('- Optimize database operations');
    recommendations.push('- Consider implementing circuit breakers');
  }

  if (analysis.orderMetrics.poolingSuccess < 0.90) {
    recommendations.push('- Review pooling logic');
    recommendations.push('- Optimize pool matching algorithm');
    recommendations.push('- Consider implementing batch processing');
  }

  if (recommendations.length === 0) {
    recommendations.push('- System performance is within acceptable parameters');
    recommendations.push('- Continue monitoring for potential improvements');
  }

  return recommendations.join('\n');
}

// Main execution
const inputFile = process.argv[2];
if (!inputFile) {
  console.error('Please provide the input JSON file path');
  process.exit(1);
}

try {
  const results = JSON.parse(fs.readFileSync(inputFile, 'utf8'));
  const analysis = analyzeResults(results);
  const report = generateMarkdownReport(analysis);
  console.log(report);
} catch (error) {
  console.error('Error processing results:', error);
  process.exit(1);
} 