import { useState } from 'react';
import { X, Clock, MapPin, User, Calendar, Repeat, Plus, Mail, MoreHorizontal, CreditCard, Banknote, Smartphone, Check, ChevronLeft, Delete } from 'lucide-react';
import { Sheet, SheetContent } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { format, parseISO } from 'date-fns';
import { pt } from 'date-fns/locale';
import { Appointment, useUpdateAppointmentStatus } from '@/hooks/useAppointments';
import { useServices } from '@/hooks/useServices';
import { useTeamMembers } from '@/hooks/useTeamMembers';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

interface AppointmentDetailSheetProps {
  appointment: Appointment;
  onClose: () => void;
}

function Numpad({ value, onChange }: { value: string; onChange: (v: string) => void }) {
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
        <button key={k} onClick={() => handleKey(k)}
          className={cn('h-14 rounded-2xl text-lg font-bold transition-all active:scale-95',
            k === 'del' ? 'bg-muted text-muted-foreground' : 'bg-card border border-border/50 hover:bg-primary/10'
          )}>
          {k === 'del' ? <Delete className="w-5 h-5 mx-auto" /> : k}
        </button>
      ))}
    </div>
  );
}

const PAYMENT_METHODS = [
  { id: 'cash', label: 'Dinheiro', icon: Banknote, color: 'border-emerald-500/50 bg-emerald-500/10 text-emerald-500' },
  { id: 'mbway', label: 'MBWay', icon: Smartphone, color: 'border-sky-500/50 bg-sky-500/10 text-sky-500' },
  { id: 'card', label: 'Cartão', icon: CreditCard, color: 'border-violet-500/50 bg-violet-500/10 text-violet-500' },
];

const STATUS_LABELS: Record<string, { label: string; color: string }> = {
  pending_approval: { label: 'Pendente', color: 'bg-amber-100 text-amber-700' },
  confirmed: { label: 'Confirmado', color: 'bg-sky-100 text-sky-700' },
  completed: { label: 'Concluído', color: 'bg-emerald-100 text-emerald-700' },
  cancelled: { label: 'Cancelado', color: 'bg-red-100 text-red-700' },
  no_show: { label: 'Não compareceu', color: 'bg-muted text-muted-foreground' },
};

export default function AppointmentDetailSheet({ appointment: appt, onClose }: AppointmentDetailSheetProps) {
  const { data: services = [] } = useServices();
  const { data: teamMembers = [] } = useTeamMembers();
  const updateStatus = useUpdateAppointmentStatus();
  const { toast } = useToast();

  const [showCheckout, setShowCheckout] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState('');
  const [cashPaid, setCashPaid] = useState('');
  const [done, setDone] = useState(false);

  const apptServices = services.filter(s => appt.service_ids?.includes(s.id));
  const total = appt.value || apptServices.reduce((acc, s) => acc + s.price, 0);
  const cashPaidNum = parseFloat(cashPaid || '0');
  const change = cashPaid && cashPaidNum >= total ? cashPaidNum - total : null;
  const datetime = parseISO(appt.datetime);
  const status = appt.status as string;
  const statusInfo = STATUS_LABELS[status];
  const teamMember = teamMembers.find(m => m.id === appt.team_member_id);

  const getInitials = (name: string) => name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);

  const suggestions = total > 0 ? [
    Math.ceil(total / 5) * 5,
    Math.ceil(total / 10) * 10,
    Math.ceil(total / 20) * 20,
  ].filter((v, i, a) => a.indexOf(v) === i && v > total) : [];

  const handleStatus = async (s: Appointment['status']) => {
    await updateStatus.mutateAsync({ id: appt.id, status: s });
    toast({ title: 'Estado atualizado!' });
    if (s === 'cancelled') onClose();
  };

  const handleConfirmPayment = async () => {
    await handleStatus('completed');
    setDone(true);
    setTimeout(() => onClose(), 2000);
  };

  return (
    <Sheet open onOpenChange={o => !o && onClose()}>
      <SheetContent side="bottom" className="h-[95vh] rounded-t-3xl p-0 flex flex-col">

        {/* ─── Blue header bar ─── */}
        <div className="bg-sky-500 text-white px-4 pt-5 pb-4 flex items-center justify-between rounded-t-3xl">
          <span className="text-sm font-semibold capitalize">
            {format(datetime, "EEE, d 'de' MMM", { locale: pt })}
          </span>
          <button onClick={onClose} className="w-8 h-8 rounded-full hover:bg-white/20 flex items-center justify-center">
            <X className="w-5 h-5" />
          </button>
        </div>

        {done ? (
          <div className="flex flex-col items-center justify-center flex-1 gap-4">
            <div className="w-20 h-20 rounded-full bg-emerald-500/20 flex items-center justify-center animate-in zoom-in-50 duration-300">
              <Check className="w-10 h-10 text-emerald-500" />
            </div>
            <p className="text-lg font-bold">Pagamento Confirmado!</p>
            <p className="text-muted-foreground text-sm">€{total.toFixed(2)} registado</p>
          </div>
        ) : showCheckout ? (
          /* ─── CHECKOUT FLOW ─── */
          <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
            <div className="flex items-center gap-2 mb-1">
              <button onClick={() => setShowCheckout(false)} className="text-muted-foreground hover:text-foreground">
                <ChevronLeft className="w-5 h-5" />
              </button>
              <p className="text-sm font-semibold uppercase tracking-widest text-muted-foreground">Forma de Pagamento</p>
            </div>

            <div className="grid grid-cols-3 gap-2">
              {PAYMENT_METHODS.map(pm => (
                <button key={pm.id}
                  onClick={() => { setPaymentMethod(pm.id); setCashPaid(''); }}
                  className={cn('p-3 rounded-2xl border-2 flex flex-col items-center gap-1.5 transition-all',
                    paymentMethod === pm.id ? pm.color + ' border-2' : 'border-border/50 bg-card hover:border-primary/40'
                  )}>
                  <pm.icon className="w-6 h-6" />
                  <span className="text-xs font-bold">{pm.label}</span>
                </button>
              ))}
            </div>

            {paymentMethod === 'cash' && (
              <div className="space-y-4">
                <div className="text-center bg-muted rounded-2xl p-4">
                  <p className="text-xs text-muted-foreground uppercase tracking-widest mb-1">Valor Recebido</p>
                  <p className="text-4xl font-black tracking-tight">€{cashPaid || '0'}</p>
                  {change !== null && (
                    <div className="mt-2 flex items-center justify-center gap-2">
                      <span className="text-sm text-muted-foreground">Troco:</span>
                      <span className="text-2xl font-bold text-emerald-500">€{change.toFixed(2)}</span>
                    </div>
                  )}
                </div>
                {suggestions.length > 0 && (
                  <div className="flex gap-2">
                    {suggestions.map(s => (
                      <button key={s} onClick={() => setCashPaid(String(s))}
                        className="flex-1 py-2 rounded-xl bg-muted border border-border/50 text-sm font-bold hover:bg-primary/10 transition-colors">
                        €{s}
                      </button>
                    ))}
                  </div>
                )}
                <Numpad value={cashPaid} onChange={setCashPaid} />
              </div>
            )}

            <Button
              className="w-full h-14 text-base font-bold rounded-2xl"
              disabled={!paymentMethod || (paymentMethod === 'cash' && cashPaidNum < total) || updateStatus.isPending}
              onClick={handleConfirmPayment}
            >
              <Check className="w-5 h-5 mr-2" />
              Confirmar €{total.toFixed(2)}
            </Button>
          </div>
        ) : (
          /* ─── DETAIL VIEW ─── */
          <>
            <div className="flex-1 overflow-y-auto">
              {/* Client card */}
              <div className="px-4 py-4 border-b border-border/30">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-sm font-bold text-primary">
                      {appt.client_name ? getInitials(appt.client_name) : <User className="w-5 h-5 text-muted-foreground" />}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="font-semibold text-sm">{appt.client_name || 'Cliente'}</p>
                        {statusInfo && (
                          <span className={cn('text-[10px] px-1.5 py-0.5 rounded font-semibold', statusInfo.color)}>
                            {statusInfo.label}
                          </span>
                        )}
                      </div>
                      {appt.client_email && <p className="text-xs text-muted-foreground">{appt.client_email}</p>}
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
                  <span className="capitalize">{format(datetime, "EEEE, d 'de' MMMM 'de' yyyy", { locale: pt })}</span>
                </div>
                <div className="flex items-center gap-3 text-sm">
                  <Clock className="w-4 h-4 text-muted-foreground" />
                  <span>{format(datetime, 'HH:mm')} - {appt.duration}min</span>
                </div>
                <div className="flex items-center gap-3 text-sm text-muted-foreground">
                  <Repeat className="w-4 h-4" />
                  <span>Não se repete</span>
                </div>
              </div>

              {/* Services list */}
              <div className="px-4 py-3 border-b border-border/30">
                {apptServices.length > 0 ? apptServices.map(s => (
                  <div key={s.id} className="flex items-center gap-3 py-2">
                    <div className="w-1 h-12 rounded-full bg-sky-400" />
                    <div className="flex-1">
                      <p className="font-medium text-sm">{s.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {format(datetime, 'HH:mm')} · {s.duration}min
                        {teamMember ? ` · ${teamMember.name}` : ''}
                      </p>
                    </div>
                    <span className="text-sm font-semibold">€{s.price.toFixed(2)}</span>
                  </div>
                )) : (
                  <div className="flex items-center gap-3 py-2">
                    <div className="w-1 h-12 rounded-full bg-sky-400" />
                    <div className="flex-1">
                      <p className="font-medium text-sm">Serviço</p>
                      <p className="text-xs text-muted-foreground">{appt.duration}min</p>
                    </div>
                    <span className="text-sm font-semibold">€{total.toFixed(2)}</span>
                  </div>
                )}

                {appt.address && (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground mt-2">
                    <MapPin className="w-4 h-4" />
                    <span>{appt.address}</span>
                  </div>
                )}

                {appt.notes && (
                  <p className="text-sm text-muted-foreground mt-2 italic">{appt.notes}</p>
                )}
              </div>
            </div>

            {/* Sticky footer */}
            <div className="border-t border-border/50 px-4 py-4 bg-background space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Total</span>
                <span className="text-lg font-bold">€{total.toFixed(2)}</span>
              </div>

              {status === 'completed' ? (
                <div className="text-center py-2">
                  <span className="px-4 py-2 bg-emerald-100 text-emerald-700 rounded-full text-sm font-bold">💳 Pago</span>
                </div>
              ) : status === 'cancelled' ? (
                <div className="text-center py-2">
                  <span className="px-4 py-2 bg-red-100 text-red-700 rounded-full text-sm font-bold">Cancelado</span>
                </div>
              ) : (
                <div className="flex gap-2">
                  {status === 'pending_approval' && (
                    <>
                      <Button variant="outline" className="flex-1 border-destructive/50 text-destructive" onClick={() => handleStatus('cancelled')}>
                        Rejeitar
                      </Button>
                      <Button className="flex-1 bg-emerald-600 hover:bg-emerald-700" onClick={() => handleStatus('confirmed')}>
                        Confirmar
                      </Button>
                    </>
                  )}
                  {(status === 'confirmed' || status === 'arrived') && (
                    <>
                      <Button variant="outline" className="flex-1 border-destructive/50 text-destructive" onClick={() => handleStatus('cancelled')}>
                        Cancelar
                      </Button>
                      <Button className="flex-1" onClick={() => setShowCheckout(true)}>
                        <CreditCard className="w-4 h-4 mr-2" /> Pagar agora
                      </Button>
                    </>
                  )}
                </div>
              )}
            </div>
          </>
        )}
      </SheetContent>
    </Sheet>
  );
}
