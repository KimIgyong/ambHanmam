import { NavLink, Outlet } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

const navItems = [
  { path: '/kms/doc-builder', key: 'docBuilder.tab' },
  { path: '/kms/ddd', key: 'ddd.tab' },
  { path: '/kms/ddd-settings', key: 'ddd.settingsTab' },
  { path: '/kms/tag-cloud', key: 'tagCloud' },
  { path: '/kms/tags', key: 'tagManagement' },
  { path: '/kms/knowledge-graph', key: 'knowledgeGraph' },
  { path: '/kms/amb-graph', key: 'ambGraph.tab' },
];

export default function KmsLayout() {
  const { t } = useTranslation('kms');

  return (
    <div className="flex h-full flex-col">
      <div className="border-b border-gray-200 bg-white px-6">
        <div className="flex items-center gap-6">
          <h1 className="py-3 text-lg font-bold text-gray-900">{t('title')}</h1>
          <nav className="flex gap-1">
            {navItems.map((item) => (
              <NavLink
                key={item.path}
                to={item.path}
                className={({ isActive }) =>
                  `border-b-2 px-3 py-3 text-sm font-medium transition-colors ${
                    isActive
                      ? 'border-blue-600 text-blue-600'
                      : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'
                  }`
                }
              >
                {t(item.key)}
              </NavLink>
            ))}
          </nav>
        </div>
      </div>
      <div className="flex-1 overflow-auto">
        <Outlet />
      </div>
    </div>
  );
}
