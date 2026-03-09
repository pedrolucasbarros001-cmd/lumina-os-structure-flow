import { useState, useRef, useEffect, useCallback } from 'react';
import { format, parseISO, addMinutes } from 'date-fns';
import { pt } from 'date-fns/locale';
import { ChevronLeft, ChevronRight, Plus } from 'lucide-react';
import { useAppointments, Appointment, useCreateAppointment } from '@/hooks/useAppointments';
import { useRescheduleAppointment } from '@/hooks/useRescheduleAppointment';
import { useTeamMembers } from '@/hooks/useTeamMembers';
import { useServices } from '@/hooks/useServices';
import AppointmentDetailSheet from '@/components/AppointmentDetailSheet';
import NewAppointmentFlow from '@/components/NewAppointmentFlow';
import AgendaTutorialOverlay, { useAgendaTutorial } from '@/components/AgendaTutorialOverlay';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

// ─────────────────────────────────────────
// CONSTANTS
// ─────────────────────────────────────────
const HOUR_HEIGHT = 64; // px per hour
const PX_PER_MIN = HOUR_HEIGHT / 60;
const HOURS = Array.from({ length: 24 }, (_, i) => i); // 0-23
const COL_WIDTH = 150; // px per team member column
const TIME_AXIS_W = 52; // px for left time axis

const STATUS_STYLES: Record<string, { bg: string, text: string }> = {
  pending_approval: { bg: '#fcd34d', text: '#451a03' }, // amber-300
  confirmed: { bg: '#38bdf8', text: '#082f49' }, // sky-400 (matches screenshot cyan)
  in_transit: { bg: '#fcd34d', text: '#451a03' }, // amber-300
  arrived: { bg: '#34d399', text: '#064e3b' }, // emerald-400
  completed: { bg: '#94a3b8', text: '#0f172a' }, // slate-400
  cancelled: { bg: '#f87171', text: '#450a0a' }, // red-400
};

function topForTime(datetime: string) {
  const d = parseISO(datetime);
  return (d.getHours() * 60 + d.getMinutes()) * PX_PER_MIN;
}

function heightForDuration(minutes: number) {
  return Math.max(minutes * PX_PER_MIN, HOUR_HEIGHT * 0.6);
}

// ─────────────────────────────────────────
// APPOINTMENT BLOCK
// ─────────────────────────────────────────
function ApptBlock({
  appt, services, onClick, onDragStart,
}: {
  appt: Appointment;
  services: ReturnType<typeof useServices>['data'];
  onClick: () => void;
  onDragStart: (e: React.TouchEvent | React.MouseEvent, appt: Appointment) => void;
}) {
  const top = topForTime(appt.datetime);
  const durationMin = (appt as any).duration_minutes || 60;
  const height = heightForDuration(durationMin);
  const svc = (services || []).find(s => appt.service_ids?.includes(s.id));
  const startStr = format(parseISO(appt.datetime), 'HH:mm');
  const endStr = format(addMinutes(parseISO(appt.datetime), durationMin), 'HH:mm');
  const style = STATUS_STYLES[appt.status] || STATUS_STYLES['confirmed'];

  let touchTimer = useRef<ReturnType<typeof setTimeout>>();

  const handleTouchStart = (e: React.TouchEvent) => {
    touchTimer.current = setTimeout(() => {
      onDragStart(e, appt);
    }, 500);
  };
  const handleTouchEnd = () => { clearTimeout(touchTimer.current); };

  return (
    <div
      style={{ top, height, left: 4, right: 4, position: 'absolute', backgroundColor: style.bg, borderRadius: 8 }}
      className="cursor-pointer p-1.5 overflow-hidden select-none active:scale-[0.98] transition-transform shadow-sm"
      onClick={onClick}
      onMouseDown={(e) => onDragStart(e, appt)}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      <p className="text-[10px] font-semibold leading-tight flex items-center gap-1" style={{ color: style.text }}>
        {startStr} – {endStr} {appt.client_name}
      </p>
      {svc && <p className="text-[10px] truncate" style={{ color: style.text, opacity: 0.85 }}>{svc.name}</p>}
      {(appt as any).type === 'home' && <p className="text-[9px] mt-0.5 font-bold" style={{ color: style.text }}>🏠 Domicílio</p>}
    </div>
  );
}

// ─────────────────────────────────────────
// MAIN AGENDA PAGE
// ─────────────────────────────────────────
export default function Agenda() {
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [detailAppt, setDetailAppt] = useState<Appointment | null>(null);
  const [newApptOpen, setNewApptOpen] = useState(false);
  const [newApptTime, setNewApptTime] = useState<{ hour: number; teamMemberId?: string } | null>(null);
  const [rescheduleModal, setRescheduleModal] = useState<{ appt: Appointment; newTime: Date; newTeamMemberId?: string } | null>(null);
  const { show: showTutorial, dismiss: dismissTutorial } = useAgendaTutorial();
  const { toast } = useToast();
  const reschedule = useRescheduleAppointment();

  const dateStr = format(selectedDate, 'yyyy-MM-dd');
  const { data: appointments = [] } = useAppointments(dateStr);
  const { data: team = [] } = useTeamMembers();
  const { data: services = [] } = useServices();

  // Time = pixel position from 8am by default, auto-scroll to current time
  const gridRef = useRef<HTMLDivElement>(null);
  const now = new Date();
  const nowTop = (now.getHours() * 60 + now.getMinutes()) * PX_PER_MIN;

  useEffect(() => {
    if (gridRef.current) {
      const scrollTo = Math.max(0, nowTop - 100);
      gridRef.current.scrollTop = scrollTo;
    }
  }, []);

  // Long-press to create on time axis
  const longPressTimer = useRef<ReturnType<typeof setTimeout>>();
  const handleTimeAxisPress = (hour: number) => {
    longPressTimer.current = setTimeout(() => {
      setNewApptTime({ hour });
      setNewApptOpen(true);
    }, 500);
  };

  // Drag-to-reschedule (simplified — tracks touch position)
  const dragAppt = useRef<Appointment | null>(null);
  const [dragging, setDragging] = useState(false);
  const [dragX, setDragX] = useState(0);
  const [dragY, setDragY] = useState(0);

  const handleDragStart = useCallback((e: React.TouchEvent | React.MouseEvent, appt: Appointment) => {
    dragAppt.current = appt;
    setDragging(true);
  }, []);

  const handleDragMove = useCallback((e: React.TouchEvent | React.MouseEvent) => {
    if (!dragging || !dragAppt.current) return;
    const clientX = 'touches' in e ? e.touches[0].clientX : (e as React.MouseEvent).clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : (e as React.MouseEvent).clientY;
    setDragX(clientX);
    setDragY(clientY);
  }, [dragging]);

  const handleDragEnd = useCallback(() => {
    if (!dragging || !dragAppt.current || !gridRef.current) { setDragging(false); return; }
    const rect = gridRef.current.getBoundingClientRect();
    const relY = dragY - rect.top + gridRef.current.scrollTop;
    const relX = dragX - rect.left + gridRef.current.scrollLeft - TIME_AXIS_W;

    // Calculate new time (15 min increments)
    const minutes = Math.round(relY / PX_PER_MIN / 15) * 15;
    const newTime = new Date(selectedDate);
    newTime.setHours(Math.floor(minutes / 60), minutes % 60, 0, 0);

    // Calculate new team member
    const colIdx = Math.max(0, Math.floor(relX / COL_WIDTH));
    const newMemberId = columns[colIdx]?.id !== '__solo' ? columns[colIdx]?.id : null;

    setRescheduleModal({
      appt: dragAppt.current,
      newTime,
      newTeamMemberId: newMemberId || undefined
    });
    dragAppt.current = null;
    setDragging(false);
  }, [dragging, dragY, dragX, selectedDate, columns]);

  const confirmReschedule = async () => {
    if (!rescheduleModal) return;
    await reschedule.mutateAsync({
      id: rescheduleModal.appt.id,
      datetime: rescheduleModal.newTime.toISOString(),
      team_member_id: rescheduleModal.newTeamMemberId || (rescheduleModal.appt as any).team_member_id
    } as any);
    toast({ title: '✅ Agendamento atualizado!' });
    setRescheduleModal(null);
  };

  // Columns: each team member
  const columns = team.length > 0 ? team : [{ id: '__solo', name: 'Eu', avatar_url: null }];

  return (
    <div className="flex flex-col h-screen overflow-hidden bg-background">
      {showTutorial && <AgendaTutorialOverlay onFinish={dismissTutorial} />}

      {/* ── TOP HEADER ── */}
      <div className="shrink-0 border-b border-border/50 bg-background/90 backdrop-blur-md z-20">
        {/* Date navigation */}
        <div className="flex items-center justify-between px-3 py-2">
          <button onClick={() => setSelectedDate(d => { const n = new Date(d); n.setDate(n.getDate() - 1); return n; })}
            className="p-2 rounded-full hover:bg-muted transition-colors">
            <ChevronLeft className="w-5 h-5" />
          </button>
          <button className="flex items-center gap-2 text-sm font-semibold">
            {format(selectedDate, "EEEE d 'de' MMM", { locale: pt })}
            <ChevronRight className="w-4 h-4 text-muted-foreground rotate-90" />
          </button>
          <button onClick={() => setSelectedDate(d => { const n = new Date(d); n.setDate(n.getDate() + 1); return n; })}
            className="p-2 rounded-full hover:bg-muted transition-colors">
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>

        {/* Team member columns header */}
        <div className="flex flex-1" style={{ paddingLeft: TIME_AXIS_W }}>
          {columns.map(m => (
            <div key={m.id} className="flex-1 min-w-[150px] shrink-0 flex flex-col items-center gap-1 py-2 border-r border-border/30 last:border-r-0">
              <div className="w-9 h-9 rounded-full bg-primary/20 flex items-center justify-center text-sm font-bold text-primary">
                {(m.name || '?')[0].toUpperCase()}
              </div>
              <span className="text-[11px] text-muted-foreground truncate max-w-full px-1">{m.name}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Reschedule banner */}
      {rescheduleModal && (
        <div className="shrink-0 bg-primary/10 border-b border-primary/30 px-4 py-2 flex items-center justify-between z-30">
          <span className="text-sm font-medium">
            Remarcar para {format(rescheduleModal.newTime, "HH:mm 'de' d MMM", { locale: pt })}
          </span>
          <button onClick={() => setRescheduleModal(null)} className="text-muted-foreground hover:text-foreground">✕</button>
        </div>
      )}

      {/* ── GRID BODY ── */}
      <div
        ref={gridRef}
        className="flex-1 overflow-y-auto overflow-x-auto relative"
        onMouseMove={handleDragMove}
        onTouchMove={handleDragMove}
        onMouseUp={handleDragEnd}
        onTouchEnd={handleDragEnd}
      >
        <div style={{ position: 'relative', height: HOUR_HEIGHT * 24, display: 'flex', minWidth: '100%' }}>
          {/* Time axis */}
          <div className="shrink-0 sticky left-0 z-10 bg-background" style={{ width: TIME_AXIS_W }}>
            {HOURS.map(h => (
              <div key={h}
                style={{ height: HOUR_HEIGHT, position: 'relative' }}
                onMouseDown={() => handleTimeAxisPress(h)}
                onTouchStart={() => handleTimeAxisPress(h)}
                onMouseUp={() => clearTimeout(longPressTimer.current)}
                onTouchEnd={() => clearTimeout(longPressTimer.current)}
              >
                <span className={cn(
                  'absolute -top-2.5 right-2 text-[10px] font-mono',
                  h === now.getHours() && format(selectedDate, 'yyyy-MM-dd') === format(now, 'yyyy-MM-dd')
                    ? 'text-red-400 font-bold' : 'text-muted-foreground'
                )}>
                  {String(h).padStart(2, '0')}:00
                </span>
              </div>
            ))}
            {/* Current time indicator */}
            {format(selectedDate, 'yyyy-MM-dd') === format(now, 'yyyy-MM-dd') && (
              <div style={{ position: 'absolute', top: nowTop, left: 0, right: 0, zIndex: 20 }}>
                <div className="flex items-center">
                  <span className="bg-red-500 text-white text-[9px] font-bold px-1 rounded-sm mr-0.5">
                    {format(now, 'HH:mm')}
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* Team columns */}
          {columns.map(member => {
            const colAppts = appointments.filter(a => (a as any).team_member_id === member.id || team.length === 0);
            return (
              <div key={member.id}
                className="flex-1 min-w-[150px] shrink-0 border-l border-border/30 relative"
                onMouseDown={(e) => {
                  const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
                  const relY = e.clientY - rect.top + (gridRef.current?.scrollTop || 0);
                  const hour = Math.floor(relY / HOUR_HEIGHT);
                  longPressTimer.current = setTimeout(() => {
                    setNewApptTime({ hour, teamMemberId: member.id !== '__solo' ? member.id : undefined });
                    setNewApptOpen(true);
                  }, 450);
                }}
                onMouseUp={() => clearTimeout(longPressTimer.current)}
                onTouchStart={(e) => {
                  const touch = e.touches[0];
                  const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
                  const relY = touch.clientY - rect.top + (gridRef.current?.scrollTop || 0);
                  const hour = Math.floor(relY / HOUR_HEIGHT);
                  longPressTimer.current = setTimeout(() => {
                    setNewApptTime({ hour, teamMemberId: member.id !== '__solo' ? member.id : undefined });
                    setNewApptOpen(true);
                  }, 450);
                }}
                onTouchEnd={() => clearTimeout(longPressTimer.current)}
              >
                {/* Hour lines */}
                {HOURS.map(h => (
                  <div key={h} style={{ height: HOUR_HEIGHT }} className="border-b border-border/20" />
                ))}

                {/* Current time red line */}
                {format(selectedDate, 'yyyy-MM-dd') === format(now, 'yyyy-MM-dd') && (
                  <div style={{ position: 'absolute', top: nowTop, left: 0, right: 0, height: 1, backgroundColor: '#ef4444', zIndex: 10 }} />
                )}

                {/* Appointment blocks */}
                {colAppts.map(appt => (
                  <ApptBlock
                    key={appt.id}
                    appt={appt}
                    services={services}
                    onClick={() => setDetailAppt(appt)}
                    onDragStart={handleDragStart}
                  />
                ))}
              </div>
            );
          })}
        </div>
      </div>

      {/* ── FAB ── */}
      <button
        onClick={() => { setNewApptTime(null); setNewApptOpen(true); }}
        className="fixed bottom-6 right-5 w-14 h-14 rounded-full bg-primary shadow-lg shadow-primary/40 flex items-center justify-center z-30 hover:bg-primary/90 active:scale-95 transition-all"
      >
        <Plus className="w-7 h-7 text-white" />
      </button>

      {/* ── RESCHEDULE CONFIRM MODAL ── */}
      {rescheduleModal && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-end">
          <div className="w-full bg-card rounded-t-3xl p-6 space-y-4 border-t border-border/50">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold">Atualizar agendamento</h3>
              <button onClick={() => setRescheduleModal(null)} className="text-muted-foreground">✕</button>
            </div>
            <div className="flex items-center gap-3 p-3 bg-primary/10 rounded-xl border border-primary/30">
              <input type="checkbox" className="w-5 h-5 rounded accent-primary" defaultChecked />
              <div>
                <p className="font-medium text-sm">Notificar {rescheduleModal.appt.client_name} sobre a remarcação</p>
                <p className="text-xs text-muted-foreground">Enviar uma mensagem informando que o agendamento foi remarcado</p>
              </div>
            </div>
            <button
              onClick={confirmReschedule}
              disabled={reschedule.isPending}
              className="w-full h-12 bg-primary text-white rounded-2xl font-bold text-base"
            >
              {reschedule.isPending ? 'A remarcar...' : 'Atualizar'}
            </button>
          </div>
        </div>
      )}

      {/* ── DETAIL SHEET ── */}
      {detailAppt && (
        <AppointmentDetailSheet appointment={detailAppt} onClose={() => setDetailAppt(null)} />
      )}

      {/* ── NEW APPOINTMENT FLOW ── */}
      {newApptOpen && (
        <NewAppointmentFlow
          initialHour={newApptTime?.hour ?? now.getHours()}
          initialTeamMemberId={newApptTime?.teamMemberId}
          selectedDate={selectedDate}
          onClose={() => setNewApptOpen(false)}
        />
      )}
    </div>
  );
}
