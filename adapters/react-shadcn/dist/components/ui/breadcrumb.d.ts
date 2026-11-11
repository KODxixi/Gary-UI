import * as React from "react";
declare function Breadcrumb({ className, ...props }: React.ComponentProps<"nav">): React.JSX.Element;
declare const BreadcrumbList: React.ForwardRefExoticComponent<Omit<React.DetailedHTMLProps<React.OlHTMLAttributes<HTMLOListElement>, HTMLOListElement>, "ref"> & React.RefAttributes<HTMLOListElement>>;
declare function BreadcrumbItem({ className, ...props }: React.ComponentProps<"li">): React.JSX.Element;
declare function BreadcrumbLink({ className, ...props }: React.ComponentProps<"a">): React.JSX.Element;
declare function BreadcrumbPage({ className, ...props }: React.ComponentProps<"span">): React.JSX.Element;
declare function BreadcrumbSeparator({ children, className, ...props }: React.ComponentProps<"li">): React.JSX.Element;
declare function BreadcrumbEllipsis({ className, ...props }: React.ComponentProps<"span">): React.JSX.Element;
export { Breadcrumb, BreadcrumbList, BreadcrumbItem, BreadcrumbLink, BreadcrumbPage, BreadcrumbSeparator, BreadcrumbEllipsis };
//# sourceMappingURL=breadcrumb.d.ts.map