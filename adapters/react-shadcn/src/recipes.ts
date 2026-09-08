export const roleClass = {
  title: "gary-role-title",
  "section-title": "gary-role-section-title",
  body: "gary-role-body",
  label: "gary-role-label",
  annotation: "gary-role-annotation",
  metric: "gary-role-metric",
} as const

export const cardProps = {
  metric: { "data-gary-card": "metric" },
  comparison: { "data-gary-card": "comparison" },
  judgement: { "data-gary-card": "judgement" },
  media: { "data-gary-card": "media" },
} as const

export type GaryRole = keyof typeof roleClass
export type GaryCardStructure = keyof typeof cardProps
export type GaryFontWeight = 100 | 300 | 400 | 500 | 600 | 700 | 800 | 900

export function garyRole(role: GaryRole): string { return roleClass[role] }
export function garyCard(structure: GaryCardStructure) { return cardProps[structure] }
export function garyWeight(weight: GaryFontWeight) { return { "data-gary-font-weight": String(weight) } as const }
