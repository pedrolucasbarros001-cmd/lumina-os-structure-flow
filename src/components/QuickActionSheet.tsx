import { useState } from 'react';
import { CalendarPlus, CreditCard, Globe, X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { cn } from '@/lib/utils';
import NewAppointmentSheet from './NewAppointmentSheet';
import QuickCheckoutSheet from './QuickCheckoutSheet';

interface QuickActionSheetProps {
    open: boolean;
    onClose: () => void;
}

const actions = [
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

export default function QuickActionSheet({ open, onClose }: QuickActionSheetProps) {
    const navigate = useNavigate();
    const [bookingOpen, setBookingOpen] = useState(false);
    const [checkoutOpen, setCheckoutOpen] = useState(false);

    const handleAction = (id: string) => {
        onClose();
        if (id === 'booking') setBookingOpen(true);
        if (id === 'checkout') setCheckoutOpen(true);
        if (id === 'profile') navigate('/unit');
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

            {/* Sheet */}
            <div
                className={cn(
                    'fixed bottom-0 left-0 right-0 z-50 transition-all duration-500 ease-out',
                    open ? 'translate-y-0' : 'translate-y-full'
                )}
            >
                <div className="mx-auto max-w-lg px-4 pb-8">
                    {/* Handle */}
                    <div className="flex justify-center mb-4">
                        <div className="w-12 h-1 rounded-full bg-white/30" />
                    </div>

                    <div className="space-y-3">
                        {actions.map((action, i) => (
                            <button
                                key={action.id}
                                onClick={() => handleAction(action.id)}
                                className={cn(
                                    'w-full flex items-center gap-4 p-4 rounded-2xl',
                                    'bg-card/80 backdrop-blur-md border border-white/10',
                                    'hover:scale-[1.02] active:scale-[0.98]',
                                    'transition-all duration-200',
                                    'animate-in slide-in-from-bottom-4',
                                )}
                                style={{ animationDelay: `${i * 60}ms` }}
                            >
                                <div className={cn('w-12 h-12 rounded-xl bg-gradient-to-br flex items-center justify-center flex-shrink-0', action.color)}>
                                    <action.icon className="w-5 h-5 text-white" />
                                </div>
                                <div className="text-left">
                                    <p className="font-semibold text-foreground">{action.label}</p>
                                    <p className="text-xs text-muted-foreground">{action.sublabel}</p>
                                </div>
                            </button>
                        ))}

                        <button
                            onClick={onClose}
                            className="w-full flex items-center justify-center gap-2 p-3 rounded-2xl bg-muted/50 text-muted-foreground hover:bg-muted transition-colors mt-2"
                        >
                            <X className="w-4 h-4" />
                            <span className="text-sm">Cancelar</span>
                        </button>
                    </div>
                </div>
            </div>

            <NewAppointmentSheet open={bookingOpen} onClose={() => setBookingOpen(false)} />
            <QuickCheckoutSheet open={checkoutOpen} onClose={() => setCheckoutOpen(false)} />
        </>
    );
}
