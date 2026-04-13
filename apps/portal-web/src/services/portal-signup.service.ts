import api from '@/lib/api';

export async function sendVerifyCode(email: string): Promise<void> {
  await api.post('/portal/auth/send-verify-code', { email });
}

export async function verifyEmailCode(email: string, code: string): Promise<string> {
  const { data } = await api.post('/portal/auth/verify-email-code', { email, code });
  const result = data.data || data;
  return result.verify_token;
}
