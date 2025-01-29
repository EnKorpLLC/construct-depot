export class RateLimiter {
  private lastRequestTime: number = 0;
  private requestInterval: number = 1000; // Default 1 second

  constructor(requestsPerMinute: number = 60) {
    this.requestInterval = 60000 / requestsPerMinute;
  }

  async wait(): Promise<void> {
    const now = Date.now();
    const timeSinceLastRequest = now - this.lastRequestTime;
    
    if (timeSinceLastRequest < this.requestInterval) {
      const delay = this.requestInterval - timeSinceLastRequest;
      await new Promise(resolve => setTimeout(resolve, delay));
    }
    
    this.lastRequestTime = Date.now();
  }

  setRequestsPerMinute(requestsPerMinute: number): void {
    this.requestInterval = 60000 / requestsPerMinute;
  }
} 