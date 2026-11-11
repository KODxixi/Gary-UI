import * as React from "react";
import * as SliderPrimitive from "@radix-ui/react-slider";
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
declare const Slider: React.ForwardRefExoticComponent<Omit<SliderPrimitive.SliderProps & React.RefAttributes<HTMLSpanElement>, "ref"> & React.RefAttributes<HTMLSpanElement>>;
export { Slider };
//# sourceMappingURL=slider.d.ts.map