import { jsx as _jsx } from "react/jsx-runtime";
import { Toaster as Sonner } from "sonner";
import { useTheme } from "next-themes";
function Toaster({ ...props }) {
    const { theme = "system" } = useTheme();
    return (_jsx(Sonner, { theme: theme, className: "toaster group", toastOptions: {
            classNames: {
                toast: "group toast group-[.toaster]:bg-background group-[.toaster]:text-foreground group-[.toaster]:border group-[.toaster]:shadow-xl",
                description: "group-[.toast]:text-muted-foreground",
                actionButton: "group-[.toast]:bg-primary group-[.toast]:text-primary-foreground",
                cancelButton: "group-[.toast]:bg-muted group-[.toast]:text-muted-foreground",
            },
        }, ...props }));
}
export { Toaster };
//# sourceMappingURL=sonner.js.map