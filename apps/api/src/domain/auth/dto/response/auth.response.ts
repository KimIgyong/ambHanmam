export class UserResponse {
  userId: string;
  email: string;
  name: string;
  unit: string;
  role: string;
  companyEmail: string | null;
  level?: string;
  cell?: string;
  status?: string;
  companyId?: string;
  isHq?: boolean;
  mustChangePw?: boolean;
  hasSignature?: boolean;
  /** 사용자 타임존 (IANA timezone) */
  timezone?: string;
  /** UI 언어: vi | ko | en */
  locale?: string;
  createdAt: string;
}

export class AuthTokenResponse {
  accessToken: string;
  refreshToken: string;
  user: UserResponse;
}
