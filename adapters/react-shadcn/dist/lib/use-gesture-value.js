import { useEffect, useRef, useState } from "react";
const HISTORY_LENGTH = 5;
const PROJECTION_DECAY = 0.998;
/**
 * Pointer-based gesture tracking.
 *
 * Attach the returned `ref` to an element. Press + drag records the last ~5
 * pointer samples; on release (or `pointercancel`) the release velocity
 * (px/ms) and the projected landing point are computed via an exponential-decay
 * approximation. Uses `setPointerCapture` so moves keep landing on the element
 * even outside its bounds. SSR-safe (listeners only attach in the browser).
 */
export function useGestureValue() {
    const ref = useRef(null);
    const activePointerId = useRef(null);
    const history = useRef([]);
    const [velocity, setVelocity] = useState({ x: 0, y: 0 });
    const [projected, setProjected] = useState(null);
    useEffect(() => {
        const el = ref.current;
        if (!el)
            return;
        if (typeof window === "undefined")
            return;
        const record = (x, y, t) => {
            history.current.push({ x, y, t });
            if (history.current.length > HISTORY_LENGTH)
                history.current.shift();
        };
        const onPointerDown = (e) => {
            if (activePointerId.current != null)
                return;
            activePointerId.current = e.pointerId;
            history.current = [];
            record(e.clientX, e.clientY, e.timeStamp);
            try {
                el.setPointerCapture(e.pointerId);
            }
            catch {
                // Capture unsupported/denied; listeners still fire on the target.
            }
        };
        const onPointerMove = (e) => {
            if (e.pointerId !== activePointerId.current)
                return;
            record(e.clientX, e.clientY, e.timeStamp);
        };
        const finish = (e) => {
            if (e.pointerId !== activePointerId.current)
                return;
            record(e.clientX, e.clientY, e.timeStamp);
            const h = history.current;
            let vx = 0;
            let vy = 0;
            if (h.length >= 2) {
                const first = h[0];
                const last = h[h.length - 1];
                const dt = last.t - first.t;
                if (dt > 0) {
                    vx = (last.x - first.x) / dt; // px/ms
                    vy = (last.y - first.y) / dt;
                }
            }
            // Exponential-decay projection: sum(decay^n) = decay / (1 - decay).
            const current = h[h.length - 1];
            const factor = PROJECTION_DECAY / (1 - PROJECTION_DECAY);
            const dx = (vx / 1000) * factor;
            const dy = (vy / 1000) * factor;
            setVelocity({ x: vx, y: vy });
            setProjected({ x: current.x + dx, y: current.y + dy });
            activePointerId.current = null;
            history.current = [];
            try {
                el.releasePointerCapture(e.pointerId);
            }
            catch {
                // Already released.
            }
        };
        const onPointerUp = (e) => finish(e);
        const onPointerCancel = (e) => finish(e);
        el.addEventListener("pointerdown", onPointerDown);
        el.addEventListener("pointermove", onPointerMove);
        el.addEventListener("pointerup", onPointerUp);
        el.addEventListener("pointercancel", onPointerCancel);
        return () => {
            el.removeEventListener("pointerdown", onPointerDown);
            el.removeEventListener("pointermove", onPointerMove);
            el.removeEventListener("pointerup", onPointerUp);
            el.removeEventListener("pointercancel", onPointerCancel);
            if (activePointerId.current != null) {
                try {
                    el.releasePointerCapture(activePointerId.current);
                }
                catch {
                    // Already released.
                }
                activePointerId.current = null;
            }
        };
    }, []);
    return { ref, velocity, projected };
}
//# sourceMappingURL=use-gesture-value.js.map