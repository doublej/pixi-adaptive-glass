type Listener<T> = (payload: T) => void;

type EventMap = Record<string, unknown>;

export class EventBus<Events extends EventMap> {
  private listeners: { [K in keyof Events]?: Set<Listener<Events[K]>> } = {};

  on<K extends keyof Events>(event: K, listener: Listener<Events[K]>): void {
    let listeners = this.listeners[event];
    if (!listeners) {
      listeners = new Set();
      this.listeners[event] = listeners;
    }
    listeners.add(listener);
  }

  off<K extends keyof Events>(event: K, listener: Listener<Events[K]>): void {
    this.listeners[event]?.delete(listener);
  }

  emit<K extends keyof Events>(event: K, payload: Events[K]): void {
    const listeners = this.listeners[event];
    if (!listeners) return;
    for (const listener of listeners) {
      listener(payload);
    }
  }

  removeAll(): void {
    for (const key of Object.keys(this.listeners) as Array<keyof Events>) {
      this.listeners[key]?.clear();
    }
  }
}
