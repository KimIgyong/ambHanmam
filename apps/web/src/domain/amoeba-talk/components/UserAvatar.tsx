import { useState, useEffect } from 'react';

const API_BASE = import.meta.env.VITE_API_BASE_URL || '/api/v1';
const SYSTEM_USER_ID = '00000000-0000-0000-0000-000000000000';

/** userId → blob URL 캐시 (메모리, 탭 단위) */
const blobCache = new Map<string, string | null>();

interface UserAvatarProps {
  userId: string;
  name: string;
  size?: number;
}

export default function UserAvatar({ userId, name, size = 32 }: UserAvatarProps) {
  const [blobUrl, setBlobUrl] = useState<string | null>(
    blobCache.get(userId) ?? null,
  );
  const [checked, setChecked] = useState(blobCache.has(userId));

  useEffect(() => {
    if (checked) return;

    const normalizedId = (userId || '').trim();
    if (!normalizedId || normalizedId === SYSTEM_USER_ID) {
      blobCache.set(userId, null);
      setChecked(true);
      return;
    }

    let revoked = false;

    fetch(`${API_BASE}/users/${normalizedId}/profile-image`, { credentials: 'include' })
      .then((r) => {
        if (!r.ok) throw new Error('no image');
        return r.blob();
      })
      .then((blob) => {
        if (revoked) return;
        const url = URL.createObjectURL(blob);
        blobCache.set(userId, url);
        setBlobUrl(url);
      })
      .catch(() => {
        blobCache.set(userId, null);
      })
      .finally(() => setChecked(true));

    return () => { revoked = true; };
  }, [userId, checked]);

  const initials = (name || '?')
    .replace(/^\[Slack\]\s*/, '')
    .split(/\s+/)
    .map((w) => w.charAt(0))
    .join('')
    .slice(0, 2)
    .toUpperCase();

  if (!blobUrl) {
    return (
      <div
        className="flex items-center justify-center rounded-full bg-indigo-100 text-xs font-medium text-indigo-600"
        style={{ width: size, height: size }}
      >
        {initials}
      </div>
    );
  }

  return (
    <img
      src={blobUrl}
      alt={name}
      className="rounded-full object-cover"
      style={{ width: size, height: size }}
    />
  );
}
