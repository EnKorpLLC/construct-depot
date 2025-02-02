// Basic performance monitoring implementation
export const performanceMonitor = {
  start(operation: string): void {
    console.time(`[Performance] ${operation}`);
  },

  end(operation: string): void {
    console.timeEnd(`[Performance] ${operation}`);
  },

  async track<T>(operation: string, fn: () => Promise<T>): Promise<T> {
    this.start(operation);
    try {
      const result = await fn();
      return result;
    } finally {
      this.end(operation);
    }
  },

  logMetrics(operation: string, metrics: Record<string, any>): void {
    console.log(`[Metrics] ${operation}:`, metrics);
  },

  logError(operation: string, error: unknown): void {
    console.error(`[Error] ${operation}:`, {
      message: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined
    });
  }
}; 