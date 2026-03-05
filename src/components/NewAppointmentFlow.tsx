import { useState, useRef } from 'react';
import { format, addMinutes } from 'date-fns';
import { pt } from 'date-fns/locale';
import { Search, X, MapPin, Plus, UserPlus, User } from 'lucide-react';
import { useClients } from '@/hooks/useClients';
import { useServices } from '@/hooks/useServices';
import { useTeamMembers } from '@/hooks/useTeamMembers';
import { useCreateAppointment } from '@/hooks/useAppointments';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

interface Props {
    initialHour: number;
    initialTeamMemberId?: string;
    selectedDate: Date;
    onClose: () => void;
}

type Step = 'client' | 'service' | 'detail';

interface SelectedClient {
    id: string;
    name: string;
    email?: string | null;
    phone?: string | null;
    isNew?: boolean;
    walkIn?: boolean;
}

interface SelectedService {
    id: string;
    name: string;
    price: number;
    duration_minutes: number;
    team_member_id?: string;
}

export default function NewAppointmentFlow({ initialHour, initialTeamMemberId, selectedDate, onClose }: Props) {
    const [step, setStep] = useState<Step>('client');
    const [clientSearch, setClientSearch] = useState('');
    const [serviceSearch, setServiceSearch] = useState('');
    const [selectedClient, setSelectedClient] = useState<SelectedClient | null>(null);
    const [selectedServices, setSelectedServices] = useState<SelectedService[]>([]);
    const [appointmentHour, setAppointmentHour] = useState(initialHour);
    const [appointmentMin, setAppointmentMin] = useState(0);
    const [isDelivery, setIsDelivery] = useState(false);
    const [deliveryAddress, setDeliveryAddress] = useState('');
    const [saving, setSaving] = useState(false);

    const { data: clients = [] } = useClients();
    const { data: services = [] } = useServices();
    const { data: team = [] } = useTeamMembers();
    const createAppt = useCreateAppointment();
    const { toast } = useToast();

    const filteredClients = clients.filter(c =>
        c.name.toLowerCase().includes(clientSearch.toLowerCase()) ||
        c.email?.toLowerCase().includes(clientSearch.toLowerCase())
    );

    const filteredServices = services.filter(s =>
        s.name.toLowerCase().includes(serviceSearch.toLowerCase()) && s.is_active
    );

    const totalPrice = selectedServices.reduce((sum, s) => sum + s.price, 0);
    const totalDuration = selectedServices.reduce((sum, s) => sum + s.duration_minutes, 0);

    const datetime = new Date(selectedDate);
    datetime.setHours(appointmentHour, appointmentMin, 0, 0);
    const endTime = addMinutes(datetime, totalDuration || 60);

    const handleSave = async () => {
        if (!selectedClient || selectedServices.length === 0) return;
        setSaving(true);
        try {
            await createAppt.mutateAsync({
                client_id: selectedClient.id !== '__new' && selectedClient.id !== '__walkin' ? selectedClient.id : null,
                client_name: selectedClient.name,
                client_phone: selectedClient.phone,
                client_email: selectedClient.email,
                datetime: datetime.toISOString(),
                status: 'confirmed',
                value: totalPrice,
                type: isDelivery ? 'home' : 'in_person',
                address: isDelivery ? deliveryAddress : null,
                service_ids: selectedServices.map(s => s.id),
                team_member_id: initialTeamMemberId || team[0]?.id || null,
                duration_minutes: totalDuration || 60,
            } as any);
            toast({ title: '✅ Agendamento criado!' });
            onClose();
        } catch (err: any) {
            toast({ title: 'Erro', description: err.message, variant: 'destructive' });
        } finally { setSaving(false); }
    };

    return (
        <div className="fixed inset-0 z-50 flex flex-col bg-background animate-in slide-in-from-bottom duration-300">
            {/* ── STEP: CLIENT ── */}
            {step === 'client' && (
                <>
                    <div className="flex items-center justify-between p-4 border-b border-border/50">
                        <h2 className="text-xl font-bold">Selecionar cliente</h2>
                        <button onClick={onClose}><X className="w-6 h-6 text-muted-foreground" /></button>
                    </div>

                    {/* Search */}
                    <div className="px-4 py-3">
                        <div className="flex items-center gap-2 bg-muted rounded-2xl px-3 py-2 border border-border/50 focus-within:border-primary/50 transition-colors">
                            <Search className="w-4 h-4 text-muted-foreground" />
                            <input
                                value={clientSearch}
                                onChange={e => setClientSearch(e.target.value)}
                                placeholder="Pesquisar cliente ou deixar em branco para clie..."
                                className="flex-1 bg-transparent text-sm outline-none"
                                autoFocus
                            />
                        </div>
                    </div>

                    <div className="flex-1 overflow-y-auto">
                        {/* Cadastrar / Walk-in */}
                        <div className="px-4 space-y-1 pb-2">
                            <button
                                onClick={() => { setSelectedClient({ id: '__new', name: clientSearch || 'Novo cliente', isNew: true }); setStep('service'); }}
                                className="w-full flex items-center gap-4 p-4 hover:bg-muted/60 rounded-xl transition-colors"
                            >
                                <div className="w-12 h-12 rounded-full bg-primary flex items-center justify-center shrink-0">
                                    <UserPlus className="w-6 h-6 text-white" />
                                </div>
                                <span className="font-semibold text-base">Cadastrar cliente</span>
                            </button>
                            <button
                                onClick={() => { setSelectedClient({ id: '__walkin', name: 'Sem reserva', walkIn: true }); setStep('service'); }}
                                className="w-full flex items-center gap-4 p-4 hover:bg-muted/60 rounded-xl transition-colors"
                            >
                                <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center shrink-0">
                                    <User className="w-6 h-6 text-muted-foreground" />
                                </div>
                                <span className="font-semibold text-base text-muted-foreground">Sem reserva</span>
                            </button>
                        </div>

                        {/* Client list */}
                        <div className="px-4 space-y-0.5">
                            {filteredClients.map(c => (
                                <button
                                    key={c.id}
                                    onClick={() => { setSelectedClient({ id: c.id, name: c.name, email: c.email, phone: c.phone }); setStep('service'); }}
                                    className="w-full flex items-center gap-4 py-3 border-b border-border/30 last:border-0 hover:bg-muted/40 rounded-lg px-2 transition-colors"
                                >
                                    <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center shrink-0">
                                        <span className="text-primary font-bold">{c.name[0].toUpperCase()}</span>
                                    </div>
                                    <div className="text-left">
                                        <p className="font-semibold">{c.name}</p>
                                        {c.email && <p className="text-xs text-muted-foreground">{c.email}</p>}
                                    </div>
                                </button>
                            ))}
                        </div>
                    </div>
                </>
            )}

            {/* ── STEP: SERVICE ── */}
            {step === 'service' && (
                <>
                    <div className="flex items-center justify-between p-4 border-b border-border/50">
                        <button onClick={() => setStep('client')} className="text-muted-foreground hover:text-foreground">← Voltar</button>
                        <h2 className="text-xl font-bold">Selecionar serviço</h2>
                        <button onClick={onClose}><X className="w-6 h-6 text-muted-foreground" /></button>
                    </div>

                    <div className="px-4 py-3">
                        <div className="flex items-center gap-2 bg-muted rounded-2xl px-3 py-2 border border-border/50">
                            <Search className="w-4 h-4 text-muted-foreground" />
                            <input value={serviceSearch} onChange={e => setServiceSearch(e.target.value)} placeholder="Buscar serviço por nome"
                                className="flex-1 bg-transparent text-sm outline-none" autoFocus />
                        </div>
                    </div>

                    <div className="flex-1 overflow-y-auto px-4 pb-4 space-y-0.5">
                        {filteredServices.map(s => (
                            <button
                                key={s.id}
                                onClick={() => {
                                    const already = selectedServices.find(x => x.id === s.id);
                                    if (already) {
                                        setSelectedServices(ss => ss.filter(x => x.id !== s.id));
                                    } else {
                                        setSelectedServices(ss => [...ss, {
                                            id: s.id, name: s.name, price: s.price,
                                            duration_minutes: (s as any).duration_minutes || 60,
                                            team_member_id: initialTeamMemberId,
                                        }]);
                                    }
                                }}
                                className={cn(
                                    'w-full flex items-center py-4 border-b border-border/30 last:border-0 px-1 transition-colors',
                                    selectedServices.find(x => x.id === s.id) ? 'bg-primary/5' : 'hover:bg-muted/40'
                                )}
                            >
                                <div className="w-1 h-10 rounded-full bg-primary mr-4" />
                                <div className="flex-1 text-left">
                                    <p className="font-semibold">{s.name}</p>
                                    <p className="text-xs text-muted-foreground">{(s as any).duration_minutes || 60}min</p>
                                </div>
                                <span className="font-bold text-primary">€{s.price.toFixed(2)}</span>
                                {selectedServices.find(x => x.id === s.id) && (
                                    <span className="ml-2 w-5 h-5 rounded-full bg-primary text-white text-xs flex items-center justify-center">✓</span>
                                )}
                            </button>
                        ))}
                    </div>

                    <div className="p-4 border-t border-border/50">
                        <button
                            disabled={selectedServices.length === 0}
                            onClick={() => setStep('detail')}
                            className="w-full h-12 bg-primary text-white rounded-2xl font-bold disabled:opacity-40"
                        >
                            Continuar {selectedServices.length > 0 ? `(${selectedServices.length})` : ''}
                        </button>
                    </div>
                </>
            )}

            {/* ── STEP: DETAIL ── */}
            {step === 'detail' && (
                <>
                    {/* Header */}
                    <div className="flex items-center justify-between p-4 border-b border-border/50">
                        <button onClick={() => setStep('service')} className="text-muted-foreground">←</button>
                        <h2 className="text-lg font-bold">
                            {format(datetime, "EEEE d MMM", { locale: pt })}
                        </h2>
                        <button onClick={onClose}><X className="w-6 h-6 text-muted-foreground" /></button>
                    </div>

                    <div className="flex-1 overflow-y-auto p-4 space-y-4">
                        {/* Client card */}
                        <div className="bg-card border border-border/50 rounded-2xl p-4 flex items-center gap-3">
                            <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center">
                                <span className="text-primary font-bold text-lg">{selectedClient?.name?.[0]?.toUpperCase()}</span>
                            </div>
                            <div className="flex-1">
                                <p className="font-bold">{selectedClient?.name}</p>
                                {selectedClient?.email && <p className="text-sm text-muted-foreground">{selectedClient.email}</p>}
                            </div>
                        </div>

                        {/* Date/time */}
                        <div className="bg-card border border-border/50 rounded-2xl p-4 space-y-3">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                    <span>📅</span>
                                    <span>{format(datetime, "EEEE d MMM", { locale: pt })}</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <input type="time"
                                        value={`${String(appointmentHour).padStart(2, '0')}:${String(appointmentMin).padStart(2, '0')}`}
                                        onChange={e => {
                                            const [h, m] = e.target.value.split(':').map(Number);
                                            setAppointmentHour(h); setAppointmentMin(m);
                                        }}
                                        className="text-sm font-bold bg-muted rounded-lg px-2 py-1 outline-none border border-border/50 focus:border-primary"
                                    />
                                </div>
                            </div>
                            {/* Delivery toggle */}
                            <div className="flex items-center justify-between pt-2 border-t border-border/30">
                                <div className="flex items-center gap-2 text-sm">
                                    <MapPin className="w-4 h-4 text-orange-400" />
                                    <span>Serviço ao Domicílio</span>
                                </div>
                                <button
                                    onClick={() => setIsDelivery(d => !d)}
                                    className={cn('w-12 h-6 rounded-full transition-colors relative', isDelivery ? 'bg-primary' : 'bg-muted')}
                                >
                                    <span className={cn('absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-all', isDelivery ? 'left-6' : 'left-0.5')} />
                                </button>
                            </div>
                            {isDelivery && (
                                <input value={deliveryAddress} onChange={e => setDeliveryAddress(e.target.value)}
                                    placeholder="Morada do cliente" className="w-full bg-muted rounded-xl px-3 py-2 text-sm outline-none border border-border/50 focus:border-primary" />
                            )}
                        </div>

                        {/* Services */}
                        <div>
                            <p className="text-sm font-semibold mb-2">Serviços</p>
                            <div className="space-y-2">
                                {selectedServices.map(s => {
                                    const startStr = format(datetime, 'HH:mm');
                                    const endStr = format(addMinutes(datetime, s.duration_minutes), 'HH:mm');
                                    const memberName = team.find(m => m.id === s.team_member_id)?.name || team[0]?.name || 'Eu';
                                    return (
                                        <div key={s.id} className="flex items-center gap-3 bg-card border border-border/50 rounded-xl p-3">
                                            <div className="w-1 h-10 rounded-full bg-primary" />
                                            <div className="flex-1">
                                                <p className="font-semibold">{s.name}</p>
                                                <p className="text-xs text-muted-foreground">{startStr} · {s.duration_minutes}min · {memberName}</p>
                                            </div>
                                            <span className="font-bold">€{s.price.toFixed(2)}</span>
                                        </div>
                                    );
                                })}
                            </div>
                            <button onClick={() => setStep('service')} className="flex items-center gap-2 text-primary text-sm mt-2 hover:opacity-70">
                                <Plus className="w-4 h-4" />Adicionar serviço
                            </button>
                        </div>

                        {/* Total */}
                        <div className="flex items-center justify-between font-bold text-lg border-t border-border/50 pt-4">
                            <span>Total</span>
                            <span className="text-primary">€{totalPrice.toFixed(2)}</span>
                        </div>
                    </div>

                    {/* Actions */}
                    <div className="p-4 border-t border-border/50 flex gap-3">
                        <button onClick={onClose} className="flex-1 h-12 rounded-2xl bg-muted font-bold text-muted-foreground">Cancelar</button>
                        <button
                            onClick={handleSave}
                            disabled={saving}
                            className="flex-2 px-6 h-12 rounded-2xl bg-primary text-white font-bold flex-1"
                        >
                            {saving ? 'A guardar...' : 'Salvar'}
                        </button>
                    </div>
                </>
            )}
        </div>
    );
}
