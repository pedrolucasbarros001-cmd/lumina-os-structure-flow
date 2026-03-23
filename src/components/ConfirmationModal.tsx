import { AlertCircle, CheckCircle } from 'lucide-react';
import ModernModal from '@/components/ModernModal';

export type ConfirmationLevel = 'info' | 'warning' | 'success' | 'error';

interface ConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  message: string;
  level?: ConfirmationLevel;
  confirmText?: string;
  cancelText?: string;
  onConfirm?: () => void | Promise<void>;
  loading?: boolean;
}

/**
 * Modal de confirmação genérico com diferentes níveis
 * Usa o estilo moderno com pontas arredondadas
 */
export default function ConfirmationModal({
  isOpen,
  onClose,
  title,
  message,
  level = 'info',
  confirmText = 'Confirmar',
  cancelText = 'Cancelar',
  onConfirm,
  loading = false,
}: ConfirmationModalProps) {
  const handleConfirm = async () => {
    if (onConfirm) {
      await onConfirm();
    }
    onClose();
  };

  const iconColors: Record<ConfirmationLevel, string> = {
    info: 'text-blue-400',
    warning: 'text-amber-400',
    success: 'text-emerald-400',
    error: 'text-red-400',
  };

  const iconBgGradients: Record<ConfirmationLevel, string> = {
    info: 'from-blue-600 to-cyan-600',
    warning: 'from-amber-600 to-orange-600',
    success: 'from-emerald-600 to-teal-600',
    error: 'from-red-600 to-rose-600',
  };

  const glowColors: Record<ConfirmationLevel, string> = {
    info: 'from-blue-500 to-cyan-400',
    warning: 'from-amber-500 to-orange-400',
    success: 'from-emerald-500 to-teal-400',
    error: 'from-red-500 to-rose-400',
  };

  return (
    <ModernModal
      isOpen={isOpen}
      onClose={onClose}
      title={title}
      size="sm"
      darkMode={true}
      primaryAction={
        onConfirm
          ? {
              label: confirmText,
              onClick: handleConfirm,
              loading,
            }
          : undefined
      }
      secondaryAction={{
        label: cancelText,
        onClick: onClose,
      }}
    >
      <div className="space-y-4 py-4">
        {/* Icon */}
        <div className="flex justify-center">
          <div className="relative">
            <div className={`absolute inset-0 bg-gradient-to-r ${glowColors[level]} blur-xl opacity-40 rounded-full w-16 h-16`}></div>
            <div
              className={`relative w-16 h-16 bg-gradient-to-br ${iconBgGradients[level]} rounded-full flex items-center justify-center shadow-lg`}
            >
              {level === 'success' ? (
                <CheckCircle className={`w-8 h-8 ${iconColors[level]}`} />
              ) : (
                <AlertCircle className={`w-8 h-8 ${iconColors[level]}`} />
              )}
            </div>
          </div>
        </div>

        {/* Message */}
        <div className="text-center">
          <p className="text-slate-300 text-sm leading-relaxed">{message}</p>
        </div>
      </div>
    </ModernModal>
  );
}
