import { CheckCircle2 } from 'lucide-react';

interface ActionResultModalProps {
  isOpen: boolean;
  title: string;
  message: string;
  confirmLabel: string;
  onClose: () => void;
}

export default function ActionResultModal({
  isOpen,
  title,
  message,
  confirmLabel,
  onClose,
}: ActionResultModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 px-4">
      <div className="w-full max-w-sm rounded-xl bg-white p-6 shadow-xl">
        <div className="mb-3 flex items-center gap-2 text-gray-900">
          <CheckCircle2 className="h-5 w-5 text-green-500" />
          <h3 className="text-base font-semibold">{title}</h3>
        </div>
        <p className="text-sm text-gray-600">{message}</p>
        <div className="mt-5 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700"
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
