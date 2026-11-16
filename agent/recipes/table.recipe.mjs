/**
 * Recipe · table (stack shell)
 * Block order comes from content.blocks; heading may carry a search/action toolbar.
 */
import { createElement as h } from 'react';
import { VStack } from '@astryxdesign/core';
import { SECTIONS } from './sections.mjs';

export const id = 'table';

const SUPPORTED = Object.keys(SECTIONS);

export function render(content) {
  const blocks = Array.isArray(content.blocks) ? content.blocks : [];
  if (blocks.length === 0) {
    throw new Error('table: content.blocks 为空或缺失，无法渲染');
  }
  return h(
    VStack,
    { gap: 6, width: '100%' },
    blocks.map((b, i) => {
      const Section = SECTIONS[b.type];
      if (!Section) {
        throw new Error(
          `table: 未知区块类型 type="${b.type}"（支持: ${SUPPORTED.join(', ')}）`
        );
      }
      return h(Section, { key: b.id || `b${i}`, ...(b.props || {}) });
    })
  );
}

export default { id, render };
