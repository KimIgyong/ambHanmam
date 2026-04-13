import { TFunction } from 'i18next';
import { AxiosError } from 'axios';

interface ApiErrorResponse {
  success: boolean;
  error?: {
    code: string;
    message: string;
  };
}

const LOGIN_ERROR_MAP: Record<string, string> = {
  E1014: 'loginErrorEmailNotFound',
  E1015: 'loginErrorPasswordIncorrect',
  E1020: 'loginErrorAccountLocked',
};

export function getLoginErrorMessage(
  error: unknown,
  t: TFunction,
  fallbackKey = 'auth:loginFailed',
): string {
  const axiosErr = error as AxiosError<ApiErrorResponse>;
  const errorCode = axiosErr?.response?.data?.error?.code;

  if (errorCode && LOGIN_ERROR_MAP[errorCode]) {
    return t(`auth:${LOGIN_ERROR_MAP[errorCode]}`);
  }

  return t(fallbackKey);
}

export function getLoginErrorCode(error: unknown): string | undefined {
  const axiosErr = error as AxiosError<ApiErrorResponse>;
  return axiosErr?.response?.data?.error?.code;
}
