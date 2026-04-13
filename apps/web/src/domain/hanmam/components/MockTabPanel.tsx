interface Tab {
  id?: string;
  key?: string;
  label: string;
}

interface Props {
  tabs: Tab[];
  activeTab: string;
  onTabChange: (id: string) => void;
}

export default function MockTabPanel({ tabs, activeTab, onTabChange }: Props) {
  return (
    <div className="flex gap-0 border-b border-gray-200">
      {tabs.map((tab) => {
        const tabId = tab.id ?? tab.key ?? '';
        return (
          <button
            key={tabId}
            onClick={() => onTabChange(tabId)}
            className={`px-4 py-2.5 text-sm font-medium transition-colors ${
              activeTab === tabId
                ? 'border-b-2 border-indigo-600 text-indigo-600'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            {tab.label}
          </button>
        );
      })}
    </div>
  );
}
