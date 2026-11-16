import type { RefObject } from "react";
/** A 2D pointer sample in client pixels. */
export interface GesturePoint {
    x: number;
    y: number;
}
export interface UseGestureValueResult<T extends HTMLElement> {
    /** Attach to the draggable element. */
    ref: RefObject<T | null>;
    /** Release velocity, px/ms (x, y). */
    velocity: GesturePoint;
    /** Projected landing point after release, or null before the first release. */
    projected: GesturePoint | null;
}
/**
 * Pointer-based gesture tracking.
 *
 * Attach the returned `ref` to an element. Press + drag records the last ~5
 * pointer samples; on release (or `pointercancel`) the release velocity
 * (px/ms) and the projected landing point are computed via an exponential-decay
 * approximation. Uses `setPointerCapture` so moves keep landing on the element
 * even outside its bounds. SSR-safe (listeners only attach in the browser).
 */
export declare function useGestureValue<T extends HTMLElement>(): UseGestureValueResult<T>;
//# sourceMappingURL=use-gesture-value.d.ts.map