import { cn } from '@/lib/utils';

interface LuminaLogoProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  variant?: 'icon-only' | 'text-only' | 'full';
  className?: string;
  showGradient?: boolean;
}

/**
 * Logo Lumina OS com gradiente azul-roxo
 * Variantes:
 * - icon-only: Apenas o ícone "L" (quadrado arredondado)
 * - text-only: Apenas "LUMINA OS" com gradiente
 * - full: Ícone + texto lado a lado
 */
export function LuminaLogo({
  size = 'md',
  variant = 'full',
  className,
  showGradient = true,
}: LuminaLogoProps) {
  const sizes = {
    sm: {
      icon: 'w-6 h-6',
      text: 'text-sm',
      gap: 'gap-2',
    },
    md: {
      icon: 'w-8 h-8',
      text: 'text-base',
      gap: 'gap-2',
    },
    lg: {
      icon: 'w-10 h-10',
      text: 'text-lg',
      gap: 'gap-3',
    },
    xl: {
      icon: 'w-12 h-12',
      text: 'text-xl',
      gap: 'gap-3',
    },
  };

  const sizeConfig = sizes[size];

  // Ícone L em quadrado arredondado com gradiente
  const IconComponent = () => (
    <div
      className={cn(
        sizeConfig.icon,
        'rounded-lg flex items-center justify-center font-bold text-white shrink-0',
        showGradient ? 'bg-lumina-gradient' : 'bg-primary'
      )}
    >
      <span className="text-lg">L</span>
    </div>
  );

  // Texto "LUMINA OS"
  const TextComponent = () => (
    <div className="flex flex-col">
      <span
        className={cn(
          sizeConfig.text,
          'font-bold',
          showGradient ? 'lumina-gradient-text' : 'text-foreground'
        )}
      >
        LUMINA
      </span>
      <span className="text-[10px] font-medium text-muted-foreground tracking-widest">
        OS
      </span>
    </div>
  );

  return (
    <div className={cn('flex items-center', sizeConfig.gap, className)}>
      {variant !== 'text-only' && <IconComponent />}
      {variant !== 'icon-only' && <TextComponent />}
    </div>
  );
}

export default LuminaLogo;
