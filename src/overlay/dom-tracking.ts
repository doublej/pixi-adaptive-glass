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

export class DomTrackingController {
  private resizeObserver?: ResizeObserver;
  private intersectionObserver?: IntersectionObserver;
  private observer?: MutationObserver;
  private tracked: Map<HTMLElement, TrackedItem>;
  private callbacks: DomTrackingCallbacks;

  constructor(tracked: Map<HTMLElement, TrackedItem>, callbacks: DomTrackingCallbacks) {
    this.tracked = tracked;
    this.callbacks = callbacks;
  }

  setupObservers(selector: string, trackFn: (el: HTMLElement) => void, untrackFn: (el: HTMLElement) => void, cleanupFn: () => void): void {
    // Set up ResizeObserver for size changes
    this.resizeObserver = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const element = entry.target as HTMLElement;
        const item = this.tracked.get(element);
        if (!item) continue;

        const rect = element.getBoundingClientRect();
        const lastRect = item.lastRect;

        // Check if size changed significantly (more than 1px)
        if (lastRect && (
          Math.abs(rect.width - lastRect.width) > 1 ||
          Math.abs(rect.height - lastRect.height) > 1
        )) {
          this.callbacks.updateGeometry(element, item);
        }
        item.lastRect = rect;
      }
    });

    // Set up IntersectionObserver for visibility
    this.intersectionObserver = new IntersectionObserver((entries) => {
      for (const entry of entries) {
        const element = entry.target as HTMLElement;
        const item = this.tracked.get(element);
        if (!item) continue;

        item.visible = entry.isIntersecting;
        const cssVisible = this.callbacks.isCssVisible(element);
        item.panel.visible = item.visible && cssVisible;
      }
    });

    // Mount existing elements
    const existing = document.querySelectorAll<HTMLElement>(selector);
    existing.forEach((el) => trackFn(el));

    // Set up MutationObserver
    this.observer = new MutationObserver((mutations) => {
      for (const mutation of mutations) {
        if (mutation.type === 'childList') {
          mutation.addedNodes.forEach((node) => {
            if (node instanceof HTMLElement && node.matches(selector)) {
              trackFn(node);
            }
            if (node instanceof HTMLElement) {
              const children = node.querySelectorAll<HTMLElement>(selector);
              children.forEach((child) => trackFn(child));
            }
          });
          mutation.removedNodes.forEach((node) => {
            if (node instanceof HTMLElement && this.tracked.has(node)) {
              untrackFn(node);
            }
          });
        } else if (mutation.type === 'attributes') {
          const target = mutation.target as HTMLElement;
          if (mutation.attributeName === 'class') {
            if (target.matches(selector)) {
              trackFn(target);
            } else {
              untrackFn(target);
            }
          } else if (mutation.attributeName === 'style') {
            const item = this.tracked.get(target);
            if (item) {
              // Check for visibility changes
              const cssVisible = this.callbacks.isCssVisible(target);
              item.panel.visible = cssVisible && item.visible;

              // Check for border-radius changes
              const rect = target.getBoundingClientRect();
              const newRadius = this.callbacks.parseBorderRadius(target, rect);
              if (Math.abs(newRadius - item.lastRadius) > 0.5) {
                this.callbacks.updateGeometry(target, item);
              }
            }
          } else if (mutation.attributeName === 'hidden') {
            const item = this.tracked.get(target);
            if (item) {
              const cssVisible = this.callbacks.isCssVisible(target);
              item.panel.visible = cssVisible && item.visible;
            }
          }
        }
      }
      cleanupFn();
    });

    this.observer.observe(document.body, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ['class', 'style', 'hidden'],
    });
  }

  observeElement(element: HTMLElement): void {
    this.resizeObserver?.observe(element);
    this.intersectionObserver?.observe(element);
  }

  unobserveElement(element: HTMLElement): void {
    this.resizeObserver?.unobserve(element);
    this.intersectionObserver?.unobserve(element);
  }

  destroy(): void {
    this.observer?.disconnect();
    this.resizeObserver?.disconnect();
    this.intersectionObserver?.disconnect();
  }
}

// Animation polling helpers
export function createAnimationHandlers(
  tracked: Map<HTMLElement, TrackedItem>,
  syncElement: SyncElementFn,
  updateGeometry: UpdateGeometryFn
) {
  const startPolling = (element: HTMLElement): void => {
    const item = tracked.get(element);
    if (!item || item.polling) return;

    item.polling = true;
    const poll = () => {
      if (!item.polling) return;
      syncElement(element, item.panel);
      requestAnimationFrame(poll);
    };
    requestAnimationFrame(poll);
  };

  const stopPolling = (element: HTMLElement): void => {
    const item = tracked.get(element);
    if (!item) return;

    item.polling = false;
    updateGeometry(element, item);
  };

  const handleAnimationStart = (e: Event) => {
    const element = e.currentTarget as HTMLElement;
    startPolling(element);
  };

  const handleAnimationEnd = (e: Event) => {
    const element = e.currentTarget as HTMLElement;
    // Check if any animations are still running
    const animations = element.getAnimations();
    if (animations.length === 0) {
      stopPolling(element);
    }
  };

  return { handleAnimationStart, handleAnimationEnd };
}
