import { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { CheckCircle, XCircle, ArrowLeft } from 'lucide-react';

export default function PaymentResultPage() {
  const { t } = useTranslation(['settings', 'common']);
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const success = searchParams.get('success') === 'true';
  const invoiceNo = searchParams.get('invoiceNo') || '';
  const resultCd = searchParams.get('resultCd') || '';
  const error = searchParams.get('error') || '';

  const [countdown, setCountdown] = useState(10);

  useEffect(() => {
    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          navigate('/');
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [navigate]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50">
      <div className="mx-auto max-w-md px-6 text-center">
        <div className="rounded-2xl border border-gray-200 bg-white p-8 shadow-sm">
          {success ? (
            <>
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-green-100">
                <CheckCircle className="h-8 w-8 text-green-600" />
              </div>
              <h1 className="mb-2 text-xl font-bold text-gray-900">
                {t('settings:paymentGateway.result.successTitle', 'Payment Successful')}
              </h1>
              <p className="mb-4 text-sm text-gray-500">
                {t('settings:paymentGateway.result.successDesc', 'Your payment has been processed successfully.')}
              </p>
            </>
          ) : (
            <>
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-red-100">
                <XCircle className="h-8 w-8 text-red-600" />
              </div>
              <h1 className="mb-2 text-xl font-bold text-gray-900">
                {t('settings:paymentGateway.result.failedTitle', 'Payment Failed')}
              </h1>
              <p className="mb-4 text-sm text-gray-500">
                {error
                  ? t('settings:paymentGateway.result.errorDesc', 'An error occurred during payment processing.')
                  : t('settings:paymentGateway.result.failedDesc', 'Your payment could not be completed.')}
              </p>
            </>
          )}

          {invoiceNo && (
            <div className="mb-4 rounded-lg bg-gray-50 px-4 py-2 text-xs text-gray-500">
              {t('settings:paymentGateway.result.invoiceNo', 'Invoice No')}: {invoiceNo}
              {resultCd && ` | Code: ${resultCd}`}
            </div>
          )}

          <p className="mb-6 text-xs text-gray-400">
            {t('settings:paymentGateway.result.redirect', {
              defaultValue: 'Redirecting in {{seconds}} seconds...',
              seconds: countdown,
            })}
          </p>

          <button
            onClick={() => navigate('/')}
            className="flex w-full items-center justify-center gap-2 rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-indigo-700 transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            {t('settings:paymentGateway.result.goHome', 'Go to Home')}
          </button>
        </div>
      </div>
    </div>
  );
}
