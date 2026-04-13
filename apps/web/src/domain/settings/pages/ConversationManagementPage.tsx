import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { MessageSquare, Search, ArrowLeft, MessageCircleMore, Rows3 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAdminConversations, useAdminTimeline } from '../hooks/useConversationAdmin';
import { UNITS } from '@/global/constant/unit.constant';
import ConversationDetailModal from '../components/ConversationDetailModal';
import { LocalDateTime } from '@/components/common/LocalDateTime';
import { useEntityStore } from '@/domain/hr/store/entity.store';

export default function ConversationManagementPage() {
  const { t } = useTranslation(['settings', 'common', 'units']);
  const navigate = useNavigate();
  const entities = useEntityStore((s) => s.entities);
  const [department, setDepartment] = useState('');
  const [entityId, setEntityId] = useState('');
  const [search, setSearch] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [page, setPage] = useState(1);
  const [selectedId, setSelectedId] = useState('');
  const [selectedMessageId, setSelectedMessageId] = useState('');
  const [viewMode, setViewMode] = useState<'timeline' | 'rooms'>('timeline');

  const params = {
    ...(entityId && { entity_id: entityId }),
    ...(department && { department }),
    ...(search && { search }),
    ...(dateFrom && { dateFrom }),
    ...(dateTo && { dateTo }),
    page,
    size: 20,
  };

  const { data: result, isLoading } = useAdminConversations(params);
  const { data: timelineResult, isLoading: isTimelineLoading } = useAdminTimeline(params);
  const conversations = result?.data || [];
  const timeline = timelineResult?.data || [];
  const pagination = result?.pagination;
  const timelinePagination = timelineResult?.pagination;

  const openConversation = (conversationId: string, messageId?: string) => {
    setSelectedId(conversationId);
    setSelectedMessageId(messageId || '');
  };

  return (
    <div className="flex h-full flex-col overflow-hidden">
      {/* Header */}
      <div className="shrink-0 border-b border-gray-200 bg-white px-6 py-4">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate('/admin')}
            className="rounded-md p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition-colors"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-cyan-100">
            <MessageSquare className="h-5 w-5 text-cyan-600" />
          </div>
          <div>
            <h1 className="text-lg font-semibold text-gray-900">
              {t('settings:conversations.title')}
            </h1>
            <p className="text-sm text-gray-500">
              {t('settings:conversations.subtitle')}
            </p>
          </div>
        </div>

        {/* Filters */}
        <div className="mt-3 flex flex-wrap items-center gap-3">
          <select
            value={entityId}
            onChange={(e) => { setEntityId(e.target.value); setPage(1); }}
            className="rounded-md border border-gray-300 py-2 pl-3 pr-8 text-sm focus:border-cyan-500 focus:outline-none focus:ring-1 focus:ring-cyan-500"
          >
            <option value="">{t('settings:conversations.filter.allEntities')}</option>
            {entities.map((entity) => (
              <option key={entity.entityId} value={entity.entityId}>
                {entity.code} · {entity.name}
              </option>
            ))}
          </select>
          <select
            value={department}
            onChange={(e) => { setDepartment(e.target.value); setPage(1); }}
            className="rounded-md border border-gray-300 py-2 pl-3 pr-8 text-sm focus:border-cyan-500 focus:outline-none focus:ring-1 focus:ring-cyan-500"
          >
            <option value="">{t('settings:conversations.filter.allDepartments')}</option>
            {UNITS.map((dept) => (
              <option key={dept.code} value={dept.code}>
                {t(`units:${dept.nameKey}`)}
              </option>
            ))}
          </select>
          <div className="relative flex-1 min-w-[200px] max-w-md">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              placeholder={t('settings:conversations.filter.searchPlaceholder')}
              className="w-full rounded-md border border-gray-300 py-2 pl-9 pr-3 text-sm focus:border-cyan-500 focus:outline-none focus:ring-1 focus:ring-cyan-500"
            />
          </div>
          <input
            type="date"
            value={dateFrom}
            onChange={(e) => { setDateFrom(e.target.value); setPage(1); }}
            className="rounded-md border border-gray-300 py-2 px-3 text-sm focus:border-cyan-500 focus:outline-none focus:ring-1 focus:ring-cyan-500"
          />
          <span className="text-gray-400 text-sm">~</span>
          <input
            type="date"
            value={dateTo}
            onChange={(e) => { setDateTo(e.target.value); setPage(1); }}
            className="rounded-md border border-gray-300 py-2 px-3 text-sm focus:border-cyan-500 focus:outline-none focus:ring-1 focus:ring-cyan-500"
          />
        </div>

        <div className="mt-4 flex items-center gap-2">
          <button
            onClick={() => setViewMode('timeline')}
            className={`inline-flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
              viewMode === 'timeline' ? 'bg-cyan-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            <Rows3 className="h-4 w-4" />
            {t('settings:conversations.tabs.timeline')}
          </button>
          <button
            onClick={() => setViewMode('rooms')}
            className={`inline-flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
              viewMode === 'rooms' ? 'bg-cyan-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            <MessageCircleMore className="h-4 w-4" />
            {t('settings:conversations.tabs.rooms')}
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto">
        {viewMode === 'timeline' ? (
          isTimelineLoading ? (
            <div className="flex items-center justify-center py-20">
              <div className="text-sm text-gray-500">{t('common:loading')}</div>
            </div>
          ) : timeline.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20">
              <Rows3 className="h-12 w-12 text-gray-300" />
              <p className="mt-3 text-sm font-medium text-gray-500">
                {t('settings:conversations.noResults')}
              </p>
            </div>
          ) : (
            <div className="divide-y divide-gray-200 bg-white">
              {timeline.map((item: any) => (
                <button
                  key={item.messageId}
                  onClick={() => openConversation(item.conversationId, item.messageId)}
                  className="flex w-full flex-col gap-2 px-6 py-4 text-left transition-colors hover:bg-cyan-50"
                >
                  <div className="flex flex-wrap items-center gap-2 text-xs text-gray-500">
                    <span className="rounded-full bg-gray-100 px-2 py-0.5 font-medium text-gray-700">
                      {item.entityCode || t('settings:conversations.labels.noEntity')}
                    </span>
                    <span>{item.userName}</span>
                    <span>·</span>
                    <span>{String(t(`units:${item.unit}.name`, { defaultValue: item.unit }))}</span>
                    <span>·</span>
                    <span className={`rounded-full px-2 py-0.5 font-medium ${item.role === 'admin' ? 'bg-amber-100 text-amber-800' : item.role === 'user' ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-700'}`}>
                      {item.role === 'admin'
                        ? t('settings:conversations.roles.admin')
                        : item.role === 'user'
                          ? t('settings:conversations.roles.user')
                          : t('settings:conversations.roles.ai')}
                    </span>
                    <span className="ml-auto"><LocalDateTime value={item.createdAt} format='YYYY-MM-DD HH:mm' /></span>
                  </div>
                  <div className="text-sm font-semibold text-gray-900">{item.title}</div>
                  <div className="line-clamp-2 text-sm text-gray-600 whitespace-pre-wrap">{item.content}</div>
                  <div className="text-xs text-gray-400">{item.entityName || t('settings:conversations.labels.noEntity')}</div>
                </button>
              ))}
            </div>
          )
        ) : isLoading ? (
          <div className="flex items-center justify-center py-20">
            <div className="text-sm text-gray-500">{t('common:loading')}</div>
          </div>
        ) : conversations.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20">
            <MessageSquare className="h-12 w-12 text-gray-300" />
            <p className="mt-3 text-sm font-medium text-gray-500">
              {t('settings:conversations.noResults')}
            </p>
          </div>
        ) : (
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50 sticky top-0">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  {t('settings:conversations.table.user')}
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  {t('settings:conversations.table.entity')}
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  {t('settings:conversations.table.unit')}
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  {t('settings:conversations.table.title')}
                </th>
                <th className="px-6 py-3 text-center text-xs font-medium uppercase tracking-wider text-gray-500">
                  {t('settings:conversations.table.messageCount')}
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  {t('settings:conversations.table.createdAt')}
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  {t('settings:conversations.table.updatedAt')}
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 bg-white">
              {conversations.map((cvs: any) => (
                <tr
                  key={cvs.conversationId}
                  className="hover:bg-gray-50 cursor-pointer transition-colors"
                  onClick={() => setSelectedId(cvs.conversationId)}
                >
                  <td className="whitespace-nowrap px-6 py-3 text-sm text-gray-900">
                    <div>{cvs.userName}</div>
                    <div className="text-xs text-gray-400">{cvs.userEmail}</div>
                  </td>
                  <td className="whitespace-nowrap px-6 py-3 text-sm text-gray-600">
                    <div className="font-medium text-gray-800">{cvs.entityCode || '-'}</div>
                    <div className="text-xs text-gray-400">{cvs.entityName || t('settings:conversations.labels.noEntity')}</div>
                  </td>
                  <td className="whitespace-nowrap px-6 py-3 text-sm">
                    <span className="inline-flex items-center rounded-full bg-cyan-50 px-2 py-0.5 text-xs font-medium text-cyan-700">
                      {String(t(`units:${cvs.unit}.name`, { defaultValue: cvs.unit }))}
                    </span>
                  </td>
                  <td className="px-6 py-3 text-sm text-gray-900 max-w-xs truncate">
                    {cvs.title}
                  </td>
                  <td className="whitespace-nowrap px-6 py-3 text-sm text-gray-600 text-center">
                    {cvs.messageCount}
                  </td>
                  <td className="whitespace-nowrap px-6 py-3 text-sm text-gray-500">
                    {<LocalDateTime value={cvs.createdAt} format='YYYY-MM-DD HH:mm' />}
                  </td>
                  <td className="whitespace-nowrap px-6 py-3 text-sm text-gray-500">
                    {<LocalDateTime value={cvs.updatedAt} format='YYYY-MM-DD HH:mm' />}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Pagination */}
      {viewMode === 'rooms' && pagination && pagination.totalPages > 1 && (
        <div className="shrink-0 border-t border-gray-200 bg-white px-6 py-3 flex items-center justify-between">
          <div className="text-sm text-gray-500">
            {t('settings:conversations.table.totalCount', { count: pagination.totalCount })}
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={!pagination.hasPrev}
              className="rounded-md border border-gray-300 px-3 py-1.5 text-sm disabled:opacity-50 hover:bg-gray-50 transition-colors"
            >
              {t('common:prev')}
            </button>
            <span className="text-sm text-gray-600">
              {pagination.page} / {pagination.totalPages}
            </span>
            <button
              onClick={() => setPage((p) => p + 1)}
              disabled={!pagination.hasNext}
              className="rounded-md border border-gray-300 px-3 py-1.5 text-sm disabled:opacity-50 hover:bg-gray-50 transition-colors"
            >
              {t('common:next')}
            </button>
          </div>
        </div>
      )}

      {viewMode === 'timeline' && timelinePagination && timelinePagination.totalPages > 1 && (
        <div className="shrink-0 border-t border-gray-200 bg-white px-6 py-3 flex items-center justify-between">
          <div className="text-sm text-gray-500">
            {t('settings:conversations.table.totalCount', { count: timelinePagination.totalCount })}
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={!timelinePagination.hasPrev}
              className="rounded-md border border-gray-300 px-3 py-1.5 text-sm disabled:opacity-50 hover:bg-gray-50 transition-colors"
            >
              {t('common:prev')}
            </button>
            <span className="text-sm text-gray-600">
              {timelinePagination.page} / {timelinePagination.totalPages}
            </span>
            <button
              onClick={() => setPage((p) => p + 1)}
              disabled={!timelinePagination.hasNext}
              className="rounded-md border border-gray-300 px-3 py-1.5 text-sm disabled:opacity-50 hover:bg-gray-50 transition-colors"
            >
              {t('common:next')}
            </button>
          </div>
        </div>
      )}

      {/* Detail Modal */}
      {selectedId && (
        <ConversationDetailModal
          conversationId={selectedId}
          initialSelectedMessageId={selectedMessageId}
          onClose={() => setSelectedId('')}
        />
      )}
    </div>
  );
}
