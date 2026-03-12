import { X, Lock, TrendingUp, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent } from '@/components/ui/sheet';

interface PaywallModalProps {
  open: boolean;
  onClose: () => void;
  type: 'units' | 'staff';
  currentPlan: 'monthly' | 'annual';
  current: number;
  limit: number;
}

export function PaywallModal({ open, onClose, type, currentPlan, current, limit }: PaywallModalProps) {
  const isMonthly = currentPlan === 'monthly';

  const content = {
    units: {
      title: isMonthly ? 'Atualizar para Plano Anual' : 'Limite de Empresas Atingido',
      icon: TrendingUp,
      description: isMonthly
        ? `Seu plano Mensal permite apenas 1 empresa. Upgrade para o Plano Anual e gerencie até 3 empresas (filiais).`
        : `Seu plano Anual permite apenas 3 empresas. Entre em contato para expandir.`,
      features: [
        '3 empresas (filiais)',
        'Dashboard Global com dados consolidados',
        'Gestão de equipa completa',
        'Suporte prioritário',
      ],
      cta: isMonthly ? 'Upgrade para €777/ano' : 'Contacte Suporte',
      price: isMonthly ? '€777' : null,
      period: isMonthly ? '/ano' : '',
    },
    staff: {
      title: isMonthly ? 'Atualizar para Plano Anual' : 'Limite de Colaboradores Atingido',
      icon: Users,
      description: isMonthly
        ? `Seu plano Mensal permite apenas 4 colaboradores. Upgrade para o Plano Anual e gerencie até 4 colaboradores por empresa.`
        : `Você atingiu o limite de 4 colaboradores por empresa. Entre em contato para expandir.`,
      features: [
        '4 colaboradores por empresa',
        'Gestão de comissões',
        'Rankings de desempenho',
        'API de integração',
      ],
      cta: isMonthly ? 'Upgrade para €777/ano' : 'Contacte Suporte',
      price: isMonthly ? '€777' : null,
      period: isMonthly ? '/ano' : '',
    },
  };

  const data = content[type];
  const Icon = data.icon;

  return (
    <Sheet open={open} onOpenChange={onClose}>
      <SheetContent side="bottom" className="rounded-t-3xl p-0">
        <div className="bg-gradient-to-br from-primary/10 via-accent/5 to-background px-6 pt-8 pb-6">
          {/* Close Button */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 w-8 h-8 rounded-full hover:bg-muted flex items-center justify-center"
          >
            <X className="w-5 h-5" />
          </button>

          {/* Icon */}
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary to-primary-glow flex items-center justify-center mb-4">
            <Icon className="w-8 h-8 text-white" />
          </div>

          {/* Title */}
          <h2 className="text-2xl font-bold font-display mb-2">{data.title}</h2>
          <p className="text-sm text-muted-foreground mb-6">{data.description}</p>

          {/* Features */}
          <div className="space-y-2 mb-6 py-4 border-y border-border/50">
            {data.features.map((feature, i) => (
              <div key={i} className="flex items-center gap-3 text-sm">
                <div className="w-5 h-5 rounded-full bg-emerald-500/20 flex items-center justify-center flex-shrink-0">
                  <div className="w-2 h-2 rounded-full bg-emerald-500" />
                </div>
                <span>{feature}</span>
              </div>
            ))}
          </div>

          {/* Price */}
          {data.price && (
            <div className="mb-6 px-4 py-3 rounded-xl bg-muted/50">
              <p className="text-xs text-muted-foreground mb-1">Preço Annual</p>
              <div className="flex items-baseline gap-1">
                <span className="text-3xl font-bold font-display">{data.price}</span>
                <span className="text-sm text-muted-foreground">{data.period}</span>
              </div>
            </div>
          )}

          {/* CTA */}
          <Button className="w-full h-12 rounded-xl font-semibold text-base mb-3">
            <Lock className="w-4 h-4 mr-2" />
            {data.cta}
          </Button>

          <Button
            variant="outline"
            className="w-full h-12 rounded-xl font-semibold text-base"
            onClick={onClose}
          >
            Agora não
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}
