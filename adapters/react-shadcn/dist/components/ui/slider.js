import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import * as React from "react";
import * as SliderPrimitive from "@radix-ui/react-slider";
import { cn } from "../../lib/utils";
/**
 * Slider.
 *
 * Colors are intentionally left as shadcn semantic utilities (`bg-secondary`,
 * `bg-primary`, `bg-background`, `border`, `ring`): they already resolve to
 * Gary tokens through the bridge in styles/gary-ui.css
 *   bg-secondary -> --gary-surface-sunken (track)
 *   bg-primary   -> --gary-text-primary  (range)
 *   bg-background-> --gary-surface-page  (thumb)
 *   ring         -> --gary-focus-ring
 * so no hardcoded color is introduced here.
 *
 * Radix owns the pointer / keyboard / value model. We do NOT attach
 * useGestureValue to the thumb — that would double-handle the pointer and
 * fight Radix. The only physics we add is a CSS-only "weight" on grab: the
 * thumb grows a touch while pressed (standalone `scale` property, so it never
 * collides with Radix's left/right % positioning).
 */
const Slider = React.forwardRef(({ className, ...props }, ref) => (_jsxs(SliderPrimitive.Root, { ref: ref, "data-slot": "slider", className: cn("gary-slider relative flex w-full touch-none select-none items-center", className), ...props, children: [_jsx(SliderPrimitive.Track, { "data-slot": "slider-track", className: "gary-slider__track relative h-1.5 w-full grow overflow-hidden rounded-full bg-secondary", children: _jsx(SliderPrimitive.Range, { "data-slot": "slider-range", className: "gary-slider__range absolute h-full bg-primary" }) }), _jsx(SliderPrimitive.Thumb, { "data-slot": "slider-thumb", className: "gary-slider__thumb block size-4 rounded-full border border-primary/50 bg-background shadow\n                 transition-[scale] duration-150 scale-100 active:scale-105\n                 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring\n                 disabled:pointer-events-none disabled:opacity-50" })] })));
Slider.displayName = "Slider";
export { Slider };
//# sourceMappingURL=slider.js.map