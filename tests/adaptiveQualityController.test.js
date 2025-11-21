import { describe, expect, it } from 'vitest';
import { AdaptiveQualityController } from '../src/core/AdaptiveQualityController.js';
const makeSample = (ms) => ({ cpuMs: ms, timestamp: performance.now() });
describe('AdaptiveQualityController', () => {
    it('reduces quality when frame budget exceeded', () => {
        const controller = new AdaptiveQualityController(16.6);
        for (let i = 0; i < 40; i += 1) {
            controller.record(makeSample(30));
        }
        const decision = controller.evaluate();
        expect(decision?.action).toBeDefined();
    });
    it('applies overrides to quality settings', () => {
        const controller = new AdaptiveQualityController();
        controller.setOverrides({ renderScale: 0.5, enableDispersion: false });
        const quality = controller.getQuality();
        expect(quality.renderScale).toBe(0.5);
        expect(quality.enableDispersion).toBeFalsy();
    });
});
