import { Node, mergeAttributes } from '@tiptap/core';

/**
 * WikiLink TipTap Extension
 *
 * HTML 렌더링:
 *   <span class="wiki-link" data-type="NOTE" data-id="uuid" data-text="제목">제목</span>
 *
 * 에디터 내에서 인라인 노드로 표시되며, 클릭 시 해당 문서로 이동 가능.
 */
export const WikiLink = Node.create({
  name: 'wikiLink',
  group: 'inline',
  inline: true,
  atom: true,

  addAttributes() {
    return {
      id: { default: null },
      type: { default: 'NOTE' },
      text: { default: '' },
    };
  },

  parseHTML() {
    return [
      {
        tag: 'span.wiki-link',
        getAttrs: (node) => {
          const el = node as HTMLElement;
          return {
            id: el.getAttribute('data-id'),
            type: el.getAttribute('data-type') || 'NOTE',
            text: el.getAttribute('data-text') || el.textContent || '',
          };
        },
      },
    ];
  },

  renderHTML({ node, HTMLAttributes }) {
    return [
      'span',
      mergeAttributes(HTMLAttributes, {
        class: 'wiki-link',
        'data-id': node.attrs.id,
        'data-type': node.attrs.type,
        'data-text': node.attrs.text,
      }),
      node.attrs.text || '',
    ];
  },

  addNodeView() {
    return ({ node }) => {
      const dom = document.createElement('span');
      dom.className = 'wiki-link';
      dom.setAttribute('data-id', node.attrs.id || '');
      dom.setAttribute('data-type', node.attrs.type || 'NOTE');
      dom.setAttribute('data-text', node.attrs.text || '');
      dom.textContent = node.attrs.text || '';
      dom.contentEditable = 'false';

      // Styling
      const typeColors: Record<string, string> = {
        NOTE: '#6366f1',
        TASK: '#8b5cf6',
        ISSUE: '#ef4444',
        PROJECT: '#22c55e',
        MISSION: '#f59e0b',
      };
      const color = typeColors[node.attrs.type] || '#6366f1';
      dom.style.color = color;
      dom.style.backgroundColor = `${color}10`;
      dom.style.padding = '1px 4px';
      dom.style.borderRadius = '3px';
      dom.style.cursor = 'pointer';
      dom.style.fontWeight = '500';
      dom.style.textDecoration = 'none';
      dom.style.borderBottom = `1px solid ${color}40`;

      return { dom };
    };
  },
});

export default WikiLink;
