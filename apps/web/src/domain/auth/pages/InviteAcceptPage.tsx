import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { Eye, EyeOff } from 'lucide-react';
import { apiClient } from '@/lib/api-client';

interface InvitationInfo {
  valid: boolean;
  email: string;
  role: string;
  unit: string;
  levelCode: string;
  companyId: string;
  partnerId: string | null;
  partnerName: string | null;
  autoApprove: boolean;
}

export default function InviteAcceptPage() {
  const { t } = useTranslation('auth');
  const { token } = useParams<{ token: string }>();
  const navigate = useNavigate();

  const [invitation, setInvitation] = useState<InvitationInfo | null>(null);
  const [loadError, setLoadError] = useState('');
  const [loading, setLoading] = useState(true);

  const [name, setName] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [phone, setPhone] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [resultMessage, setResultMessage] = useState('');

  useEffect(() => {
    if (!token) return;
    apiClient.get(`/invitations/validate/${token}`)
      .then((res: any) => {
        setInvitation(res.data);
      })
      .catch((err: any) => {
        setLoadError(err.response?.data?.message || 'Invalid or expired invitation.');
      })
      .finally(() => setLoading(false));
  }, [token]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (password !== confirmPassword) {
      setError(t('invite.mismatch', 'Passwords do not match.'));
      return;
    }

    if (password.length < 8) {
      setError(t('validation.passwordMinRegister', 'Password must be at least 8 characters.'));
      return;
    }

    if (!/^(?=.*[a-zA-Z])(?=.*\d)/.test(password)) {
      setError(t('validation.passwordPattern', 'Password must contain both letters and numbers.'));
      return;
    }

    setSubmitting(true);
    try {
      const res: any = await apiClient.post(`/invitations/token/${token}/accept`, {
        name,
        password,
        phone: phone || undefined,
      });
      setSuccess(true);
      setResultMessage(res.data.message || 'Registration complete.');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to accept invitation.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="text-gray-500 dark:text-gray-400">Loading...</div>
      </div>
    );
  }

  if (loadError) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="max-w-md w-full bg-white dark:bg-gray-800 rounded-lg shadow-sm p-8 text-center">
          <h1 className="text-xl font-bold text-red-600 dark:text-red-400 mb-4">
            {t('invite.invalidTitle', 'Invalid Invitation')}
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mb-6">{loadError}</p>
          <Link to="/user/login" className="text-blue-600 dark:text-blue-400 hover:underline text-sm">
            {t('invite.goLogin', 'Go to Login')}
          </Link>
        </div>
      </div>
    );
  }

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="max-w-md w-full bg-white dark:bg-gray-800 rounded-lg shadow-sm p-8 text-center">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-green-100 dark:bg-green-900/40 flex items-center justify-center">
            <svg className="w-8 h-8 text-green-600 dark:text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-2">
            {t('invite.successTitle', 'Registration Complete')}
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mb-6">{resultMessage}</p>
          <button
            onClick={() => navigate('/user/login', { replace: true })}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md text-sm font-medium"
          >
            {t('invite.goLogin', 'Go to Login')}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
      <div className="max-w-md w-full bg-white dark:bg-gray-800 rounded-lg shadow-sm p-8">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-2 text-center">
          {t('invite.title', 'Accept Invitation')}
        </h1>
        <p className="text-gray-600 dark:text-gray-400 mb-6 text-center text-sm">
          {invitation?.partnerName
            ? `${t('invite.partnerInvite', { defaultValue: 'You have been invited to join as a partner.' })} (${invitation.partnerName})`
            : `${t('invite.subtitle', 'You have been invited to join.')} (${invitation?.email})`
          }
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400 p-3 rounded text-sm">
              {error}
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              {t('invite.name', 'Name')} *
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
              required
              minLength={2}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              {t('invite.password', 'Password')} *
            </label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-3 py-2 pr-10 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                required
                minLength={8}
                placeholder={t('passwordRegisterPlaceholder', 'At least 8 characters with letters and numbers')}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                tabIndex={-1}
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              {t('invite.confirmPassword', 'Confirm Password')} *
            </label>
            <div className="relative">
              <input
                type={showConfirmPassword ? 'text' : 'password'}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full px-3 py-2 pr-10 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                required
                minLength={8}
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                tabIndex={-1}
              >
                {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              {t('invite.phone', 'Phone')}
            </label>
            <input
              type="text"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
            />
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="w-full py-2 px-4 bg-blue-600 hover:bg-blue-700 text-white rounded-md font-medium disabled:opacity-50"
          >
            {submitting ? t('invite.submitting', 'Registering...') : t('invite.submit', 'Complete Registration')}
          </button>
        </form>
      </div>
    </div>
  );
}
