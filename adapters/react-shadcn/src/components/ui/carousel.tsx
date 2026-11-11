import * as React from "react"
import useEmblaCarousel, { type UseEmblaCarouselType } from "embla-carousel-react"
import { ArrowLeft, ArrowRight } from "reicon-react"
import { cn } from "../../lib/utils"

type CarouselApi = UseEmblaCarouselType[1]
type CarouselContextType = {
  carouselRef: ReturnType<typeof useEmblaCarousel>[0]
  api: ReturnType<typeof useEmblaCarousel>[1]
  scrollPrev: () => void
  scrollNext: () => void
  canScrollPrev: boolean
  canScrollNext: boolean
  orientation: "horizontal" | "vertical"
}

const CarouselContext = React.createContext<CarouselContextType | null>(null)

function useCarousel() {
  const ctx = React.useContext(CarouselContext)
  if (!ctx) throw new Error("useCarousel must be used within <Carousel>")
  return ctx
}

const Carousel = React.forwardRef<HTMLDivElement, React.ComponentProps<"div"> & { opts?: any; orientation?: "horizontal" | "vertical"; setApi?: (api: CarouselApi) => void; plugins?: any[] }>(
  ({ orientation = "horizontal", opts, setApi, plugins, className, children, ...props }, ref) => {
    const [carouselRef, api] = useEmblaCarousel({ ...opts, axis: orientation === "horizontal" ? "x" : "y" }, plugins)
    const [canScrollPrev, setCanScrollPrev] = React.useState(false)
    const [canScrollNext, setCanScrollNext] = React.useState(false)

    const onSelect = React.useCallback((api: CarouselApi) => {
      if (!api) return
      setCanScrollPrev(api.canScrollPrev())
      setCanScrollNext(api.canScrollNext())
    }, [])

    const scrollPrev = React.useCallback(() => api?.scrollPrev(), [api])
    const scrollNext = React.useCallback(() => api?.scrollNext(), [api])

    React.useEffect(() => {
      if (!api || !setApi) return
      setApi(api)
    }, [api, setApi])

    React.useEffect(() => {
      if (!api) return
      onSelect(api)
      api.on("reInit", onSelect)
      api.on("select", onSelect)
      return () => { api?.off("select", onSelect) }
    }, [api, onSelect])

    return (
      <CarouselContext.Provider value={{ carouselRef, api: api!, scrollPrev, scrollNext, canScrollPrev, canScrollNext, orientation }}>
        <div ref={ref} data-slot="carousel" role="region" aria-roledescription="carousel"
          className={cn("relative", orientation === "horizontal" ? "x-axis" : "y-axis", className)} {...props}>
          {children}
        </div>
      </CarouselContext.Provider>
    )
  }
)
Carousel.displayName = "Carousel"

const CarouselContent = React.forwardRef<HTMLDivElement, React.ComponentProps<"div">>(({ className, ...props }, ref) => {
  const { carouselRef, orientation } = useCarousel()
  // Slide gap is driven by the authoritative Gary spacing token (--gary-space-4 = 16px),
  // keeping the shadcn "negative outer margin + inner padding" technique but sourcing
  // the value from tokens so density changes flow through.
  const gap: React.CSSProperties =
    orientation === "horizontal"
      ? { marginLeft: "calc(var(--gary-space-4) * -1)" }
      : { marginTop: "calc(var(--gary-space-4) * -1)" }
  return (
    <div ref={carouselRef} className="overflow-hidden">
      <div ref={ref} data-slot="carousel-content" style={gap} className={cn("flex", orientation === "vertical" && "flex-col", className)} {...props} />
    </div>
  )
})
CarouselContent.displayName = "CarouselContent"

const CarouselItem = React.forwardRef<HTMLDivElement, React.ComponentProps<"div">>(({ className, ...props }, ref) => {
  const { orientation } = useCarousel()
  const gap: React.CSSProperties =
    orientation === "horizontal"
      ? { paddingLeft: "var(--gary-space-4)" }
      : { paddingTop: "var(--gary-space-4)" }
  return <div ref={ref} data-slot="carousel-item" role="group" aria-roledescription="slide" style={gap}
    className={cn("min-w-0 shrink-0 grow-0 basis-full", className)} {...props} />
})
CarouselItem.displayName = "CarouselItem"

const CarouselPrevious = React.forwardRef<HTMLButtonElement, React.ComponentProps<"button">>(({ className, ...props }, ref) => {
  const { orientation, scrollPrev, canScrollPrev } = useCarousel()
  return (
    <button ref={ref} type="button" data-slot="carousel-previous" disabled={!canScrollPrev} onClick={scrollPrev}
      className={cn("absolute size-8 rounded-full border bg-background shadow disabled:opacity-50",
        orientation === "horizontal" ? "-left-12 top-1/2 -translate-y-1/2" : "-top-12 left-1/2 -translate-x-1/2 rotate-90", className)} {...props}>
      <ArrowLeft className="size-4" /><span className="sr-only">Previous slide</span>
    </button>
  )
})
CarouselPrevious.displayName = "CarouselPrevious"

const CarouselNext = React.forwardRef<HTMLButtonElement, React.ComponentProps<"button">>(({ className, ...props }, ref) => {
  const { orientation, scrollNext, canScrollNext } = useCarousel()
  return (
    <button ref={ref} type="button" data-slot="carousel-next" disabled={!canScrollNext} onClick={scrollNext}
      className={cn("absolute size-8 rounded-full border bg-background shadow disabled:opacity-50",
        orientation === "horizontal" ? "-right-12 top-1/2 -translate-y-1/2" : "-bottom-12 left-1/2 -translate-x-1/2 rotate-90", className)} {...props}>
      <ArrowRight className="size-4" /><span className="sr-only">Next slide</span>
    </button>
  )
})
CarouselNext.displayName = "CarouselNext"

export { Carousel, CarouselContent, CarouselItem, CarouselPrevious, CarouselNext, type CarouselApi }
