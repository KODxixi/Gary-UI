import { jsx as _jsx } from "react/jsx-runtime";
import * as React from "react";
import * as AvatarPrimitive from "@radix-ui/react-avatar";
import { cn } from "../../lib/utils";
const Avatar = React.forwardRef(({ className, ...props }, ref) => (_jsx(AvatarPrimitive.Root, { ref: ref, "data-slot": "avatar", className: cn("gary-avatar relative flex size-10 shrink-0 overflow-hidden rounded-full", className), ...props })));
Avatar.displayName = "Avatar";
const AvatarImage = React.forwardRef(({ className, ...props }, ref) => (_jsx(AvatarPrimitive.Image, { ref: ref, "data-slot": "avatar-image", className: cn("gary-avatar__image aspect-square size-full", className), ...props })));
AvatarImage.displayName = "AvatarImage";
const AvatarFallback = React.forwardRef(({ className, ...props }, ref) => (_jsx(AvatarPrimitive.Fallback, { ref: ref, "data-slot": "avatar-fallback", className: cn("gary-avatar__fallback flex size-full items-center justify-center rounded-full bg-muted text-xs font-medium", className), ...props })));
AvatarFallback.displayName = "AvatarFallback";
export { Avatar, AvatarImage, AvatarFallback };
//# sourceMappingURL=avatar.js.map