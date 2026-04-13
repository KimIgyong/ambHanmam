import { create } from 'zustand';

interface CmsEditorState {
  selectedPageId: string | null;
  selectedMenuId: string | null;
  editorLang: 'en' | 'ko';
  isDirty: boolean;
  setSelectedPageId: (id: string | null) => void;
  setSelectedMenuId: (id: string | null) => void;
  setEditorLang: (lang: 'en' | 'ko') => void;
  setDirty: (dirty: boolean) => void;
  reset: () => void;
}

export const useCmsEditorStore = create<CmsEditorState>((set) => ({
  selectedPageId: null,
  selectedMenuId: null,
  editorLang: 'en',
  isDirty: false,
  setSelectedPageId: (id) => set({ selectedPageId: id }),
  setSelectedMenuId: (id) => set({ selectedMenuId: id }),
  setEditorLang: (lang) => set({ editorLang: lang }),
  setDirty: (dirty) => set({ isDirty: dirty }),
  reset: () => set({ selectedPageId: null, selectedMenuId: null, editorLang: 'en', isDirty: false }),
}));
