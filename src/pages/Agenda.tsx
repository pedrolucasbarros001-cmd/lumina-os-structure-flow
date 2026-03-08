import { useState, useRef, useCallback, useEffect, useMemo } from 'react';
import { format, addDays, subDays, parseISO, startOfWeek, isSameDay, isToday } from 'date-fns';
import { pt } from 'date-fns/locale';
import { ChevronDown, ChevronLeft, ChevronRight, Filter, MapPin, X } from 'lucide-react';
import { useAppointments, Appointment, useUpdateAppointmentStatus } from '@/hooks/useAppointments';
import { useServices } from '@/hooks/useServices';
import { useTeamMembers } from '@/hooks/useTeamMembers';
import NewAppointmentSheet from '@/components/NewAppointmentSheet';
import AppointmentDetailSheet from '@/components/AppointmentDetailSheet';
import AgendaTutorialOverlay, { useAgendaTutorial } from '@/components/AgendaTutorialOverlay';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Sheet, SheetContent } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { cn } from '@/lib/utils';

const HOUR_HEIGHT = 80;
const START_HOUR = 0;
const END_HOUR = 24;
const TIME_LABEL_WIDTH = 56;

function getInitials(name: string) {
  return name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);
}

function timeToMinutes(dateStr: string): number {
  const d = parseISO(dateStr);
  return d.getHours() * 60 + d.getMinutes();
}

function minutesToTop(minutes: number): number {
  return ((minutes - START_HOUR * 60) / 60) * HOUR_HEIGHT;
}

function durationToHeight(duration: number): number {
  return (duration / 60) * HOUR_HEIGHT;
}

function formatTimeRange(dateStr: string, duration: number): string {
  const start = parseISO(dateStr);
  const end = new Date(start.getTime() + duration * 60000);
  return `${format(start, 'HH:mm')} - ${format(end, 'HH:mm')}`;
}

// ─── Appointment Block ───
function AppointmentBlock({
  appt, colIndex, totalCols, onClick, onLongPressStart, isDragSource,
}: {
  appt: Appointment; colIndex: number; totalCols: number;
  onClick: () => void; onLongPressStart: (e: React.PointerEvent, appt: Appointment) => void;
  isDragSource?: boolean;
}) {
  const minutes = timeToMinutes(appt.datetime);
  const top = minutesToTop(minutes);
  const height = durationToHeight(appt.duration || 60);
  const isHome = appt.type === 'home';
  const isCompleted = appt.status === 'completed';
  const isCancelled = appt.status === 'cancelled';

  const colWidth = `calc((100% - ${TIME_LABEL_WIDTH}px) / ${totalCols})`;
  const left = `calc(${TIME_LABEL_WIDTH}px + ${colIndex} * ${colWidth})`;

  return (
    <div
      className={cn(
        'absolute rounded-lg border-l-[3px] px-2 py-1.5 cursor-pointer overflow-hidden transition-all hover:shadow-md select-none',
        isDragSource ? 'opacity-30' :
        isCompleted ? 'bg-muted/60 border-l-muted-foreground/40 opacity-60' :
        isCancelled ? 'bg-destructive/10 border-l-destructive/40 opacity-50' :
        isHome ? 'bg-orange-500/15 border-l-orange-500' :
        'bg-sky-400/20 border-l-sky-400'
      )}
      style={{ top: `${top}px`, height: `${Math.max(height, 28)}px`, left, width: `calc(${colWidth} - 4px)`, zIndex: 5 }}
      onClick={onClick}
      onPointerDown={(e) => onLongPressStart(e, appt)}
    >
      <p className="text-[10px] text-muted-foreground font-mono leading-none truncate">
        {formatTimeRange(appt.datetime, appt.duration || 60)}
      </p>
      <p className="text-xs font-semibold truncate mt-0.5 text-foreground">{appt.client_name || 'Cliente'}</p>
      {isHome && <MapPin className="w-3 h-3 text-orange-500 absolute top-1.5 right-1.5" />}
      {isCompleted && (
        <span className="absolute top-1 right-1 text-[8px] font-bold bg-foreground/80 text-background px-1 py-0.5 rounded uppercase">Pago</span>
      )}
    </div>
  );
}

// ─── Current Time Indicator ───
function CurrentTimeLine() {
  const [now, setNow] = useState(new Date());
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 60000);
    return () => clearInterval(id);
  }, []);
  const minutes = now.getHours() * 60 + now.getMinutes();
  const top = minutesToTop(minutes);
  return (
    <div className="absolute left-0 right-0 pointer-events-none" style={{ top: `${top}px`, zIndex: 10 }}>
      <div className="flex items-center">
        <div className="w-[52px] flex justify-end pr-1">
          <span className="text-[10px] font-bold text-destructive bg-destructive/15 px-1.5 py-0.5 rounded">
            {format(now, 'HH:mm')}
          </span>
        </div>
        <div className="flex-1 h-[2px] bg-destructive relative">
          <div className="w-2.5 h-2.5 rounded-full bg-destructive absolute -left-1 -top-1" />
        </div>
      </div>
    </div>
  );
}

// ─── Reschedule Bottom Sheet ───
function RescheduleSheet({
  open, onCancel, onConfirm, clientName, targetTime,
}: {
  open: boolean; onCancel: () => void; onConfirm: (notify: boolean) => void;
  clientName: string; targetTime: string;
}) {
  const [notify, setNotify] = useState(true);
  return (
    <Sheet open={open} onOpenChange={o => !o && onCancel()}>
      <SheetContent side="bottom" className="rounded-t-3xl p-0">
        <div className="px-5 pt-5 pb-2 flex items-center justify-between">
          <h3 className="text-lg font-bold">Atualizar agendamento</h3>
          <button onClick={onCancel} className="w-8 h-8 rounded-full hover:bg-muted flex items-center justify-center">
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="px-5 py-4 space-y-3">
          <div className="flex items-start gap-3">
            <Checkbox id="notify" checked={notify} onCheckedChange={c => setNotify(!!c)} className="mt-0.5" />
            <div>
              <label htmlFor="notify" className="text-sm font-medium cursor-pointer">
                Notificar {clientName || 'cliente'} sobre a remarcação
              </label>
              <p className="text-xs text-muted-foreground mt-0.5">
                Enviar uma mensagem informando {clientName || 'o cliente'} que o agendamento foi remarcado para {targetTime}
              </p>
            </div>
          </div>
        </div>
        <div className="px-5 pb-6">
          <Button className="w-full h-12 rounded-xl font-semibold" onClick={() => onConfirm(notify)}>
            Atualizar
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}

// ═══════════════════════════════
// MAIN AGENDA
// ═══════════════════════════════
export default function Agenda() {
  const [selected, setSelected] = useState(new Date());
  const [newOpen, setNewOpen] = useState(false);
  const [prefillTime, setPrefillTime] = useState('');
  const [prefillTeamMemberId, setPrefillTeamMemberId] = useState('');
  const [detailAppt, setDetailAppt] = useState<Appointment | null>(null);
  const { show: showTutorial, dismiss: dismissTutorial } = useAgendaTutorial();

  const longPressTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const longPressStartPos = useRef<{ x: number; y: number } | null>(null);

  // Drag state
  const [dragAppt, setDragAppt] = useState<Appointment | null>(null);
  const [dragGhostY, setDragGhostY] = useState(0);
  const [dragColIndex, setDragColIndex] = useState(0);
  const [rescheduleTarget, setRescheduleTarget] = useState<{ appt: Appointment; newTime: string; newTeamMemberId: string } | null>(null);
  const gridRef = useRef<HTMLDivElement>(null);
  const isDragging = useRef(false);

  const dateStr = format(selected, 'yyyy-MM-dd');
  const { data: appointments = [] } = useAppointments(dateStr);
  const { data: teamMembers = [] } = useTeamMembers();
  const { data: services = [] } = useServices();

  const columns = useMemo(() => {
    if (teamMembers.length === 0) return [{ id: '__self', name: 'Eu', photo_url: null as string | null }];
    return teamMembers.map(m => ({ id: m.id, name: m.name, photo_url: m.photo_url }));
  }, [teamMembers]);

  const hours = Array.from({ length: END_HOUR - START_HOUR }, (_, i) => START_HOUR + i);

  const apptsByCol = useMemo(() => {
    const map: Record<string, Appointment[]> = {};
    columns.forEach(c => { map[c.id] = []; });
    appointments.forEach(a => {
      const colId = a.team_member_id || columns[0]?.id || '__self';
      if (map[colId]) map[colId].push(a);
      else if (map[columns[0]?.id]) map[columns[0].id].push(a);
    });
    return map;
  }, [appointments, columns]);

  const goToday = () => setSelected(new Date());
  const goPrev = () => setSelected(d => subDays(d, 1));
  const goNext = () => setSelected(d => addDays(d, 1));

  const weekStart = startOfWeek(selected, { weekStartsOn: 1 });
  const weekDays = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));

  // ─── Long Press on empty grid ───
  const handleGridPointerDown = useCallback((e: React.PointerEvent<HTMLDivElement>) => {
    if (dragAppt) return;
    const rect = gridRef.current?.getBoundingClientRect();
    if (!rect) return;
    const relX = e.clientX - rect.left;
    const relY = e.clientY - rect.top + (gridRef.current?.scrollTop || 0);
    longPressStartPos.current = { x: e.clientX, y: e.clientY };

    longPressTimer.current = setTimeout(() => {
      const colWidth = (rect.width - TIME_LABEL_WIDTH) / columns.length;
      const colIdx = Math.floor((relX - TIME_LABEL_WIDTH) / colWidth);
      if (colIdx < 0 || colIdx >= columns.length) return;
      const minutesFromTop = (relY / HOUR_HEIGHT) * 60;
      const snappedMinutes = Math.round(minutesFromTop / 15) * 15;
      const hour = Math.floor(snappedMinutes / 60);
      const min = snappedMinutes % 60;
      const timeStr = `${dateStr}T${String(hour).padStart(2, '0')}:${String(min).padStart(2, '0')}`;
      setPrefillTime(timeStr);
      setPrefillTeamMemberId(columns[colIdx].id === '__self' ? '' : columns[colIdx].id);
      setNewOpen(true);
    }, 300);
  }, [columns, dateStr, dragAppt]);

  const handleGridPointerMove = useCallback((e: React.PointerEvent) => {
    if (longPressStartPos.current) {
      const dx = Math.abs(e.clientX - longPressStartPos.current.x);
      const dy = Math.abs(e.clientY - longPressStartPos.current.y);
      if (dx > 10 || dy > 10) {
        if (longPressTimer.current) clearTimeout(longPressTimer.current);
        longPressStartPos.current = null;
      }
    }
    if (isDragging.current && dragAppt && gridRef.current) {
      const rect = gridRef.current.getBoundingClientRect();
      const relY = e.clientY - rect.top + gridRef.current.scrollTop;
      const relX = e.clientX - rect.left;
      setDragGhostY(relY);
      const colWidth = (rect.width - TIME_LABEL_WIDTH) / columns.length;
      const colIdx = Math.max(0, Math.min(columns.length - 1, Math.floor((relX - TIME_LABEL_WIDTH) / colWidth)));
      setDragColIndex(colIdx);
    }
  }, [dragAppt, columns]);

  const handleGridPointerUp = useCallback(() => {
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current);
      longPressTimer.current = null;
    }
    longPressStartPos.current = null;
    if (isDragging.current && dragAppt) {
      isDragging.current = false;
      const snappedMinutes = Math.round((dragGhostY / HOUR_HEIGHT) * 60 / 15) * 15;
      const hour = Math.floor(snappedMinutes / 60);
      const min = snappedMinutes % 60;
      const newTimeStr = `${dateStr}T${String(Math.min(23, hour)).padStart(2, '0')}:${String(min).padStart(2, '0')}`;
      const targetCol = columns[dragColIndex];
      setRescheduleTarget({
        appt: dragAppt,
        newTime: newTimeStr,
        newTeamMemberId: targetCol?.id === '__self' ? '' : targetCol?.id || '',
      });
      setDragAppt(null);
    }
  }, [dragAppt, dragGhostY, dragColIndex, dateStr, columns]);

  // ─── Long press on appointment (start drag) ───
  const handleApptLongPressStart = useCallback((e: React.PointerEvent, appt: Appointment) => {
    e.stopPropagation();
    longPressStartPos.current = { x: e.clientX, y: e.clientY };
    longPressTimer.current = setTimeout(() => {
      isDragging.current = true;
      setDragAppt(appt);
      const rect = gridRef.current?.getBoundingClientRect();
      if (rect) {
        setDragGhostY(e.clientY - rect.top + (gridRef.current?.scrollTop || 0));
        const colWidth = (rect.width - TIME_LABEL_WIDTH) / columns.length;
        const colIdx = Math.max(0, Math.min(columns.length - 1, Math.floor((e.clientX - rect.left - TIME_LABEL_WIDTH) / colWidth)));
        setDragColIndex(colIdx);
      }
    }, 300);
  }, [columns]);

  const cancelDrag = () => {
    setDragAppt(null);
    isDragging.current = false;
  };

  const handleRescheduleConfirm = async (_notify: boolean) => {
    // In production: update datetime + team_member_id in DB
    setRescheduleTarget(null);
  };

  // Scroll to 8am on mount
  const scrollInitialized = useRef(false);
  useEffect(() => {
    if (!scrollInitialized.current && gridRef.current) {
      gridRef.current.scrollTop = 8 * HOUR_HEIGHT;
      scrollInitialized.current = true;
    }
  }, []);

  // Swipe detection
  const touchStart = useRef<{ x: number; y: number } | null>(null);
  const handleTouchStart = (e: React.TouchEvent) => {
    touchStart.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
  };
  const handleTouchEnd = (e: React.TouchEvent) => {
    if (!touchStart.current) return;
    const dx = e.changedTouches[0].clientX - touchStart.current.x;
    const dy = Math.abs(e.changedTouches[0].clientY - touchStart.current.y);
    if (Math.abs(dx) > 60 && dy < 80) {
      if (dx < 0) goNext(); else goPrev();
    }
    touchStart.current = null;
  };

  return (
    <div className="flex flex-col h-[calc(100vh-56px)] relative">
      {showTutorial && <AgendaTutorialOverlay onFinish={dismissTutorial} />}

      {/* ─── Header ─── */}
      <div className="px-4 pt-3 pb-2 bg-background/80 backdrop-blur-md sticky top-0 z-20 border-b border-border/50 space-y-3">
        {/* Drag mode purple banner */}
        {dragAppt && (
          <div className="flex items-center justify-between bg-violet-600 text-white px-3 py-2 rounded-xl -mx-1 mb-2">
            <span className="text-sm font-medium">
              Remarcar para {format(selected, "EEE d 'de' MMM", { locale: pt })}
            </span>
            <button onClick={cancelDrag} className="w-6 h-6 rounded-full hover:bg-white/20 flex items-center justify-center">
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        <div className="flex items-center justify-between">
          <button className="flex items-center gap-1.5 group" onClick={goToday}>
            <h2 className="text-lg font-bold capitalize">
              {format(selected, "EEEE, d 'de' MMMM", { locale: pt })}
            </h2>
            <ChevronDown className="w-4 h-4 text-muted-foreground group-hover:text-foreground transition-colors" />
          </button>
          <div className="flex items-center gap-1">
            <button onClick={goPrev} className="w-8 h-8 rounded-full hover:bg-muted flex items-center justify-center">
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button onClick={goNext} className="w-8 h-8 rounded-full hover:bg-muted flex items-center justify-center">
              <ChevronRight className="w-4 h-4" />
            </button>
            <button className="w-8 h-8 rounded-full hover:bg-muted flex items-center justify-center">
              <Filter className="w-4 h-4 text-muted-foreground" />
            </button>
          </div>
        </div>

        {/* Week strip */}
        <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-none pb-1">
          {weekDays.map((day, i) => {
            const isSel = isSameDay(day, selected);
            const tod = isToday(day);
            return (
              <button key={i} onClick={() => setSelected(day)}
                className={cn(
                  'flex flex-col items-center gap-0.5 px-2.5 py-1.5 rounded-xl transition-all min-w-[44px]',
                  isSel ? 'bg-primary text-primary-foreground' : tod ? 'border border-primary/50 text-primary' : 'text-muted-foreground hover:bg-muted'
                )}>
                <span className="text-[10px] font-medium uppercase">{format(day, 'EEE', { locale: pt })}</span>
                <span className="text-base font-bold leading-none">{format(day, 'd')}</span>
              </button>
            );
          })}
        </div>

        {/* Team member row */}
        <div className="flex items-center gap-0 overflow-x-auto scrollbar-none">
          <div style={{ width: TIME_LABEL_WIDTH }} className="shrink-0" />
          {columns.map(col => (
            <div key={col.id} className="flex flex-col items-center gap-1 shrink-0"
              style={{ width: `calc((100vw - ${TIME_LABEL_WIDTH}px - 2rem) / ${Math.min(columns.length, 4)})` }}>
              <Avatar className="w-8 h-8">
                {col.photo_url && <AvatarImage src={col.photo_url} />}
                <AvatarFallback className="text-[10px] font-bold bg-primary/10 text-primary">
                  {getInitials(col.name)}
                </AvatarFallback>
              </Avatar>
              <span className="text-[10px] font-medium text-muted-foreground truncate max-w-[60px]">{col.name}</span>
            </div>
          ))}
        </div>
      </div>

      {/* ─── Time Grid ─── */}
      <div
        ref={gridRef}
        className="flex-1 overflow-y-auto overflow-x-hidden relative touch-pan-y"
        onPointerDown={handleGridPointerDown}
        onPointerMove={handleGridPointerMove}
        onPointerUp={handleGridPointerUp}
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
      >
        <div className="relative" style={{ height: `${(END_HOUR - START_HOUR) * HOUR_HEIGHT}px` }}>
          {hours.map(h => (
            <div key={h} className="absolute left-0 right-0 border-t border-border/30"
              style={{ top: `${(h - START_HOUR) * HOUR_HEIGHT}px`, height: `${HOUR_HEIGHT}px` }}>
              <span className="absolute text-[10px] text-muted-foreground font-mono" style={{ left: 8, top: -6 }}>
                {String(h).padStart(2, '0')}:00
              </span>
              <div className="absolute left-0 right-0 border-t border-border/15"
                style={{ top: `${HOUR_HEIGHT / 2}px`, left: `${TIME_LABEL_WIDTH}px` }} />
            </div>
          ))}

          {/* Column dividers */}
          {columns.map((_, i) => (
            <div key={i} className="absolute top-0 bottom-0 border-l border-border/20"
              style={{ left: `calc(${TIME_LABEL_WIDTH}px + ${i} * ((100% - ${TIME_LABEL_WIDTH}px) / ${columns.length}))` }} />
          ))}

          {isToday(selected) && <CurrentTimeLine />}

          {/* Appointment blocks */}
          {columns.map((col, colIdx) =>
            (apptsByCol[col.id] || []).map(appt => (
              <AppointmentBlock
                key={appt.id} appt={appt} colIndex={colIdx} totalCols={columns.length}
                onClick={() => !isDragging.current && setDetailAppt(appt)}
                onLongPressStart={handleApptLongPressStart}
                isDragSource={dragAppt?.id === appt.id}
              />
            ))
          )}

          {/* Drag ghost */}
          {dragAppt && isDragging.current && (
            <div className="absolute rounded-lg border-2 border-sky-400/60 bg-sky-400/20 pointer-events-none"
              style={{
                top: `${dragGhostY}px`,
                height: `${durationToHeight(dragAppt.duration || 60)}px`,
                left: `calc(${TIME_LABEL_WIDTH}px + ${dragColIndex} * ((100% - ${TIME_LABEL_WIDTH}px) / ${columns.length}))`,
                width: `calc((100% - ${TIME_LABEL_WIDTH}px) / ${columns.length} - 4px)`,
                zIndex: 20, opacity: 0.7,
              }}>
              <p className="text-xs font-semibold p-1.5 text-sky-600 truncate">{dragAppt.client_name}</p>
            </div>
          )}
        </div>
      </div>

      {/* Drag mode sticky bottom bar */}
      {dragAppt && (
        <div className="sticky bottom-0 border-t border-border/50 bg-background px-4 py-3 flex gap-3 z-30">
          <Button variant="outline" className="flex-1" onClick={cancelDrag}>Cancelar</Button>
          <Button className="flex-1" onClick={() => {
            // Force drop at current position
            handleGridPointerUp();
          }}>Salvar</Button>
        </div>
      )}

      {/* Reschedule bottom sheet */}
      {rescheduleTarget && (
        <RescheduleSheet
          open
          onCancel={() => setRescheduleTarget(null)}
          onConfirm={handleRescheduleConfirm}
          clientName={rescheduleTarget.appt.client_name || ''}
          targetTime={format(parseISO(rescheduleTarget.newTime), "HH:mm 'de' EEEE", { locale: pt })}
        />
      )}

      <NewAppointmentSheet
        open={newOpen} onClose={() => setNewOpen(false)}
        prefillDate={dateStr} prefillTime={prefillTime} prefillTeamMemberId={prefillTeamMemberId}
      />

      {detailAppt && (
        <AppointmentDetailSheet appointment={detailAppt} onClose={() => setDetailAppt(null)} />
      )}
    </div>
  );
}
