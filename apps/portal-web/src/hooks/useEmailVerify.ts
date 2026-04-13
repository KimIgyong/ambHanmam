import { useState, useCallback, useRef, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { sendVerifyCode, verifyEmailCode } from '@/services/portal-signup.service';
import { trackEmailCodeSent, trackEmailVerified } from '@/lib/ga-events';

export interface ModalState {
  isOpen: boolean;
  type: 'success' | 'error';
  title: string;
  message: string;
}

interface UseEmailVerifyReturn {
  codeSent: boolean;
  verified: boolean;
  verifyToken: string | null;
  sending: boolean;
  verifying: boolean;
  error: string | null;
  resendTimer: number;
  modal: ModalState;
  closeModal: () => void;
  handleSendCode: (email: string) => Promise<void>;
  handleVerify: (email: string, code: string) => Promise<void>;
  reset: () => void;
}

const MODAL_CLOSED: ModalState = { isOpen: false, type: 'success', title: '', message: '' };

export function useEmailVerify(): UseEmailVerifyReturn {
  const { t } = useTranslation();
  const [codeSent, setCodeSent] = useState(false);
  const [verified, setVerified] = useState(false);
  const [verifyToken, setVerifyToken] = useState<string | null>(null);
  const [sending, setSending] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [resendTimer, setResendTimer] = useState(0);
  const [modal, setModal] = useState<ModalState>(MODAL_CLOSED);
  const timerRef = useRef<ReturnType<typeof setInterval>>();

  const closeModal = useCallback(() => setModal(MODAL_CLOSED), []);

  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  const startTimer = useCallback(() => {
    setResendTimer(180);
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = setInterval(() => {
      setResendTimer((prev) => {
        if (prev <= 1) {
          clearInterval(timerRef.current);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  }, []);

  const handleSendCode = useCallback(async (email: string) => {
    setSending(true);
    setError(null);
    try {
      await sendVerifyCode(email);
      setCodeSent(true);
      startTimer();
      trackEmailCodeSent(email);
      setModal({ isOpen: true, type: 'success', title: t('auth.modal_verify_sent_title'), message: t('auth.modal_verify_sent_msg') });
    } catch (err: unknown) {
      const resp = (err as { response?: { data?: { error?: { code?: string; message?: string }; code?: string; message?: string } } })?.response?.data;
      const errCode = resp?.error?.code || resp?.code;
      const errMessage = resp?.error?.message || resp?.message;
      let errMsg: string;
      if (errCode === 'E1024') {
        errMsg = t('auth.signup_err_email_exists');
      } else if (errCode === 'E1028') {
        errMsg = t('auth.signup_err_rate_limit');
      } else {
        errMsg = errMessage || t('auth.signup_err_send_failed');
      }
      setError(errMsg);
      setModal({ isOpen: true, type: 'error', title: t('auth.modal_verify_fail_title'), message: errMsg });
    } finally {
      setSending(false);
    }
  }, [startTimer, t]);

  const handleVerify = useCallback(async (email: string, code: string) => {
    setVerifying(true);
    setError(null);
    try {
      const token = await verifyEmailCode(email, code);
      setVerified(true);
      setVerifyToken(token);
      if (timerRef.current) clearInterval(timerRef.current);
      setResendTimer(0);
      trackEmailVerified(email);
      setModal({ isOpen: true, type: 'success', title: t('auth.modal_email_verified_title'), message: t('auth.modal_email_verified_msg') });
    } catch (err: unknown) {
      const resp = (err as { response?: { data?: { error?: { code?: string; message?: string }; code?: string; message?: string } } })?.response?.data;
      const errCode = resp?.error?.code || resp?.code;
      let errMsg: string;
      if (errCode === 'E1026') {
        errMsg = t('auth.signup_err_code_expired');
      } else {
        errMsg = t('auth.signup_err_code_invalid');
      }
      setError(errMsg);
      setModal({ isOpen: true, type: 'error', title: t('auth.modal_verify_fail_title'), message: errMsg });
    } finally {
      setVerifying(false);
    }
  }, [t]);

  const reset = useCallback(() => {
    setCodeSent(false);
    setVerified(false);
    setVerifyToken(null);
    setError(null);
    setResendTimer(0);
    if (timerRef.current) clearInterval(timerRef.current);
  }, []);

  return {
    codeSent,
    verified,
    verifyToken,
    sending,
    verifying,
    error,
    resendTimer,
    modal,
    closeModal,
    handleSendCode,
    handleVerify,
    reset,
  };
}
