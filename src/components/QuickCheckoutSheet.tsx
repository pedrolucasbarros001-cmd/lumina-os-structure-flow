import { useState } from 'react';
import { X, CreditCard, Smartphone, Banknote, Plus, Check } from 'lucide-react';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useClients } from '@/hooks/useClients';
import { useServices } from '@/hooks/useServices';
import { useCreateAppointment } from '@/hooks/useAppointments';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

interface QuickCheckoutSheetProps {
    open: boolean;
    onClose: () => void;
}

const paymentMethods = [
    { id: 'cash', label: 'Dinheiro', icon: Banknote, color: 'text-emerald-400' },
    { id: 'mbway', label: 'MBWay / Pix', icon: Smartphone, color: 'text-blue-400' },
    { id: 'card', label: 'Cartão', icon: CreditCard, color: 'text-purple-400' },
];

export default function QuickCheckoutSheet({ open, onClose }: QuickCheckoutSheetProps) {
    const { data: clients = [] } = useClients();
    const { data: services = [] } = useServices();
    const createAppointment = useCreateAppointment();
    const { toast } = useToast();

    const [clientId, setClientId] = useState('');
    const [selectedServices, setSelectedServices] = useState<string[]>([]);
    const [payment, setPayment] = useState('');
    const [cashPaid, setCashPaid] = useState('');
    const [done, setDone] = useState(false);

    const selectedClient = clients.find(c => c.id === clientId);
    const addedServices = services.filter(s => selectedServices.includes(s.id));
    const total = addedServices.reduce((sum, s) => sum + s.price, 0);
    const change = payment === 'cash' && cashPaid ? parseFloat(cashPaid) - total : null;

    const toggleService = (id: string) => {
        setSelectedServices(prev =>
            prev.includes(id) ? prev.filter(s => s !== id) : [...prev, id]
        );
    };

    const handleConfirm = async () => {
        if (!clientId || selectedServices.length === 0 || !payment) return;
        try {
            await createAppointment.mutateAsync({
                client_id: clientId,
                client_name: selectedClient?.name || '',
                service_ids: selectedServices,
                datetime: new Date().toISOString(),
                duration: addedServices.reduce((sum, s) => sum + s.duration, 0),
                value: total,
                type: 'unit',
                status: 'completed',
            });
            setDone(true);
            setTimeout(() => {
                setDone(false);
                setClientId('');
                setSelectedServices([]);
                setPayment('');
                setCashPaid('');
                onClose();
            }, 2000);
        } catch {
            toast({ variant: 'destructive', title: 'Erro', description: 'Não foi possível registar o pagamento.' });
        }
    };

    return (
        <Sheet open={open} onOpenChange={o => !o && onClose()}>
            <SheetContent side="bottom" className="h-[90vh] overflow-y-auto rounded-t-3xl p-0">
                <SheetHeader className="px-6 pt-6 pb-4 border-b border-border/50">
                    <div className="flex items-center justify-between">
                        <SheetTitle className="flex items-center gap-2">
                            <CreditCard className="w-5 h-5 text-emerald-400" />
                            Pagamento Rápido
                        </SheetTitle>
                        <Button variant="ghost" size="icon" onClick={onClose}><X className="w-4 h-4" /></Button>
                    </div>
                </SheetHeader>

                {done ? (
                    <div className="flex flex-col items-center justify-center h-64 gap-4">
                        <div className="w-16 h-16 rounded-full bg-emerald-500/20 flex items-center justify-center animate-in zoom-in-50">
                            <Check className="w-8 h-8 text-emerald-400" />
                        </div>
                        <p className="text-lg font-semibold">Pagamento Registado!</p>
                        <p className="text-muted-foreground text-sm">€{total.toFixed(2)}</p>
                    </div>
                ) : (
                    <div className="px-6 py-4 space-y-5">
                        {/* Client */}
                        <div>
                            <p className="text-xs text-muted-foreground mb-2 uppercase tracking-widest">Cliente</p>
                            <Select value={clientId} onValueChange={setClientId}>
                                <SelectTrigger><SelectValue placeholder="Selecionar cliente..." /></SelectTrigger>
                                <SelectContent>
                                    {clients.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
                                </SelectContent>
                            </Select>
                        </div>

                        {/* Services */}
                        <div>
                            <p className="text-xs text-muted-foreground mb-2 uppercase tracking-widest">Serviços</p>
                            <div className="space-y-2">
                                {services.filter(s => s.is_active).map(s => (
                                    <button
                                        key={s.id}
                                        onClick={() => toggleService(s.id)}
                                        className={cn(
                                            'w-full flex items-center justify-between p-3 rounded-xl border transition-all',
                                            selectedServices.includes(s.id)
                                                ? 'border-primary bg-primary/10'
                                                : 'border-border hover:border-primary/40'
                                        )}
                                    >
                                        <div className="flex items-center gap-3">
                                            <div className={cn('w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all',
                                                selectedServices.includes(s.id) ? 'border-primary bg-primary' : 'border-muted-foreground'
                                            )}>
                                                {selectedServices.includes(s.id) && <Check className="w-3 h-3 text-white" />}
                                            </div>
                                            <span className="text-sm font-medium">{s.name}</span>
                                        </div>
                                        <span className="text-sm font-semibold text-primary">€{s.price.toFixed(2)}</span>
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Total */}
                        {addedServices.length > 0 && (
                            <div className="p-4 rounded-2xl bg-card border border-border/50">
                                <div className="space-y-2">
                                    {addedServices.map(s => (
                                        <div key={s.id} className="flex justify-between text-sm">
                                            <span className="text-muted-foreground">{s.name}</span>
                                            <span>€{s.price.toFixed(2)}</span>
                                        </div>
                                    ))}
                                    <div className="border-t border-border/50 pt-2 flex justify-between font-bold">
                                        <span>Total a Pagar</span>
                                        <span className="text-primary text-lg">€{total.toFixed(2)}</span>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Payment Method */}
                        <div>
                            <p className="text-xs text-muted-foreground mb-2 uppercase tracking-widest">Forma de Pagamento</p>
                            <div className="grid grid-cols-3 gap-2">
                                {paymentMethods.map(pm => (
                                    <button
                                        key={pm.id}
                                        onClick={() => setPayment(pm.id)}
                                        className={cn(
                                            'p-3 rounded-xl border flex flex-col items-center gap-1.5 transition-all',
                                            payment === pm.id ? 'border-primary bg-primary/10' : 'border-border hover:border-primary/40'
                                        )}
                                    >
                                        <pm.icon className={cn('w-5 h-5', pm.color)} />
                                        <span className="text-xs font-medium">{pm.label}</span>
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Cash numpad */}
                        {payment === 'cash' && (
                            <div className="space-y-3">
                                <input
                                    type="number"
                                    step="0.01"
                                    min="0"
                                    placeholder="Valor entregue (€)"
                                    value={cashPaid}
                                    onChange={e => setCashPaid(e.target.value)}
                                    className="w-full text-center text-2xl font-bold bg-transparent border-b-2 border-primary pb-2 outline-none"
                                />
                                {change !== null && change >= 0 && (
                                    <div className="text-center text-emerald-400 font-semibold">
                                        Troco: €{change.toFixed(2)}
                                    </div>
                                )}
                            </div>
                        )}

                        <Button
                            className="w-full"
                            disabled={!clientId || selectedServices.length === 0 || !payment || createAppointment.isPending}
                            onClick={handleConfirm}
                        >
                            {createAppointment.isPending ? 'A processar...' : `Confirmar €${total.toFixed(2)}`}
                        </Button>
                    </div>
                )}
            </SheetContent>
        </Sheet>
    );
}
