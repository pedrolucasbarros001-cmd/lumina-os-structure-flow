import { useState } from 'react';
import { CalendarPlus, CreditCard, Globe, X, Clock } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { useUserContext } from '@/hooks/useUserContext';
import NewAppointmentSheet from './NewAppointmentSheet';
import QuickCheckoutSheet from './QuickCheckoutSheet';

interface QuickActionSheetProps {
    open: boolean;
    onClose: () => void;
}

const ownerActions = [
    {
        id: 'booking',
        icon: CalendarPlus,
        label: 'Nova Reserva',
        sublabel: 'Agendamento interno',
        color: 'from-indigo-500 to-purple-600',
    },
    {
        id: 'checkout',
        icon: CreditCard,
        label: 'Pagamento Rápido',
        sublabel: 'Quick Checkout',
        color: 'from-emerald-500 to-teal-600',
    },
    {
        id: 'profile',
        icon: Globe,
        label: 'Gerir Perfil Online',
        sublabel: 'Vitrine do negócio',
        color: 'from-orange-500 to-rose-500',
    },
];

const staffActions = [
    {
        id: 'block',
        icon: Clock,
        label: 'Bloquear Horário',
        sublabel: 'Pausa, almoço, férias...',
        color: 'from-slate-500 to-slate-700',
    },
    {
        id: 'booking',
        icon: CalendarPlus,
        label: 'Novo Agendamento',
        sublabel: 'Marcar cliente manualmente',
        color: 'from-indigo-500 to-purple-600',
    },
    {
        id: 'checkout',
        icon: CreditCard,
        label: 'Quick Checkout',
        sublabel: 'Registar venda rápida',
        color: 'from-emerald-500 to-teal-600',
    },
];

export default function QuickActionSheet({ open, onClose }: QuickActionSheetProps) {
    const navigate = useNavigate();
    const { isStaff } = useUserContext();
    const [bookingOpen, setBookingOpen] = useState(false);
    const [checkoutOpen, setCheckoutOpen] = useState(false);

    const actions = isStaff ? staffActions : ownerActions;

    const handleAction = (id: string) => {
        onClose();
        if (id === 'booking') setBookingOpen(true);
        if (id === 'checkout') setCheckoutOpen(true);
        if (id === 'profile') navigate('/unit');
        if (id === 'block') {
            // TODO: Implement block time sheet
            navigate('/agenda');
        }
    };

    return (
        <>
            {/* Backdrop */}
            <div
                className={cn(
                    'fixed inset-0 z-40 bg-black/60 backdrop-blur-sm transition-all duration-300',
                    open ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
                )}
                onClick={onClose}
            />

            {/* Sheet — iOS-like bottom sheet with safe area */}
            <div
                className={cn(
                    'fixed bottom-0 left-0 right-0 z-50 transition-all duration-500 ease-out',
                    'max-h-[85vh] md:max-h-[70vh]',
                    open ? 'translate-y-0' : 'translate-y-full'
                )}
            >
                <div className="mx-auto w-full max-w-lg rounded-t-3xl md:rounded-2xl bg-background/95 backdrop-blur-xl border border-border/30 shadow-2xl">
                    {/* Handle Bar — iPhone-style */}
                    <div className="flex justify-center pt-3 pb-1">
                        <div className="w-10 h-1 rounded-full bg-muted/40" />
                    </div>

                    {/* Content with scrollable area */}
                    <div className="px-4 md:px-6 pb-6 md:pb-8 max-h-[calc(85vh-60px)] overflow-y-auto">
                        <div className="space-y-2 md:space-y-3 mt-2">
                            {actions.map((action, i) => (
                                <button
                                    key={action.id}
                                    onClick={() => handleAction(action.id)}
                                    className={cn(
                                        'w-full flex items-center gap-3 md:gap-4 p-3 md:p-4 rounded-xl md:rounded-2xl',
                                        'bg-card/60 backdrop-blur-md border border-border/50',
                                        'hover:bg-card/80 active:scale-95',
                                        'transition-all duration-200 ease-out',
                                        'animate-in slide-in-from-bottom-4',
                                    )}
                                    style={{ animationDelay: `${i * 60}ms` }}
                                >
                                    <div className={cn(
                                        'w-10 h-10 md:w-12 md:h-12 rounded-lg md:rounded-xl',
                                        'bg-gradient-to-br flex items-center justify-center flex-shrink-0',
                                        'shadow-md',
                                        action.color
                                    )}>
                                        <action.icon className="w-5 h-5 md:w-6 md:h-6 text-white" />
                                    </div>
                                    <div className="text-left flex-1 min-w-0">
                                        <p className="font-semibold text-foreground text-sm md:text-base">{action.label}</p>
                                        <p className="text-xs md:text-xs text-muted-foreground leading-tight">{action.sublabel}</p>
                                    </div>
                                    <div className="text-muted-foreground/30 ml-auto">
                                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                        </svg>
                                    </div>
                                </button>
                            ))}

                            <button
                                onClick={onClose}
                                className={cn(
                                    'w-full flex items-center justify-center gap-2 p-3 md:p-4',
                                    'rounded-xl md:rounded-2xl',
                                    'bg-muted/40 hover:bg-muted/60',
                                    'text-muted-foreground hover:text-foreground',
                                    'transition-all duration-200',
                                    'border border-border/30',
                                    'mt-2 md:mt-4 font-medium'
                                )}
                            >
                                <X className="w-4 h-4 md:w-5 md:h-5" />
                                <span className="text-sm md:text-base">Cancelar</span>
                            </button>
                        </div>
                    </div>

                    {/* Safe area for iPhone home indicator */}
                    {open && <div className="h-safe" />}
                </div>
            </div>

            <NewAppointmentSheet open={bookingOpen} onClose={() => setBookingOpen(false)} />
            <QuickCheckoutSheet open={checkoutOpen} onClose={() => setCheckoutOpen(false)} />
        </>
    );
}