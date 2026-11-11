import { useEffect, useRef } from "react";
/**
 * Spring timing constants. These mirror the CSS-side `--gary-spring-*` tokens
 * so the JS physics layer stays in lockstep with the declarative CSS one.
 */
export const SPRING_RESPONSE_BASE = 0.35;
export const SPRING_RESPONSE_FAST = 0.2;
export const SPRING_RESPONSE_SLOW = 0.5;
export const SPRING_DAMPING_CRITICAL = 1.0;
export const SPRING_DAMPING_MOMENTUM = 0.8;
const BASE_DT = 1 / 60;
const MAX_DT = 32 / 1000;
const SNAP_EPSILON = 0.001;
/**
 * Interruptible, rAF-driven one-dimensional spring.
 *
 * The animated value lives on a ref (no per-frame setState). When `target`
 * changes, integration continues from the current value and current velocity
 * instead of jumping. On the server (or any environment without
 * `requestAnimationFrame`) the ref simply mirrors `target`.
 */
export function useSpring(target, params = {}) {
    const valueRef = useRef(target);
    const velocityRef = useRef(0);
    const targetRef = useRef(target);
    const paramsRef = useRef(params);
    const rafRef = useRef(null);
    const lastTimeRef = useRef(null);
    // Read the freshest params inside the rAF loop without restarting it.
    paramsRef.current = params;
    const hasWindow = typeof window !== "undefined" &&
        typeof window.requestAnimationFrame === "function";
    useEffect(() => {
        targetRef.current = target;
        if (!hasWindow)
            return;
        const tick = (now) => {
            const { response = SPRING_RESPONSE_BASE, damping = SPRING_DAMPING_CRITICAL, } = paramsRef.current;
            // Semi-implicit Euler: a = -k·x - c·v  (mass = 1)
            const safeResponse = response > 0 ? response : SPRING_RESPONSE_BASE;
            const omega = (2 * Math.PI) / safeResponse;
            const k = omega * omega;
            const c = damping * 2 * Math.sqrt(k);
            const prev = lastTimeRef.current;
            lastTimeRef.current = now;
            let dt = prev == null ? BASE_DT : (now - prev) / 1000;
            if (dt > MAX_DT)
                dt = MAX_DT;
            if (dt < 0)
                dt = 0;
            const t = targetRef.current;
            const x = valueRef.current - t;
            const acceleration = -k * x - c * velocityRef.current;
            velocityRef.current += acceleration * dt;
            valueRef.current += velocityRef.current * dt;
            const settled = Math.abs(valueRef.current - t) < SNAP_EPSILON &&
                Math.abs(velocityRef.current) < SNAP_EPSILON;
            if (settled) {
                valueRef.current = t;
                velocityRef.current = 0;
                rafRef.current = null;
                return;
            }
            rafRef.current = window.requestAnimationFrame(tick);
        };
        lastTimeRef.current = null;
        rafRef.current = window.requestAnimationFrame(tick);
        return () => {
            if (rafRef.current != null) {
                window.cancelAnimationFrame(rafRef.current);
                rafRef.current = null;
            }
        };
    }, [target, hasWindow]);
    return valueRef;
}
//# sourceMappingURL=use-spring.js.map