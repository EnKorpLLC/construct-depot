interface RateLimiterOptions {
  tokensPerInterval: number;
  interval: 'second' | 'minute' | 'hour';
}

export class RateLimiter {
  private tokens: number;
  private lastRefill: number;
  private readonly tokensPerInterval: number;
  private readonly interval: number;

  constructor(options: RateLimiterOptions) {
    this.tokens = options.tokensPerInterval;
    this.tokensPerInterval = options.tokensPerInterval;
    this.lastRefill = Date.now();

    // Convert interval to milliseconds
    switch (options.interval) {
      case 'second':
        this.interval = 1000;
        break;
      case 'minute':
        this.interval = 60 * 1000;
        break;
      case 'hour':
        this.interval = 60 * 60 * 1000;
        break;
      default:
        throw new Error('Invalid interval');
    }
  }

  private refillTokens(): void {
    const now = Date.now();
    const timePassed = now - this.lastRefill;
    const intervalsPassed = Math.floor(timePassed / this.interval);

    if (intervalsPassed > 0) {
      this.tokens = Math.min(
        this.tokensPerInterval,
        this.tokens + (intervalsPassed * this.tokensPerInterval)
      );
      this.lastRefill = now;
    }
  }

  async removeTokens(count: number): Promise<void> {
    return new Promise((resolve, reject) => {
      const attempt = () => {
        this.refillTokens();

        if (this.tokens >= count) {
          this.tokens -= count;
          resolve();
        } else {
          const timeUntilRefill = this.interval - (Date.now() - this.lastRefill);
          setTimeout(attempt, timeUntilRefill);
        }
      };

      attempt();
    });
  }

  getTokens(): number {
    this.refillTokens();
    return this.tokens;
  }
} 