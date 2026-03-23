import { useState } from 'react';
import { Gift, Sparkles } from 'lucide-react';
import ModernModal from '@/components/ModernModal';

interface PromoModalProps {
  isOpen: boolean;
  onClose: () => void;
  promo?: {
    title: string;
    discount: string;
    description: string;
    code?: string;
  };
}

/**
 * Modal para exibir promoções e ofertas especiais
 * Segue o estilo moderno com pontas arredondadas
 */
export default function PromoModal({ isOpen, onClose, promo }: PromoModalProps) {
  const [claiming, setClaiming] = useState(false);
  const [copied, setCopied] = useState(false);

  const defaultPromo = {
    title: 'Oferta Especial',
    discount: '50%',
    description: 'Aproveite este desconto incrível em todos os serviços premium',
    code: 'SPECIAL50',
    ...promo,
  };

  const handleClaim = async () => {
    setClaiming(true);
    setTimeout(() => {
      setClaiming(false);
      onClose();
    }, 1500);
  };

  const handleCopyCode = () => {
    if (defaultPromo.code) {
      navigator.clipboard.writeText(defaultPromo.code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <ModernModal
      isOpen={isOpen}
      onClose={onClose}
      title={defaultPromo.title}
      size="md"
      darkMode={true}
      primaryAction={{
        label: 'Usar Agora',
        onClick: handleClaim,
        loading: claiming,
      }}
      secondaryAction={{
        label: 'Fechar',
      }}
    >
      <div className="space-y-6 pb-4">
        {/* Discount Badge */}
        <div className="flex justify-center">
          <div className="relative">
            <div className="absolute inset-0 bg-gradient-to-r from-amber-500 to-orange-500 blur-2xl opacity-50 rounded-full w-24 h-24"></div>
            <div className="relative w-24 h-24 bg-gradient-to-br from-amber-500 to-orange-500 rounded-full flex items-center justify-center shadow-2xl">
              <div className="text-center">
                <div className="text-3xl font-bold text-white">{defaultPromo.discount}</div>
                <div className="text-xs text-amber-100">DE DESCONTO</div>
              </div>
            </div>
          </div>
        </div>

        {/* Description */}
        <div className="text-center">
          <p className="text-slate-300 text-sm leading-relaxed">{defaultPromo.description}</p>
        </div>

        {/* Promo Code */}
        {defaultPromo.code && (
          <div
            className="bg-gradient-to-r from-amber-500/20 to-orange-500/20 border border-amber-500/30 rounded-2xl p-4 cursor-pointer hover:border-amber-500/60 transition-colors"
            onClick={handleCopyCode}
          >
            <p className="text-xs text-slate-400 text-center mb-2">Código de promoção</p>
            <p className="text-lg font-mono font-bold text-amber-300 text-center tracking-widest">
              {defaultPromo.code}
            </p>
            <p className="text-xs text-slate-500 text-center mt-2">
              {copied ? '✓ Copiado!' : 'Clique para copiar'}
            </p>
          </div>
        )}

        {/* Features */}
        <div className="space-y-2 pt-2">
          <div className="flex items-center gap-3 text-sm">
            <Sparkles className="w-4 h-4 text-cyan-400 flex-shrink-0" />
            <span className="text-slate-300">Válido por 7 dias</span>
          </div>
          <div className="flex items-center gap-3 text-sm">
            <Gift className="w-4 h-4 text-rose-400 flex-shrink-0" />
            <span className="text-slate-300">Aplicável a novos clientes</span>
          </div>
        </div>

        {/* Terms */}
        <p className="text-xs text-slate-500 text-center px-2">
          Termos e condições aplicáveis. Não acumulável com outras ofertas.
        </p>
      </div>
    </ModernModal>
  );
}
