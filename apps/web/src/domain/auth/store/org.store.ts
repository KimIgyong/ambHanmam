import { create } from 'zustand';

interface Organization {
  id: string;
  name: string;
  code: string;
  country: string;
  isHq: boolean;
}

interface OrgState {
  organizations: Organization[];
  /** HQ 사용자가 선택한 조직 ID (null = 전체) */
  selectedOrgId: string | null;
  setOrganizations: (orgs: Organization[]) => void;
  setSelectedOrg: (orgId: string | null) => void;
}

export const useOrgStore = create<OrgState>((set) => ({
  organizations: [],
  selectedOrgId: null,
  setOrganizations: (orgs) => set({ organizations: orgs }),
  setSelectedOrg: (orgId) => set({ selectedOrgId: orgId }),
}));
