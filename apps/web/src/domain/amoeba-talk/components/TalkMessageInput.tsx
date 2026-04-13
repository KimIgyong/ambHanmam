import { useState, useRef, useCallback, KeyboardEvent, ClipboardEvent } from 'react';
import { useTranslation } from 'react-i18next';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Send, Languages, ChevronDown, Loader2, Paperclip, X, FileText, ImagePlus, RefreshCw, Users } from 'lucide-react';
import { useSendMessage, useChannelDetail, useTyping, talkKeys } from '../hooks/useTalk';
import { useTalkStore } from '../store/talk.store';
import { useTalkUserId } from '../hooks/useTalkUser';
import ReplyPreview from './ReplyPreview';

const TRANSLATE_LANGUAGES = [
  { code: 'en', label: 'English' },
  { code: 'ko', label: '한국어' },
  { code: 'vi', label: 'Tiếng Việt' },
] as const;

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const ALLOWED_TYPES = [
  'image/jpeg', 'image/png', 'image/gif', 'image/webp',
  'application/pdf',
  'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-excel', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'application/vnd.ms-powerpoint', 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  'application/zip', 'application/x-zip-compressed',
  'text/plain', 'text/csv', 'text/markdown',
];

const ALLOWED_EXTENSIONS = ['.md', '.txt', '.csv', '.zip'];

/** 브라우저가 MIME을 올바르게 감지하지 못하는 텍스트 파일 확장자에 대해 MIME 교정 */
const EXT_MIME_MAP: Record<string, string> = {
  '.md': 'text/markdown',
  '.txt': 'text/plain',
  '.csv': 'text/csv',
};

function fixFileMime(file: File): File {
  if (file.type && ALLOWED_TYPES.includes(file.type)) return file;
  const ext = '.' + file.name.split('.').pop()?.toLowerCase();
  const correctMime = EXT_MIME_MAP[ext];
  if (correctMime) {
    return new File([file], file.name, { type: correctMime });
  }
  return file;
}

interface TalkMessageInputProps {
  channelId: string;
}

export default function TalkMessageInput({ channelId }: TalkMessageInputProps) {
  const { t } = useTranslation(['talk']);
  const queryClient = useQueryClient();
  const [content, setContent] = useState('');
  const [showLangPicker, setShowLangPicker] = useState(false);
  const [files, setFiles] = useState<File[]>([]);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);
  const langPickerRef = useRef<HTMLDivElement>(null);
  const sendMessage = useSendMessage();
  const typingMutation = useTyping();
  const lastTypingSentRef = useRef(0);

  // Mention
  const currentUserId = useTalkUserId();
  const { data: channelDetail } = useChannelDetail(channelId);
  const [showMentionDropdown, setShowMentionDropdown] = useState(false);
  const [mentionQuery, setMentionQuery] = useState('');
  const [mentionStart, setMentionStart] = useState(-1);
  const [selectedMentionIdx, setSelectedMentionIdx] = useState(0);
  const mentionMapRef = useRef<Map<string, string>>(new Map()); // name → userId

  const isDirectChannel = channelDetail?.type === 'DIRECT';

  const memberCandidates = channelDetail?.members
    ?.filter((m) => m.userId !== currentUserId)
    .filter((m) => m.userName.toLowerCase().includes(mentionQuery.toLowerCase()))
    .slice(0, 8) ?? [];

  // DIRECT가 아닌 채널에서만 @all 항목을 최상단에 추가
  const mentionCandidates = (!isDirectChannel && 'all'.includes(mentionQuery.toLowerCase()))
    ? [{ userId: 'all', userName: 'all', isAll: true }, ...memberCandidates.map(m => ({ ...m, isAll: false }))]
    : memberCandidates.map(m => ({ ...m, isAll: false }));

  const {
    simultaneousTranslation,
    simultaneousTranslationLang,
    setSimultaneousTranslation,
    setSimultaneousTranslationLang,
    replyTo,
    setReplyTo,
  } = useTalkStore();

  const handleRefreshMessages = useCallback(async () => {
    setIsRefreshing(true);
    await queryClient.invalidateQueries({ queryKey: talkKeys.messages(channelId) });
    setIsRefreshing(false);
  }, [queryClient, channelId]);

  const handleSend = () => {
    const trimmed = content.trim();
    if ((!trimmed && files.length === 0) || sendMessage.isPending) return;

    // Replace @name with <@userId> and collect mention_user_ids
    let processedContent = trimmed || '';
    const mentionUserIds: string[] = [];
    mentionMapRef.current.forEach((userId, name) => {
      const regex = new RegExp(`@${name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}`, 'g');
      if (processedContent.match(regex)) {
        if (userId === 'all') {
          // @all → <@all> + 채널 전체 멤버 ID 추가
          processedContent = processedContent.replace(regex, '<@all>');
          channelDetail?.members
            ?.filter((m) => m.userId !== currentUserId)
            .forEach((m) => {
              if (!mentionUserIds.includes(m.userId)) mentionUserIds.push(m.userId);
            });
        } else {
          processedContent = processedContent.replace(regex, `<@${userId}>`);
          if (!mentionUserIds.includes(userId)) mentionUserIds.push(userId);
        }
      }
    });

    sendMessage.mutate(
      {
        channelId,
        content: processedContent,
        translateTo: simultaneousTranslation ? simultaneousTranslationLang : undefined,
        parentId: replyTo?.id,
        files: files.length > 0 ? files : undefined,
        mentionUserIds: mentionUserIds.length > 0 ? mentionUserIds : undefined,
      },
      {
        onSuccess: () => {
          setContent('');
          setFiles([]);
          setReplyTo(null);
          mentionMapRef.current.clear();
          if (textareaRef.current) {
            textareaRef.current.style.height = 'auto';
          }
        },
      },
    );
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (showMentionDropdown && mentionCandidates.length > 0) {
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedMentionIdx((prev) => Math.min(prev + 1, mentionCandidates.length - 1));
        return;
      }
      if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedMentionIdx((prev) => Math.max(prev - 1, 0));
        return;
      }
      if (e.key === 'Enter') {
        e.preventDefault();
        const selected = mentionCandidates[selectedMentionIdx];
        if (selected) selectMention(selected.userId, selected.userName);
        return;
      }
      if (e.key === 'Escape') {
        e.preventDefault();
        setShowMentionDropdown(false);
        return;
      }
    }
    // 모바일: Enter=줄바꿈(기본동작), PC: Enter=전송, Shift+Enter=줄바꿈
    const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
    if (e.key === 'Enter' && !e.shiftKey && !isMobile) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleContentChange = useCallback((value: string) => {
    setContent(value);
    const cursorPos = textareaRef.current?.selectionStart || 0;
    const textBeforeCursor = value.slice(0, cursorPos);
    const atMatch = textBeforeCursor.match(/@([^\s@]*)$/);
    if (atMatch) {
      setShowMentionDropdown(true);
      setMentionQuery(atMatch[1]);
      setMentionStart(cursorPos - atMatch[1].length - 1);
      setSelectedMentionIdx(0);
    } else {
      setShowMentionDropdown(false);
    }

    // Typing indicator (debounce 3s)
    const now = Date.now();
    if (value.trim() && now - lastTypingSentRef.current > 3000) {
      lastTypingSentRef.current = now;
      typingMutation.mutate(channelId);
    }
  }, [channelId, typingMutation]);

  const selectMention = useCallback((userId: string, userName: string) => {
    const before = content.slice(0, mentionStart);
    const after = content.slice(textareaRef.current?.selectionStart || content.length);
    const newContent = `${before}@${userName} ${after}`;
    setContent(newContent);
    mentionMapRef.current.set(userName, userId);
    setShowMentionDropdown(false);
    textareaRef.current?.focus();
  }, [content, mentionStart]);

  const handleInput = () => {
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.style.height = 'auto';
      textarea.style.height = `${Math.min(textarea.scrollHeight, 120)}px`;
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = Array.from(e.target.files || []);
    const valid: File[] = [];
    let rejected = 0;
    for (const f of selected) {
      if (f.size > MAX_FILE_SIZE) { rejected++; continue; }
      const fixed = fixFileMime(f);
      if (!ALLOWED_TYPES.includes(fixed.type) && !ALLOWED_EXTENSIONS.some((ext) => f.name.toLowerCase().endsWith(ext))) { rejected++; continue; }
      valid.push(fixed);
    }
    if (rejected > 0) {
      toast.error(t('talk:fileTypeNotAllowed', { defaultValue: '지원하지 않는 파일 형식이 포함되어 있습니다.' }));
    }
    setFiles((prev) => [...prev, ...valid].slice(0, 5));
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = Array.from(e.target.files || []);
    const valid = selected.filter((f) => {
      if (f.size > MAX_FILE_SIZE) return false;
      if (!f.type.startsWith('image/')) return false;
      return true;
    });
    setFiles((prev) => [...prev, ...valid].slice(0, 5));
    if (imageInputRef.current) imageInputRef.current.value = '';
  };

  const removeFile = (idx: number) => {
    setFiles((prev) => prev.filter((_, i) => i !== idx));
  };

  const isImage = (type: string) => type.startsWith('image/');

  const handlePaste = useCallback((e: ClipboardEvent<HTMLTextAreaElement>) => {
    const items = e.clipboardData?.items;
    if (!items) return;

    const imageFiles: File[] = [];
    for (const item of Array.from(items)) {
      if (item.type.startsWith('image/')) {
        const file = item.getAsFile();
        if (file) imageFiles.push(file);
      }
    }
    if (imageFiles.length === 0) return;

    e.preventDefault();

    const oversized = imageFiles.filter((f) => f.size > MAX_FILE_SIZE);
    if (oversized.length > 0) {
      toast.error(t('talk:pasteImageTooLarge'));
      return;
    }

    setFiles((prev) => {
      const remaining = 5 - prev.length;
      if (remaining <= 0) {
        toast.warning(t('talk:maxFilesReached'));
        return prev;
      }
      const toAdd = imageFiles.slice(0, remaining);
      return [...prev, ...toAdd];
    });
  }, [t]);

  const toggleTranslation = () => {
    if (simultaneousTranslation) {
      setSimultaneousTranslation(false);
      setShowLangPicker(false);
    } else {
      setSimultaneousTranslation(true);
      if (!simultaneousTranslationLang) {
        setShowLangPicker(true);
      }
    }
  };

  const handleSelectLang = (code: string) => {
    setSimultaneousTranslationLang(code);
    setSimultaneousTranslation(true);
    setShowLangPicker(false);
  };

  const selectedLangLabel = TRANSLATE_LANGUAGES.find(
    (l) => l.code === simultaneousTranslationLang,
  )?.label;

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes}B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)}KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)}MB`;
  };

  return (
    <div className="border-t bg-white px-2 py-2 md:px-4 md:py-3">
      {/* Reply Preview */}
      <ReplyPreview />

      {/* Typing Indicator */}
      <TypingIndicator />

      {/* 첨부 파일 미리보기 */}
      {files.length > 0 && (
        <div className="mb-2 flex flex-wrap gap-2">
          {files.map((file, idx) => (
            <div
              key={idx}
              className="group relative flex items-center gap-1.5 rounded-lg border border-gray-200 bg-gray-50 px-2 py-1.5"
            >
              {isImage(file.type) ? (
                <img
                  src={URL.createObjectURL(file)}
                  alt={file.name}
                  className="h-10 w-10 rounded object-cover"
                />
              ) : (
                <FileText className="h-5 w-5 text-gray-400" />
              )}
              <div className="max-w-[120px]">
                <p className="truncate text-xs font-medium text-gray-700">{file.name}</p>
                <p className="text-[10px] text-gray-400">{formatFileSize(file.size)}</p>
              </div>
              <button
                onClick={() => removeFile(idx)}
                className="absolute -right-1.5 -top-1.5 rounded-full bg-gray-500 p-0.5 text-white opacity-0 transition-opacity group-hover:opacity-100"
              >
                <X className="h-3 w-3" />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Simultaneous Translation Toggle + File/Image Buttons */}
      <div className="mb-2 flex items-center justify-between">
        <div className="flex items-center gap-2">
        <div className="relative" ref={langPickerRef}>
          <button
            onClick={toggleTranslation}
            className={`flex items-center gap-1 rounded-md px-2 py-1 text-xs font-medium transition-colors ${
              simultaneousTranslation
                ? 'bg-indigo-100 text-indigo-700'
                : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
            }`}
          >
            <Languages className="h-3.5 w-3.5" />
            <span>{t('talk:simultaneousTranslation')}</span>
          </button>

          {showLangPicker && (
            <div className="absolute bottom-8 left-0 z-10 min-w-[140px] rounded-md border bg-white py-1 shadow-lg">
              <p className="px-3 py-1 text-xs font-medium text-gray-400">
                {t('talk:selectTargetLang')}
              </p>
              {TRANSLATE_LANGUAGES.map((lang) => (
                <button
                  key={lang.code}
                  onClick={() => handleSelectLang(lang.code)}
                  className="flex w-full px-3 py-1.5 text-left text-sm text-gray-700 hover:bg-gray-50"
                >
                  {lang.label}
                </button>
              ))}
            </div>
          )}
        </div>

        {simultaneousTranslation && selectedLangLabel && (
          <button
            onClick={() => setShowLangPicker(!showLangPicker)}
            className="flex items-center gap-0.5 rounded-md bg-indigo-50 px-2 py-1 text-xs text-indigo-600 hover:bg-indigo-100"
          >
            → {selectedLangLabel}
            <ChevronDown className="h-3 w-3" />
          </button>
        )}
        </div>

        {/* 새로고침 + 파일/이미지 첨부 버튼 (우측 정렬) */}
        <div className="flex items-center gap-1">
          <button
            onClick={handleRefreshMessages}
            disabled={isRefreshing}
            className="shrink-0 rounded-lg p-1.5 text-gray-400 hover:bg-gray-100 hover:text-indigo-500 disabled:opacity-50"
            title={t('talk:refreshMessages', { defaultValue: '메시지 새로고침' })}
          >
            <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
          </button>
          <button
            onClick={() => fileInputRef.current?.click()}
            className="shrink-0 rounded-lg p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
            title={t('talk:attachFile', { defaultValue: '파일 첨부' })}
          >
            <Paperclip className="h-4 w-4" />
          </button>
          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept={[...ALLOWED_TYPES, ...ALLOWED_EXTENSIONS].join(',')}
            onChange={handleFileSelect}
            className="hidden"
          />
          <button
            onClick={() => imageInputRef.current?.click()}
            className="shrink-0 rounded-lg p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
            title={t('talk:attachImage', { defaultValue: '이미지 전송' })}
          >
            <ImagePlus className="h-4 w-4" />
          </button>
          <input
            ref={imageInputRef}
            type="file"
            multiple
            accept="image/jpeg,image/png,image/gif,image/webp"
            onChange={handleImageSelect}
            className="hidden"
          />
        </div>
      </div>

      {/* Message Input */}
      <div className="flex items-end gap-2">

        <div className="relative flex-1">
          {/* Mention Dropdown */}
          {showMentionDropdown && mentionCandidates.length > 0 && (
            <div className="absolute bottom-full left-0 z-20 mb-1 max-h-48 w-full overflow-y-auto rounded-lg border bg-white shadow-lg">
              {mentionCandidates.map((member, idx) => (
                <button
                  key={member.userId}
                  onClick={() => selectMention(member.userId, member.userName)}
                  className={`flex w-full items-center gap-2 px-3 py-2 text-left text-sm hover:bg-gray-50 ${
                    idx === selectedMentionIdx ? 'bg-indigo-50 text-indigo-700' : 'text-gray-700'
                  }`}
                >
                  {member.isAll ? (
                    <div className="flex h-6 w-6 items-center justify-center rounded-full bg-amber-100 text-amber-600">
                      <Users className="h-3.5 w-3.5" />
                    </div>
                  ) : (
                    <div className="flex h-6 w-6 items-center justify-center rounded-full bg-indigo-100 text-xs font-medium text-indigo-600">
                      {member.userName.charAt(0).toUpperCase()}
                    </div>
                  )}
                  <div className="flex flex-col">
                    <span>{member.isAll ? `@${t('talk:mentionAll')}` : member.userName}</span>
                    {member.isAll && (
                      <span className="text-xs text-gray-400">{t('talk:mentionAllDesc')}</span>
                    )}
                  </div>
                </button>
              ))}
            </div>
          )}
          <textarea
            ref={textareaRef}
            value={content}
            onChange={(e) => handleContentChange(e.target.value)}
            onKeyDown={handleKeyDown}
            onPaste={handlePaste}
            onInput={handleInput}
            placeholder={
              simultaneousTranslation
                ? t('talk:messagePlaceholderTranslation', { lang: selectedLangLabel })
                : t('talk:messagePlaceholder')
            }
            rows={1}
            className="w-full resize-none rounded-lg border border-gray-200 px-3 py-2 text-base md:text-sm text-gray-700 placeholder-gray-400 outline-none focus:border-indigo-300 focus:ring-1 focus:ring-indigo-300"
          />
        </div>
        <button
          onClick={handleSend}
          disabled={(!content.trim() && files.length === 0) || sendMessage.isPending}
          className="rounded-lg bg-indigo-500 p-2 text-white transition-colors hover:bg-indigo-600 disabled:opacity-40 disabled:hover:bg-indigo-500"
        >
          {sendMessage.isPending && simultaneousTranslation ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Send className="h-4 w-4" />
          )}
        </button>
      </div>
      <p className="mt-1 text-xs text-gray-300">
        {simultaneousTranslation
          ? t('talk:inputHintTranslation')
          : t('talk:inputHint')}
      </p>
    </div>
  );
}

function TypingIndicator() {
  const { t } = useTranslation(['talk']);
  const typingUsers = useTalkStore((s) => s.typingUsers);
  const names = Object.values(typingUsers).map((u) => u.userName);
  if (names.length === 0) return null;

  const text = names.length === 1
    ? t('talk:typingOne', { name: names[0] })
    : t('talk:typingMultiple', { count: names.length });

  return (
    <p className="mb-1 text-xs text-gray-400 animate-pulse">
      {text}
    </p>
  );
}
