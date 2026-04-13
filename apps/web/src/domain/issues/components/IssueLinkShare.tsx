import { useState, useRef, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Link2, Share2, Check, Search } from 'lucide-react';
import { toast } from 'sonner';
import { talkService } from '@/domain/amoeba-talk/service/talk.service';
import { useEntityMembers } from '@/domain/amoeba-talk/hooks/useTalk';
import { useAuthStore } from '@/domain/auth/store/auth.store';

interface Props {
  issueId: string;
  issueTitle: string;
  /** 이슈 참조번호 (ISN-1 형식) — 제공 시 복사 텍스트에 포함 */
  refNumber?: string | null;
  /** 라벨 텍스트 노출 여부 (상세화면 인라인 배치 시 사용) */
  showLabel?: boolean;
}

export default function IssueLinkShare({ issueId, issueTitle, refNumber, showLabel }: Props) {
  const { t } = useTranslation(['issues']);
  const currentUser = useAuthStore((s) => s.user);
  const { data: members = [] } = useEntityMembers();

  const [copied, setCopied] = useState(false);
  const [showShare, setShowShare] = useState(false);
  const [search, setSearch] = useState('');
  const [sending, setSending] = useState(false);
  const popoverRef = useRef<HTMLDivElement>(null);

  const issueUrl = `${window.location.origin}/issues?id=${issueId}`;

  useEffect(() => {
    if (!showShare) return;
    const handleClickOutside = (e: MouseEvent) => {
      if (popoverRef.current && !popoverRef.current.contains(e.target as Node)) {
        setShowShare(false);
        setSearch('');
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showShare]);

  const handleCopy = (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    const copyText = refNumber
      ? `[${refNumber}] ${issueTitle}\n${issueUrl}`
      : issueUrl;
    navigator.clipboard.writeText(copyText).then(() => {
      setCopied(true);
      toast.success(t('issues:link.copied'));
      setTimeout(() => setCopied(false), 2000);
    });
  };

  const handleShareToggle = (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    setShowShare((v) => !v);
    setSearch('');
  };

  const handleSendDm = async (targetUserId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    setSending(true);
    try {
      const channel = await talkService.findOrCreateDm(targetUserId);
      if (!channel) throw new Error('DM channel not found');
      const content = refNumber
        ? `[${t('issues:link.shareMessagePrefix')}] [${refNumber}] ${issueTitle}\n${issueUrl}`
        : `[${t('issues:link.shareMessagePrefix')}] ${issueTitle}\n${issueUrl}`;
      await talkService.sendMessage(channel.id, { content });
      toast.success(t('issues:link.shareSent'));
      setShowShare(false);
      setSearch('');
    } catch {
      toast.error(t('issues:link.shareFailed'));
    } finally {
      setSending(false);
    }
  };

  const filteredMembers = members.filter(
    (m) =>
      m.userId !== currentUser?.userId &&
      (m.name.toLowerCase().includes(search.toLowerCase()) ||
        m.email.toLowerCase().includes(search.toLowerCase())),
  );

  return (
    <div
      className="relative flex items-center gap-0.5"
      ref={popoverRef}
      onClick={(e) => e.stopPropagation()}
      onPointerDown={(e) => e.stopPropagation()}
    >
      {/* 복사 버튼 */}
      <button
        type="button"
        onClick={handleCopy}
        className="flex items-center gap-1 rounded px-1.5 py-0.5 text-xs text-gray-400 hover:bg-gray-100 hover:text-gray-600"
        title={t('issues:link.copy')}
      >
        {copied ? (
          <Check className="h-3.5 w-3.5 text-green-500" />
        ) : (
          <Link2 className="h-3.5 w-3.5" />
        )}
        {showLabel && (
          <span className="hidden sm:inline">{t('issues:link.copy')}</span>
        )}
      </button>

      {/* 공유 버튼 */}
      <button
        type="button"
        onClick={handleShareToggle}
        className={`flex items-center gap-1 rounded px-1.5 py-0.5 text-xs transition-colors hover:bg-gray-100 ${
          showShare ? 'bg-indigo-50 text-indigo-600' : 'text-gray-400 hover:text-gray-600'
        }`}
        title={t('issues:link.share')}
      >
        <Share2 className="h-3.5 w-3.5" />
        {showLabel && (
          <span className="hidden sm:inline">{t('issues:link.share')}</span>
        )}
      </button>

      {/* 공유 팝오버 */}
      {showShare && (
        <div className="absolute left-0 top-7 z-[200] min-w-[220px] rounded-lg border border-gray-200 bg-white shadow-lg">
          <div className="border-b border-gray-100 p-2">
            <p className="mb-1.5 px-1 text-xs font-medium text-gray-600">
              {t('issues:link.shareSelectUser')}
            </p>
            <div className="relative">
              <Search className="absolute left-2 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-gray-400" />
              <input
                autoFocus
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder={t('issues:link.searchMember')}
                className="w-full rounded border border-gray-200 py-1 pl-7 pr-2 text-xs focus:border-indigo-300 focus:outline-none"
              />
            </div>
          </div>
          <div className="max-h-40 overflow-y-auto py-1">
            {filteredMembers.length === 0 ? (
              <p className="px-3 py-2 text-xs text-gray-400">{t('issues:link.noMembers')}</p>
            ) : (
              filteredMembers.map((m) => (
                <button
                  key={m.userId}
                  type="button"
                  onClick={(e) => handleSendDm(m.userId, e)}
                  disabled={sending}
                  className="w-full px-3 py-1.5 text-left text-xs hover:bg-indigo-50 disabled:opacity-50"
                >
                  <span className="font-medium text-gray-700">{m.name}</span>
                  <span className="ml-1.5 text-gray-400 text-[10px]">{m.email}</span>
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
