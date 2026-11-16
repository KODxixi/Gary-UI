import type { RefObject } from "react";
/**
 * Drive a DOM element's style from an interruptible spring.
 *
 * Unlike useSpring (which only updates a ref), this hook writes the
 * spring value straight to `el.style[styleProp]` on every animation
 * frame — no React re-renders, no CSS transition, fully interruptible.
 *
 * @param elRef   Target element ref (must be mounted when state flips).
 * @param open    Whether the element should be at its visible target.
 * @param config  Spring physics + style mapping.
 */
export interface SpringStyleConfig {
    /** spring natural period in seconds */
    response?: number;
    /** damping ratio ζ. 1.0 = critical, 0.8 = momentum (slight overshoot) */
    damping?: number;
    /** value when open (e.g. 1 for opacity, 1 for scale) */
    openValue: number;
    /** value when closed (e.g. 0.96 for scale-in, 0 for fade-out) */
    closedValue: number;
    /** which CSS property to write (opacity / transform / etc.) */
    styleProp: "opacity" | "transform";
    /** format the spring value into a CSS string (e.g. v => `scale(${v})`) */
    format?: (v: number) => string;
    /** initial style before first frame (avoids flash) */
    initialStyle?: React.CSSProperties;
}
export declare function useSpringStyle(elRef: RefObject<HTMLElement | null>, open: boolean, config: SpringStyleConfig): void;
//# sourceMappingURL=use-spring-style.d.ts.map