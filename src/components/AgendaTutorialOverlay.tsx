import { useState, useEffect } from 'react';
import { cn } from '@/lib/utils';
import { ChevronRight, X } from 'lucide-react';

// Stores in localStorage so it only shows once
const SEEN_KEY = 'lumina_agenda_tutorial_seen';

const STEPS = [
    {
        id: 'swipe',
        emoji: '👆',
        title: 'Navegar pelo Calendário',
        description: 'Deslize para a esquerda ou direita na semana para mudar de dia.',
        hint: 'Passo 1 de 3',
        highlightCss: 'top-[140px] left-4 right-4 h-14 rounded-2xl',
    },
    {
        id: 'longpress',
        emoji: '✋',
        title: 'Criar um Agendamento',
        description: 'Mantenha o dedo pressionado num espaço vazio da agenda para criar uma nova reserva.',
        hint: 'Passo 2 de 3',
        highlightCss: 'top-[240px] left-4 right-4 h-32 rounded-2xl',
    },
    {
        id: 'drag',
        emoji: '↕️',
        title: 'Remarcar Agendamento',
        description: 'Segure e arraste um bloco existente para outro horário para o remarcar facilmente.',
        hint: 'Passo 3 de 3',
        highlightCss: 'top-[240px] left-4 right-4 h-24 rounded-2xl',
    },
];

interface AgendaTutorialOverlayProps {
    onFinish: () => void;
}

export default function AgendaTutorialOverlay({ onFinish }: AgendaTutorialOverlayProps) {
    const [currentStep, setCurrentStep] = useState(0);
    const [animating, setAnimating] = useState(false);

    const step = STEPS[currentStep];
    const isLast = currentStep === STEPS.length - 1;

    const goNext = () => {
        if (animating) return;
        if (isLast) {
            localStorage.setItem(SEEN_KEY, 'true');
            onFinish();
        } else {
            setAnimating(true);
            setTimeout(() => { setCurrentStep(s => s + 1); setAnimating(false); }, 200);
        }
    };

    const skip = () => {
        localStorage.setItem(SEEN_KEY, 'true');
        onFinish();
    };

    return (
        <div className="fixed inset-0 z-50 pointer-events-auto">
            {/* Dark backdrop with cutout for highlighted area */}
            <div className="absolute inset-0 bg-black/75 backdrop-blur-sm" />

            {/* Highlight area (glowing cutout) */}
            <div
                className={cn(
                    'absolute border-2 border-primary/80 rounded-2xl animate-pulse',
                    step.highlightCss
                )}
                style={{ boxShadow: '0 0 0 9999px rgba(0,0,0,0.75), 0 0 24px hsl(var(--primary) / 0.6)' }}
            />

            {/* Skip button */}
            <button
                onClick={skip}
                className="absolute top-4 right-4 p-2 rounded-full bg-white/10 text-white/70 hover:bg-white/20 transition-colors"
            >
                <X className="w-5 h-5" />
            </button>

            {/* Info card — slides up from bottom */}
            <div className={cn(
                'absolute left-4 right-4 bottom-8 bg-card rounded-3xl p-6 space-y-4 shadow-2xl border border-border/50 transition-all duration-200',
                animating ? 'opacity-0 translate-y-4' : 'opacity-100 translate-y-0'
            )}>
                <div className="flex items-start gap-4">
                    <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center text-3xl shrink-0">
                        {step.emoji}
                    </div>
                    <div className="flex-1">
                        <p className="text-xs text-muted-foreground uppercase tracking-widest mb-1">{step.hint}</p>
                        <h3 className="text-lg font-bold leading-tight">{step.title}</h3>
                        <p className="text-sm text-muted-foreground mt-1">{step.description}</p>
                    </div>
                </div>

                {/* Progress dots */}
                <div className="flex items-center justify-center gap-2">
                    {STEPS.map((_, i) => (
                        <div key={i} className={cn('rounded-full transition-all', i === currentStep ? 'w-6 h-2 bg-primary' : 'w-2 h-2 bg-muted')} />
                    ))}
                </div>

                <button
                    onClick={goNext}
                    className="w-full h-12 rounded-2xl bg-gradient-to-r from-primary to-accent text-white font-bold flex items-center justify-center gap-2 active:scale-[0.98] transition-transform"
                >
                    {isLast ? '✅ Pronto, percebo!' : 'Próximo'}
                    {!isLast && <ChevronRight className="w-5 h-5" />}
                </button>
            </div>
        </div>
    );
}

// Hook to check if tutorial was already seen
export function useAgendaTutorial() {
    const [show, setShow] = useState(false);

    useEffect(() => {
        const seen = localStorage.getItem(SEEN_KEY);
        if (!seen) setShow(true);
    }, []);

    const dismiss = () => setShow(false);

    return { show, dismiss };
}
