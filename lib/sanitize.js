import DOMPurify from 'isomorphic-dompurify';

const ALLOWED = {
  ALLOWED_TAGS: [
    'p', 'br', 'strong', 'em', 'b', 'i', 'u', 's', 'del', 'ins', 'sub', 'sup',
    'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
    'ul', 'ol', 'li', 'dl', 'dt', 'dd',
    'blockquote', 'pre', 'code', 'hr',
    'a', 'img', 'figure', 'figcaption', 'table', 'thead', 'tbody', 'tr', 'th', 'td',
    'span', 'div', 'input'
  ],
  ALLOWED_ATTR: [
    'href', 'src', 'alt', 'title', 'id', 'class', 'datetime', 'loading', 'decoding', 'target', 'rel',
    'type', 'checked', 'disabled'
  ]
};

export function sanitizeHtml(html) {
  return DOMPurify.sanitize(html, ALLOWED);
}
