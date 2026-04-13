import * as sanitizeHtml from 'sanitize-html';

/**
 * Sanitize rich HTML content (notices, emails, etc.)
 * Allows safe tags (formatting, lists, images, tables) while removing
 * dangerous elements (script, iframe, form) and event handlers.
 */
export function sanitizeRichHtml(html: string): string {
  if (!html) return html;
  return sanitizeHtml(html, {
    allowedTags: sanitizeHtml.defaults.allowedTags.concat([
      'img', 'h1', 'h2', 'table', 'thead', 'tbody', 'tr', 'th', 'td',
      'span', 'div', 'br', 'hr', 'sup', 'sub', 'u', 's', 'mark',
    ]),
    allowedAttributes: {
      ...sanitizeHtml.defaults.allowedAttributes,
      img: ['src', 'alt', 'width', 'height'],
      span: ['style', 'class'],
      div: ['style', 'class'],
      td: ['colspan', 'rowspan', 'style'],
      th: ['colspan', 'rowspan', 'style'],
      a: ['href', 'target', 'rel'],
    },
    allowedSchemes: ['http', 'https', 'mailto'],
    allowedStyles: {
      '*': {
        color: [/.*/],
        'background-color': [/.*/],
        'text-align': [/.*/],
        'font-size': [/.*/],
        'font-weight': [/.*/],
      },
    },
  });
}

/**
 * Strip all HTML tags from content (for plain-text contexts like chat messages).
 */
export function stripHtml(html: string): string {
  if (!html) return html;
  return sanitizeHtml(html, { allowedTags: [], allowedAttributes: {} });
}
