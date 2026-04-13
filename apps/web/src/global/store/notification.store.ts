import { create } from 'zustand';

export interface NotificationItem {
  ntfId: string;
  ntfType: string;
  ntfTitle: string;
  ntfMessage: string | null;
  ntfRecipientId: string;
  ntfSenderId: string;
  senderName?: string;
  ntfResourceType: string;
  ntfResourceId: string;
  ntfIsRead: boolean;
  ntfReadAt: string | null;
  entId: string;
  ntfCreatedAt: string;
}

interface NotificationStore {
  notifications: NotificationItem[];
  unreadCount: number;

  // 모달 알림 큐
  modalQueue: NotificationItem[];
  currentModal: NotificationItem | null;

  // Actions
  setNotifications: (items: NotificationItem[]) => void;
  addNotification: (item: NotificationItem) => void;
  setUnreadCount: (count: number) => void;
  markAsRead: (ntfId: string) => void;
  markAllAsRead: () => void;

  // 모달 Actions
  addToModalQueue: (item: NotificationItem) => void;
  showNextModal: () => void;
  dismissModal: () => void;
}

export const useNotificationStore = create<NotificationStore>((set, get) => ({
  notifications: [],
  unreadCount: 0,
  modalQueue: [],
  currentModal: null,

  setNotifications: (items) =>
    set({ notifications: items }),

  addNotification: (item) =>
    set((state) => ({
      notifications: [item, ...state.notifications],
      unreadCount: state.unreadCount + 1,
    })),

  setUnreadCount: (count) =>
    set({ unreadCount: count }),

  markAsRead: (ntfId) =>
    set((state) => ({
      notifications: state.notifications.map((n) =>
        n.ntfId === ntfId ? { ...n, ntfIsRead: true } : n,
      ),
      unreadCount: Math.max(0, state.unreadCount - 1),
    })),

  markAllAsRead: () =>
    set((state) => ({
      notifications: state.notifications.map((n) => ({
        ...n,
        ntfIsRead: true,
      })),
      unreadCount: 0,
    })),

  addToModalQueue: (item) => {
    const { currentModal } = get();
    if (!currentModal) {
      set({ currentModal: item });
    } else {
      set((state) => ({ modalQueue: [...state.modalQueue, item] }));
    }
  },

  showNextModal: () => {
    const { modalQueue } = get();
    if (modalQueue.length > 0) {
      const [next, ...rest] = modalQueue;
      set({ currentModal: next, modalQueue: rest });
    } else {
      set({ currentModal: null });
    }
  },

  dismissModal: () => {
    get().showNextModal();
  },
}));
