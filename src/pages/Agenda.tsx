import { useState } from 'react';
import { format, addDays, subDays, parseISO, startOfWeek, isSameDay } from 'date-fns';
import { pt } from 'date-fns/locale';
import { ChevronLeft, ChevronRight, MapPin, Plus, Clock } from 'lucide-react';
import { useAppointments, Appointment } from '@/hooks/useAppointments';
import { useServices } from '@/hooks/useServices';
import { useTeamMembers } from '@/hooks/useTeamMembers';
import NewAppointmentSheet from '@/components/NewAppointmentSheet';
import AppointmentDetailSheet from '@/components/AppointmentDetailSheet';
import { cn } from '@/lib/utils';

const STATUS_STYLES: Record<Appointment['status'], string> = {
  pending_approval: 'bg-yellow-500/20 border-yellow-500/50 text-yellow-300',
  confirmed: 'bg-blue-500/20 border-blue-500/50 text-blue-300',
  completed: 'bg-muted/60 border-border text-muted-foreground',
  cancelled: 'bg-red-500/10 border-red-500/30 text-red-400',
  no_show: 'bg-orange-500/10 border-orange-500/30 text-orange-400',
};

const STATUS_LABELS: Record<Appointment['status'], string> = {
  pending_approval: 'Pendente',
  confirmed: 'Confirmado',
  completed: 'Concluído',
  cancelled: 'Cancelado',
  no_show: 'Faltou',
};

// Horizontal day strip for week navigation
function WeekStrip({ selected, onChange }: { selected: Date; onChange: (d: Date) => void }) {
  const startDay = startOfWeek(selected, { weekStartsOn: 1 });

  return (
    <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
      {Array.from({ length: 7 }).map((_, i) => {
        const day = addDays(startDay, i);
        const isToday = isSameDay(day, new Date());
        const isSelected = isSameDay(day, selected);
        return (
          <button
            key={i}
            onClick={() => onChange(day)}
            className={cn(
              'flex flex-col items-center gap-0.5 px-3 py-2 rounded-xl transition-all min-w-[48px]',
              isSelected ? 'bg-primary text-primary-foreground' : isToday ? 'border border-primary/50 text-primary' : 'text-muted-foreground hover:bg-muted'
            )}
          >
            <span className="text-[10px] font-medium uppercase">{format(day, 'EEE', { locale: pt })}</span>
            <span className="text-lg font-bold leading-none">{format(day, 'd')}</span>
          </button>
        );
      })}
    </div>
  );
}

// Appointment Card
function AppointmentCard({ appt, onClick }: { appt: Appointment; onClick: () => void }) {
  const time = format(parseISO(appt.datetime), 'HH:mm');
  const isHome = appt.type === 'home';
  const isPaid = appt.status === 'completed';

  return (
    <button
      onClick={onClick}
      className={cn(
        'w-full text-left p-3 rounded-xl border transition-all hover:scale-[1.01] active:scale-[0.99]',
        STATUS_STYLES[appt.status]
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5 mb-0.5">
            <Clock className="w-3 h-3 shrink-0" />
            <span className="text-xs font-mono">{time}</span>
            {isHome && <MapPin className="w-3 h-3 text-orange-400 shrink-0" />}
          </div>
          <p className="font-semibold text-sm truncate">{appt.client_name || 'Cliente'}</p>
          {appt.address && <p className="text-xs opacity-70 truncate">{appt.address}</p>}
        </div>
        <div className="flex flex-col items-end gap-1 shrink-0">
          {appt.value! > 0 && (
            <span className="text-xs font-bold">€{appt.value!.toFixed(2)}</span>
          )}
          {isPaid && (
            <span className="px-1.5 py-0.5 text-[9px] font-bold bg-black/60 text-white rounded uppercase tracking-wider">Pago</span>
          )}
          <span className={cn(
            'text-[10px] px-1.5 py-0.5 rounded uppercase tracking-wide font-medium',
          )}>
            {STATUS_LABELS[appt.status]}
          </span>
        </div>
      </div>
    </button>
  );
}

export default function Agenda() {
  const [selected, setSelected] = useState(new Date());
  const [newOpen, setNewOpen] = useState(false);
  const [detailAppt, setDetailAppt] = useState<Appointment | null>(null);

  const dateStr = format(selected, 'yyyy-MM-dd');
  const { data: appointments = [], isLoading } = useAppointments(dateStr);

  const sorted = [...appointments].sort(
    (a, b) => new Date(a.datetime).getTime() - new Date(b.datetime).getTime()
  );

  return (
    <div className="flex flex-col h-[calc(100vh-56px)]">
      {/* Header */}
      <div className="px-4 pt-4 pb-3 border-b border-border/50 bg-background/80 backdrop-blur-md sticky top-0 z-10 space-y-3">
        {/* Month + nav */}
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs text-muted-foreground">{format(selected, 'MMMM yyyy', { locale: pt })}</p>
          </div>
          <div className="flex items-center gap-1">
            <button
              onClick={() => setSelected(d => subDays(d, 7))}
              className="w-8 h-8 rounded-full hover:bg-muted flex items-center justify-center transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              onClick={() => setSelected(new Date())}
              className="px-3 h-8 rounded-full hover:bg-muted text-xs font-medium transition-colors"
            >
              Hoje
            </button>
            <button
              onClick={() => setSelected(d => addDays(d, 7))}
              className="w-8 h-8 rounded-full hover:bg-muted flex items-center justify-center transition-colors"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
        <WeekStrip selected={selected} onChange={setSelected} />
      </div>

      {/* Appointments */}
      <div className="flex-1 overflow-y-auto px-4 py-4">
        {isLoading ? (
          <div className="space-y-3">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-20 rounded-xl bg-muted/40 animate-pulse" />
            ))}
          </div>
        ) : sorted.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-48 text-center gap-3">
            <div className="w-14 h-14 rounded-2xl bg-muted flex items-center justify-center">
              <Plus className="w-7 h-7 text-muted-foreground" />
            </div>
            <div>
              <p className="font-semibold">Sem agendamentos</p>
              <p className="text-sm text-muted-foreground">Toque no botão + para criar uma reserva</p>
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            <p className="text-xs text-muted-foreground font-medium">
              {sorted.length} agendamento{sorted.length !== 1 ? 's' : ''}
            </p>
            {sorted.map(appt => (
              <AppointmentCard key={appt.id} appt={appt} onClick={() => setDetailAppt(appt)} />
            ))}
          </div>
        )}
      </div>

      <NewAppointmentSheet
        open={newOpen}
        onClose={() => setNewOpen(false)}
        prefillDate={dateStr}
      />

      {detailAppt && (
        <AppointmentDetailSheet
          appointment={detailAppt}
          onClose={() => setDetailAppt(null)}
        />
      )}
    </div>
  );
}
