import { create } from 'zustand';

/** 알림 센터 가상 채널 ID */
export const NOTIFICATION_CHANNEL_ID = '__NOTIFICATION_CENTER__';

interface TranslationEntry {
  content: string;
  detectedLang: string;
}

interface TalkState {
  currentChannelId: string | null;
  showCreateModal: boolean;
  showEditModal: boolean;
  showNewDmModal: boolean;
  showMemberPanel: boolean;
  showInviteModal: boolean;

  // Translation
  translations: Record<string, Record<string, TranslationEntry>>;
  activeTranslation: string | null;

  // Simultaneous Translation
  simultaneousTranslation: boolean;
  simultaneousTranslationLang: string;

  // Search
  isSearchOpen: boolean;
  searchQuery: string;

  // Reply
  replyTo: { id: string; senderName: string; content: string } | null;

  // Notification Preview
  notificationPreview: { resourceType: string; resourceId: string } | null;
  setNotificationPreview: (preview: { resourceType: string; resourceId: string } | null) => void;

  // Presence
  presenceMap: Record<string, 'online' | 'offline'>;
  setPresence: (userId: string, status: 'online' | 'offline') => void;
  setPresenceMap: (map: Record<string, 'online' | 'offline'>) => void;

  // Typing Indicator
  typingUsers: Record<string, { userName: string; timestamp: number }>;
  setTypingUser: (userId: string, userName: string) => void;
  clearTypingUser: (userId: string) => void;

  setCurrentChannelId: (id: string | null) => void;
  setShowCreateModal: (show: boolean) => void;
  setShowEditModal: (show: boolean) => void;
  setShowNewDmModal: (show: boolean) => void;
  setShowMemberPanel: (show: boolean) => void;
  setShowInviteModal: (show: boolean) => void;

  setTranslation: (msgId: string, lang: string, entry: TranslationEntry) => void;
  setActiveTranslation: (msgId: string | null) => void;
  clearTranslation: (msgId: string, lang: string) => void;

  setSimultaneousTranslation: (enabled: boolean) => void;
  setSimultaneousTranslationLang: (lang: string) => void;

  setIsSearchOpen: (open: boolean) => void;
  setSearchQuery: (query: string) => void;

  setReplyTo: (msg: { id: string; senderName: string; content: string } | null) => void;
}

export const useTalkStore = create<TalkState>((set) => ({
  currentChannelId: null,
  showCreateModal: false,
  showEditModal: false,
  showNewDmModal: false,
  showMemberPanel: false,
  showInviteModal: false,

  translations: {},
  activeTranslation: null,

  simultaneousTranslation: false,
  simultaneousTranslationLang: 'en',

  isSearchOpen: false,
  searchQuery: '',

  replyTo: null,

  notificationPreview: null,
  setNotificationPreview: (preview) => set({ notificationPreview: preview }),

  presenceMap: {},
  setPresence: (userId, status) =>
    set((state) => ({
      presenceMap: { ...state.presenceMap, [userId]: status },
    })),
  setPresenceMap: (map) => set({ presenceMap: map }),

  typingUsers: {},
  setTypingUser: (userId, userName) =>
    set((state) => ({
      typingUsers: { ...state.typingUsers, [userId]: { userName, timestamp: Date.now() } },
    })),
  clearTypingUser: (userId) =>
    set((state) => {
      const next = { ...state.typingUsers };
      delete next[userId];
      return { typingUsers: next };
    }),

  setCurrentChannelId: (id) =>
    set({
      currentChannelId: id,
      translations: {},
      activeTranslation: null,
      isSearchOpen: false,
      searchQuery: '',
      replyTo: null,
      typingUsers: {},
      notificationPreview: null,
    }),
  setShowCreateModal: (show) => set({ showCreateModal: show }),
  setShowEditModal: (show) => set({ showEditModal: show }),
  setShowNewDmModal: (show) => set({ showNewDmModal: show }),
  setShowMemberPanel: (show) => set({ showMemberPanel: show }),
  setShowInviteModal: (show) => set({ showInviteModal: show }),

  setTranslation: (msgId, lang, entry) =>
    set((state) => ({
      translations: {
        ...state.translations,
        [msgId]: { ...state.translations[msgId], [lang]: entry },
      },
    })),
  setActiveTranslation: (msgId) => set({ activeTranslation: msgId }),
  clearTranslation: (msgId, lang) =>
    set((state) => {
      const msgTranslations = { ...state.translations[msgId] };
      delete msgTranslations[lang];
      return {
        translations: { ...state.translations, [msgId]: msgTranslations },
      };
    }),

  setSimultaneousTranslation: (enabled) => set({ simultaneousTranslation: enabled }),
  setSimultaneousTranslationLang: (lang) => set({ simultaneousTranslationLang: lang }),

  setIsSearchOpen: (open) => set({ isSearchOpen: open, searchQuery: open ? '' : '' }),
  setSearchQuery: (query) => set({ searchQuery: query }),

  setReplyTo: (msg) => set({ replyTo: msg }),
}));
