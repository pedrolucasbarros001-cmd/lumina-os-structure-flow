import { useState } from 'react';
import { X, MapPin, Clock, User, Navigation, CheckCircle, CreditCard, Ban, Banknote, Smartphone, Check } from 'lucide-react';
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

const paymentMethods = [
    { id: 'cash', label: 'Dinheiro', icon: Banknote },
    { id: 'mbway', label: 'MBWay / Pix', icon: Smartphone },
    { id: 'card', label: 'Cartão', icon: CreditCard },
];

export default function AppointmentDetailSheet({ appointment: appt, onClose }: AppointmentDetailSheetProps) {
    const { data: services = [] } = useServices();
    const updateStatus = useUpdateAppointmentStatus();
    const { toast } = useToast();

    const [paymentMethod, setPaymentMethod] = useState('');
    const [cashPaid, setCashPaid] = useState('');
    const [showCheckout, setShowCheckout] = useState(false);
    const [done, setDone] = useState(false);

    const apptServices = services.filter(s => appt.service_ids?.includes(s.id));
    const total = appt.value || apptServices.reduce((s, srv) => s + srv.price, 0);
    const change = paymentMethod === 'cash' && cashPaid ? parseFloat(cashPaid) - total : null;

    const handleStatus = async (status: Appointment['status']) => {
        await updateStatus.mutateAsync({ id: appt.id, status });
        toast({ title: 'Estado atualizado!' });
        if (status !== 'completed') onClose();
    };

    const handleConfirmPayment = async () => {
        await handleStatus('completed');
        setDone(true);
        setTimeout(() => onClose(), 2000);
    };

    const isDelivery = appt.type === 'home';
    const datetime = parseISO(appt.datetime);

    return (
        <Sheet open onOpenChange={o => !o && onClose()}>
            <SheetContent side="bottom" className="h-[85vh] overflow-y-auto rounded-t-3xl p-0">
                <SheetHeader className="px-6 pt-6 pb-4 border-b border-border/50">
                    <div className="flex items-center justify-between">
                        <SheetTitle className="flex items-center gap-2">
                            {isDelivery && <MapPin className="w-5 h-5 text-orange-400" />}
                            {appt.client_name || 'Agendamento'}
                        </SheetTitle>
                        <Button variant="ghost" size="icon" onClick={onClose}><X className="w-4 h-4" /></Button>
                    </div>
                </SheetHeader>

                {done ? (
                    <div className="flex flex-col items-center justify-center h-48 gap-4">
                        <div className="w-16 h-16 rounded-full bg-emerald-500/20 flex items-center justify-center animate-in zoom-in-50">
                            <Check className="w-8 h-8 text-emerald-400" />
                        </div>
                        <p className="text-lg font-semibold">Pagamento Confirmado!</p>
                        <p className="text-muted-foreground">€{total.toFixed(2)} registado</p>
                    </div>
                ) : (
                    <div className="px-6 py-4 space-y-4">
                        {/* Info */}
                        <div className="space-y-2 text-sm">
                            <div className="flex items-center gap-2 text-muted-foreground">
                                <Clock className="w-4 h-4 shrink-0" />
                                <span>{format(datetime, "EEEE, dd 'de' MMMM 'às' HH:mm", { locale: pt })}</span>
                            </div>
                            {appt.address && (
                                <div className="flex items-center gap-2 text-muted-foreground">
                                    <MapPin className="w-4 h-4 shrink-0" />
                                    <span>{appt.address}</span>
                                </div>
                            )}
                        </div>

                        {/* Cart summary (always visible) */}
                        <div className="rounded-2xl bg-card border border-border/50 overflow-hidden">
                            <div className="px-4 pt-4 pb-2 space-y-2">
                                <div className="flex items-center gap-2 pb-2 border-b border-border/50">
                                    <User className="w-4 h-4 text-muted-foreground" />
                                    <span className="font-medium">{appt.client_name}</span>
                                </div>
                                {apptServices.length > 0 ? (
                                    apptServices.map(s => (
                                        <div key={s.id} className="flex justify-between text-sm">
                                            <span>{s.name}</span>
                                            <span>€{s.price.toFixed(2)}</span>
                                        </div>
                                    ))
                                ) : (
                                    <div className="flex justify-between text-sm">
                                        <span>Serviço</span>
                                        <span>€{total.toFixed(2)}</span>
                                    </div>
                                )}
                                {isDelivery && (
                                    <div className="flex justify-between text-sm text-orange-400">
                                        <div className="flex items-center gap-1">
                                            <MapPin className="w-3 h-3" /> Taxa de Deslocação
                                        </div>
                                        <span>incluída</span>
                                    </div>
                                )}
                            </div>
                            <div className="px-4 py-3 bg-primary/5 border-t border-border/50 flex justify-between font-bold">
                                <span>Total</span>
                                <span className="text-primary text-lg">€{total.toFixed(2)}</span>
                            </div>
                        </div>

                        {/* Status Actions */}
                        {appt.status === 'confirmed' && !showCheckout && (
                            <div className="space-y-2">
                                {isDelivery && (
                                    <Button
                                        variant="outline"
                                        className="w-full border-yellow-500/50 text-yellow-400 hover:bg-yellow-500/10"
                                        onClick={() => {
                                            window.open(`https://maps.google.com?q=${encodeURIComponent(appt.address || '')}`, '_blank');
                                        }}
                                    >
                                        <Navigation className="w-4 h-4 mr-2" />
                                        Iniciar Trajeto
                                    </Button>
                                )}
                                <Button
                                    className="w-full bg-emerald-600 hover:bg-emerald-700"
                                    onClick={() => setShowCheckout(true)}
                                >
                                    <CreditCard className="w-4 h-4 mr-2" />
                                    Cobrar / Finalizar
                                </Button>
                                <Button
                                    variant="outline"
                                    className="w-full border-destructive/50 text-destructive hover:bg-destructive/10"
                                    onClick={() => handleStatus('cancelled')}
                                >
                                    <Ban className="w-4 h-4 mr-2" />
                                    Cancelar
                                </Button>
                            </div>
                        )}

                        {appt.status === 'pending_approval' && (
                            <div className="space-y-2">
                                <Button className="w-full" onClick={() => handleStatus('confirmed')}>
                                    <CheckCircle className="w-4 h-4 mr-2" />
                                    Confirmar
                                </Button>
                                <Button
                                    variant="outline"
                                    className="w-full border-destructive/50 text-destructive"
                                    onClick={() => handleStatus('cancelled')}
                                >
                                    <Ban className="w-4 h-4 mr-2" />
                                    Rejeitar
                                </Button>
                            </div>
                        )}

                        {appt.status === 'completed' && (
                            <div className="text-center py-4">
                                <span className="px-4 py-2 bg-black/60 text-white rounded-full text-sm font-bold uppercase tracking-wider">✓ Pago</span>
                            </div>
                        )}

                        {/* Checkout flow */}
                        {showCheckout && appt.status !== 'completed' && (
                            <div className="space-y-4 animate-in slide-in-from-bottom-4">
                                <p className="text-xs text-muted-foreground uppercase tracking-widest">Forma de Pagamento</p>
                                <div className="grid grid-cols-3 gap-2">
                                    {paymentMethods.map(pm => (
                                        <button
                                            key={pm.id}
                                            onClick={() => setPaymentMethod(pm.id)}
                                            className={cn(
                                                'p-3 rounded-xl border flex flex-col items-center gap-1.5 transition-all',
                                                paymentMethod === pm.id ? 'border-primary bg-primary/10' : 'border-border hover:border-primary/40'
                                            )}
                                        >
                                            <pm.icon className="w-5 h-5" />
                                            <span className="text-xs font-medium">{pm.label}</span>
                                        </button>
                                    ))}
                                </div>

                                {paymentMethod === 'cash' && (
                                    <div className="space-y-2">
                                        <input
                                            type="number"
                                            step="0.01"
                                            placeholder="Valor entregue (€)"
                                            value={cashPaid}
                                            onChange={e => setCashPaid(e.target.value)}
                                            className="w-full text-center text-2xl font-bold bg-transparent border-b-2 border-primary pb-2 outline-none"
                                        />
                                        {change !== null && change >= 0 && (
                                            <p className="text-center text-emerald-400 font-semibold">Troco: €{change.toFixed(2)}</p>
                                        )}
                                    </div>
                                )}

                                <Button
                                    className="w-full"
                                    disabled={!paymentMethod || updateStatus.isPending}
                                    onClick={handleConfirmPayment}
                                >
                                    <Check className="w-4 h-4 mr-2" />
                                    Confirmar €{total.toFixed(2)}
                                </Button>
                            </div>
                        )}
                    </div>
                )}
            </SheetContent>
        </Sheet>
    );
}
