import * as React from "react";
declare function Pagination({ className, ...props }: React.ComponentProps<"nav">): React.JSX.Element;
declare const PaginationContent: React.ForwardRefExoticComponent<Omit<React.DetailedHTMLProps<React.HTMLAttributes<HTMLUListElement>, HTMLUListElement>, "ref"> & React.RefAttributes<HTMLUListElement>>;
declare function PaginationItem({ className, ...props }: React.ComponentProps<"li">): React.JSX.Element;
declare const PaginationLink: React.ForwardRefExoticComponent<Omit<React.ClassAttributes<HTMLAnchorElement> & React.AnchorHTMLAttributes<HTMLAnchorElement> & {
    isActive?: boolean;
    size?: "default" | "sm" | "lg" | "icon";
}, "ref"> & React.RefAttributes<HTMLAnchorElement>>;
declare function PaginationPrevious({ className, ...props }: React.ComponentProps<typeof PaginationLink>): React.JSX.Element;
declare function PaginationNext({ className, ...props }: React.ComponentProps<typeof PaginationLink>): React.JSX.Element;
declare function PaginationEllipsis({ className, ...props }: React.ComponentProps<"span">): React.JSX.Element;
export { Pagination, PaginationContent, PaginationLink, PaginationItem, PaginationPrevious, PaginationNext, PaginationEllipsis };
//# sourceMappingURL=pagination.d.ts.map