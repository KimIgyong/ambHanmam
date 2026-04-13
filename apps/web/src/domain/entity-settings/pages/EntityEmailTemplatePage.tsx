import { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { Mail, ArrowLeft, Save, RotateCcw, Eye, EyeOff, Loader2, CheckCircle, XCircle } from 'lucide-react';
import { useAuthStore } from '@/domain/auth/store/auth.store';
import {
  useEmailTemplate,
  useUpsertEmailTemplate,
  useDeleteEmailTemplate,
  usePreviewEmailTemplate,
} from '@/domain/settings/hooks/useEmailTemplates';

const TEMPLATE_CODE = 'INVITATION';

const VARIABLES = [
  { key: '{{inviterName}}', label: '초대자 이름' },
  { key: '{{companyName}}', label: '회사명' },
  { key: '{{role}}', label: '역할' },
  { key: '{{department}}', label: '부서' },
  { key: '{{inviteLink}}', label: '초대 링크' },
];

export default function EntityEmailTemplatePage() {
  const { t } = useTranslation(['entitySettings', 'common']);
  const navigate = useNavigate();
  const bodyRef = useRef<HTMLTextAreaElement>(null);
  const companyId = useAuthStore((s) => s.user?.companyId);

  const { data: template, isLoading } = useEmailTemplate(TEMPLATE_CODE, companyId);
  const upsertMutation = useUpsertEmailTemplate(TEMPLATE_CODE, companyId);
  const deleteMutation = useDeleteEmailTemplate(TEMPLATE_CODE, companyId);
  const previewMutation = usePreviewEmailTemplate(TEMPLATE_CODE, companyId);

  const [subject, setSubject] = useState('');
  const [body, setBody] = useState('');
  const [showPreview, setShowPreview] = useState(false);
  const [previewHtml, setPreviewHtml] = useState<{ subject: string; html: string } | null>(null);
  const [statusMsg, setStatusMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    if (template) {
      setSubject(template.subject);
      setBody(template.body);
    }
  }, [template]);

  const showStatus = (type: 'success' | 'error', text: string) => {
    setStatusMsg({ type, text });
    setTimeout(() => setStatusMsg(null), 3000);
  };

  const handleSave = async () => {
    try {
      await upsertMutation.mutateAsync({ subject, body });
      showStatus('success', t('entitySettings:emailTemplate.saveSuccess'));
    } catch {
      showStatus('error', t('entitySettings:emailTemplate.saveError'));
    }
  };

  const handleReset = async () => {
    if (!confirm(t('entitySettings:emailTemplate.resetConfirm'))) return;
    try {
      await deleteMutation.mutateAsync();
      showStatus('success', t('entitySettings:emailTemplate.resetSuccess'));
    } catch {
      showStatus('error', t('entitySettings:emailTemplate.saveError'));
    }
  };

  const handlePreview = async () => {
    try {
      const result = await previewMutation.mutateAsync();
      setPreviewHtml(result);
      setShowPreview(true);
    } catch {
      showStatus('error', t('entitySettings:emailTemplate.previewError'));
    }
  };

  const insertVariable = (varKey: string) => {
    const el = bodyRef.current;
    if (!el) {
      setBody((prev) => prev + varKey);
      return;
    }
    const start = el.selectionStart;
    const end = el.selectionEnd;
    setBody((prev) => prev.slice(0, start) + varKey + prev.slice(end));
    setTimeout(() => {
      el.focus();
      el.setSelectionRange(start + varKey.length, start + varKey.length);
    }, 0);
  };

  if (!companyId) {
    return (
      <div className="flex h-full items-center justify-center text-sm text-gray-500">
        {t('entitySettings:customApps.noEntityAssigned')}
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex h-full items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-indigo-500" />
      </div>
    );
  }

  return (
    <div className="h-full overflow-y-auto">
      <div className="mx-auto max-w-4xl p-6">
        <div className="mb-6 flex items-center gap-3">
          <button
            onClick={() => navigate('/entity-settings')}
            className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700"
          >
            <ArrowLeft className="h-4 w-4" />
            {t('common:back')}
          </button>
        </div>

        <div className="mb-6 flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-orange-100">
            <Mail className="h-5 w-5 text-orange-600" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-gray-900">{t('entitySettings:emailTemplate.title')}</h1>
            <p className="text-sm text-gray-500">{t('entitySettings:emailTemplate.description')}</p>
          </div>
        </div>

        {statusMsg && (
          <div
            className={`mb-4 flex items-center gap-2 rounded-lg p-3 text-sm ${
              statusMsg.type === 'success' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'
            }`}
          >
            {statusMsg.type === 'success' ? (
              <CheckCircle className="h-4 w-4" />
            ) : (
              <XCircle className="h-4 w-4" />
            )}
            {statusMsg.text}
          </div>
        )}

        <div className="rounded-xl border border-gray-200 bg-white shadow-sm">
          <div className="border-b border-gray-100 px-6 py-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="font-semibold text-gray-900">{t('entitySettings:emailTemplate.invitationEmail')}</h2>
                <p className="mt-0.5 text-xs text-gray-400">
                  {template?.isCustom
                    ? t('entitySettings:emailTemplate.customized')
                    : t('entitySettings:emailTemplate.usingDefault')}
                </p>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={handlePreview}
                  disabled={previewMutation.isPending}
                  className="flex items-center gap-1.5 rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-sm text-gray-600 hover:bg-gray-50"
                >
                  {previewMutation.isPending ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  ) : (
                    <Eye className="h-3.5 w-3.5" />
                  )}
                  {t('entitySettings:emailTemplate.preview')}
                </button>
                {template?.isCustom && (
                  <button
                    onClick={handleReset}
                    disabled={deleteMutation.isPending}
                    className="flex items-center gap-1.5 rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-sm text-gray-500 hover:bg-gray-50"
                  >
                    <RotateCcw className="h-3.5 w-3.5" />
                    {t('entitySettings:emailTemplate.reset')}
                  </button>
                )}
              </div>
            </div>
          </div>

          <div className="space-y-4 p-6">
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">
                {t('entitySettings:emailTemplate.subject')}
              </label>
              <input
                type="text"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                placeholder={t('entitySettings:emailTemplate.subjectPlaceholder')}
              />
            </div>

            <div>
              <p className="mb-2 text-xs font-medium text-gray-500">{t('entitySettings:emailTemplate.variables')}</p>
              <div className="flex flex-wrap gap-1.5">
                {VARIABLES.map((v) => (
                  <button
                    key={v.key}
                    onClick={() => insertVariable(v.key)}
                    title={v.label}
                    className="rounded-md bg-indigo-50 px-2 py-1 font-mono text-xs text-indigo-700 transition-colors hover:bg-indigo-100"
                  >
                    {v.key}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">
                {t('entitySettings:emailTemplate.body')} <span className="text-xs text-gray-400">(HTML)</span>
              </label>
              <textarea
                ref={bodyRef}
                value={body}
                onChange={(e) => setBody(e.target.value)}
                rows={18}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 font-mono text-xs text-gray-700 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                placeholder={t('entitySettings:emailTemplate.bodyPlaceholder')}
              />
            </div>
          </div>

          <div className="flex justify-end border-t border-gray-100 px-6 py-4">
            <button
              onClick={handleSave}
              disabled={upsertMutation.isPending}
              className="flex items-center gap-2 rounded-lg bg-indigo-600 px-5 py-2 text-sm font-semibold text-white hover:bg-indigo-700 disabled:opacity-50"
            >
              {upsertMutation.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Save className="h-4 w-4" />
              )}
              {t('entitySettings:emailTemplate.save')}
            </button>
          </div>
        </div>
      </div>

      {showPreview && previewHtml && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="flex h-[90vh] w-full max-w-2xl flex-col rounded-xl bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-gray-100 px-6 py-4">
              <p className="mt-0.5 text-xs text-gray-400">
                {t('entitySettings:emailTemplate.previewSubject')}: {previewHtml.subject}
              </p>
              <button
                onClick={() => setShowPreview(false)}
                className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700"
              >
                <EyeOff className="h-4 w-4" />
                {t('common:close')}
              </button>
            </div>
            <div className="flex-1 overflow-auto p-4">
              <iframe
                srcDoc={previewHtml.html}
                className="h-full w-full rounded-lg border-0 bg-gray-50"
                sandbox="allow-same-origin"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
