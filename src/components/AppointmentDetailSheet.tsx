import { useState } from 'react';
import { X, MapPin, Clock, User, Navigation, CheckCircle, CreditCard, Ban, Banknote, Smartphone, Check, ChevronLeft, Delete } from 'lucide-react';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { format, parseISO } from 'date-fns';
import { pt } from 'date-fns/locale';
import { Appointment, useUpdateAppointmentStatus } from '@/hooks/useAppointments';
import { useServices } from '@/hooks/useServices';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

interface AppointmentDetailSheetProps {
    appointment: Appointment;
    onClose: () => void;
}

// ─────────────────────────────────────────
// NUMPAD COMPONENT (for cash payments)
// ─────────────────────────────────────────
function Numpad({ value, onChange }: { value: string; onChange: (v: string) => void }) {
    const total = 0;
    const keys = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '.', '0', 'del'];

    const handleKey = (k: string) => {
        if (k === 'del') return onChange(value.slice(0, -1));
        if (k === '.' && value.includes('.')) return;
        if (value.length >= 6) return;
        onChange(value + k);
    };

    return (
        <div className="grid grid-cols-3 gap-2">
            {keys.map(k => (
                <button
                    key={k}
                    onClick={() => handleKey(k)}
                    className={cn(
                        'h-14 rounded-2xl text-lg font-bold transition-all active:scale-95',
                        k === 'del' ? 'bg-muted text-muted-foreground hover:bg-muted/60' : 'bg-card border border-border/50 hover:bg-primary/10 hover:border-primary/30'
                    )}
                >
                    {k === 'del' ? <Delete className="w-5 h-5 mx-auto" /> : k}
                </button>
            ))}
        </div>
    );
}

const PAYMENT_METHODS = [
    { id: 'cash', label: 'Dinheiro', icon: Banknote, color: 'border-emerald-500/50 bg-emerald-500/10 text-emerald-400' },
    { id: 'mbway', label: 'MBWay', icon: Smartphone, color: 'border-blue-500/50 bg-blue-500/10 text-blue-400' },
    { id: 'card', label: 'Cartão', icon: CreditCard, color: 'border-violet-500/50 bg-violet-500/10 text-violet-400' },
];

// Status color map
const STATUS_HEADER: Record<string, string> = {
    pending_approval: 'bg-background',
    confirmed: 'bg-background',
    in_transit: 'bg-yellow-500/10 border-yellow-500/40',
    arrived: 'bg-emerald-500/10 border-emerald-500/40',
    completed: 'bg-background',
    cancelled: 'bg-background',
};

export default function AppointmentDetailSheet({ appointment: appt, onClose }: AppointmentDetailSheetProps) {
    const { data: services = [] } = useServices();
    const updateStatus = useUpdateAppointmentStatus();
    const { toast } = useToast();

    const [paymentMethod, setPaymentMethod] = useState('');
    const [cashPaid, setCashPaid] = useState('');
    const [showCheckout, setShowCheckout] = useState(false);
    const [done, setDone] = useState(false);

    const apptServices = services.filter(s => appt.service_ids?.includes(s.id));
    const serviceTotal = apptServices.reduce((acc, s) => acc + s.price, 0);
    const total = appt.value || serviceTotal;
    const deliveryFee = (appt as any).delivery_fee || 0;
    const grandTotal = total + deliveryFee;

    const cashPaidNum = parseFloat(cashPaid || '0');
    const change = cashPaid && cashPaidNum >= grandTotal ? cashPaidNum - grandTotal : null;

    const handleStatus = async (status: Appointment['status']) => {
        await updateStatus.mutateAsync({ id: appt.id, status });
        toast({ title: 'Estado atualizado!' });
        if (status === 'cancelled') onClose();
    };

    const handleConfirmPayment = async () => {
        await handleStatus('completed');
        setDone(true);
        setTimeout(() => onClose(), 2500);
    };

    const isDelivery = appt.type === 'home';
    const datetime = parseISO(appt.datetime);
    const status = appt.status as string;

    // Quick-change suggestions for cash
    const suggestions = grandTotal > 0 ? [
        Math.ceil(grandTotal / 5) * 5,
        Math.ceil(grandTotal / 10) * 10,
        Math.ceil(grandTotal / 20) * 20,
    ].filter((v, i, a) => a.indexOf(v) === i && v > grandTotal) : [];

    return (
        <Sheet open onOpenChange={o => !o && onClose()}>
            <SheetContent side="bottom" className={cn('h-[90vh] overflow-y-auto rounded-t-3xl p-0 border-t-2', STATUS_HEADER[status] || 'bg-background')}>
                <SheetHeader className="px-6 pt-6 pb-4 border-b border-border/50">
                    <div className="flex items-center justify-between">
                        <SheetTitle className="flex items-center gap-2">
                            {isDelivery && <MapPin className="w-5 h-5 text-orange-400" />}
                            {status === 'in_transit' && <span className="text-yellow-400">🚗</span>}
                            {status === 'arrived' && <span className="text-emerald-400">📍</span>}
                            {appt.client_name || 'Agendamento'}
                        </SheetTitle>
                        <Button variant="ghost" size="icon" onClick={onClose}><X className="w-4 h-4" /></Button>
                    </div>
                    {/* Status pill */}
                    {status === 'in_transit' && (
                        <div className="flex items-center gap-2 text-yellow-400 text-sm font-medium mt-1">
                            <span className="w-2 h-2 rounded-full bg-yellow-400 animate-pulse" />
                            Em trânsito para o cliente
                        </div>
                    )}
                    {status === 'arrived' && (
                        <div className="flex items-center gap-2 text-emerald-400 text-sm font-medium mt-1">
                            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                            Check-in feito — em atendimento
                        </div>
                    )}
                </SheetHeader>

                {done ? (
                    <div className="flex flex-col items-center justify-center h-56 gap-4">
                        <div className="w-20 h-20 rounded-full bg-emerald-500/20 flex items-center justify-center animate-in zoom-in-50 duration-300">
                            <Check className="w-10 h-10 text-emerald-400" />
                        </div>
                        <div className="text-center">
                            <p className="text-lg font-bold">Pagamento Confirmado!</p>
                            <p className="text-muted-foreground text-sm">€{grandTotal.toFixed(2)} registado</p>
                        </div>
                    </div>
                ) : (
                    <div className="px-6 py-4 space-y-4">
                        {/* ── Info ── */}
                        <div className="space-y-1.5 text-sm text-muted-foreground">
                            <div className="flex items-center gap-2">
                                <Clock className="w-4 h-4 shrink-0" />
                                <span>{format(datetime, "EEEE, dd 'de' MMMM 'às' HH:mm", { locale: pt })}</span>
                            </div>
                            {appt.address && (
                                <div className="flex items-center gap-2">
                                    <MapPin className="w-4 h-4 shrink-0" />
                                    <span>{appt.address}</span>
                                </div>
                            )}
                        </div>

                        {/* ── Cart (Uber Eats style) ── */}
                        <div className="rounded-2xl bg-card border border-border/50 overflow-hidden">
                            <div className="px-4 pt-4 pb-2 space-y-2">
                                <div className="flex items-center gap-2 pb-2 border-b border-border/50">
                                    <User className="w-4 h-4 text-muted-foreground" />
                                    <span className="font-medium">{appt.client_name || 'Cliente'}</span>
                                </div>
                                {/* Services */}
                                {apptServices.length > 0 ? (
                                    apptServices.map(s => (
                                        <div key={s.id} className="flex justify-between text-sm">
                                            <span>✂️ {s.name}</span>
                                            <span className="font-medium">€{s.price.toFixed(2)}</span>
                                        </div>
                                    ))
                                ) : (
                                    <div className="flex justify-between text-sm">
                                        <span>Serviço</span>
                                        <span>€{total.toFixed(2)}</span>
                                    </div>
                                )}
                                {/* Delivery fee */}
                                {isDelivery && (
                                    <div className="flex justify-between text-sm text-orange-400">
                                        <div className="flex items-center gap-1">
                                            <MapPin className="w-3 h-3" />
                                            <span>🚗 Taxa de Deslocação</span>
                                        </div>
                                        <span>{deliveryFee > 0 ? `€${deliveryFee.toFixed(2)}` : 'incluída'}</span>
                                    </div>
                                )}
                            </div>
                            {/* Total */}
                            <div className="px-4 py-3 bg-primary/5 border-t border-border/50 flex justify-between font-bold">
                                <span>Total</span>
                                <span className="text-primary text-lg">€{grandTotal.toFixed(2)}</span>
                            </div>
                        </div>

                        {/* ── STATUS PIPELINE ACTIONS ── */}

                        {/* Pending → Confirm or Reject */}
                        {status === 'pending_approval' && (
                            <div className="space-y-2">
                                <Button className="w-full bg-emerald-600 hover:bg-emerald-700" onClick={() => handleStatus('confirmed')}>
                                    <CheckCircle className="w-4 h-4 mr-2" />Confirmar Agendamento
                                </Button>
                                <Button variant="outline" className="w-full border-destructive/50 text-destructive" onClick={() => handleStatus('cancelled')}>
                                    <Ban className="w-4 h-4 mr-2" />Rejeitar
                                </Button>
                            </div>
                        )}

                        {/* Confirmed → Iniciar Trajeto (Delivery) or Cobrar */}
                        {status === 'confirmed' && !showCheckout && (
                            <div className="space-y-2">
                                {isDelivery && (
                                    <Button
                                        className="w-full bg-yellow-500 hover:bg-yellow-600 text-black font-bold"
                                        onClick={() => {
                                            handleStatus('in_transit' as Appointment['status']);
                                            window.open(`https://maps.google.com?q=${encodeURIComponent(appt.address || '')}`, '_blank');
                                        }}
                                    >
                                        🚗 Iniciar Trajeto + Abrir Maps
                                    </Button>
                                )}
                                <Button className="w-full bg-emerald-600 hover:bg-emerald-700" onClick={() => setShowCheckout(true)}>
                                    <CreditCard className="w-4 h-4 mr-2" />Cobrar / Finalizar
                                </Button>
                                <Button variant="outline" className="w-full border-destructive/50 text-destructive" onClick={() => handleStatus('cancelled')}>
                                    <Ban className="w-4 h-4 mr-2" />Cancelar
                                </Button>
                            </div>
                        )}

                        {/* In Transit → Check-in */}
                        {status === 'in_transit' && (
                            <div className="space-y-2">
                                <Button
                                    className="w-full bg-emerald-600 hover:bg-emerald-700 font-bold"
                                    onClick={() => handleStatus('arrived' as Appointment['status'])}
                                >
                                    📍 Check-in / Cheguei ao Local
                                </Button>
                                <Button variant="outline" className="w-full" onClick={() => window.open(`https://maps.google.com?q=${encodeURIComponent(appt.address || '')}`, '_blank')}>
                                    <Navigation className="w-4 h-4 mr-2" />Reabrir Maps
                                </Button>
                            </div>
                        )}

                        {/* Arrived → Cobrar */}
                        {status === 'arrived' && !showCheckout && (
                            <Button className="w-full bg-emerald-600 hover:bg-emerald-700 font-bold text-base h-14" onClick={() => setShowCheckout(true)}>
                                <CreditCard className="w-5 h-5 mr-2" />💰 Cobrar / Finalizar Serviço
                            </Button>
                        )}

                        {/* Completed → badge */}
                        {status === 'completed' && (
                            <div className="text-center py-4">
                                <span className="px-5 py-2.5 bg-black/70 text-white rounded-full text-sm font-bold uppercase tracking-wider">
                                    💳 Pago
                                </span>
                            </div>
                        )}

                        {/* ── CHECKOUT FLOW ── */}
                        {showCheckout && status !== 'completed' && (
                            <div className="space-y-4 animate-in slide-in-from-bottom-4">
                                <div className="flex items-center gap-2 mb-1">
                                    <button onClick={() => setShowCheckout(false)} className="text-muted-foreground hover:text-foreground">
                                        <ChevronLeft className="w-5 h-5" />
                                    </button>
                                    <p className="text-sm font-semibold uppercase tracking-widest text-muted-foreground">Forma de Pagamento</p>
                                </div>

                                {/* Payment method selection */}
                                <div className="grid grid-cols-3 gap-2">
                                    {PAYMENT_METHODS.map(pm => (
                                        <button
                                            key={pm.id}
                                            onClick={() => { setPaymentMethod(pm.id); setCashPaid(''); }}
                                            className={cn(
                                                'p-3 rounded-2xl border-2 flex flex-col items-center gap-1.5 transition-all',
                                                paymentMethod === pm.id ? pm.color + ' border-2' : 'border-border/50 bg-card hover:border-primary/40'
                                            )}
                                        >
                                            <pm.icon className="w-6 h-6" />
                                            <span className="text-xs font-bold">{pm.label}</span>
                                        </button>
                                    ))}
                                </div>

                                {/* Cash: Numpad + suggestions */}
                                {paymentMethod === 'cash' && (
                                    <div className="space-y-4">
                                        {/* Amount display */}
                                        <div className="text-center bg-muted rounded-2xl p-4">
                                            <p className="text-xs text-muted-foreground uppercase tracking-widest mb-1">Valor Recebido</p>
                                            <p className="text-4xl font-black tracking-tight">€{cashPaid || '0'}</p>
                                            {change !== null && (
                                                <div className="mt-2 flex items-center justify-center gap-2">
                                                    <span className="text-sm text-muted-foreground">Troco:</span>
                                                    <span className="text-2xl font-bold text-emerald-400">€{change.toFixed(2)}</span>
                                                </div>
                                            )}
                                        </div>

                                        {/* Quick suggestion pills */}
                                        {suggestions.length > 0 && (
                                            <div className="flex gap-2">
                                                {suggestions.map(s => (
                                                    <button
                                                        key={s}
                                                        onClick={() => setCashPaid(String(s))}
                                                        className="flex-1 py-2 rounded-xl bg-muted border border-border/50 text-sm font-bold hover:bg-primary/10 hover:border-primary/30 transition-colors"
                                                    >
                                                        €{s}
                                                    </button>
                                                ))}
                                            </div>
                                        )}

                                        {/* Numpad */}
                                        <Numpad value={cashPaid} onChange={setCashPaid} />
                                    </div>
                                )}

                                {/* Confirm button */}
                                <Button
                                    className="w-full h-14 text-base font-bold rounded-2xl bg-gradient-to-r from-primary to-accent"
                                    disabled={!paymentMethod || (paymentMethod === 'cash' && cashPaidNum < grandTotal) || updateStatus.isPending}
                                    onClick={handleConfirmPayment}
                                >
                                    <Check className="w-5 h-5 mr-2" />
                                    Confirmar €{grandTotal.toFixed(2)}
                                </Button>
                            </div>
                        )}
                    </div>
                )}
            </SheetContent>
        </Sheet>
    );
}
