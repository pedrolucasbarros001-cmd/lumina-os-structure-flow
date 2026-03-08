import { useState } from 'react';
import { format, parseISO } from 'date-fns';
import { pt } from 'date-fns/locale';
import { Clock, MapPin, Filter, Check, X, AlertCircle } from 'lucide-react';
import { useAppointments, Appointment, useUpdateAppointmentStatus } from '@/hooks/useAppointments';
import AppointmentDetailSheet from '@/components/AppointmentDetailSheet';
import { cn } from '@/lib/utils';

const FILTERS = [
  { id: 'all', label: 'Todos' },
  { id: 'pending_approval', label: 'Pendentes' },
  { id: 'confirmed', label: 'Confirmados' },
  { id: 'completed', label: 'Concluídos' },
  { id: 'cancelled', label: 'Cancelados' },
] as const;

const STATUS_STYLES: Record<Appointment['status'], string> = {
  pending_approval: 'bg-yellow-500/20 border-yellow-500/40',
  confirmed: 'bg-blue-500/20 border-blue-500/40',
  en_route: 'bg-amber-500/20 border-amber-500/40',
  arrived: 'bg-emerald-500/20 border-emerald-500/40',
  completed: 'bg-muted/40 border-border/50',
  cancelled: 'bg-red-500/10 border-red-500/20',
  no_show: 'bg-orange-500/10 border-orange-500/20',
};

const STATUS_DOT: Record<Appointment['status'], string> = {
  pending_approval: 'bg-yellow-400',
  confirmed: 'bg-blue-400',
  en_route: 'bg-amber-400',
  arrived: 'bg-emerald-400',
  completed: 'bg-emerald-400',
  cancelled: 'bg-red-400',
  no_show: 'bg-orange-400',
};

const STATUS_LABELS: Record<Appointment['status'], string> = {
  pending_approval: 'Pendente',
  confirmed: 'Confirmado',
  en_route: 'A caminho',
  arrived: 'No local',
  completed: 'Concluído',
  cancelled: 'Cancelado',
  no_show: 'Faltou',
};

export default function Appointments() {
  const { data: appointments = [], isLoading } = useAppointments();
  const [filter, setFilter] = useState<'all' | Appointment['status']>('all');
  const [detail, setDetail] = useState<Appointment | null>(null);

  const filtered = filter === 'all' ? appointments : appointments.filter(a => a.status === filter);
  const sorted = [...filtered].sort((a, b) => new Date(b.datetime).getTime() - new Date(a.datetime).getTime());

  return (
    <div className="flex flex-col h-[calc(100vh-56px)]">
      {/* Filter chips */}
      <div className="sticky top-0 z-10 bg-background/80 backdrop-blur-md border-b border-border/50 px-4 py-3">
        <div className="flex gap-2 overflow-x-auto scrollbar-none">
          {FILTERS.map(f => (
            <button
              key={f.id}
              onClick={() => setFilter(f.id as any)}
              className={cn(
                'px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-all',
                filter === f.id
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-muted text-muted-foreground hover:bg-muted/80'
              )}
            >
              {f.label}
            </button>
          ))}
        </div>
        <p className="text-xs text-muted-foreground mt-2">{sorted.length} atendimento{sorted.length !== 1 ? 's' : ''}</p>
      </div>

      {/* List */}
      <div className="flex-1 overflow-y-auto px-4 py-3 space-y-2">
        {isLoading ? (
          [1, 2, 3, 4].map(i => <div key={i} className="h-20 rounded-xl bg-muted/40 animate-pulse" />)
        ) : sorted.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-48 gap-3 text-center">
            <AlertCircle className="w-12 h-12 text-muted-foreground/40" />
            <p className="text-sm text-muted-foreground">Sem atendimentos nesta categoria</p>
          </div>
        ) : (
          sorted.map(appt => (
            <button
              key={appt.id}
              onClick={() => setDetail(appt)}
              className={cn(
                'w-full text-left p-4 rounded-xl border transition-all hover:scale-[1.01] active:scale-[0.99]',
                STATUS_STYLES[appt.status]
              )}
            >
              <div className="flex items-start gap-3">
                <div className={cn('w-2 h-2 rounded-full mt-1.5 shrink-0', STATUS_DOT[appt.status])} />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <p className="font-semibold truncate">{appt.client_name || 'Cliente'}</p>
                    {appt.value! > 0 && <span className="text-sm font-bold shrink-0">€{appt.value!.toFixed(2)}</span>}
                  </div>
                  <div className="flex items-center gap-3 text-xs text-muted-foreground mt-1">
                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {format(parseISO(appt.datetime), "dd/MM 'às' HH:mm", { locale: pt })}
                    </span>
                    {appt.type === 'home' && (
                      <span className="flex items-center gap-0.5 text-orange-400">
                        <MapPin className="w-3 h-3" />Domicílio
                      </span>
                    )}
                    <span className="ml-auto text-xs px-1.5 py-0.5 rounded font-medium bg-black/20">
                      {STATUS_LABELS[appt.status]}
                    </span>
                  </div>
                </div>
              </div>
            </button>
          ))
        )}
      </div>

      {detail && (
        <AppointmentDetailSheet appointment={detail} onClose={() => setDetail(null)} />
      )}
    </div>
  );
}
