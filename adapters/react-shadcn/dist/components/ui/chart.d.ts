import * as React from "react";
import { ResponsiveContainer } from "recharts";
export type ChartConfig = Record<string, {
    label?: string;
    color?: string;
    icon?: React.ComponentType;
    theme?: {
        light?: string;
        dark?: string;
    };
}>;
interface ChartContextValue {
    config: ChartConfig;
}
export declare function useChart(): ChartContextValue;
declare const ChartContainer: React.ForwardRefExoticComponent<Omit<React.ClassAttributes<HTMLDivElement> & React.HTMLAttributes<HTMLDivElement> & {
    config: ChartConfig;
    children: React.ComponentProps<typeof ResponsiveContainer>["children"];
}, "ref"> & React.RefAttributes<HTMLDivElement>>;
declare const ChartTooltip: React.ForwardRefExoticComponent<Omit<Omit<import("recharts").DefaultTooltipContentProps<import("recharts").TooltipValueType, import("recharts/types/component/DefaultTooltipContent").NameType>, "label" | "viewBox" | "active" | "payload" | "coordinate" | "accessibilityLayer"> & {
    active?: boolean;
    allowEscapeViewBox?: import("recharts/types/util/types").AllowInDimension;
    animationDuration?: import("recharts/types/util/types").AnimationDuration;
    animationEasing?: import("recharts").EasingInput;
    axisId?: import("recharts").AxisId;
    content?: import("recharts/types/component/Tooltip").ContentType<import("recharts").TooltipValueType, import("recharts/types/component/DefaultTooltipContent").NameType> | undefined;
    contentStyle?: React.CSSProperties;
    cursor?: import("recharts/types/component/Cursor").CursorDefinition;
    defaultIndex?: number | import("recharts").TooltipIndex;
    filterNull?: boolean;
    formatter?: ((value: import("recharts").TooltipValueType, name: import("recharts/types/component/DefaultTooltipContent").NameType, item: import("recharts/types/state/tooltipSlice").TooltipPayloadEntry, index: number, payload: import("recharts").TooltipPayload) => React.ReactNode | [React.ReactNode, React.ReactNode]) | undefined;
    includeHidden?: boolean | undefined;
    isAnimationActive?: boolean | "auto";
    itemSorter?: import("recharts").TooltipItemSorter;
    itemStyle?: React.CSSProperties;
    labelFormatter?: (label: React.ReactNode, payload: import("recharts").TooltipPayload) => React.ReactNode;
    labelStyle?: React.CSSProperties;
    offset?: number | import("recharts").Coordinate;
    payloadUniqBy?: import("recharts/types/util/payload/getUniqPayload").UniqueOption<import("recharts/types/state/tooltipSlice").TooltipPayloadEntry>;
    portal?: HTMLElement | null;
    position?: Partial<import("recharts").Coordinate>;
    reverseDirection?: import("recharts/types/util/types").AllowInDimension;
    separator?: string;
    shared?: boolean;
    trigger?: import("recharts/types/chart/types").TooltipTrigger;
    useTranslate3d?: boolean;
    wrapperStyle?: React.CSSProperties;
}, "content" | "cursor"> & {
    content?: React.ReactElement;
    cursor?: boolean | Record<string, unknown>;
} & React.RefAttributes<HTMLDivElement>>;
interface ChartTooltipPayloadItem {
    dataKey?: string | number;
    name?: string;
    value?: number | string;
    color?: string;
    payload?: unknown;
    [key: string]: unknown;
}
interface ChartTooltipContentProps {
    active?: boolean;
    payload?: ChartTooltipPayloadItem[];
    label?: string | number;
    className?: string;
    hideLabel?: boolean;
    hideIndicator?: boolean;
    indicator?: "line" | "dot" | "dashed";
    labelClassName?: string;
    labelFormatter?: (label: React.ReactNode, payload: ChartTooltipPayloadItem[]) => React.ReactNode;
    nameKey?: string;
    color?: string;
}
declare const ChartTooltipContent: React.ForwardRefExoticComponent<ChartTooltipContentProps & React.RefAttributes<HTMLDivElement>>;
interface ChartLegendPayloadItem {
    value?: string;
    color?: string;
    dataKey?: string | number;
    [key: string]: unknown;
}
declare const ChartLegend: React.ForwardRefExoticComponent<Omit<Omit<import("recharts").DefaultLegendContentProps, "ref" | "layout" | "payload" | "verticalAlign"> & {
    content?: import("recharts/types/component/DefaultLegendContent").ContentType;
    layout?: import("recharts").CartesianLayout | "auto";
    wrapperStyle?: React.CSSProperties;
    width?: number | string;
    height?: number | string;
    payloadUniqBy?: import("recharts/types/util/payload/getUniqPayload").UniqueOption<import("recharts").LegendPayload>;
    onBBoxUpdate?: (box: import("recharts/types/util/useElementOffset").ElementOffset | null) => void;
    portal?: HTMLElement | null;
    itemSorter?: import("recharts/types/component/Legend").LegendItemSorter | null;
    verticalAlign?: import("recharts/types/component/DefaultLegendContent").VerticalAlignmentType;
    position?: import("recharts").CartesianPosition;
    offset?: number;
}, "content"> & {
    content?: React.ReactElement;
} & React.RefAttributes<HTMLDivElement>>;
interface ChartLegendContentProps {
    className?: string;
    hideIcon?: boolean;
    payload?: ChartLegendPayloadItem[];
    verticalAlign?: "top" | "bottom" | "middle";
    nameKey?: string;
}
declare const ChartLegendContent: React.ForwardRefExoticComponent<ChartLegendContentProps & React.RefAttributes<HTMLDivElement>>;
export { ChartContainer, ChartTooltip, ChartTooltipContent, ChartLegend, ChartLegendContent, };
//# sourceMappingURL=chart.d.ts.map