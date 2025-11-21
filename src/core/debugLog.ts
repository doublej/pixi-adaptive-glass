type DebugFn = (label: string, detail?: string, data?: unknown) => void;

interface DebugOptions {
  onceKey?: string;
}

const onceRegistryKey = '__glassDebugOnceKeys';

function getGlobalLogger(): DebugFn | undefined {
  if (typeof globalThis === 'undefined') return undefined;
  const fn = (globalThis as { __glassDebugLog?: DebugFn }).__glassDebugLog;
  return typeof fn === 'function' ? fn : undefined;
}

function shouldSkip(onceKey?: string): boolean {
  if (!onceKey || typeof globalThis === 'undefined') return false;
  const globalObject = globalThis as { [onceRegistryKey]?: Set<string> };
  if (!globalObject[onceRegistryKey]) {
    globalObject[onceRegistryKey] = new Set<string>();
  }
  const registry = globalObject[onceRegistryKey]!;
  if (registry.has(onceKey)) {
    return true;
  }
  registry.add(onceKey);
  return false;
}

export function debugLog(label: string, detail?: string, data?: unknown, options?: DebugOptions): void {
  const logger = getGlobalLogger();
  if (!logger) {
    return;
  }
  if (shouldSkip(options?.onceKey)) {
    return;
  }
  try {
    logger(label, detail, data);
  } catch {
    // Swallow logging failures to keep rendering robust.
  }
}
