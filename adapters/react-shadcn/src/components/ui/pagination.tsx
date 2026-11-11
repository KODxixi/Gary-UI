import * as React from "react"
import { ChevronLeft, ChevronRight, MoreH } from "reicon-react"
import { cn } from "../../lib/utils"

function Pagination({ className, ...props }: React.ComponentProps<"nav">) {
  return <nav aria-label="pagination" data-slot="pagination" className={cn("gary-pagination mx-auto flex w-full justify-center", className)} {...props} />
}

const PaginationContent = React.forwardRef<HTMLUListElement, React.ComponentProps<"ul">>(({ className, ...props }, ref) => (
  <ul ref={ref} className="flex flex-row items-center gap-1" {...props} />
))
PaginationContent.displayName = "PaginationContent"

function PaginationItem({ className, ...props }: React.ComponentProps<"li">) {
  return <li data-slot="pagination-item" className={cn("gary-pagination__item", className)} {...props} />
}

const PaginationLink = React.forwardRef<HTMLAnchorElement, React.ComponentProps<"a"> & { isActive?: boolean; size?: "default" | "sm" | "lg" | "icon" }>(
  ({ className, isActive, size = "default", ...props }, ref) => (
    <a ref={ref} aria-current={isActive ? "page" : undefined} data-slot="pagination-link"
      className={cn("gary-pagination__link flex size-9 items-center justify-center rounded-md px-3 text-sm transition-colors", isActive && "bg-primary text-primary-foreground", className)}
      {...props} />
  )
)
PaginationLink.displayName = "PaginationLink"

function PaginationPrevious({ className, ...props }: React.ComponentProps<typeof PaginationLink>) {
  return <PaginationLink aria-label="Go to previous page" size="default" className={cn("gap-1 pl-2.5", className)} {...props}><ChevronLeft className="size-4" /><span>Previous</span></PaginationLink>
}

function PaginationNext({ className, ...props }: React.ComponentProps<typeof PaginationLink>) {
  return <PaginationLink aria-label="Go to next page" size="default" className={cn("gap-1 pr-2.5", className)} {...props}><span>Next</span><ChevronRight className="size-4" /></PaginationLink>
}

function PaginationEllipsis({ className, ...props }: React.ComponentProps<"span">) {
  return <span data-slot="pagination-ellipsis" aria-hidden="true" className={cn("flex size-9 items-center justify-center", className)}><MoreH className="size-4" weight="Filled" /><span className="sr-only">More pages</span></span>
}

export { Pagination, PaginationContent, PaginationLink, PaginationItem, PaginationPrevious, PaginationNext, PaginationEllipsis }
