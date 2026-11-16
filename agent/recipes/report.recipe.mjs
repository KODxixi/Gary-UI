/**
 * Recipe · report (article shell)
 * Block order comes from content.blocks; type is dispatched via SECTIONS.
 */
import { createElement as h } from 'react';
import { VStack } from '@astryxdesign/core';
import { SECTIONS } from './sections.mjs';

export const id = 'report';

const SUPPORTED = Object.keys(SECTIONS);

export function render(content) {
  const blocks = Array.isArray(content.blocks) ? content.blocks : [];
  if (blocks.length === 0) {
    throw new Error('report: content.blocks 为空或缺失，无法渲染');
  }
  return h(
    VStack,
    { gap: 8, width: '100%' },
    blocks.map((b, i) => {
      const Section = SECTIONS[b.type];
      if (!Section) {
        throw new Error(
          `report: 未知区块类型 type="${b.type}"（支持: ${SUPPORTED.join(', ')}）`
        );
      }
      return h(Section, { key: b.id || `b${i}`, ...(b.props || {}) });
    })
  );
}

export default { id, render };
