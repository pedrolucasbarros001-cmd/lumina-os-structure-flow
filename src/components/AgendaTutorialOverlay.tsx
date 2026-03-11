import { useState, useEffect, useCallback } from 'react';
import { cn } from '@/lib/utils';
import { ArrowLeftRight, Plus, GripVertical } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useProfile } from '@/hooks/useProfile';
import { supabase } from '@/integrations/supabase/client';

const STEPS = [
  {
    id: 'swipe',
    icon: ArrowLeftRight,
    title: 'Percorrer calendário',
    description: 'Deslize para a esquerda e para a direita para alternar datas e colaboradores.',
    button: 'Próximo',
  },
  {
    id: 'longpress',
    icon: Plus,
    title: 'Fazer agendamento',
    description: 'Mantenha pressionado um horário no calendário para agendar.',
    button: 'Próximo',
  },
  {
    id: 'drag',
    icon: GripVertical,
    title: 'Arraste e solte',
    description: 'Mantenha pressionado um agendamento para arrastar e soltar.',
    button: 'Concluído',
  },
];

interface AgendaTutorialOverlayProps {
  onFinish: () => void | Promise<void>;
}

export default function AgendaTutorialOverlay({ onFinish }: AgendaTutorialOverlayProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [animating, setAnimating] = useState(false);

  const step = STEPS[currentStep];
  const isLast = currentStep === STEPS.length - 1;
  const StepIcon = step.icon;

  const goNext = () => {
    if (animating) return;
    if (isLast) {
      void onFinish();
    } else {
      setAnimating(true);
      setTimeout(() => {
        setCurrentStep(s => s + 1);
        setAnimating(false);
      }, 200);
    }
  };

  const skip = () => {
    void onFinish();
  };

  return (
    <div className="fixed inset-0 z-50 pointer-events-auto flex flex-col">
      <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-black/20 to-black/90" />

      <button
        onClick={skip}
        className="absolute top-4 right-4 z-10 text-sm text-white/60 hover:text-white/90 transition-colors"
      >
        Ignorar
      </button>

      <div className="flex-1 flex items-center justify-center relative">
        <div className={cn(
          'flex flex-col items-center gap-4 transition-all duration-200',
          animating ? 'opacity-0 scale-95' : 'opacity-100 scale-100'
        )}>
          <div className="relative">
            <div className="w-20 h-20 rounded-full bg-white/10 backdrop-blur-sm flex items-center justify-center border border-white/20">
              <StepIcon className="w-10 h-10 text-white" />
            </div>
            <div className="absolute -bottom-3 -right-3 w-8 h-8 animate-bounce">
              <span className="text-2xl">👆</span>
            </div>
          </div>
        </div>
      </div>

      <div className={cn(
        'relative px-6 pb-10 pt-6 space-y-5 transition-all duration-200',
        animating ? 'opacity-0 translate-y-4' : 'opacity-100 translate-y-0'
      )}>
        <div className="text-center space-y-2">
          <h3 className="text-xl font-bold text-white">{step.title}</h3>
          <p className="text-sm text-white/70 max-w-xs mx-auto">{step.description}</p>
        </div>

        <div className="flex items-center justify-center gap-2">
          {STEPS.map((_, i) => (
            <div
              key={i}
              className={cn(
                'rounded-full transition-all',
                i === currentStep ? 'w-6 h-2 bg-white' : 'w-2 h-2 bg-white/30'
              )}
            />
          ))}
        </div>

        <button
          onClick={goNext}
          className="w-full h-12 rounded-2xl bg-white text-black font-bold text-sm flex items-center justify-center active:scale-[0.98] transition-transform"
        >
          {step.button}
        </button>
      </div>
    </div>
  );
}

// Tutorial is now persisted per account (DB), not per browser localStorage.
export function useAgendaTutorial() {
  const { user } = useAuth();
  const { data: profile, isLoading } = useProfile();
  const [show, setShow] = useState(false);

  useEffect(() => {
    if (!user || isLoading) return;
    setShow(!profile?.agenda_tutorial_completed);
  }, [user, isLoading, profile?.agenda_tutorial_completed]);

  const dismiss = useCallback(async () => {
    setShow(false);

    if (!user || profile?.agenda_tutorial_completed) return;

    await supabase
      .from('profiles')
      .update({ agenda_tutorial_completed: true })
      .eq('id', user.id);
  }, [user, profile?.agenda_tutorial_completed]);

  return { show: !!user && !isLoading && show, dismiss };
}
