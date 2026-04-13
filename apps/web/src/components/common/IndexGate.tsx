import { useState, useEffect } from 'react';
import { Outlet } from 'react-router-dom';
import { settingsService } from '@/domain/settings/service/settings.service';

export default function IndexGate() {
  const [state, setState] = useState<'loading' | 'index' | 'app'>('loading');
  const [html, setHtml] = useState('');

  useEffect(() => {
    // 루트가 아닌 경우 바로 앱 표시
    if (window.location.pathname !== '/') {
      setState('app');
      return;
    }

    settingsService
      .getIndexPage()
      .then((data) => {
        if (data && data.enabled && data.html) {
          setHtml(data.html);
          setState('index');
        } else {
          setState('app');
        }
      })
      .catch(() => {
        setState('app');
      });
  }, []);

  if (state === 'loading') {
    return (
      <div className="flex h-screen items-center justify-center bg-gray-50">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-indigo-600 border-t-transparent" />
      </div>
    );
  }

  if (state === 'index') {
    return (
      <div className="h-screen w-screen">
        <iframe
          srcDoc={html}
          title="Index Page"
          className="h-full w-full border-0"
        />
      </div>
    );
  }

  return <Outlet />;
}
