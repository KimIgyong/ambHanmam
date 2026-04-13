import { create } from 'zustand';
import { UnitCode, MessageResponse } from '@amb/types';

interface AssistantModalState {
  isOpen: boolean;
  phase: 'welcome' | 'chat';
  selectedUnit: UnitCode | null;
  conversationId: string | null;
  messages: MessageResponse[];
  streamingContent: string;
  isStreaming: boolean;
  isResponseIncomplete: boolean;

  open: () => void;
  close: () => void;
  selectUnit: (unit: UnitCode) => void;
  backToWelcome: () => void;
  setConversationId: (id: string) => void;
  addMessage: (msg: MessageResponse) => void;
  setMessages: (msgs: MessageResponse[]) => void;
  appendStreamingContent: (chunk: string) => void;
  setIsStreaming: (v: boolean) => void;
  setStreamingContent: (v: string) => void;
  setIsResponseIncomplete: (v: boolean) => void;
  reset: () => void;
}

export const useAssistantModalStore = create<AssistantModalState>((set) => ({
  isOpen: false,
  phase: 'welcome',
  selectedUnit: null,
  conversationId: null,
  messages: [],
  streamingContent: '',
  isStreaming: false,
  isResponseIncomplete: false,

  open: () => set({ isOpen: true }),
  close: () => set({ isOpen: false }),
  selectUnit: (unit) => set({ selectedUnit: unit, phase: 'chat', conversationId: null, messages: [], streamingContent: '', isStreaming: false }),
  backToWelcome: () => set({ phase: 'welcome', selectedUnit: null, conversationId: null, messages: [], streamingContent: '', isStreaming: false, isResponseIncomplete: false }),
  setConversationId: (id) => set({ conversationId: id }),
  addMessage: (msg) => set((s) => ({ messages: [...s.messages, msg] })),
  setMessages: (msgs) => set({ messages: msgs }),
  appendStreamingContent: (chunk) => set((s) => ({ streamingContent: s.streamingContent + chunk })),
  setIsStreaming: (v) => set({ isStreaming: v }),
  setStreamingContent: (v) => set({ streamingContent: v }),
  setIsResponseIncomplete: (v) => set({ isResponseIncomplete: v }),
  reset: () => set({
    isOpen: false,
    phase: 'welcome',
    selectedUnit: null,
    conversationId: null,
    messages: [],
    streamingContent: '',
    isStreaming: false,
    isResponseIncomplete: false,
  }),
}));
