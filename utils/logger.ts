export function logInfo(message: string, ...args: any[]): void {
  console.log(`[INFO] ${message}`, ...args);
}

export function logError(message: string, ...args: any[]): void {
  console.error(`[ERROR] ${message}`, ...args);
}

export function logWarn(message: string, ...args: any[]): void {
  console.warn(`[WARN] ${message}`, ...args);
}
