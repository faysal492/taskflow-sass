import { Injectable, LoggerService as NestLoggerService } from '@nestjs/common';

export enum LogLevel {
  ERROR = 'error',
  WARN = 'warn',
  INFO = 'info',
  DEBUG = 'debug',
}

@Injectable()
export class CustomLoggerService implements NestLoggerService {
  log(message: string, context?: string) {
    this.printMessage(LogLevel.INFO, message, context);
  }

  error(message: string, trace?: string, context?: string) {
    this.printMessage(LogLevel.ERROR, message, context, trace);
  }

  warn(message: string, context?: string) {
    this.printMessage(LogLevel.WARN, message, context);
  }

  debug(message: string, context?: string) {
    this.printMessage(LogLevel.DEBUG, message, context);
  }

  private printMessage(
    level: LogLevel,
    message: string,
    context?: string,
    trace?: string,
  ) {
    const timestamp = new Date().toISOString();
    const contextString = context ? `[${context}]` : '';
    const logMessage = `${timestamp} [${level.toUpperCase()}] ${contextString} ${message}`;
    
    console.log(logMessage);
    
    if (trace) {
      console.log(trace);
    }
  }
}
