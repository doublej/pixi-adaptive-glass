type Listener<T> = (payload: T) => void;
type EventMap = Record<string, unknown>;
export declare class EventBus<Events extends EventMap> {
    private listeners;
    on<K extends keyof Events>(event: K, listener: Listener<Events[K]>): void;
    off<K extends keyof Events>(event: K, listener: Listener<Events[K]>): void;
    emit<K extends keyof Events>(event: K, payload: Events[K]): void;
    removeAll(): void;
}
export {};
