import { create } from 'zustand';
import { UnitCode, MessageResponse } from '@amb/types';

interface ChatState {
  currentUnit: UnitCode | null;
  currentConversationId: string | null;
  messages: MessageResponse[];
  streamingContent: string;
  isStreaming: boolean;
  sidebarOpen: boolean;
  isResponseIncomplete: boolean;

  setCurrentUnit: (unit: UnitCode | null) => void;
  setCurrentConversationId: (id: string | null) => void;
  setMessages: (messages: MessageResponse[]) => void;
  addMessage: (message: MessageResponse) => void;
  setStreamingContent: (content: string) => void;
  appendStreamingContent: (chunk: string) => void;
  setIsStreaming: (streaming: boolean) => void;
  setIsResponseIncomplete: (incomplete: boolean) => void;
  toggleSidebar: () => void;
  reset: () => void;
}

export const useChatStore = create<ChatState>((set) => ({
  currentUnit: null,
  currentConversationId: null,
  messages: [],
  streamingContent: '',
  isStreaming: false,
  sidebarOpen: true,
  isResponseIncomplete: false,

  setCurrentUnit: (unit) => set({ currentUnit: unit }),
  setCurrentConversationId: (id) => set({ currentConversationId: id }),
  setMessages: (messages) => set({ messages }),
  addMessage: (message) => set((state) => ({ messages: [...state.messages, message] })),
  setStreamingContent: (content) => set({ streamingContent: content }),
  appendStreamingContent: (chunk) =>
    set((state) => ({ streamingContent: state.streamingContent + chunk })),
  setIsStreaming: (streaming) => set({ isStreaming: streaming }),
  setIsResponseIncomplete: (incomplete) => set({ isResponseIncomplete: incomplete }),
  toggleSidebar: () => set((state) => ({ sidebarOpen: !state.sidebarOpen })),
  reset: () =>
    set({
      currentUnit: null,
      currentConversationId: null,
      messages: [],
      streamingContent: '',
      isStreaming: false,
      isResponseIncomplete: false,
    }),
}));
