import { useState, useEffect, useMemo } from 'react';
import { X, Search, Plus, UserRound, Calendar, Clock, Repeat, ChevronDown, Mail, MoreHorizontal } from 'lucide-react';
import { Sheet, SheetContent } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useServices } from '@/hooks/useServices';
import { useClients } from '@/hooks/useClients';
import { useTeamMembers } from '@/hooks/useTeamMembers';
import { useCreateAppointment } from '@/hooks/useAppointments';
import { useToast } from '@/hooks/use-toast';
import { format, parseISO } from 'date-fns';
import { pt } from 'date-fns/locale';
import { cn } from '@/lib/utils';

interface NewAppointmentSheetProps {
  open: boolean;
  onClose: () => void;
  prefillDate?: string;
  prefillTime?: string;
  prefillTeamMemberId?: string;
}

type Step = 'client' | 'service' | 'detail';

interface SelectedService {
  id: string;
  name: string;
  duration: number;
  price: number;
}

export default function NewAppointmentSheet({ open, onClose, prefillDate, prefillTime, prefillTeamMemberId }: NewAppointmentSheetProps) {
  const { data: services = [] } = useServices();
  const { data: clients = [] } = useClients();
  const { data: teamMembers = [] } = useTeamMembers();
  const createAppointment = useCreateAppointment();
  const { toast } = useToast();

  const [step, setStep] = useState<Step>('client');
  const [clientSearch, setClientSearch] = useState('');
  const [serviceSearch, setServiceSearch] = useState('');

  const [selectedClient, setSelectedClient] = useState<{ id: string; name: string; email?: string | null } | null>(null);
  const [selectedServices, setSelectedServices] = useState<SelectedService[]>([]);
  const [selectedTeamMemberId, setSelectedTeamMemberId] = useState(prefillTeamMemberId || '');

  const datetime = prefillTime || (prefillDate ? `${prefillDate}T10:00` : '');

  useEffect(() => {
    if (open) {
      setStep('client');
      setSelectedClient(null);
      setSelectedServices([]);
      setClientSearch('');
      setServiceSearch('');
      setSelectedTeamMemberId(prefillTeamMemberId || '');
    }
  }, [open, prefillTeamMemberId]);

  const filteredClients = useMemo(() => {
    if (!clientSearch) return clients;
    const q = clientSearch.toLowerCase();
    return clients.filter(c => c.name.toLowerCase().includes(q) || c.email?.toLowerCase().includes(q));
  }, [clients, clientSearch]);

  const activeServices = useMemo(() => {
    const active = services.filter(s => s.is_active);
    if (!serviceSearch) return active;
    const q = serviceSearch.toLowerCase();
    return active.filter(s => s.name.toLowerCase().includes(q));
  }, [services, serviceSearch]);

  const teamMember = teamMembers.find(m => m.id === selectedTeamMemberId);

  const parsedDatetime = datetime ? parseISO(datetime) : new Date();

  const totalPrice = selectedServices.reduce((sum, s) => sum + s.price, 0);
  const totalDuration = selectedServices.reduce((sum, s) => sum + s.duration, 0);

  const handleAddService = (s: { id: string; name: string; duration: number; price: number }) => {
    setSelectedServices(prev => {
      if (prev.some(existing => existing.id === s.id)) return prev;
      return [...prev, s];
    });
    setServiceSearch('');
    setStep('detail');
  };

  const handleRemoveService = (serviceId: string) => {
    setSelectedServices(prev => prev.filter(s => s.id !== serviceId));
  };

  const handleSubmit = async () => {
    try {
      await createAppointment.mutateAsync({
        client_id: selectedClient?.id || null,
        client_name: selectedClient?.name || 'Sem reserva',
        client_phone: null,
        service_ids: selectedServices.map(s => s.id),
        team_member_id: selectedTeamMemberId || null,
        datetime,
        duration: totalDuration || 60,
        value: totalPrice,
        type: 'unit',
        address: null,
        notes: null,
        status: 'confirmed',
      });
      toast({ title: 'Reserva criada!', description: 'Agendamento adicionado com sucesso.' });
      onClose();
    } catch {
      toast({ variant: 'destructive', title: 'Erro', description: 'Não foi possível criar a reserva.' });
    }
  };

  const getInitials = (name: string) => name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);

  return (
    <Sheet open={open} onOpenChange={o => !o && onClose()}>
      <SheetContent side="bottom" className="h-[95vh] rounded-t-3xl p-0 flex flex-col">

        {/* ═══ STEP 1: SELECT CLIENT ═══ */}
        {step === 'client' && (
          <div className="flex flex-col h-full">
            <div className="flex items-center justify-between px-4 pt-5 pb-3">
              <h2 className="text-lg font-bold">Selecionar cliente</h2>
              <button onClick={onClose} className="w-8 h-8 rounded-full hover:bg-muted flex items-center justify-center">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="px-4 pb-3">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Pesquisar cliente..."
                  value={clientSearch}
                  onChange={e => setClientSearch(e.target.value)}
                  className="pl-9 rounded-xl bg-muted/50 border-0"
                />
              </div>
            </div>

            <div className="flex-1 overflow-y-auto">
              <button
                onClick={() => { setSelectedClient(null); setStep('service'); }}
                className="w-full flex items-center gap-3 px-4 py-3.5 hover:bg-muted/50 transition-colors border-b border-border/30"
              >
                <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center">
                  <UserRound className="w-5 h-5 text-muted-foreground" />
                </div>
                <span className="font-medium">Sem reserva (walk-in)</span>
              </button>

              {filteredClients.map(c => (
                <button
                  key={c.id}
                  onClick={() => { setSelectedClient({ id: c.id, name: c.name, email: c.email }); setStep('service'); }}
                  className="w-full flex items-center gap-3 px-4 py-3.5 hover:bg-muted/50 transition-colors border-b border-border/30"
                >
                  <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-sm font-bold text-primary">
                    {getInitials(c.name)}
                  </div>
                  <div className="text-left">
                    <p className="font-medium text-sm">{c.name}</p>
                    {c.email && <p className="text-xs text-muted-foreground">{c.email}</p>}
                  </div>
                </button>
              ))}

              {filteredClients.length === 0 && clientSearch && (
                <p className="text-sm text-muted-foreground text-center py-8">Nenhum cliente encontrado</p>
              )}
            </div>
          </div>
        )}

        {/* ═══ STEP 2: SELECT SERVICE ═══ */}
        {step === 'service' && (
          <div className="flex flex-col h-full">
            <div className="flex items-center gap-3 px-4 pt-5 pb-3">
              <button onClick={() => selectedServices.length > 0 ? setStep('detail') : setStep('client')} className="w-8 h-8 rounded-full hover:bg-muted flex items-center justify-center">
                <X className="w-5 h-5" />
              </button>
              <h2 className="text-lg font-bold">Selecionar serviço</h2>
            </div>

            <div className="px-4 pb-3">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar serviço por nome..."
                  value={serviceSearch}
                  onChange={e => setServiceSearch(e.target.value)}
                  className="pl-9 rounded-xl bg-muted/50 border-0"
                />
              </div>
            </div>

            <div className="flex-1 overflow-y-auto">
              {activeServices.map(s => {
                const isSelected = selectedServices.some(sel => sel.id === s.id);
                return (
                  <button
                    key={s.id}
                    onClick={() => handleAddService({ id: s.id, name: s.name, duration: s.duration, price: s.price })}
                    className={cn(
                      "w-full flex items-center justify-between px-4 py-3.5 hover:bg-muted/50 transition-colors border-b border-border/30",
                      isSelected && "bg-primary/5"
                    )}
                  >
                    <div className="flex items-center gap-3">
                      <div className={cn("w-1 h-10 rounded-full", isSelected ? "bg-emerald-500" : "bg-sky-400")} />
                      <div className="text-left">
                        <p className="font-medium text-sm">{s.name}</p>
                        <p className="text-xs text-muted-foreground">{s.duration}min</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {isSelected && <span className="text-xs text-emerald-600 font-semibold">✓</span>}
                      <span className="text-sm font-semibold">€{s.price.toFixed(2)}</span>
                    </div>
                  </button>
                );
              })}

              {activeServices.length === 0 && (
                <p className="text-sm text-muted-foreground text-center py-8">Nenhum serviço encontrado</p>
              )}
            </div>
          </div>
        )}

        {/* ═══ STEP 3: APPOINTMENT DETAIL ═══ */}
        {step === 'detail' && (
          <div className="flex flex-col h-full">
            <div className="bg-sky-500 text-white px-4 pt-5 pb-4 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-sm font-semibold capitalize">
                  {format(parsedDatetime, "EEE, d 'de' MMM", { locale: pt })}
                </span>
                <ChevronDown className="w-4 h-4" />
              </div>
              <button onClick={onClose} className="w-8 h-8 rounded-full hover:bg-white/20 flex items-center justify-center">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto">
              {/* Client card */}
              <div className="px-4 py-4 border-b border-border/30">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-sm font-bold text-primary">
                      {selectedClient ? getInitials(selectedClient.name) : <UserRound className="w-5 h-5 text-muted-foreground" />}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="font-semibold text-sm">{selectedClient?.name || 'Sem reserva'}</p>
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-sky-100 text-sky-600 font-semibold">Novo</span>
                      </div>
                      {selectedClient?.email && <p className="text-xs text-muted-foreground">{selectedClient.email}</p>}
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    <button className="w-8 h-8 rounded-full hover:bg-muted flex items-center justify-center">
                      <Mail className="w-4 h-4 text-muted-foreground" />
                    </button>
                    <button className="w-8 h-8 rounded-full hover:bg-muted flex items-center justify-center">
                      <MoreHorizontal className="w-4 h-4 text-muted-foreground" />
                    </button>
                  </div>
                </div>
              </div>

              {/* Date/Time info */}
              <div className="px-4 py-3 space-y-2.5 border-b border-border/30">
                <div className="flex items-center gap-3 text-sm">
                  <Calendar className="w-4 h-4 text-muted-foreground" />
                  <span className="capitalize">{format(parsedDatetime, "EEEE, d 'de' MMMM 'de' yyyy", { locale: pt })}</span>
                </div>
                <div className="flex items-center gap-3 text-sm">
                  <Clock className="w-4 h-4 text-muted-foreground" />
                  <span>{format(parsedDatetime, 'HH:mm')} - {totalDuration || 60}min</span>
                </div>
                <div className="flex items-center gap-3 text-sm text-muted-foreground">
                  <Repeat className="w-4 h-4" />
                  <span>Não se repete</span>
                </div>
              </div>

              {/* Services list */}
              <div className="px-4 py-3 border-b border-border/30">
                {selectedServices.map(s => (
                  <div key={s.id} className="flex items-center gap-3 py-2">
                    <div className="w-1 h-12 rounded-full bg-sky-400" />
                    <div className="flex-1">
                      <p className="font-medium text-sm">{s.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {format(parsedDatetime, 'HH:mm')} · {s.duration}min
                        {teamMember ? ` · ${teamMember.name}` : ''}
                      </p>
                    </div>
                    <span className="text-sm font-semibold">€{s.price.toFixed(2)}</span>
                    <button
                      onClick={() => handleRemoveService(s.id)}
                      className="w-6 h-6 rounded-full hover:bg-destructive/10 flex items-center justify-center text-muted-foreground hover:text-destructive transition-colors"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}

                <button
                  onClick={() => setStep('service')}
                  className="flex items-center gap-2 text-sm text-primary font-medium mt-2 py-2"
                >
                  <Plus className="w-4 h-4" />
                  Adicionar serviço
                </button>
              </div>
            </div>

            {/* Sticky footer */}
            <div className="border-t border-border/50 px-4 py-4 bg-background space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Total</span>
                <span className="text-lg font-bold">€{totalPrice.toFixed(2)}</span>
              </div>
              <Button
                className="w-full h-12 rounded-xl font-semibold text-base"
                disabled={createAppointment.isPending}
                onClick={handleSubmit}
              >
                {createAppointment.isPending ? 'A criar...' : 'Salvar'}
              </Button>
            </div>
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}
