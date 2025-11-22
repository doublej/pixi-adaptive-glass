import type { GlassPanel } from '../panels/GlassPanel.js';
import type { TrackedItem } from './types.js';
export type SyncElementFn = (element: HTMLElement, panel: GlassPanel) => void;
export type UpdateGeometryFn = (element: HTMLElement, item: TrackedItem) => void;
export type IsCssVisibleFn = (element: HTMLElement) => boolean;
export type ParseBorderRadiusFn = (element: HTMLElement, rect: DOMRect) => number;
export interface DomTrackingCallbacks {
    syncElement: SyncElementFn;
    updateGeometry: UpdateGeometryFn;
    isCssVisible: IsCssVisibleFn;
    parseBorderRadius: ParseBorderRadiusFn;
}
export declare class DomTrackingController {
    private resizeObserver?;
    private intersectionObserver?;
    private observer?;
    private tracked;
    private callbacks;
    constructor(tracked: Map<HTMLElement, TrackedItem>, callbacks: DomTrackingCallbacks);
    setupObservers(selector: string, trackFn: (el: HTMLElement) => void, untrackFn: (el: HTMLElement) => void, cleanupFn: () => void): void;
    observeElement(element: HTMLElement): void;
    unobserveElement(element: HTMLElement): void;
    destroy(): void;
}
export declare function createAnimationHandlers(tracked: Map<HTMLElement, TrackedItem>, syncElement: SyncElementFn, updateGeometry: UpdateGeometryFn): {
    handleAnimationStart: (e: Event) => void;
    handleAnimationEnd: (e: Event) => void;
};
