import { useState, useEffect } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { clientPortalApiService } from '../service/client-portal.service';
import { useClientAuthStore } from '../store/client-auth.store';
import { toast } from 'sonner';

export default function ClientRegisterPage() {
  const { t } = useTranslation('clientPortal');
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { login } = useClientAuthStore();

  const token = searchParams.get('token') || '';
  const [invitation, setInvitation] = useState<{
    email: string; name?: string; clientName?: string;
    entityCode?: string; entityName?: string;
  } | null>(null);
  const [loading, setLoading] = useState(false);
  const [verifying, setVerifying] = useState(true);

  const [name, setName] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [jobTitle, setJobTitle] = useState('');
  const [phone, setPhone] = useState('');

  useEffect(() => {
    if (!token) {
      setVerifying(false);
      return;
    }
    clientPortalApiService.verifyInvitation(token)
      .then((data) => {
        setInvitation(data);
        if (data.name) setName(data.name);
      })
      .catch(() => setInvitation(null))
      .finally(() => setVerifying(false));
  }, [token]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      toast.error(t('register.passwordMismatch'));
      return;
    }
    setLoading(true);
    try {
      const data = await clientPortalApiService.register({
        token, name, password,
        ...(jobTitle && { job_title: jobTitle }),
        ...(phone && { phone }),
      });
      login(data.user);
      navigate('/client');
    } catch (err: unknown) {
      const error = err as Error & { response?: { data?: { error?: { message?: string } } } };
      toast.error(error.response?.data?.error?.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  if (verifying) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <div className="text-gray-500">Loading...</div>
      </div>
    );
  }

  if (!token || !invitation) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4">
        <div className="w-full max-w-md rounded-xl border border-gray-200 bg-white p-8 text-center shadow-sm">
          <p className="text-gray-500">{t('register.invalidToken')}</p>
          <Link to="/client/login" className="mt-4 inline-block text-sm font-medium text-indigo-600 hover:text-indigo-500">
            {t('register.login')}
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-md rounded-xl border border-gray-200 bg-white p-8 shadow-sm">
        <div className="mb-6 text-center">
          <h1 className="text-xl font-semibold text-gray-900">{t('register.title')}</h1>
          <p className="mt-1 text-sm text-gray-500">{t('register.subtitle')}</p>
          {invitation.clientName && (
            <p className="mt-2 text-sm font-medium text-indigo-600">{invitation.clientName}</p>
          )}
          {invitation.entityName && (
            <p className="mt-1 text-xs text-gray-500">
              {t('register.invitedBy', { entity: `${invitation.entityCode} — ${invitation.entityName}` })}
            </p>
          )}
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">{t('login.email')}</label>
            <input type="email" value={invitation.email} disabled
              className="w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-500" />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">{t('register.name')}</label>
            <input type="text" value={name} onChange={(e) => setName(e.target.value)} required
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500" />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">{t('register.password')}</label>
            <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required minLength={8}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500" />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">{t('register.confirmPassword')}</label>
            <input type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} required
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500" />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">{t('register.jobTitle')}</label>
            <input type="text" value={jobTitle} onChange={(e) => setJobTitle(e.target.value)}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500" />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">{t('register.phone')}</label>
            <input type="tel" value={phone} onChange={(e) => setPhone(e.target.value)}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500" />
          </div>
          <button type="submit" disabled={loading}
            className="w-full rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-50">
            {loading ? '...' : t('register.submit')}
          </button>
        </form>

        <p className="mt-4 text-center text-sm text-gray-500">
          {t('register.hasAccount')}{' '}
          <Link
            to={`/client/login${invitation?.entityCode ? `?entityCode=${invitation.entityCode}&entityName=${encodeURIComponent(invitation.entityName || '')}` : ''}`}
            className="font-medium text-indigo-600 hover:text-indigo-500"
          >
            {t('register.login')}
          </Link>
        </p>
      </div>
    </div>
  );
}
