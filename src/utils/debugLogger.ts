import fs from 'fs';
import path from 'path';
import util from 'util';

let logStream: fs.WriteStream | null = null;
const originalConsole = {
  log: console.log,
  warn: console.warn,
  error: console.error,
  info: console.info,
  debug: console.debug
};

/**
 * Intercepts console methods and writes output to a file in the provided directory.
 * Output is still displayed in the terminal.
 */
export function startDebugLogging(artifactsDir: string): string {
  const logFilePath = path.join(artifactsDir, 'mission_execution.txt');
  
  // Ensure we don't have multiple streams open
  if (logStream) {
    logStream.end();
  }

  logStream = fs.createWriteStream(logFilePath, { flags: 'a', encoding: 'utf8' });

  const writeToLog = (type: string, ...args: any[]) => {
    const timestamp = new Date().toISOString();
    const formattedMessage = util.format(...args);
    const logLine = `[${timestamp}] [${type.toUpperCase()}] ${formattedMessage}\n`;
    
    if (logStream && logStream.writable) {
      logStream.write(logLine);
    }
  };

  // Override console methods
  console.log = (...args: any[]) => {
    originalConsole.log(...args);
    writeToLog('log', ...args);
  };

  console.warn = (...args: any[]) => {
    originalConsole.warn(...args);
    writeToLog('warn', ...args);
  };

  console.error = (...args: any[]) => {
    originalConsole.error(...args);
    writeToLog('error', ...args);
  };

  console.info = (...args: any[]) => {
    originalConsole.info(...args);
    writeToLog('info', ...args);
  };

  console.debug = (...args: any[]) => {
    originalConsole.debug(...args);
    writeToLog('debug', ...args);
  };

  console.log(`[LOGGER] Redirección de logs activa: ${logFilePath}`);
  return logFilePath;
}

/**
 * Restores original console methods and closes the log stream.
 */
export function stopDebugLogging(): void {
  // Restore original methods
  console.log = originalConsole.log;
  console.warn = originalConsole.warn;
  console.error = originalConsole.error;
  console.info = originalConsole.info;
  console.debug = originalConsole.debug;

  if (logStream) {
    logStream.write(`\n[${new Date().toISOString()}] [SYSTEM] Sesión de log finalizada.\n`);
    logStream.end();
    logStream = null;
    console.log('[LOGGER] Redirección de logs finalizada.');
  }
}
