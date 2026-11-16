import { useEffect, useRef } from "react";
const BASE_DT = 1 / 60;
const MAX_DT = 32 / 1000;
const SNAP_EPSILON = 0.001;
export function useSpringStyle(elRef, open, config) {
    const valueRef = useRef(config.closedValue);
    const velocityRef = useRef(0);
    const rafRef = useRef(null);
    const lastTimeRef = useRef(null);
    const configRef = useRef(config);
    configRef.current = config;
    // Apply initial style synchronously on mount to avoid flash
    useEffect(() => {
        const el = elRef.current;
        if (!el || !config.initialStyle)
            return;
        Object.assign(el.style, config.initialStyle);
    }, [elRef]);
    useEffect(() => {
        const el = elRef.current;
        if (!el)
            return;
        const target = open ? configRef.current.openValue : configRef.current.closedValue;
        const { response = 0.35, damping = 1.0, styleProp, format, } = configRef.current;
        const omega = (2 * Math.PI) / response;
        const k = omega * omega;
        const c = damping * 2 * Math.sqrt(k);
        const write = (v) => {
            if (format) {
                el.style[styleProp] = format(v);
            }
            else {
                el.style[styleProp] = String(v);
            }
        };
        const tick = (now) => {
            const prev = lastTimeRef.current;
            lastTimeRef.current = now;
            let dt = prev == null ? BASE_DT : (now - prev) / 1000;
            if (dt > MAX_DT)
                dt = MAX_DT;
            if (dt < 0)
                dt = 0;
            const x = valueRef.current - target;
            const acceleration = -k * x - c * velocityRef.current;
            velocityRef.current += acceleration * dt;
            valueRef.current += velocityRef.current * dt;
            write(valueRef.current);
            const settled = Math.abs(valueRef.current - target) < SNAP_EPSILON &&
                Math.abs(velocityRef.current) < SNAP_EPSILON;
            if (settled) {
                valueRef.current = target;
                velocityRef.current = 0;
                rafRef.current = null;
                return;
            }
            rafRef.current = requestAnimationFrame(tick);
        };
        lastTimeRef.current = null;
        rafRef.current = requestAnimationFrame(tick);
        return () => {
            if (rafRef.current != null) {
                cancelAnimationFrame(rafRef.current);
                rafRef.current = null;
            }
        };
    }, [elRef, open]);
}
//# sourceMappingURL=use-spring-style.js.map