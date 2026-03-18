import { useNavigate } from 'react-router-dom';
import { Sparkles, Check, ArrowRight, Zap } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

const PLANS = [
  {
    id: 'monthly' as const,
    name: 'Lumina Pro',
    tagline: 'Para profissionais e pequenos negócios',
    price: '69',
    period: '/mês',
    billingNote: 'Faturado mensalmente',
    highlight: false,
    badge: null,
    Icon: Zap,
    limits: '1 unidade · até 4 colaboradores',
    features: [
      'Agenda inteligente · agendamentos ilimitados',
      'CRM de clientes com notas técnicas',
      'Catálogo de serviços e produtos',
      'Página de agendamento online pública',
      'Painel financeiro e relatórios',
      'Até 4 colaboradores por unidade',
      '1 unidade incluída',
    ],
  },
  {
    id: 'annual' as const,
    name: 'Lumina Enterprise',
    tagline: 'Para equipas, franquias e escala máxima',
    price: '64,75',
    period: '/mês',
    billingNote: 'Faturado anualmente · Poupa 35%',
    highlight: true,
    badge: 'Mais Popular',
    Icon: Sparkles,
    limits: 'até 3 unidades · colaboradores ilimitados',
    features: [
      'Tudo do Pro',
      'Até 3 unidades independentes',
      'Colaboradores ilimitados por unidade',
      'Modo delivery completo com rastreamento',
      'Dashboard de métricas de delivery',
      'Suporte prioritário',
    ],
  },
];

export default function PlanSelection() {
  const navigate = useNavigate();

  const handleSelectPlan = (planId: 'monthly' | 'annual') => {
    sessionStorage.setItem('selected_plan', planId);
    navigate('/onboarding');
  };

  return (
    <div className="min-h-screen bg-[#09090b] text-white flex flex-col items-center justify-center p-6 relative overflow-hidden">
      {/* Background Orbs */}
      <div className="absolute top-0 -left-20 w-96 h-96 bg-primary/15 rounded-full blur-[140px] pointer-events-none" />
      <div className="absolute bottom-0 -right-20 w-96 h-96 bg-accent/15 rounded-full blur-[140px] pointer-events-none" />

      <div className="w-full max-w-4xl z-10 space-y-10">
        {/* Header */}
        <div className="text-center space-y-4">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-primary/30 bg-primary/10 text-primary text-sm font-medium mb-2">
            <Sparkles className="w-3.5 h-3.5" />
            LUMINA OS
          </div>
          <h1 className="text-4xl font-black tracking-tight">
            Escolhe o teu plano
          </h1>
          <p className="text-zinc-400 text-lg max-w-md mx-auto">
            Começa com 5 dias grátis. Sem compromisso.
          </p>

          {/* Trust badges */}
          <div className="flex items-center justify-center gap-6 text-zinc-500 text-sm pt-2 flex-wrap">
            <span className="flex items-center gap-1.5">
              <Check className="w-4 h-4 text-emerald-500" /> Sem compromisso
            </span>
            <span className="flex items-center gap-1.5">
              <Check className="w-4 h-4 text-emerald-500" /> Cancela quando quiseres
            </span>
            <span className="flex items-center gap-1.5">
              <Check className="w-4 h-4 text-emerald-500" /> Suporte incluído
            </span>
          </div>
        </div>

        {/* Plans Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-3xl mx-auto w-full">
          {PLANS.map((plan) => (
            <div
              key={plan.id}
              className={cn(
                'relative flex flex-col rounded-3xl border p-6 transition-all duration-300',
                plan.highlight
                  ? 'border-primary bg-gradient-to-br from-primary/10 via-primary/5 to-transparent shadow-[0_0_60px_-15px] shadow-primary/30 scale-[1.02]'
                  : 'border-zinc-800 bg-zinc-900/60 hover:border-zinc-600'
              )}
            >
              {/* Popular Badge */}
              {plan.badge && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                  <span className="bg-primary text-primary-foreground text-xs font-bold px-4 py-1 rounded-full">
                    {plan.badge}
                  </span>
                </div>
              )}

              {/* Trial Badge */}
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 text-xs font-bold mb-5 self-start">
                <span className="relative flex h-1.5 w-1.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                  <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-400" />
                </span>
                5 Dias Grátis · Cancela quando quiseres
              </div>

              {/* Plan header */}
              <div className="flex items-start gap-3 mb-4">
                <div className={cn(
                  'w-10 h-10 rounded-2xl flex items-center justify-center shrink-0',
                  plan.highlight ? 'bg-primary text-primary-foreground' : 'bg-zinc-800 text-zinc-400'
                )}>
                  <plan.Icon className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-lg font-bold">{plan.name}</h2>
                  <p className="text-zinc-500 text-xs">{plan.tagline}</p>
                </div>
              </div>

              {/* Price */}
              <div className="mb-1">
                <span className="text-4xl font-black">€{plan.price}</span>
                <span className="text-zinc-500 text-sm ml-1">{plan.period}</span>
              </div>
              <p className="text-xs text-zinc-500 mb-1">{plan.billingNote}</p>
              <p className="text-xs text-zinc-600 mb-6">{plan.limits}</p>

              {/* Features */}
              <ul className="space-y-2.5 mb-6 flex-1">
                {plan.features.map((f) => (
                  <li key={f} className="flex items-start gap-2.5 text-sm text-zinc-300">
                    <Check className={cn('w-4 h-4 shrink-0 mt-0.5', plan.highlight ? 'text-primary' : 'text-emerald-500')} />
                    {f}
                  </li>
                ))}
              </ul>

              {/* CTA */}
              <Button
                className={cn(
                  'w-full h-12 rounded-xl font-bold text-sm',
                  plan.highlight
                    ? 'bg-primary hover:bg-primary/90 text-primary-foreground'
                    : 'bg-zinc-800 hover:bg-zinc-700 text-white border border-zinc-700'
                )}
                onClick={() => handleSelectPlan(plan.id)}
              >
                Começar com 5 dias grátis
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </div>
          ))}
        </div>

        {/* Footer note */}
        <p className="text-center text-xs text-zinc-600">
          Processado com segurança pelo Stripe. O cartão só é cobrado após o período de trial.
        </p>
      </div>
    </div>
  );
}
