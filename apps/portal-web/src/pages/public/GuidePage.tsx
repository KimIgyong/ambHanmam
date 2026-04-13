import { useParams, useNavigate, Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { useEffect, useRef } from 'react';
import { PageHead } from '@/components/seo/PageHead';

const GUIDE_MAP: Record<string, { path: string; title: string }> = {
  'user-guide': { path: '/service/ama/AMA-User-Guide-v1.html', title: 'User Guide' },
  'user-manual': { path: '/service/ama/AMA-User-Manual-v1.html', title: 'User Manual' },
  'smart-todo': { path: '/service/ama/AMA_SmartToDo.html', title: 'Smart ToDo' },
  'work-tools': { path: '/service/ama/AMA_WorkTools_animated.html', title: 'Work Tools' },
  'google-drive': { path: '/service/ama/ama-google-drive-guide.html', title: 'Google Drive Setup' },
  'app-install': { path: '/service/ama/app-install-guide.html', title: 'App Install Guide' },
  'car-manager': { path: '/service/ama/car-manager-ui.html', title: 'Car Manager' },
};

export function GuidePage() {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const guide = slug ? GUIDE_MAP[slug] : undefined;
  const src = guide?.path;

  /* redirect if unknown slug */
  useEffect(() => {
    if (!src) navigate('/', { replace: true });
  }, [src, navigate]);

  /* hide the guide's own lang-bar inside iframe */
  useEffect(() => {
    const iframe = iframeRef.current;
    if (!iframe || !src) return;

    const hideLangBar = () => {
      try {
        const doc = iframe.contentDocument;
        if (doc) {
          const style = doc.createElement('style');
          style.textContent = '.lang-bar { display: none !important; }';
          doc.head.appendChild(style);
        }
      } catch {
        /* cross-origin: should not happen since same-origin */
      }
    };
    iframe.addEventListener('load', hideLangBar);
    return () => iframe.removeEventListener('load', hideLangBar);
  }, [src]);

  if (!guide || !src) return null;

  return (
    <div className="pt-16 flex flex-col" style={{ height: '100vh' }}>
      <PageHead
        title={`${guide.title} — User Guide`}
        description={`${guide.title} guide for Ạ platform`}
        path={`/guide/${slug}`}
      />
      {/* thin toolbar */}
      <div className="flex items-center gap-3 px-4 py-2 border-b border-slate-200 bg-white">
        <Link
          to="/#guide"
          className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-800 transition-colors"
        >
          <ArrowLeft size={16} />
          <span>Back</span>
        </Link>
      </div>

      <iframe
        ref={iframeRef}
        src={src}
        className="flex-1 w-full border-0"
        title={`${guide.title} Guide`}
      />
    </div>
  );
}
