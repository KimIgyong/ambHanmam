import { create } from 'zustand';

export type CalendarViewType = 'month' | 'week' | 'day';

export type CalendarFilterMode = 'ALL' | 'MY' | 'UNIT' | 'CELL' | 'SHARED';

interface CalendarStoreState {
  // View
  viewType: CalendarViewType;
  setViewType: (v: CalendarViewType) => void;

  // Current date (focused date)
  currentDate: Date;
  setCurrentDate: (d: Date) => void;
  goToday: () => void;
  goPrev: () => void;
  goNext: () => void;

  // Filters
  filterMode: CalendarFilterMode;
  setFilterMode: (m: CalendarFilterMode) => void;
  filterCategory: string | null;
  setFilterCategory: (c: string | null) => void;

  // Selected calendar (for detail/edit modal)
  selectedCalendarId: string | null;
  setSelectedCalendarId: (id: string | null) => void;

  // Form modal
  isFormOpen: boolean;
  formInitialDate: string | null;
  openForm: (initialDate?: string) => void;
  closeForm: () => void;
}

export const useCalendarStore = create<CalendarStoreState>((set, get) => ({
  // View
  viewType: 'month',
  setViewType: (v) => set({ viewType: v }),

  // Current date
  currentDate: new Date(),
  setCurrentDate: (d) => set({ currentDate: d }),
  goToday: () => set({ currentDate: new Date() }),
  goPrev: () => {
    const { currentDate, viewType } = get();
    const d = new Date(currentDate);
    if (viewType === 'month') d.setMonth(d.getMonth() - 1);
    else if (viewType === 'week') d.setDate(d.getDate() - 7);
    else d.setDate(d.getDate() - 1);
    set({ currentDate: d });
  },
  goNext: () => {
    const { currentDate, viewType } = get();
    const d = new Date(currentDate);
    if (viewType === 'month') d.setMonth(d.getMonth() + 1);
    else if (viewType === 'week') d.setDate(d.getDate() + 7);
    else d.setDate(d.getDate() + 1);
    set({ currentDate: d });
  },

  // Filters
  filterMode: 'ALL',
  setFilterMode: (m) => set({ filterMode: m }),
  filterCategory: null,
  setFilterCategory: (c) => set({ filterCategory: c }),

  // Selected calendar
  selectedCalendarId: null,
  setSelectedCalendarId: (id) => set({ selectedCalendarId: id }),

  // Form modal
  isFormOpen: false,
  formInitialDate: null,
  openForm: (initialDate) => set({ isFormOpen: true, formInitialDate: initialDate || null }),
  closeForm: () => set({ isFormOpen: false, formInitialDate: null }),
}));
