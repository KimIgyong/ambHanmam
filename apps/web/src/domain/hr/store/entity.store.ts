import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { HrEntityResponse } from '@amb/types';

interface EntityState {
  currentEntity: HrEntityResponse | null;
  entities: HrEntityResponse[];
  setCurrentEntity: (entity: HrEntityResponse) => void;
  setEntities: (entities: HrEntityResponse[]) => void;
  clear: () => void;
}

export const useEntityStore = create<EntityState>()(
  persist(
    (set) => ({
      currentEntity: null,
      entities: [],

      setCurrentEntity: (entity) => set({ currentEntity: entity }),

      setEntities: (entities) =>
        set((state) => {
          // If no current entity selected, auto-select the first one
          const current = state.currentEntity;
          const stillValid = current && entities.some((e) => e.entityId === current.entityId);
          return {
            entities,
            currentEntity: stillValid ? current : entities[0] || null,
          };
        }),

      clear: () => set({ currentEntity: null, entities: [] }),
    }),
    {
      name: 'amb_entity',
      partialize: (state) => ({
        currentEntity: state.currentEntity,
      }),
    },
  ),
);
