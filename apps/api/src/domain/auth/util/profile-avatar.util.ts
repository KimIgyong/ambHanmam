const PALETTE = [
  '#2563eb',
  '#0891b2',
  '#0f766e',
  '#059669',
  '#65a30d',
  '#ca8a04',
  '#ea580c',
  '#dc2626',
  '#db2777',
  '#7c3aed',
];

function hashString(input: string): number {
  let hash = 0;
  for (let i = 0; i < input.length; i += 1) {
    hash = ((hash << 5) - hash + input.charCodeAt(i)) | 0;
  }
  return Math.abs(hash);
}

function escapeXml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

function extractInitial(name: string): string {
  const trimmed = (name || '').trim();
  if (!trimmed) return '?';

  const words = trimmed.split(/\s+/).filter(Boolean);
  if (words.length === 1) {
    return words[0].slice(0, 1).toUpperCase();
  }

  return `${words[0].slice(0, 1)}${words[1].slice(0, 1)}`.toUpperCase();
}

export function createDefaultProfileImage(name: string, seed?: string): Buffer {
  const initial = extractInitial(name);
  const colorSeed = seed || name || 'default';
  const bgColor = PALETTE[hashString(colorSeed) % PALETTE.length];

  const svg = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="128" height="128" viewBox="0 0 128 128" role="img" aria-label="profile">
  <rect width="128" height="128" rx="64" fill="${bgColor}"/>
  <text x="64" y="64" text-anchor="middle" dominant-baseline="central" font-family="Inter, Arial, sans-serif" font-size="48" font-weight="700" fill="#ffffff">${escapeXml(initial)}</text>
</svg>`;

  return Buffer.from(svg, 'utf8');
}

export function detectProfileImageContentType(buffer: Buffer | null | undefined): string {
  if (!buffer || buffer.length === 0) return 'image/jpeg';

  if (buffer.length >= 3 && buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff) {
    return 'image/jpeg';
  }

  if (
    buffer.length >= 8
    && buffer[0] === 0x89
    && buffer[1] === 0x50
    && buffer[2] === 0x4e
    && buffer[3] === 0x47
    && buffer[4] === 0x0d
    && buffer[5] === 0x0a
    && buffer[6] === 0x1a
    && buffer[7] === 0x0a
  ) {
    return 'image/png';
  }

  const textPrefix = buffer.subarray(0, 256).toString('utf8').trimStart().toLowerCase();
  if (textPrefix.startsWith('<svg') || textPrefix.startsWith('<?xml')) {
    return 'image/svg+xml';
  }

  return 'application/octet-stream';
}
