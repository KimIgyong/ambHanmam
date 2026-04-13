import DOMPurify from 'dompurify';

const ALLOWED_TAGS = [
  'p', 'br', 'b', 'i', 'u', 'strong', 'em', 'a',
  'ul', 'ol', 'li', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
  'table', 'tr', 'td', 'th', 'thead', 'tbody',
  'span', 'div', 'img', 'blockquote', 'pre', 'code', 'hr',
  'input', 'label', 's', 'del', 'sub', 'sup',
];

const ALLOWED_ATTR = [
  'href', 'src', 'alt', 'style', 'class', 'target', 'rel',
  'width', 'height', 'type', 'checked', 'disabled', 'data-type',
];

export function sanitizeHtml(dirty: string | undefined | null): string {
  if (!dirty) return '';
  return DOMPurify.sanitize(dirty, {
    ALLOWED_TAGS,
    ALLOWED_ATTR,
  });
}
