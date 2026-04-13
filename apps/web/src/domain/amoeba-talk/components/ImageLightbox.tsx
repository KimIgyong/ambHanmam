import { useEffect, useState } from 'react';
import { X } from 'lucide-react';

interface ImageLightboxProps {
  url: string;
  onClose: () => void;
}

export default function ImageLightbox({ url, onClose }: ImageLightboxProps) {
  const [error, setError] = useState(false);

  useEffect(() => {
    setError(false);
  }, [url]);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/90"
      style={{ paddingTop: 'env(safe-area-inset-top, 0px)' }}
      onClick={onClose}
    >
      {error ? (
        <div className="flex flex-col items-center gap-3 text-white/70">
          <X className="h-12 w-12" />
          <span className="text-sm">Image not available</span>
        </div>
      ) : (
        <div className="relative inline-flex" onClick={(e) => e.stopPropagation()}>
          <img
            src={url}
            alt=""
            className="max-h-[85vh] max-w-[95vw] object-contain"
            onError={() => setError(true)}
          />
          <button
            onClick={onClose}
            className="absolute right-2 top-2 z-10 rounded-full bg-black/60 p-2 text-white shadow-lg hover:bg-black/80"
          >
            <X className="h-6 w-6" />
          </button>
        </div>
      )}
    </div>
  );
}
