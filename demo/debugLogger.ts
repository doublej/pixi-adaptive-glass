export interface DebugLogger {
  log: (label: string, detail?: string, data?: unknown, options?: { onceKey?: string }) => void;
  value: string;
  onUpdate: (callback: () => void) => void;
}

export function createDebugLogger(limit = 8): DebugLogger {
  const entries: string[] = [];
  const onceKeys = new Set<string>();
  const listeners = new Set<() => void>();

  const formatTime = () => {
    const date = new Date();
    return date.toLocaleTimeString(undefined, {
      hour12: false,
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
  };

  const updateValue = () => {
    return entries.join('\n');
  };

  const log = (
    label: string,
    detail?: string,
    data?: unknown,
    options?: { onceKey?: string },
  ) => {
    if (options?.onceKey) {
      if (onceKeys.has(options.onceKey)) return;
      onceKeys.add(options.onceKey);
    }

    const time = formatTime();
    const line = `${time} ${label}${detail ? ` — ${detail}` : ''}`;
    entries.unshift(line);
    if (entries.length > limit) {
      entries.pop();
    }
    
    notifyListeners();

    if (data !== undefined) {
      console.debug(`[glass-debug] ${label}${detail ? ` — ${detail}` : ''}`, data);
    } else if (detail) {
      console.debug(`[glass-debug] ${label} — ${detail}`);
    } else {
      console.debug(`[glass-debug] ${label}`);
    }
  };

  const notifyListeners = () => {
    for (const listener of listeners) {
      listener();
    }
  };

  return {
    log,
    get value() {
      return updateValue();
    },
    onUpdate: (cb) => {
      listeners.add(cb);
    },
  };
}
