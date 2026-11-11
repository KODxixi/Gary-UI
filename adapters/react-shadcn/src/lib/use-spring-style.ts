import { useEffect, useRef } from "react"
import type { RefObject } from "react"

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
  response?: number
  /** damping ratio ζ. 1.0 = critical, 0.8 = momentum (slight overshoot) */
  damping?: number
  /** value when open (e.g. 1 for opacity, 1 for scale) */
  openValue: number
  /** value when closed (e.g. 0.96 for scale-in, 0 for fade-out) */
  closedValue: number
  /** which CSS property to write (opacity / transform / etc.) */
  styleProp: "opacity" | "transform"
  /** format the spring value into a CSS string (e.g. v => `scale(${v})`) */
  format?: (v: number) => string
  /** initial style before first frame (avoids flash) */
  initialStyle?: React.CSSProperties
}

const BASE_DT = 1 / 60
const MAX_DT = 32 / 1000
const SNAP_EPSILON = 0.001

export function useSpringStyle(
  elRef: RefObject<HTMLElement | null>,
  open: boolean,
  config: SpringStyleConfig,
): void {
  const valueRef = useRef(config.closedValue)
  const velocityRef = useRef(0)
  const rafRef = useRef<number | null>(null)
  const lastTimeRef = useRef<number | null>(null)
  const configRef = useRef(config)
  configRef.current = config

  // Apply initial style synchronously on mount to avoid flash
  useEffect(() => {
    const el = elRef.current
    if (!el || !config.initialStyle) return
    Object.assign(el.style, config.initialStyle)
  }, [elRef])

  useEffect(() => {
    const el = elRef.current
    if (!el) return

    const target = open ? configRef.current.openValue : configRef.current.closedValue
    const {
      response = 0.35,
      damping = 1.0,
      styleProp,
      format,
    } = configRef.current

    const omega = (2 * Math.PI) / response
    const k = omega * omega
    const c = damping * 2 * Math.sqrt(k)

    const write = (v: number) => {
      if (format) {
        el.style[styleProp] = format(v)
      } else {
        (el.style as unknown as Record<string, string>)[styleProp] = String(v)
      }
    }

    const tick = (now: number): void => {
      const prev = lastTimeRef.current
      lastTimeRef.current = now
      let dt = prev == null ? BASE_DT : (now - prev) / 1000
      if (dt > MAX_DT) dt = MAX_DT
      if (dt < 0) dt = 0

      const x = valueRef.current - target
      const acceleration = -k * x - c * velocityRef.current
      velocityRef.current += acceleration * dt
      valueRef.current += velocityRef.current * dt

      write(valueRef.current)

      const settled =
        Math.abs(valueRef.current - target) < SNAP_EPSILON &&
        Math.abs(velocityRef.current) < SNAP_EPSILON
      if (settled) {
        valueRef.current = target
        velocityRef.current = 0
        rafRef.current = null
        return
      }

      rafRef.current = requestAnimationFrame(tick)
    }

    lastTimeRef.current = null
    rafRef.current = requestAnimationFrame(tick)

    return () => {
      if (rafRef.current != null) {
        cancelAnimationFrame(rafRef.current)
        rafRef.current = null
      }
    }
  }, [elRef, open])
}
