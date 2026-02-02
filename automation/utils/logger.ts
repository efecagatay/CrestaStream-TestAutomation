/**
 * CrestaStream Logger
 * Datadog/Grafana-like structured log formatter
 * Provides detailed logging for test observability
 */

type LogLevel = 'DEBUG' | 'INFO' | 'WARN' | 'ERROR' | 'ACTION';

interface LogEntry {
  timestamp: string;
  level: LogLevel;
  source: string;
  message: string;
  context?: Record<string, unknown>;
  traceId?: string;
  duration?: number;
}

interface LoggerOptions {
  minLevel?: LogLevel;
  enableConsole?: boolean;
  enableJson?: boolean;
  traceId?: string;
}

// ANSI color codes for terminal output
const Colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  dim: '\x1b[2m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
  white: '\x1b[37m',
  gray: '\x1b[90m',
};

const LevelColors: Record<LogLevel, string> = {
  DEBUG: Colors.gray,
  INFO: Colors.blue,
  WARN: Colors.yellow,
  ERROR: Colors.red,
  ACTION: Colors.green,
};

const LevelPriority: Record<LogLevel, number> = {
  DEBUG: 0,
  INFO: 1,
  ACTION: 2,
  WARN: 3,
  ERROR: 4,
};

/**
 * Structured logger class
 */
export class Logger {
  private readonly source: string;
  private readonly options: Required<LoggerOptions>;
  private static globalTraceId: string = '';
  private static testStartTime: number = 0;

  constructor(source: string, options: LoggerOptions = {}) {
    this.source = source;
    this.options = {
      minLevel: options.minLevel ?? 'DEBUG',
      enableConsole: options.enableConsole ?? true,
      enableJson: options.enableJson ?? false,
      traceId: options.traceId ?? Logger.globalTraceId,
    };
  }

  // ==================== STATIC METHODS ====================

  /**
   * Called at the start of a test
   */
  static startTest(testName: string): void {
    Logger.globalTraceId = `test-${Date.now()}-${Math.random().toString(36).substring(7)}`;
    Logger.testStartTime = Date.now();
    
    const entry: LogEntry = {
      timestamp: new Date().toISOString(),
      level: 'INFO',
      source: 'TestRunner',
      message: `═══════════════════════════════════════════════════════`,
      traceId: Logger.globalTraceId,
    };
    console.log(Logger.formatForConsole(entry));
    
    const startEntry: LogEntry = {
      timestamp: new Date().toISOString(),
      level: 'INFO',
      source: 'TestRunner',
      message: `🚀 TEST STARTED: ${testName}`,
      traceId: Logger.globalTraceId,
    };
    console.log(Logger.formatForConsole(startEntry));
  }

  /**
   * Called at the end of a test
   */
  static endTest(testName: string, status: 'PASSED' | 'FAILED' | 'SKIPPED'): void {
    const duration = Date.now() - Logger.testStartTime;
    const statusEmoji = status === 'PASSED' ? '✅' : status === 'FAILED' ? '❌' : '⏭️';
    
    const entry: LogEntry = {
      timestamp: new Date().toISOString(),
      level: status === 'FAILED' ? 'ERROR' : 'INFO',
      source: 'TestRunner',
      message: `${statusEmoji} TEST ${status}: ${testName}`,
      traceId: Logger.globalTraceId,
      duration,
    };
    console.log(Logger.formatForConsole(entry));
    
    const separator: LogEntry = {
      timestamp: new Date().toISOString(),
      level: 'INFO',
      source: 'TestRunner',
      message: `═══════════════════════════════════════════════════════\n`,
      traceId: Logger.globalTraceId,
    };
    console.log(Logger.formatForConsole(separator));
    
    Logger.globalTraceId = '';
  }

  /**
   * Static helper for console formatting
   */
  private static formatForConsole(entry: LogEntry): string {
    const color = LevelColors[entry.level];
    const timestamp = entry.timestamp.split('T')[1].split('.')[0];
    const durationStr = entry.duration ? ` (${entry.duration}ms)` : '';
    
    return `${Colors.dim}[${timestamp}]${Colors.reset} ${color}[${entry.level.padEnd(6)}]${Colors.reset} ${Colors.cyan}[${entry.source}]${Colors.reset} ${entry.message}${durationStr}`;
  }

  // ==================== LOGGING METHODS ====================

  /**
   * Log at debug level
   */
  debug(message: string, context?: Record<string, unknown>): void {
    this.log('DEBUG', message, context);
  }

  /**
   * Log at info level
   */
  info(message: string, context?: Record<string, unknown>): void {
    this.log('INFO', message, context);
  }

  /**
   * Log at warning level
   */
  warn(message: string, context?: Record<string, unknown>): void {
    this.log('WARN', message, context);
  }

  /**
   * Log at error level
   */
  error(message: string, context?: Record<string, unknown>): void {
    this.log('ERROR', message, context);
  }

  /**
   * Log at action level (for user actions)
   */
  action(message: string, context?: Record<string, unknown>): void {
    this.log('ACTION', `▶ ${message}`, context);
  }

  /**
   * Log an API request
   */
  apiRequest(method: string, url: string, body?: unknown): void {
    this.log('INFO', `📤 API Request: ${method} ${url}`, {
      method,
      url,
      body: body ? JSON.stringify(body).substring(0, 200) : undefined,
    });
  }

  /**
   * Log an API response
   */
  apiResponse(method: string, url: string, status: number, duration: number): void {
    const statusEmoji = status >= 200 && status < 300 ? '✅' : '❌';
    this.log('INFO', `📥 API Response: ${statusEmoji} ${method} ${url} - ${status} (${duration}ms)`, {
      method,
      url,
      status,
      duration,
    });
  }

  /**
   * Log an assertion
   */
  assertion(description: string, passed: boolean): void {
    const emoji = passed ? '✓' : '✗';
    const level: LogLevel = passed ? 'INFO' : 'ERROR';
    this.log(level, `${emoji} Assertion: ${description}`, { passed });
  }

  /**
   * Log a step (for test steps)
   */
  step(stepNumber: number, description: string): void {
    this.log('INFO', `📋 Step ${stepNumber}: ${description}`);
  }

  /**
   * Log when a screenshot is captured
   */
  screenshot(name: string, path: string): void {
    this.log('INFO', `📸 Screenshot captured: ${name}`, { path });
  }

  /**
   * Log a performance metric
   */
  performance(metricName: string, value: number, unit: string): void {
    this.log('INFO', `⏱️ Performance: ${metricName} = ${value}${unit}`, {
      metric: metricName,
      value,
      unit,
    });
  }

  // ==================== PRIVATE METHODS ====================

  /**
   * Main log method
   */
  private log(level: LogLevel, message: string, context?: Record<string, unknown>): void {
    if (LevelPriority[level] < LevelPriority[this.options.minLevel]) {
      return;
    }

    const entry: LogEntry = {
      timestamp: new Date().toISOString(),
      level,
      source: this.source,
      message,
      context,
      traceId: this.options.traceId || Logger.globalTraceId,
    };

    if (this.options.enableConsole) {
      console.log(this.formatForConsole(entry));
    }

    if (this.options.enableJson) {
      console.log(JSON.stringify(entry));
    }
  }

  /**
   * Create console format
   */
  private formatForConsole(entry: LogEntry): string {
    const color = LevelColors[entry.level];
    const timestamp = entry.timestamp.split('T')[1].split('.')[0];
    
    let output = `${Colors.dim}[${timestamp}]${Colors.reset} ${color}[${entry.level.padEnd(6)}]${Colors.reset} ${Colors.cyan}[${entry.source}]${Colors.reset} ${entry.message}`;
    
    if (entry.context && Object.keys(entry.context).length > 0) {
      output += ` ${Colors.dim}${JSON.stringify(entry.context)}${Colors.reset}`;
    }
    
    return output;
  }
}

/**
 * Child logger creator (for nested components)
 */
export function createChildLogger(parentSource: string, childName: string): Logger {
  return new Logger(`${parentSource}:${childName}`);
}

/**
 * Performance timer utility
 */
export class PerformanceTimer {
  private startTime: number;
  private readonly logger: Logger;
  private readonly operationName: string;

  constructor(operationName: string, source: string = 'Performance') {
    this.operationName = operationName;
    this.logger = new Logger(source);
    this.startTime = Date.now();
    this.logger.debug(`⏱️ Timer started: ${operationName}`);
  }

  /**
   * Stop the timer and log the duration
   */
  stop(): number {
    const duration = Date.now() - this.startTime;
    this.logger.performance(this.operationName, duration, 'ms');
    return duration;
  }

  /**
   * Take an intermediate measurement (timer continues)
   */
  lap(label: string): number {
    const duration = Date.now() - this.startTime;
    this.logger.debug(`⏱️ Lap [${label}]: ${duration}ms`);
    return duration;
  }
}

/**
 * Logger factory for test context
 */
export function createTestLogger(testName: string): Logger {
  Logger.startTest(testName);
  return new Logger('Test');
}
