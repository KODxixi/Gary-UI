/**
 * Recipe · landing (hero shell)
 *
 * Content order from content.blocks, but the cover is promoted to a full-column
 * hero band: it eats the page shell's top inset (48px) and drops its own card
 * frame, so the page opens on a solid surface instead of a floating card.
 *
 * Horizontal reach is exactly the 1120 column: the shell's 32px side padding is
 * *outside* the recipe's own stack, and layout.mjs rule 5 compares a node to its
 * immediate parent — a wider-than-parent band fails by construction. So the
 * band runs edge to edge of the content column (100%, no side bleed), and its
 * padding stays 0 sideways so the hero headline keeps the same left edge as
 * every other block below it.
 */
import { createElement as h, Fragment } from 'react';
import { VStack } from '@astryxdesign/core';
import { SECTIONS, renderSection } from './sections.mjs';

export const id = 'landing';

const SUPPORTED = Object.keys(SECTIONS);

const HERO = {
  margin: '-48px 0 0',
  width: '100%',
  padding: '48px 0 40px',
  background: 'var(--color-surface-sunken)',
  borderRadius: '0',
};

export function render(content) {
  const blocks = Array.isArray(content.blocks) ? content.blocks : [];
  if (blocks.length === 0) {
    throw new Error('landing: content.blocks 为空或缺失，无法渲染');
  }
  return h(
    VStack,
    { gap: 10, width: '100%' },
    blocks.map((b, i) => {
      const type = String(b.type || '');
      if (!SECTIONS[type]) {
        throw new Error(
          `landing: 未知区块类型 type="${type}"（支持: ${SUPPORTED.join(', ')}）`
        );
      }
      if (type === 'cover') {
        return h(
          'div',
          { key: b.id || `b${i}`, style: HERO },
          renderSection(b, {})
        );
      }
      return h(Fragment, { key: b.id || `b${i}` }, renderSection(b, {}));
    })
  );
}

export default { id, render };
