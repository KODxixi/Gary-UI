import themeMap from '../theme-map.json' with { type: 'json' };
import sceneRecipes from '../../../spec/scene-recipes.json' with { type: 'json' };


function requireRecord(value, label) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) throw new Error(`${label} must be an object`);
  return value;
}


function milliseconds(value, label) {
  const match = String(value).match(/^(\d+)ms$/);
  if (!match) throw new Error(`${label} must use integer milliseconds`);
  return Number(match[1]);
}


const themeRecords = requireRecord(themeMap.themes, 'theme-map themes');
const recipeScenes = requireRecord(sceneRecipes.scenes, 'scene recipes');

export const themes = Object.freeze(Object.fromEntries(['dark', 'light'].map((name) => {
  const source = requireRecord(themeRecords[name], `theme ${name}`);
  for (const field of ['background', 'surface', 'text', 'muted', 'accent', 'border', 'grid']) {
    if (typeof source[field] !== 'string' || !source[field]) throw new Error(`theme ${name}.${field} is required`);
  }
  return [name, Object.freeze({
    page: source.background,
    surface: source.surface,
    text: source.text,
    secondary: source.muted,
    accent: source.accent,
    border: source.border,
    grid: source.grid,
  })];
})));

export const palettes = Object.freeze(Object.fromEntries(['dark', 'light'].map((name) => {
  const palette = sceneRecipes.colors?.chartCategory?.[name];
  if (!Array.isArray(palette) || palette.length < 4) throw new Error(`scene recipes chartCategory.${name} is invalid`);
  return [name, Object.freeze([...palette])];
})));

export const sceneRules = Object.freeze(Object.fromEntries(['reading', 'analysis', 'showcase'].map((name) => {
  const recipe = requireRecord(recipeScenes[name], `scene ${name}`);
  const themeScene = requireRecord(themeMap.scenes?.[name], `theme-map scene ${name}`);
  return [name, Object.freeze({
    contentGap: recipe.density?.contentGap,
    sectionGap: recipe.density?.sectionGap,
    surfaceAlpha: themeScene.surfaceAlpha,
    motion: recipe.motion,
  })];
})));

export const typography = Object.freeze({
  fontFamily: themeMap.fontFamily.split(',').map((item) => item.trim()).map((item) => (
    item.includes(' ') ? `"${item}"` : item
  )).join(','),
  bodyFontSize: sceneRecipes.typography.body.fontSize,
  bodyLineHeight: sceneRecipes.typography.body.lineHeight,
});

export const motion = Object.freeze({
  feedbackMs: milliseconds(sceneRecipes.motion.feedback, 'motion.feedback'),
  expandMs: milliseconds(sceneRecipes.motion.expand, 'motion.expand'),
  reorderMs: milliseconds(sceneRecipes.motion.reorder, 'motion.reorder'),
  dataUpdateMs: milliseconds(sceneRecipes.motion.dataUpdate, 'motion.dataUpdate'),
});

export const policyMetadata = Object.freeze({
  themeSource: 'theme-map.json',
  sceneSource: 'spec/scene-recipes.json',
});
