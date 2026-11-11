import { jsx as _jsx } from "react/jsx-runtime";
import * as React from "react";
import { Reorder } from "reicon-react";
import { Group as ResizableGroup, Panel as ResizablePanelElement, Separator as ResizableSeparatorElement } from "react-resizable-panels";
import { cn } from "../../lib/utils";
const ResizablePanelGroup = ResizableGroup;
const ResizablePanel = ResizablePanelElement;
/**
 * ResizableHandle.
 *
 * A true "spring rebound to the nearest boundary" was deliberately NOT wired
 * here: react-resizable-panels owns the panel pixel layout and drives the
 * separator position itself. Intercepting the drag end and animating our own
 * transform would immediately desync from the library's measured panel sizes
 * — i.e. the effect only survives by hacking the library. Per taste rules,
 * that case is cut rather than built.
 *
 * What we do add is restrained and layout-safe:
 *  - hairline + grip colors read through the Gary bridge (bg-border ->
 *    --gary-border-shadow; muted-foreground -> --gary-text-secondary).
 *  - the grip gains a subtle hover affordance so the draggability is legible
 *    without motion on every frame.
 */
function ResizableHandle({ className, withHandle, ...props }) {
    return (_jsx(ResizableSeparatorElement, { "data-slot": "resizable-handle", className: cn("relative flex w-px items-center justify-center bg-border transition-colors duration-150", className), ...props, children: withHandle && (_jsx("div", { "data-slot": "resizable-grip", className: "z-10 flex h-20 w-3 items-center justify-center rounded-full border bg-border transition-colors duration-150 hover:bg-muted-foreground/40", children: _jsx(Reorder, { className: "size-2.5 text-muted-foreground" }) })) }));
}
export { ResizablePanelGroup, ResizablePanel, ResizableHandle };
//# sourceMappingURL=resizable.js.map