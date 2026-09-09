export const roleClass = {
    title: "gary-role-title",
    "section-title": "gary-role-section-title",
    body: "gary-role-body",
    label: "gary-role-label",
    annotation: "gary-role-annotation",
    metric: "gary-role-metric",
};
export const cardProps = {
    metric: { "data-gary-card": "metric" },
    comparison: { "data-gary-card": "comparison" },
    judgement: { "data-gary-card": "judgement" },
    media: { "data-gary-card": "media" },
};
export function garyRole(role) { return roleClass[role]; }
export function garyCard(structure) { return cardProps[structure]; }
export function garyWeight(weight) { return { "data-gary-font-weight": String(weight) }; }
//# sourceMappingURL=recipes.js.map