const MANUAL_PATHS = {
  guide: '/service/ama/AMA-User-Guide-v1.html',
  manual: '/service/ama/AMA-User-Manual-v1.html',
};

function resolvePortalOrigin() {
  if (typeof window === 'undefined') return '';
  const { protocol, hostname, port } = window.location;

  if (hostname === 'localhost') {
    const resolvedPort = port === '5189' ? '5190' : port || '5190';
    return `${protocol}//${hostname}:${resolvedPort}`;
  }

  if (hostname.startsWith('stg-ama.')) {
    return `${protocol}//${hostname.replace('stg-ama.', 'stg-www.')}`;
  }

  if (hostname.startsWith('ama.')) {
    return `${protocol}//${hostname.replace('ama.', 'www.')}`;
  }

  return `${protocol}//${hostname}`;
}

export function getManualLinks() {
  const origin = resolvePortalOrigin();
  return {
    guideUrl: `${origin}${MANUAL_PATHS.guide}`,
    manualUrl: `${origin}${MANUAL_PATHS.manual}`,
  };
}

