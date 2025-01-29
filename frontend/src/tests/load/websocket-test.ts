import { Worker, isMainThread, parentPort, workerData } from 'worker_threads';
import WebSocket from 'ws';
import { performance } from 'perf_hooks';
import ws from 'k6/ws';
import { check } from 'k6';
import { Rate, Trend } from 'k6/metrics';

interface TestMetrics {
  connections: number;
  messagesSent: number;
  messagesReceived: number;
  errors: number;
  latencies: number[];
}

// Worker thread function
function runWorker(data: { id: number; connections: number }) {
  const metrics: TestMetrics = {
    connections: 0,
    messagesSent: 0,
    messagesReceived: 0,
    errors: 0,
    latencies: [],
  };

  const connections: WebSocket[] = [];

  // Create WebSocket connections
  for (let i = 0; i < data.connections; i++) {
    const ws = new WebSocket('wss://api.bulkbuyergroup.com/ws');
    
    ws.on('open', () => {
      metrics.connections++;
      // Send initial message
      const timestamp = performance.now();
      ws.send(JSON.stringify({ type: 'ping', timestamp }));
      metrics.messagesSent++;
    });

    ws.on('message', (data: string) => {
      const message = JSON.parse(data);
      if (message.type === 'pong') {
        const latency = performance.now() - message.timestamp;
        metrics.latencies.push(latency);
      }
      metrics.messagesReceived++;
    });

    ws.on('error', (error) => {
      metrics.errors++;
      console.error(`Worker ${data.id} WebSocket error:`, error);
    });

    connections.push(ws);
  }

  // Report metrics every second
  const interval = setInterval(() => {
    parentPort?.postMessage(metrics);
  }, 1000);

  // Cleanup after 5 minutes
  setTimeout(() => {
    clearInterval(interval);
    connections.forEach(ws => ws.close());
    parentPort?.postMessage({ type: 'done', metrics });
  }, 5 * 60 * 1000);
}

// Main thread
if (isMainThread) {
  class WebSocketLoadTest {
    private workers: Worker[] = [];
    private metrics: TestMetrics = {
      connections: 0,
      messagesSent: 0,
      messagesReceived: 0,
      errors: 0,
      latencies: [],
    };

    async runTest(totalConnections: number, workerCount: number) {
      const connectionsPerWorker = Math.ceil(totalConnections / workerCount);
      
      console.log(`Starting WebSocket load test with ${totalConnections} connections across ${workerCount} workers`);
      
      // Create workers
      for (let i = 0; i < workerCount; i++) {
        const worker = new Worker(__filename, {
          workerData: { id: i, connections: connectionsPerWorker }
        });

        worker.on('message', (message) => {
          if (message.type === 'done') {
            this.aggregateMetrics(message.metrics);
            worker.terminate();
          } else {
            this.aggregateMetrics(message);
          }
        });

        this.workers.push(worker);
      }

      // Wait for all workers to complete
      await Promise.all(this.workers.map(worker => 
        new Promise(resolve => worker.on('exit', resolve))
      ));

      this.printResults();
    }

    private aggregateMetrics(workerMetrics: TestMetrics) {
      this.metrics.connections += workerMetrics.connections;
      this.metrics.messagesSent += workerMetrics.messagesSent;
      this.metrics.messagesReceived += workerMetrics.messagesReceived;
      this.metrics.errors += workerMetrics.errors;
      this.metrics.latencies.push(...workerMetrics.latencies);
    }

    private printResults() {
      const latencies = this.metrics.latencies;
      latencies.sort((a, b) => a - b);
      
      console.log('\nWebSocket Load Test Results:');
      console.log('----------------------------');
      console.log(`Total Connections: ${this.metrics.connections}`);
      console.log(`Messages Sent: ${this.metrics.messagesSent}`);
      console.log(`Messages Received: ${this.metrics.messagesReceived}`);
      console.log(`Errors: ${this.metrics.errors}`);
      console.log('\nLatency Statistics (ms):');
      console.log(`Min: ${Math.min(...latencies).toFixed(2)}`);
      console.log(`Max: ${Math.max(...latencies).toFixed(2)}`);
      console.log(`Average: ${(latencies.reduce((a, b) => a + b, 0) / latencies.length).toFixed(2)}`);
      console.log(`Median: ${latencies[Math.floor(latencies.length / 2)].toFixed(2)}`);
      console.log(`95th Percentile: ${latencies[Math.floor(latencies.length * 0.95)].toFixed(2)}`);
      console.log(`99th Percentile: ${latencies[Math.floor(latencies.length * 0.99)].toFixed(2)}`);
      
      // Verify test success
      const successRate = (this.metrics.messagesReceived / this.metrics.messagesSent) * 100;
      const avgLatency = latencies.reduce((a, b) => a + b, 0) / latencies.length;
      const p95Latency = latencies[Math.floor(latencies.length * 0.95)];
      
      console.log('\nSuccess Criteria:');
      console.log(`Success Rate: ${successRate.toFixed(2)}% (Target: >95%)`);
      console.log(`Average Latency: ${avgLatency.toFixed(2)}ms (Target: <100ms)`);
      console.log(`95th Percentile Latency: ${p95Latency.toFixed(2)}ms (Target: <500ms)`);
      
      const passed = successRate > 95 && avgLatency < 100 && p95Latency < 500;
      console.log(`\nTest ${passed ? 'PASSED' : 'FAILED'}`);
    }
  }

  // Export the test runner
  export const webSocketLoadTest = new WebSocketLoadTest();
} else {
  // Run worker
  runWorker(workerData);
}

const wsLatency = new Trend('ws_latency');
const errorRate = new Rate('errors');

export const options = {
  stages: [
    { duration: '1m', target: 100 },  // Ramp up to 100 concurrent connections
    { duration: '3m', target: 100 },  // Stay at 100 connections
    { duration: '1m', target: 0 },    // Ramp down to 0
  ],
  thresholds: {
    'ws_latency': ['p95<100'],       // 95% of messages should be below 100ms
    'errors': ['rate<0.01'],         // Error rate should be below 1%
  },
};

const WS_URL = __ENV.WS_URL || 'ws://localhost:3000';

export default function() {
  const url = `${WS_URL}/ws`;
  
  const res = ws.connect(url, {}, function(socket) {
    socket.on('open', () => {
      // Subscribe to order updates
      socket.send(JSON.stringify({
        type: 'subscribe',
        channel: 'order_updates'
      }));

      // Measure ping-pong latency
      const start = Date.now();
      socket.send(JSON.stringify({ type: 'ping' }));

      socket.on('message', (data) => {
        const message = JSON.parse(data);
        if (message.type === 'pong') {
          wsLatency.add(Date.now() - start);
        }
      });

      // Send test messages
      for (let i = 0; i < 10; i++) {
        const msgStart = Date.now();
        socket.send(JSON.stringify({
          type: 'message',
          content: `Test message ${i}`
        }));
        wsLatency.add(Date.now() - msgStart);
      }
    });

    socket.on('error', () => {
      errorRate.add(1);
    });

    // Stay connected for 10 seconds
    socket.setTimeout(function() {
      socket.close();
    }, 10000);
  });

  check(res, { 'status is 101': (r) => r && r.status === 101 });
} 