import type { MutableRefObject } from "react";
/**
 * Spring timing constants. These mirror the CSS-side `--gary-spring-*` tokens
 * so the JS physics layer stays in lockstep with the declarative CSS one.
 */
export declare const SPRING_RESPONSE_BASE = 0.35;
export declare const SPRING_RESPONSE_FAST = 0.2;
export declare const SPRING_RESPONSE_SLOW = 0.5;
export declare const SPRING_DAMPING_CRITICAL = 1;
export declare const SPRING_DAMPING_MOMENTUM = 0.8;
/**
 * response: natural period in seconds (smaller = snappier).
 * damping: damping ratio ζ. 1.0 is critically damped (no overshoot),
 *          < 1.0 (e.g. SPRING_DAMPING_MOMENTUM = 0.8) underdamps and overshoots.
 */
export interface SpringParams {
    response?: number;
    damping?: number;
}
/**
 * Interruptible, rAF-driven one-dimensional spring.
 *
 * The animated value lives on a ref (no per-frame setState). When `target`
 * changes, integration continues from the current value and current velocity
 * instead of jumping. On the server (or any environment without
 * `requestAnimationFrame`) the ref simply mirrors `target`.
 */
export declare function useSpring(target: number, params?: SpringParams): MutableRefObject<number>;
//# sourceMappingURL=use-spring.d.ts.map