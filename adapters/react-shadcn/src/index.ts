export {
  Button,
  buttonVariants,
  type ButtonProps,
} from "./components/ui/button"
export {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
  cardVariants,
  type CardProps,
} from "./components/ui/card"
export { Chip, chipVariants, type ChipProps } from "./components/ui/chip"
export {
  EvidenceBar,
  evidenceBarVariants,
  type EvidenceBarProps,
} from "./components/ui/evidence-bar"
export {
  SolidPlate,
  SolidPlateLabel,
  SolidPlateValue,
  solidPlateVariants,
  type SolidPlateProps,
} from "./components/ui/solid-plate"

// shadcn/ui full port
export {
  Accordion,
  AccordionItem,
  AccordionTrigger,
  AccordionContent,
} from "./components/ui/accordion"
export { Alert, AlertTitle, AlertDescription } from "./components/ui/alert"
export {
  AlertDialog,
  AlertDialogTrigger,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogFooter,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogAction,
  AlertDialogCancel,
} from "./components/ui/alert-dialog"
export { AspectRatio } from "./components/ui/aspect-ratio"
export { Avatar, AvatarImage, AvatarFallback } from "./components/ui/avatar"
export {
  Breadcrumb,
  BreadcrumbList,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbPage,
  BreadcrumbSeparator,
  BreadcrumbEllipsis,
} from "./components/ui/breadcrumb"
export { Calendar } from "./components/ui/calendar"
export {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselPrevious,
  CarouselNext,
  type CarouselApi,
} from "./components/ui/carousel"
export { Checkbox } from "./components/ui/checkbox"
export { Collapsible, CollapsibleTrigger, CollapsibleContent } from "./components/ui/collapsible"
export {
  Command,
  CommandInput,
  CommandList,
  CommandEmpty,
  CommandGroup,
  CommandItem,
  CommandSeparator,
  CommandDialog,
  CommandShortcut,
} from "./components/ui/command"
export {
  ContextMenu,
  ContextMenuTrigger,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuCheckboxItem,
  ContextMenuRadioItem,
  ContextMenuLabel,
  ContextMenuSeparator,
  ContextMenuShortcut,
  ContextMenuGroup,
  ContextMenuPortal,
  ContextMenuSub,
  ContextMenuSubContent,
  ContextMenuSubTrigger,
  ContextMenuRadioGroup,
} from "./components/ui/context-menu"
export {
  Dialog,
  DialogTrigger,
  DialogPortal,
  DialogOverlay,
  DialogContent,
  DialogHeader,
  DialogFooter,
  DialogTitle,
  DialogDescription,
} from "./components/ui/dialog"
export {
  Drawer,
  DrawerTrigger,
  DrawerPortal,
  DrawerClose,
  DrawerContent,
  DrawerHeader,
  DrawerFooter,
  DrawerTitle,
  DrawerDescription,
  DrawerOverlay,
} from "./components/ui/drawer"
export {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuCheckboxItem,
  DropdownMenuRadioItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuShortcut,
  DropdownMenuGroup,
  DropdownMenuPortal,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuRadioGroup,
} from "./components/ui/dropdown-menu"
export {
  EmptyState,
  EmptyStateIcon,
  EmptyStateTitle,
  EmptyStateDescription,
  EmptyStateAction,
} from "./components/ui/empty-state"
export { HoverCard, HoverCardTrigger, HoverCardContent } from "./components/ui/hover-card"
export {
  InputOTP,
  InputOTPGroup,
  InputOTPSlot,
  InputOTPSeparator,
} from "./components/ui/input-otp"
export { Kbd } from "./components/ui/kbd"
export {
  Menubar,
  MenubarMenu,
  MenubarTrigger,
  MenubarContent,
  MenubarItem,
  MenubarSeparator,
} from "./components/ui/menubar"
export {
  NavigationMenu,
  NavigationMenuList,
  NavigationMenuItem,
  NavigationMenuTrigger,
  NavigationMenuContent,
  NavigationMenuLink,
  NavigationMenuViewport,
  navigationMenuTriggerStyle,
} from "./components/ui/navigation-menu"
export {
  Pagination,
  PaginationContent,
  PaginationLink,
  PaginationItem,
  PaginationPrevious,
  PaginationNext,
  PaginationEllipsis,
} from "./components/ui/pagination"
export { Popover, PopoverTrigger, PopoverContent, PopoverAnchor } from "./components/ui/popover"
export { RadioGroup, RadioGroupItem } from "./components/ui/radio-group"
export {
  ResizablePanelGroup,
  ResizablePanel,
  ResizableHandle,
} from "./components/ui/resizable"
export { ScrollArea, ScrollBar } from "./components/ui/scroll-area"
export {
  Select,
  SelectGroup,
  SelectValue,
  SelectTrigger,
  SelectContent,
  SelectLabel,
  SelectItem,
  SelectSeparator,
  SelectScrollUpButton,
  SelectScrollDownButton,
} from "./components/ui/select"
export { Separator } from "./components/ui/separator"
export { Skeleton } from "./components/ui/skeleton"
export { Slider } from "./components/ui/slider"
export { Toaster as Sonner } from "./components/ui/sonner"
export { Spinner } from "./components/ui/spinner"
export { Switch } from "./components/ui/switch"
export { Tabs, TabsList, TabsTrigger, TabsContent } from "./components/ui/tabs"
export { Toggle, toggleVariants } from "./components/ui/toggle"
export { ToggleGroup, ToggleGroupItem } from "./components/ui/toggle-group"
export { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider } from "./components/ui/tooltip"

// P0/P1/P2 upgrades
export { Input } from "./components/ui/input"
export { Label } from "./components/ui/label"
export {
  Form,
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormDescription,
  FormMessage,
  useFormField,
} from "./components/ui/form"
export {
  Field,
  FieldLabel,
  FieldControl,
  FieldDescription,
  FieldMessage,
  useField,
} from "./components/ui/field"
export {
  InputGroup,
  InputGroupLeft,
  InputGroupRight,
  InputGroupAddon,
  InputGroupButton,
  InputGroupText,
} from "./components/ui/input-group"
export {
  Sidebar,
  SidebarInset,
  SidebarTrigger,
  SidebarHeader,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarMenuBadge,
  SidebarMenuSkeleton,
  SidebarRail,
  SidebarSeparator,
  SidebarProvider,
  useSidebar,
} from "./components/ui/sidebar"
export {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  ChartLegend,
  ChartLegendContent,
  type ChartConfig,
} from "./components/ui/chart"
export {
  Table,
  TableHeader,
  TableBody,
  TableFooter,
  TableHead,
  TableRow,
  TableCell,
  TableCaption,
} from "./components/ui/table"
export { DataTable } from "./components/ui/data-table"
export {
  H1,
  H2,
  H3,
  H4,
  Lead,
  P,
  Small,
  Muted,
  Blockquote,
  InlineCode,
  List,
  ListItem,
} from "./components/ui/typography"
export {
  ButtonGroup,
  ButtonGroupSeparator,
  ButtonGroupText,
  buttonGroupVariants,
  type ButtonGroupProps,
} from "./components/ui/button-group"
export { DatePicker, DatePickerWithRange } from "./components/ui/date-picker"
export {
  Sheet,
  SheetTrigger,
  SheetClose,
  SheetPortal,
  SheetOverlay,
  SheetContent,
  SheetHeader,
  SheetFooter,
  SheetTitle,
  SheetDescription,
  type SheetContentProps,
} from "./components/ui/sheet"

export { cn } from "./lib/utils"
export { cardProps, garyCard, garyRole, roleClass, type GaryCardStructure, type GaryRole } from "./recipes"

// Spring physics layer
export {
  useSpring,
  SPRING_RESPONSE_BASE,
  SPRING_RESPONSE_FAST,
  SPRING_RESPONSE_SLOW,
  SPRING_DAMPING_CRITICAL,
  SPRING_DAMPING_MOMENTUM,
} from "./lib/use-spring"
export type { SpringParams } from "./lib/use-spring"
export { useGestureValue } from "./lib/use-gesture-value"
export type {
  GesturePoint,
  UseGestureValueResult,
} from "./lib/use-gesture-value"

export { useSpringStyle } from "./lib/use-spring-style"
export type { SpringStyleConfig } from "./lib/use-spring-style"
