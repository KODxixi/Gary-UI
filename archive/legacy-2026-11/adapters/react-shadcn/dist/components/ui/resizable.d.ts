import * as React from "react";
import { Group as ResizableGroup, Panel as ResizablePanelElement, Separator as ResizableSeparatorElement } from "react-resizable-panels";
declare const ResizablePanelGroup: typeof ResizableGroup;
declare const ResizablePanel: typeof ResizablePanelElement;
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
declare function ResizableHandle({ className, withHandle, ...props }: React.ComponentProps<typeof ResizableSeparatorElement> & {
    withHandle?: boolean;
}): React.JSX.Element;
export { ResizablePanelGroup, ResizablePanel, ResizableHandle };
//# sourceMappingURL=resizable.d.ts.map