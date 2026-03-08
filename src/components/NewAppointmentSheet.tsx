import { useState, useEffect } from 'react';
import { X, CalendarPlus, User, Clock, MapPin, StickyNote } from 'lucide-react';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { useServices } from '@/hooks/useServices';
import { useClients } from '@/hooks/useClients';
import { useTeamMembers } from '@/hooks/useTeamMembers';
import { useCreateAppointment } from '@/hooks/useAppointments';
import { useToast } from '@/hooks/use-toast';

interface NewAppointmentSheetProps {
    open: boolean;
    onClose: () => void;
    prefillDate?: string;
    prefillTime?: string;
    prefillTeamMemberId?: string;
}

export default function NewAppointmentSheet({ open, onClose, prefillDate, prefillTime, prefillTeamMemberId }: NewAppointmentSheetProps) {
    const { data: services = [] } = useServices();
    const { data: clients = [] } = useClients();
    const { data: teamMembers = [] } = useTeamMembers();
    const createAppointment = useCreateAppointment();
    const { toast } = useToast();

    const defaultDatetime = prefillTime || (prefillDate ? `${prefillDate}T10:00` : '');

    const [form, setForm] = useState({
        client_name: '',
        client_id: '',
        client_phone: '',
        service_id: '',
        team_member_id: prefillTeamMemberId || '',
        datetime: defaultDatetime,
        type: 'unit' as 'unit' | 'home',
        address: '',
        notes: '',
    });

    // Update form when prefill props change
    useEffect(() => {
        setForm(f => ({
            ...f,
            datetime: prefillTime || (prefillDate ? `${prefillDate}T10:00` : f.datetime),
            team_member_id: prefillTeamMemberId || f.team_member_id,
        }));
    }, [prefillTime, prefillTeamMemberId, prefillDate]);

    const selectedService = services.find(s => s.id === form.service_id);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const selectedClient = clients.find(c => c.id === form.client_id);
            await createAppointment.mutateAsync({
                client_id: form.client_id || null,
                client_name: selectedClient?.name || form.client_name,
                client_phone: form.client_phone || null,
                service_ids: form.service_id ? [form.service_id] : [],
                team_member_id: form.team_member_id || null,
                datetime: form.datetime,
                duration: selectedService?.duration || 60,
                value: selectedService?.price || 0,
                type: form.type,
                address: form.address || null,
                notes: form.notes || null,
                status: 'confirmed',
            });
            toast({ title: 'Reserva criada!', description: 'Agendamento adicionado com sucesso.' });
            onClose();
            setForm({ client_name: '', client_id: '', client_phone: '', service_id: '', team_member_id: '', datetime: '', type: 'unit', address: '', notes: '' });
        } catch (err) {
            toast({ variant: 'destructive', title: 'Erro', description: 'Não foi possível criar a reserva.' });
        }
    };

    return (
        <Sheet open={open} onOpenChange={open => !open && onClose()}>
            <SheetContent side="bottom" className="h-[90vh] overflow-y-auto rounded-t-3xl p-0">
                <SheetHeader className="px-6 pt-6 pb-4 border-b border-border/50">
                    <div className="flex items-center justify-between">
                        <SheetTitle className="flex items-center gap-2">
                            <CalendarPlus className="w-5 h-5 text-primary" />
                            Nova Reserva
                        </SheetTitle>
                        <Button variant="ghost" size="icon" onClick={onClose}>
                            <X className="w-4 h-4" />
                        </Button>
                    </div>
                </SheetHeader>

                <form onSubmit={handleSubmit} className="px-6 py-4 space-y-4">
                    {/* Client */}
                    <div className="space-y-2">
                        <Label className="flex items-center gap-2 text-sm font-medium">
                            <User className="w-4 h-4 text-muted-foreground" /> Cliente
                        </Label>
                        {clients.length > 0 ? (
                            <Select value={form.client_id} onValueChange={v => setForm(f => ({ ...f, client_id: v, client_name: '' }))}>
                                <SelectTrigger><SelectValue placeholder="Selecionar cliente..." /></SelectTrigger>
                                <SelectContent>
                                    {clients.map(c => (
                                        <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        ) : (
                            <Input
                                placeholder="Nome do cliente"
                                value={form.client_name}
                                onChange={e => setForm(f => ({ ...f, client_name: e.target.value }))}
                            />
                        )}
                    </div>

                    {/* Service */}
                    <div className="space-y-2">
                        <Label className="text-sm font-medium">Serviço</Label>
                        <Select value={form.service_id} onValueChange={v => setForm(f => ({ ...f, service_id: v }))}>
                            <SelectTrigger><SelectValue placeholder="Selecionar serviço..." /></SelectTrigger>
                            <SelectContent>
                                {services.filter(s => s.is_active).map(s => (
                                    <SelectItem key={s.id} value={s.id}>
                                        {s.name} — {s.duration}min — €{s.price}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    {/* Team Member */}
                    {teamMembers.length > 0 && (
                        <div className="space-y-2">
                            <Label className="text-sm font-medium">Profissional</Label>
                            <Select value={form.team_member_id} onValueChange={v => setForm(f => ({ ...f, team_member_id: v }))}>
                                <SelectTrigger><SelectValue placeholder="Qualquer profissional" /></SelectTrigger>
                                <SelectContent>
                                    {teamMembers.map(m => (
                                        <SelectItem key={m.id} value={m.id}>{m.name}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    )}

                    {/* DateTime */}
                    <div className="space-y-2">
                        <Label className="flex items-center gap-2 text-sm font-medium">
                            <Clock className="w-4 h-4 text-muted-foreground" /> Data e Hora
                        </Label>
                        <Input
                            type="datetime-local"
                            value={form.datetime}
                            onChange={e => setForm(f => ({ ...f, datetime: e.target.value }))}
                            required
                        />
                    </div>

                    {/* Type */}
                    <div className="space-y-2">
                        <Label className="text-sm font-medium">Modalidade</Label>
                        <div className="grid grid-cols-2 gap-2">
                            {(['unit', 'home'] as const).map(type => (
                                <button
                                    key={type}
                                    type="button"
                                    onClick={() => setForm(f => ({ ...f, type }))}
                                    className={`p-3 rounded-xl border text-sm font-medium transition-all ${form.type === type
                                            ? 'border-primary bg-primary/10 text-primary'
                                            : 'border-border text-muted-foreground hover:border-primary/50'
                                        }`}
                                >
                                    {type === 'unit' ? '🏪 No Local' : '🚗 Ao Domicílio'}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Address for home */}
                    {form.type === 'home' && (
                        <div className="space-y-2">
                            <Label className="flex items-center gap-2 text-sm font-medium">
                                <MapPin className="w-4 h-4 text-muted-foreground" /> Morada do Cliente
                            </Label>
                            <Input
                                placeholder="Rua, número, cidade..."
                                value={form.address}
                                onChange={e => setForm(f => ({ ...f, address: e.target.value }))}
                            />
                        </div>
                    )}

                    {/* Notes */}
                    <div className="space-y-2">
                        <Label className="flex items-center gap-2 text-sm font-medium">
                            <StickyNote className="w-4 h-4 text-muted-foreground" /> Observações
                        </Label>
                        <Textarea
                            placeholder="Notas opcionais..."
                            value={form.notes}
                            onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
                            rows={2}
                        />
                    </div>

                    {/* Selected service summary */}
                    {selectedService && (
                        <div className="p-3 rounded-xl bg-primary/5 border border-primary/20">
                            <div className="flex justify-between text-sm">
                                <span className="text-muted-foreground">{selectedService.name}</span>
                                <span className="font-semibold text-primary">€{selectedService.price.toFixed(2)}</span>
                            </div>
                            <div className="text-xs text-muted-foreground mt-1">{selectedService.duration} minutos</div>
                        </div>
                    )}

                    <Button type="submit" className="w-full" disabled={createAppointment.isPending}>
                        {createAppointment.isPending ? 'A criar...' : 'Confirmar Reserva'}
                    </Button>
                </form>
            </SheetContent>
        </Sheet>
    );
}
