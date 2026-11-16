import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import * as React from "react";
import useEmblaCarousel, {} from "embla-carousel-react";
import { ArrowLeft, ArrowRight } from "reicon-react";
import { cn } from "../../lib/utils";
const CarouselContext = React.createContext(null);
function useCarousel() {
    const ctx = React.useContext(CarouselContext);
    if (!ctx)
        throw new Error("useCarousel must be used within <Carousel>");
    return ctx;
}
const Carousel = React.forwardRef(({ orientation = "horizontal", opts, setApi, plugins, className, children, ...props }, ref) => {
    const [carouselRef, api] = useEmblaCarousel({ ...opts, axis: orientation === "horizontal" ? "x" : "y" }, plugins);
    const [canScrollPrev, setCanScrollPrev] = React.useState(false);
    const [canScrollNext, setCanScrollNext] = React.useState(false);
    const onSelect = React.useCallback((api) => {
        if (!api)
            return;
        setCanScrollPrev(api.canScrollPrev());
        setCanScrollNext(api.canScrollNext());
    }, []);
    const scrollPrev = React.useCallback(() => api?.scrollPrev(), [api]);
    const scrollNext = React.useCallback(() => api?.scrollNext(), [api]);
    React.useEffect(() => {
        if (!api || !setApi)
            return;
        setApi(api);
    }, [api, setApi]);
    React.useEffect(() => {
        if (!api)
            return;
        onSelect(api);
        api.on("reInit", onSelect);
        api.on("select", onSelect);
        return () => { api?.off("select", onSelect); };
    }, [api, onSelect]);
    return (_jsx(CarouselContext.Provider, { value: { carouselRef, api: api, scrollPrev, scrollNext, canScrollPrev, canScrollNext, orientation }, children: _jsx("div", { ref: ref, "data-slot": "carousel", role: "region", "aria-roledescription": "carousel", className: cn("relative", orientation === "horizontal" ? "x-axis" : "y-axis", className), ...props, children: children }) }));
});
Carousel.displayName = "Carousel";
const CarouselContent = React.forwardRef(({ className, ...props }, ref) => {
    const { carouselRef, orientation } = useCarousel();
    // Slide gap is driven by the authoritative Gary spacing token (--gary-space-4 = 16px),
    // keeping the shadcn "negative outer margin + inner padding" technique but sourcing
    // the value from tokens so density changes flow through.
    const gap = orientation === "horizontal"
        ? { marginLeft: "calc(var(--gary-space-4) * -1)" }
        : { marginTop: "calc(var(--gary-space-4) * -1)" };
    return (_jsx("div", { ref: carouselRef, className: "overflow-hidden", children: _jsx("div", { ref: ref, "data-slot": "carousel-content", style: gap, className: cn("flex", orientation === "vertical" && "flex-col", className), ...props }) }));
});
CarouselContent.displayName = "CarouselContent";
const CarouselItem = React.forwardRef(({ className, ...props }, ref) => {
    const { orientation } = useCarousel();
    const gap = orientation === "horizontal"
        ? { paddingLeft: "var(--gary-space-4)" }
        : { paddingTop: "var(--gary-space-4)" };
    return _jsx("div", { ref: ref, "data-slot": "carousel-item", role: "group", "aria-roledescription": "slide", style: gap, className: cn("min-w-0 shrink-0 grow-0 basis-full", className), ...props });
});
CarouselItem.displayName = "CarouselItem";
const CarouselPrevious = React.forwardRef(({ className, ...props }, ref) => {
    const { orientation, scrollPrev, canScrollPrev } = useCarousel();
    return (_jsxs("button", { ref: ref, type: "button", "data-slot": "carousel-previous", disabled: !canScrollPrev, onClick: scrollPrev, className: cn("absolute size-8 rounded-full border bg-background shadow disabled:opacity-50", orientation === "horizontal" ? "-left-12 top-1/2 -translate-y-1/2" : "-top-12 left-1/2 -translate-x-1/2 rotate-90", className), ...props, children: [_jsx(ArrowLeft, { className: "size-4" }), _jsx("span", { className: "sr-only", children: "Previous slide" })] }));
});
CarouselPrevious.displayName = "CarouselPrevious";
const CarouselNext = React.forwardRef(({ className, ...props }, ref) => {
    const { orientation, scrollNext, canScrollNext } = useCarousel();
    return (_jsxs("button", { ref: ref, type: "button", "data-slot": "carousel-next", disabled: !canScrollNext, onClick: scrollNext, className: cn("absolute size-8 rounded-full border bg-background shadow disabled:opacity-50", orientation === "horizontal" ? "-right-12 top-1/2 -translate-y-1/2" : "-bottom-12 left-1/2 -translate-x-1/2 rotate-90", className), ...props, children: [_jsx(ArrowRight, { className: "size-4" }), _jsx("span", { className: "sr-only", children: "Next slide" })] }));
});
CarouselNext.displayName = "CarouselNext";
export { Carousel, CarouselContent, CarouselItem, CarouselPrevious, CarouselNext };
//# sourceMappingURL=carousel.js.map