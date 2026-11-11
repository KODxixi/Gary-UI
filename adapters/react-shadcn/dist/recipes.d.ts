export declare const roleClass: {
    readonly title: "gary-role-title";
    readonly "section-title": "gary-role-section-title";
    readonly body: "gary-role-body";
    readonly label: "gary-role-label";
    readonly annotation: "gary-role-annotation";
    readonly metric: "gary-role-metric";
};
export declare const cardProps: {
    readonly metric: {
        readonly "data-gary-card": "metric";
    };
    readonly comparison: {
        readonly "data-gary-card": "comparison";
    };
    readonly judgement: {
        readonly "data-gary-card": "judgement";
    };
    readonly media: {
        readonly "data-gary-card": "media";
    };
};
export type GaryRole = keyof typeof roleClass;
export type GaryCardStructure = keyof typeof cardProps;
export type GaryFontWeight = 100 | 300 | 400 | 500 | 600 | 700 | 800 | 900;
export declare function garyRole(role: GaryRole): string;
export declare function garyCard(structure: GaryCardStructure): {
    readonly "data-gary-card": "metric";
} | {
    readonly "data-gary-card": "comparison";
} | {
    readonly "data-gary-card": "judgement";
} | {
    readonly "data-gary-card": "media";
};
export declare function garyWeight(weight: GaryFontWeight): {
    readonly "data-gary-font-weight": string;
};
//# sourceMappingURL=recipes.d.ts.map