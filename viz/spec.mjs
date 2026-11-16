/**
 * viz/spec.mjs — loads the machine rules this module renders by.
 *
 * The three JSON files under viz/_src/ are read-only copies of the legacy
 * truth sources (spec/chart-recipes.json, spec/flow-diagram.json,
 * spec/diagram-recipes.json). They are copied here on purpose: a parallel
 * change moves the whole spec/ tree to archive/legacy-2026-11/, so this
 * module must not depend on spec/ still existing.
 *
 * Only *geometry / stroke / spacing / annotation-protocol* numbers are read
 * from these files. Colours are NOT read: the old themes.* hex block is
 * superseded by the Gary theme tokens (see viz/palette.mjs).
 */
import fs from 'node:fs';

const read = (rel) => JSON.parse(fs.readFileSync(new URL(rel, import.meta.url), 'utf8'));

export const chartSpec = read('./_src/chart-recipes.json');
export const flowSpec = read('./_src/flow-diagram.json');
export const diagramSpec = read('./_src/diagram-recipes.json');

/** Chart constants, taken from chart-recipes.json (never re-invented here). */
export const CHART = {
  strokes: chartSpec.strokes, // { data, reference, guide, marker }
  fills: chartSpec.fills, // { area, barTop, barBottom, band }
  spacing: chartSpec.spacing, // panelPadding / titleToPlot / labelOffset / annotationClearance
  // grid.targetMajorIntervals is [4, 6]; a fixed 5 keeps every chart in a row
  // reading at the same tick density.
  ticks: 5,
  annotations: chartSpec.annotations,
  geometry: chartSpec.geometry,
};

/** Flow constants, taken from flow-diagram.json. */
export const FLOW = {
  stroke: flowSpec.geometry.strokeWidth, // primary / secondary / edge / edgeDashed
  corners: flowSpec.geometry.corners, // card 8, item 4, capsule h/2
  rhythm: flowSpec.geometry.rhythm,
  nodeSizes: flowSpec.geometry.nodeSizes,
  edges: flowSpec.edges,
  layers: flowSpec.layers,
  typeScale: flowSpec.geometry.typeScale,
};

/** Which family id belongs to "bar (single)" vs "bar (grouped)". */
export const FAMILY = Object.fromEntries(chartSpec.families.map((f) => [f.id, f]));
