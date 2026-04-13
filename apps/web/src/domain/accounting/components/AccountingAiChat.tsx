import { useState, useRef, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { Sparkles, Send, Loader2, Trash2, Save, FileText, X, Check } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { toast } from 'sonner';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';
import { useEntityStore } from '@/domain/hr/store/entity.store';
import { QuotaExceededBanner } from '@/components/common/QuotaExceededBanner';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api/v1';

interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

interface ChatReport {
  reportId: string;
  title: string;
  content: string;
  createdAt: string;
}

// ─── Hooks ──────────────────────────────────────────────

const useChatReports = () => {
  const entityId = useEntityStore((s) => s.currentEntity?.entityId);
  return useQuery({
    queryKey: ['accounting', 'chatReports', entityId],
    queryFn: () =>
      apiClient
        .get<{ success: boolean; data: ChatReport[] }>('/accounts/analysis/chat/reports')
        .then((r) => r.data.data),
    enabled: !!entityId,
  });
};

const useSaveChatReport = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: { title: string; content: string }) =>
      apiClient
        .post<{ success: boolean; data: ChatReport }>('/accounts/analysis/chat/reports', data)
        .then((r) => r.data.data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['accounting', 'chatReports'] }); },
  });
};

const useDeleteChatReport = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (reportId: string) =>
      apiClient.delete(`/accounts/analysis/chat/reports/${reportId}`),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['accounting', 'chatReports'] }); },
  });
};

// ─── Component ──────────────────────────────────────────

export default function AccountingAiChat() {
  const { t } = useTranslation(['accounting', 'common']);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [isStreaming, setIsStreaming] = useState(false);
  const [showSaveDialog, setShowSaveDialog] = useState(false);
  const [saveTitle, setSaveTitle] = useState('');
  const [saveMsgIndex, setSaveMsgIndex] = useState<number | null>(null);
  const [viewingReport, setViewingReport] = useState<ChatReport | null>(null);
  const [showReports, setShowReports] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const { data: reports = [] } = useChatReports();
  const saveReport = useSaveChatReport();
  const deleteReport = useDeleteChatReport();

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  useEffect(() => { scrollToBottom(); }, [messages, scrollToBottom]);

  const handleSend = async (text?: string) => {
    const msg = (text || input).trim();
    if (!msg || isStreaming) return;

    const userMessage: ChatMessage = { role: 'user', content: msg };
    const history = [...messages];
    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setIsStreaming(true);
    setViewingReport(null);
    setShowReports(false);

    setMessages((prev) => [...prev, { role: 'assistant', content: '' }]);

    try {
      const entityId = (await import('@/domain/hr/store/entity.store')).useEntityStore.getState().currentEntity?.entityId;
      const response = await fetch(`${API_BASE_URL}/accounts/analysis/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(entityId ? { 'X-Entity-Id': entityId } : {}),
        },
        credentials: 'include',
        body: JSON.stringify({ message: msg, history }),
      });

      if (!response.ok || !response.body) throw new Error('Chat request failed');

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let accumulated = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        const chunk = decoder.decode(value, { stream: true });
        const lines = chunk.split('\n');
        for (const line of lines) {
          if (line.startsWith('data: ')) {
            try {
              const data = JSON.parse(line.slice(6));
              if (data.type === 'content' && data.content) {
                accumulated += data.content;
                setMessages((prev) => {
                  const updated = [...prev];
                  updated[updated.length - 1] = { role: 'assistant', content: accumulated };
                  return updated;
                });
              }
            } catch { /* skip */ }
          }
        }
      }
    } catch {
      toast.error(t('common:errors.E9001', { defaultValue: '오류가 발생했습니다' }));
      setMessages((prev) => {
        const updated = [...prev];
        if (updated.length > 0 && updated[updated.length - 1].role === 'assistant' && !updated[updated.length - 1].content) {
          updated.pop();
        }
        return updated;
      });
    } finally {
      setIsStreaming(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleSaveMessage = (index: number) => {
    const today = new Date().toISOString().split('T')[0];
    const seq = String(reports.filter((r) => r.title.startsWith(`회계대시보드_${today}_`)).length + 1).padStart(3, '0');
    setSaveTitle(`회계대시보드_${today}_${seq}`);
    setSaveMsgIndex(index);
    setShowSaveDialog(true);
  };

  const handleSave = () => {
    if (!saveTitle.trim() || saveMsgIndex === null) return;
    const content = messages[saveMsgIndex]?.content;
    if (!content) return;

    saveReport.mutate(
      { title: saveTitle.trim(), content },
      {
        onSuccess: () => {
          toast.success(t('accounting:aiChat.saved', { defaultValue: '리포트가 저장되었습니다' }));
          setShowSaveDialog(false);
          setSaveTitle('');
          setSaveMsgIndex(null);
        },
      },
    );
  };

  const handleDeleteReport = (reportId: string) => {
    if (!confirm(t('accounting:aiChat.deleteConfirm', { defaultValue: '이 리포트를 삭제하시겠습니까?' }))) return;
    deleteReport.mutate(reportId, {
      onSuccess: () => {
        if (viewingReport?.reportId === reportId) setViewingReport(null);
      },
    });
  };

  const examples = [
    t('accounting:aiChat.example1', { defaultValue: '이번 달 자금 현황을 요약해줘' }),
    t('accounting:aiChat.example2', { defaultValue: '최근 지출 패턴을 분석해줘' }),
    t('accounting:aiChat.example3', { defaultValue: '정기 지출 예산 리포트를 작성해줘' }),
  ];

  return (
    <div className="rounded-xl border border-gray-200 bg-white">
      {/* Header */}
      <div className="flex items-center justify-between border-b px-5 py-3">
        <div className="flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-indigo-600" />
          <h2 className="font-semibold text-gray-900">
            {t('accounting:aiChat.title', { defaultValue: 'AI 회계 어시스턴트' })}
          </h2>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => { setShowReports(!showReports); setViewingReport(null); }}
            className={`flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-medium transition-colors ${
              showReports ? 'border-indigo-300 bg-indigo-50 text-indigo-600' : 'border-gray-300 text-gray-600 hover:bg-gray-50'
            }`}
          >
            <FileText className="h-3.5 w-3.5" />
            {t('accounting:aiChat.savedReports', { defaultValue: '저장된 리포트' })}
            {reports.length > 0 && (
              <span className="rounded-full bg-gray-200 px-1.5 text-[10px] font-bold text-gray-600">{reports.length}</span>
            )}
          </button>
          {messages.length > 0 && (
            <button
              onClick={() => { setMessages([]); setViewingReport(null); }}
              className="rounded-lg border border-gray-300 p-1.5 text-gray-400 hover:bg-gray-50 hover:text-gray-600"
              title={t('accounting:aiChat.clear', { defaultValue: '대화 초기화' })}
            >
              <Trash2 className="h-3.5 w-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Saved Reports Panel */}
      <QuotaExceededBanner />
      {showReports && (
        <div className="border-b">
          {viewingReport ? (
            <div className="max-h-96 overflow-y-auto px-5 py-4">
              <div className="mb-3 flex items-center justify-between">
                <div>
                  <h4 className="text-sm font-semibold text-gray-900">{viewingReport.title}</h4>
                  <p className="text-xs text-gray-500">{new Date(viewingReport.createdAt).toLocaleString()}</p>
                </div>
                <button onClick={() => setViewingReport(null)} className="rounded p-1 text-gray-400 hover:bg-gray-100">
                  <X className="h-4 w-4" />
                </button>
              </div>
              <div className="prose prose-sm max-w-none prose-headings:text-gray-900 prose-p:text-gray-700 prose-strong:text-gray-900 prose-li:text-gray-700">
                <ReactMarkdown>{viewingReport.content}</ReactMarkdown>
              </div>
            </div>
          ) : reports.length === 0 ? (
            <p className="px-5 py-6 text-center text-sm text-gray-400">
              {t('accounting:aiChat.noReports', { defaultValue: '저장된 리포트가 없습니다' })}
            </p>
          ) : (
            <div className="max-h-48 divide-y overflow-y-auto">
              {reports.map((report) => (
                <div
                  key={report.reportId}
                  className="flex cursor-pointer items-center justify-between px-5 py-2.5 hover:bg-gray-50"
                  onClick={() => setViewingReport(report)}
                >
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-gray-900">{report.title}</p>
                    <p className="text-xs text-gray-500">{new Date(report.createdAt).toLocaleDateString()}</p>
                  </div>
                  <button
                    onClick={(e) => { e.stopPropagation(); handleDeleteReport(report.reportId); }}
                    className="ml-2 shrink-0 rounded p-1 text-gray-400 hover:bg-red-50 hover:text-red-500"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Chat Area */}
      <div className="h-[420px] overflow-y-auto px-5 py-4">
        {messages.length === 0 && !viewingReport ? (
          <div className="flex h-full flex-col items-center justify-center text-center">
            <Sparkles className="mb-3 h-10 w-10 text-indigo-100" />
            <p className="mb-1 text-sm font-medium text-gray-600">
              {t('accounting:aiChat.welcomeDesc', { defaultValue: '회계 데이터를 기반으로 분석, 리포트 작성, 질문에 답변합니다' })}
            </p>
            <div className="mt-4 flex flex-wrap justify-center gap-2">
              {examples.map((example) => (
                <button
                  key={example}
                  onClick={() => handleSend(example)}
                  className="rounded-full border border-indigo-200 bg-indigo-50/50 px-3 py-1.5 text-xs text-indigo-600 hover:bg-indigo-100"
                >
                  {example}
                </button>
              ))}
            </div>
          </div>
        ) : (
          <>
            {messages.map((msg, i) => (
              <div key={i} className={`mb-4 ${msg.role === 'user' ? 'flex justify-end' : ''}`}>
                {msg.role === 'user' ? (
                  <div className="max-w-[80%] rounded-2xl rounded-br-md bg-indigo-600 px-4 py-2.5 text-sm text-white">
                    {msg.content}
                  </div>
                ) : (
                  <div className="group">
                    {msg.content ? (
                      <>
                        <div className="prose prose-sm max-w-none rounded-2xl rounded-bl-md bg-gray-50 px-4 py-3 prose-headings:text-gray-900 prose-p:text-gray-700 prose-p:my-1 prose-strong:text-gray-900 prose-li:text-gray-700 prose-li:my-0.5">
                          <ReactMarkdown>{msg.content}</ReactMarkdown>
                        </div>
                        {!isStreaming && (
                          <div className="mt-1 flex justify-end opacity-0 transition-opacity group-hover:opacity-100">
                            <button
                              onClick={() => handleSaveMessage(i)}
                              className="flex items-center gap-1 rounded px-2 py-0.5 text-xs text-gray-400 hover:bg-gray-100 hover:text-gray-600"
                            >
                              <Save className="h-3 w-3" />
                              {t('accounting:aiChat.saveThis', { defaultValue: '저장' })}
                            </button>
                          </div>
                        )}
                      </>
                    ) : (
                      <div className="flex items-center gap-2 rounded-2xl rounded-bl-md bg-gray-50 px-4 py-3">
                        <Loader2 className="h-4 w-4 animate-spin text-indigo-500" />
                        <span className="text-xs text-gray-400">
                          {t('accounting:aiChat.thinking', { defaultValue: '생각 중...' })}
                        </span>
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}
            <div ref={messagesEndRef} />
          </>
        )}
      </div>

      {/* Input */}
      <div className="border-t px-4 py-3">
        <div className="flex items-end gap-2">
          <textarea
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={t('accounting:aiChat.placeholder', { defaultValue: '회계 관련 질문을 입력하세요...' })}
            rows={1}
            className="max-h-24 flex-1 resize-none rounded-xl border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none"
            disabled={isStreaming}
          />
          <button
            onClick={() => handleSend()}
            disabled={!input.trim() || isStreaming}
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-indigo-600 text-white hover:bg-indigo-700 disabled:opacity-40"
          >
            {isStreaming ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
          </button>
        </div>
      </div>

      {/* Save Dialog */}
      {showSaveDialog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40" onClick={() => setShowSaveDialog(false)}>
          <div className="w-full max-w-sm rounded-xl bg-white p-5 shadow-xl" onClick={(e) => e.stopPropagation()}>
            <h3 className="mb-3 text-sm font-semibold text-gray-900">
              {t('accounting:aiChat.saveReport', { defaultValue: '리포트 저장' })}
            </h3>
            <input
              type="text"
              value={saveTitle}
              onChange={(e) => setSaveTitle(e.target.value)}
              className="mb-3 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none"
              onKeyDown={(e) => e.key === 'Enter' && handleSave()}
              autoFocus
            />
            <div className="flex justify-end gap-2">
              <button
                onClick={() => { setShowSaveDialog(false); setSaveTitle(''); setSaveMsgIndex(null); }}
                className="rounded-lg px-3 py-1.5 text-sm text-gray-500 hover:bg-gray-100"
              >
                {t('common:cancel', { defaultValue: '취소' })}
              </button>
              <button
                onClick={handleSave}
                disabled={!saveTitle.trim() || saveReport.isPending}
                className="flex items-center gap-1 rounded-lg bg-indigo-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-50"
              >
                <Check className="h-4 w-4" />
                {t('common:save', { defaultValue: '저장' })}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
