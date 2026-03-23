import { ReactNode } from 'react';
import { X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface ModernModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  subtitle?: string;
  children: ReactNode;
  primaryAction?: {
    label: string;
    onClick: () => void;
    loading?: boolean;
    disabled?: boolean;
  };
  secondaryAction?: {
    label: string;
    onClick?: () => void;
  };
  className?: string;
  darkMode?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

export default function ModernModal({
  isOpen,
  onClose,
  title,
  subtitle,
  children,
  primaryAction,
  secondaryAction,
  className,
  darkMode = true,
  size = 'md',
}: ModernModalProps) {
  if (!isOpen) return null;

  const sizeClasses = {
    sm: 'max-w-xs',
    md: 'max-w-md',
    lg: 'max-w-lg',
  };

  const bgClasses = darkMode
    ? 'bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900 border border-white/10'
    : 'bg-white border border-slate-200';

  const textClasses = darkMode ? 'text-white' : 'text-slate-900';
  const subtitleClasses = darkMode ? 'text-slate-300' : 'text-slate-600';
  const closeButtonClasses = darkMode
    ? 'bg-white/10 hover:bg-white/20'
    : 'bg-slate-200 hover:bg-slate-300';
  const closeIconColor = darkMode ? 'text-white' : 'text-slate-900';

  return (
    <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center bg-black/60 backdrop-blur-md p-4 safe-area-bottom">
      <div
        className={cn(
          'w-full rounded-3xl shadow-2xl flex flex-col overflow-hidden',
          'animate-in fade-in slide-in-from-bottom-4 md:animate-none md:fade-in md:zoom-in',
          bgClasses,
          sizeClasses[size],
          className
        )}
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          className={cn(
            'absolute top-4 left-4 z-10 w-10 h-10 rounded-full',
            'flex items-center justify-center transition-colors',
            closeButtonClasses
          )}
        >
          <X className={cn('w-5 h-5', closeIconColor)} />
        </button>

        {/* Header */}
        {(title || subtitle) && (
          <div className={cn('px-6 pt-8 pb-4 text-center', darkMode && 'text-white')}>
            {title && <h2 className="text-xl font-bold mb-1">{title}</h2>}
            {subtitle && <p className={cn('text-sm', subtitleClasses)}>{subtitle}</p>}
          </div>
        )}

        {/* Content */}
        <div className={cn('px-4 flex-1', darkMode ? 'text-slate-300' : 'text-slate-700')}>
          {children}
        </div>

        {/* Footer Actions */}
        {(primaryAction || secondaryAction) && (
          <div className="px-4 py-4 flex gap-3">
            {secondaryAction && (
              <Button
                variant="ghost"
                onClick={secondaryAction.onClick || onClose}
                className={cn(
                  'flex-1 rounded-2xl h-12',
                  darkMode
                    ? 'border border-white/20 hover:bg-white/10 text-white'
                    : 'border border-slate-300 hover:bg-slate-100 text-slate-900'
                )}
              >
                {secondaryAction.label}
              </Button>
            )}

            {primaryAction && (
              <Button
                onClick={primaryAction.onClick}
                disabled={primaryAction.disabled || primaryAction.loading}
                className={cn(
                  'flex-1 rounded-2xl h-12 font-semibold gap-2',
                  primaryAction.disabled
                    ? 'opacity-50 cursor-not-allowed'
                    : 'bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 shadow-lg shadow-emerald-500/30'
                )}
              >
                {primaryAction.loading ? '⏳ ' : ''}
                {primaryAction.label}
              </Button>
            )}
          </div>
        )}

        {/* Safe Area Spacing */}
        <div className="h-safe" />
      </div>
    </div>
  );
}
