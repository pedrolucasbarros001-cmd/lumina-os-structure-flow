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

  // Ícone L em quadrado arredondado com gradiente - SVG FIEL
  const IconComponent = () => (
    <div
      className={cn(
        sizeConfig.icon,
        'rounded-[16px] flex items-center justify-center shrink-0 relative overflow-hidden',
        showGradient ? 'lumina-gradient' : 'bg-primary'
      )}
    >
      <svg 
        viewBox="0 0 64 64" 
        className="w-full h-full"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        {/* Ponto branco - no topo, bem visível */}
        <circle cx="32" cy="9" r="4.5" fill="white" />
        
        {/* L - Letra "L" com proporções fiel ao design */}
        <g stroke="white" strokeWidth="5.5" strokeLinecap="round" strokeLinejoin="round">
          {/* Linha vertical (tronco do L) - mais comprida */}
          <line x1="20" y1="18" x2="20" y2="52" />
          {/* Linha horizontal (base do L) - mais longa */}
          <line x1="20" y1="52" x2="44" y2="52" />
        </g>
      </svg>
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
