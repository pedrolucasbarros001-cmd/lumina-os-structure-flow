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

  // Ícone L em quadrado arredondado com gradiente - COM PONTO NO TOPO
  const IconComponent = () => (
    <div
      className={cn(
        sizeConfig.icon,
        'rounded-[16px] flex items-center justify-center font-black text-white shrink-0 relative',
        showGradient ? 'lumina-gradient' : 'bg-primary'
      )}
      style={{
        fontSize: size === 'sm' ? '14px' : size === 'md' ? '18px' : size === 'lg' ? '24px' : '32px',
      }}
    >
      {/* Ponto no topo */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-1 h-1 bg-white rounded-full" 
        style={{
          width: size === 'sm' ? '3px' : size === 'md' ? '4px' : size === 'lg' ? '5px' : '6px',
          height: size === 'sm' ? '3px' : size === 'md' ? '4px' : size === 'lg' ? '5px' : '6px',
        }}
      />
      L
    </div>
  );

  // Texto "LUMINA OS"
  const TextComponent = () => (
    <div className="flex flex-col leading-tight">
      <div className="flex items-baseline gap-1">
        <span
          className={cn(
            sizeConfig.text,
            'font-black',
            'text-foreground'
          )}
        >
          LUMINA
        </span>
        <span
          className={cn(
            'text-sm',
            'font-bold',
            showGradient ? 'lumina-gradient-text' : 'text-primary'
          )}
          style={{
            fontSize: size === 'sm' ? '9px' : size === 'md' ? '11px' : size === 'lg' ? '13px' : '15px',
          }}
        >
          OS
        </span>
      </div>
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
