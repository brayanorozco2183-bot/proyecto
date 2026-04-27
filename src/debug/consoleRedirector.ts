import fs from 'fs';
import path from 'path';

export class ConsoleRedirector {
  private originalStdoutWrite: (str: string | Uint8Array, encoding?: BufferEncoding, cb?: (err?: Error) => void) => boolean;
  private originalStderrWrite: (str: string | Uint8Array, encoding?: BufferEncoding, cb?: (err?: Error) => void) => boolean;
  private logStream: fs.WriteStream | null = null;
  private isActive = false;

  constructor() {
    this.originalStdoutWrite = process.stdout.write.bind(process.stdout);
    this.originalStderrWrite = process.stderr.write.bind(process.stderr);
  }

  public start(dir: string, fileName = 'mission_logs.txt'): void {
    if (this.isActive) return;

    try {
      const logPath = path.join(dir, fileName);
      this.logStream = fs.createWriteStream(logPath, { flags: 'a', encoding: 'utf8' });

      // Override stdout
      process.stdout.write = ((chunk: any, encoding?: any, callback?: any): boolean => {
        const str = chunk.toString();
        if (this.logStream) this.logStream.write(str);
        return this.originalStdoutWrite(chunk, encoding, callback);
      }) as any;

      // Override stderr
      process.stderr.write = ((chunk: any, encoding?: any, callback?: any): boolean => {
        const str = chunk.toString();
        if (this.logStream) this.logStream.write(str);
        return this.originalStderrWrite(chunk, encoding, callback);
      }) as any;

      this.isActive = true;
      console.log(`[LOG] Redirección de consola activa. Destino: ${logPath}`);
    } catch (err) {
      console.error(`[ERROR] No se pudo iniciar la redirección de consola: ${err}`);
    }
  }

  public stop(): void {
    if (!this.isActive) return;

    process.stdout.write = this.originalStdoutWrite;
    process.stderr.write = this.originalStderrWrite;

    if (this.logStream) {
      this.logStream.end();
      this.logStream = null;
    }

    this.isActive = false;
    console.log(`[LOG] Redirección de consola finalizada.`);
  }
}

export const consoleRedirector = new ConsoleRedirector();
