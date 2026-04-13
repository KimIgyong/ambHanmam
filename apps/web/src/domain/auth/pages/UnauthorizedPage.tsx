import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';

export default function UnauthorizedPage() {
  const { t } = useTranslation('auth');
  const navigate = useNavigate();

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
      <div className="max-w-md w-full bg-white dark:bg-gray-800 rounded-lg shadow-sm p-8 text-center">
        <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-red-100 dark:bg-red-900/40 flex items-center justify-center">
          <svg className="w-8 h-8 text-red-600 dark:text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
          </svg>
        </div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-2">
          {t('unauthorized.title', 'Access Denied')}
        </h1>
        <p className="text-gray-600 dark:text-gray-400 mb-6">
          {t('unauthorized.message', 'You do not have permission to access this page.')}
        </p>
        <button
          onClick={() => navigate('/', { replace: true })}
          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md text-sm font-medium"
        >
          {t('unauthorized.goHome', 'Go to Home')}
        </button>
      </div>
    </div>
  );
}
