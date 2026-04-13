import { create } from 'zustand';

interface SignupState {
  // Step 관리
  step: number | 'complete';

  // 이메일 인증
  email: string;
  emailVerified: boolean;
  verifyToken: string | null;

  // 계정 정보 (Step 1)
  password: string;
  fullName: string;

  // 회사 정보 (Step 2)
  companyName: string;
  countryCode: string | null;
  phone: string;

  // 약관
  agreedTos: boolean;
  agreedPrivacy: boolean;
  agreedMarketing: boolean;

  // Registration result
  entityCode: string | null;
  entityName: string | null;
  autoLoginToken: string | null;

  // Actions
  setField: <K extends keyof SignupState>(key: K, value: SignupState[K]) => void;
  setStep: (step: number | 'complete') => void;
  setEmailVerified: (token: string) => void;
  setRegistrationResult: (data: { entityCode?: string; entityName?: string; autoLoginToken?: string | null }) => void;
  reset: () => void;
}

const initialState = {
  step: 1 as number | 'complete',
  email: '',
  emailVerified: false,
  verifyToken: null as string | null,
  password: '',
  fullName: '',
  companyName: '',
  countryCode: null as string | null,
  phone: '',
  agreedTos: false,
  agreedPrivacy: false,
  agreedMarketing: false,
  entityCode: null as string | null,
  entityName: null as string | null,
  autoLoginToken: null as string | null,
};

export const useSignupStore = create<SignupState>()((set) => ({
  ...initialState,

  setField: (key, value) => set({ [key]: value } as Partial<SignupState>),

  setStep: (step) => set({ step }),

  setEmailVerified: (token) =>
    set({ emailVerified: true, verifyToken: token }),

  setRegistrationResult: (data) =>
    set({
      entityCode: data.entityCode || null,
      entityName: data.entityName || null,
      autoLoginToken: data.autoLoginToken || null,
    }),

  reset: () => set(initialState),
}));
