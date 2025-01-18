import { EventEmitter } from 'events';
import { prisma } from './prisma';

interface ErrorRecoveryOptions {
  maxRetries: number;
  retryDelay: number;
  exponentialBackoff: boolean;
  alertThreshold: number;
}

interface ErrorRecord {
  timestamp: Date;
  error: string;
  retryCount: number;
  resolved: boolean;
  resolution?: string;
}

export class ErrorRecoverySystem extends EventEmitter {
  private static instance: ErrorRecoverySystem;
  private errorLog: Map<string, ErrorRecord[]>;
  private options: ErrorRecoveryOptions;

  private constructor(options?: Partial<ErrorRecoveryOptions>) {
    super();
    this.errorLog = new Map();
    this.options = {
      maxRetries: 3,
      retryDelay: 5000,
      exponentialBackoff: true,
      alertThreshold: 5,
      ...options
    };

    // Setup event listeners
    this.on('error:recorded', this.handleErrorRecorded.bind(this));
    this.on('error:resolved', this.handleErrorResolved.bind(this));
  }

  public static getInstance(options?: Partial<ErrorRecoveryOptions>): ErrorRecoverySystem {
    if (!ErrorRecoverySystem.instance) {
      ErrorRecoverySystem.instance = new ErrorRecoverySystem(options);
    }
    return ErrorRecoverySystem.instance;
  }

  async recordError(targetId: string, error: Error): Promise<void> {
    if (!this.errorLog.has(targetId)) {
      this.errorLog.set(targetId, []);
    }

    const errors = this.errorLog.get(targetId)!;
    const errorRecord: ErrorRecord = {
      timestamp: new Date(),
      error: error.message,
      retryCount: 0,
      resolved: false
    };

    errors.push(errorRecord);
    this.emit('error:recorded', targetId, errorRecord);

    // Log to database
    await prisma.crawlerError.create({
      data: {
        targetId,
        error: error.message,
        stackTrace: error.stack,
        timestamp: errorRecord.timestamp
      }
    });
  }

  async resolveError(targetId: string, errorIndex: number, resolution: string): Promise<void> {
    const errors = this.errorLog.get(targetId);
    if (!errors || !errors[errorIndex]) return;

    errors[errorIndex].resolved = true;
    errors[errorIndex].resolution = resolution;
    this.emit('error:resolved', targetId, errors[errorIndex]);

    // Update database
    await prisma.crawlerError.updateMany({
      where: {
        targetId,
        timestamp: errors[errorIndex].timestamp
      },
      data: {
        resolved: true,
        resolution
      }
    });
  }

  async shouldRetry(targetId: string): Promise<boolean> {
    const errors = this.errorLog.get(targetId);
    if (!errors || errors.length === 0) return true;

    const recentErrors = errors.filter(
      e => e.timestamp > new Date(Date.now() - 15 * 60 * 1000) // Last 15 minutes
    );

    const lastError = recentErrors[recentErrors.length - 1];
    return lastError.retryCount < this.options.maxRetries;
  }

  getRetryDelay(retryCount: number): number {
    if (!this.options.exponentialBackoff) {
      return this.options.retryDelay;
    }

    return this.options.retryDelay * Math.pow(2, retryCount);
  }

  async getErrorStats(targetId: string): Promise<{
    total: number;
    resolved: number;
    unresolved: number;
    recentErrors: ErrorRecord[];
  }> {
    const errors = this.errorLog.get(targetId) || [];
    const recentErrors = errors.filter(
      e => e.timestamp > new Date(Date.now() - 24 * 60 * 60 * 1000) // Last 24 hours
    );

    return {
      total: errors.length,
      resolved: errors.filter(e => e.resolved).length,
      unresolved: errors.filter(e => !e.resolved).length,
      recentErrors
    };
  }

  private async handleErrorRecorded(targetId: string, error: ErrorRecord): Promise<void> {
    const stats = await this.getErrorStats(targetId);
    
    // Check if we need to alert based on error frequency
    if (stats.unresolved >= this.options.alertThreshold) {
      this.emit('alert:threshold_exceeded', {
        targetId,
        unresolved: stats.unresolved,
        threshold: this.options.alertThreshold
      });
    }
  }

  private async handleErrorResolved(targetId: string, error: ErrorRecord): Promise<void> {
    // Update target status if all errors are resolved
    const stats = await this.getErrorStats(targetId);
    if (stats.unresolved === 0) {
      await prisma.crawlTarget.update({
        where: { id: targetId },
        data: { status: 'ACTIVE' }
      });
    }
  }

  async clearErrors(targetId: string): Promise<void> {
    this.errorLog.delete(targetId);
    
    // Clear from database
    await prisma.crawlerError.deleteMany({
      where: { targetId }
    });
  }
} 