import { describe, expect, it } from 'vitest';
import { EventBus } from '../src/core/EventBus.js';
describe('EventBus', () => {
    it('registers and emits events', () => {
        const bus = new EventBus();
        let received = 0;
        bus.on('test', value => {
            received = value;
        });
        bus.emit('test', 42);
        expect(received).toBe(42);
    });
});
