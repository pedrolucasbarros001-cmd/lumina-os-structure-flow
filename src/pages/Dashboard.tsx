import { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import {
  TrendingUp, TrendingDown, Eye, EyeOff, Users, Briefcase,
  ChevronLeft, ChevronRight, MapPin, CreditCard, Banknote, Smartphone
} from 'lucide-react';
import { format, subDays, startOfWeek, startOfMonth, startOfYear, parseISO, isSameDay } from 'date-fns';
import { pt } from 'date-fns/locale';
import { BarChart, Bar, ResponsiveContainer } from 'recharts';
import { useAppointments, Appointment } from '@/hooks/useAppointments';
import { useServices } from '@/hooks/useServices';
import { useTeamMembers } from '@/hooks/useTeamMembers';
import { useUnit } from '@/hooks/useUnit';
import { useProfile } from '@/hooks/useProfile';
import { useUserContext } from '@/hooks/useUserContext';
import { cn } from '@/lib/utils';

// ==================== ROLLING NUMBER ====================
function RollingDigit({ digit, delay }: { digit: string; delay: number }) {
  const [show, setShow] = useState(false);
  useEffect(() => {
    const t = setTimeout(() => setShow(true), delay);
    return () => clearTimeout(t);
  }, [delay, digit]);

  if (digit === '.' || digit === ',' || digit === '€' || digit === ' ' || digit === '%') {
    return <span className="inline-block">{digit}</span>;
  }

  return (
    <span className="inline-block overflow-hidden h-[1em] relative" style={{ width: '0.65em' }}>
      <span
        className={cn(
          'inline-block transition-transform duration-700',
          show ? 'translate-y-0 opacity-100' : 'translate-y-full opacity-0'
        )}
        style={{ transitionDelay: `${delay}ms`, transitionTimingFunction: 'cubic-bezier(0.16, 1, 0.3, 1)' }}
      >
        {digit}
      </span>
    </span>
  );
}

function RollingNumber({ value, prefix = '', suffix = '', privacyMode = false }: {
  value: string; prefix?: string; suffix?: string; privacyMode?: boolean;
}) {
  if (privacyMode) {
    return <span>{prefix}•••,••{suffix}</span>;
  }
  const chars = `${prefix}${value}${suffix}`.split('');
  return (
    <span className="inline-flex">
      {chars.map((c, i) => (
        <RollingDigit key={`${c}-${i}-${value}`} digit={c} delay={i * 60} />
      ))}
    </span>
  );
}

// ==================== SHIMMER SKELETON ====================
function ShimmerRow() {
  return (
    <div className="flex items-center gap-3 py-3">
      <div className="w-8 h-8 rounded-full bg-muted relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-foreground/5 to-transparent animate-shimmer" />
      </div>
      <div className="flex-1 space-y-1.5">
        <div className="h-3 w-3/4 rounded bg-muted relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-foreground/5 to-transparent animate-shimmer" />
        </div>
        <div className="h-2 w-1/2 rounded bg-muted relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-foreground/5 to-transparent animate-shimmer" />
        </div>
      </div>
      <div className="h-4 w-12 rounded bg-muted relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-foreground/5 to-transparent animate-shimmer" />
      </div>
    </div>
  );
}

// ==================== APPLE RING CHART ====================
function AppleRings({ localPct, deliveryPct }: { localPct: number; deliveryPct: number }) {
  const size = 140;
  const outerR = 56;
  const innerR = 42;
  const strokeW = 12;
  const outerC = 2 * Math.PI * outerR;
  const innerC = 2 * Math.PI * innerR;
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    requestAnimationFrame(() => setMounted(true));
    return () => setMounted(false);
  }, [localPct, deliveryPct]);

  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="shrink-0">
      {/* Outer track */}
      <circle cx={size / 2} cy={size / 2} r={outerR} fill="none"
        stroke="hsl(var(--muted))" strokeWidth={strokeW} opacity={0.3} />
      {/* Inner track */}
      <circle cx={size / 2} cy={size / 2} r={innerR} fill="none"
        stroke="hsl(var(--muted))" strokeWidth={strokeW} opacity={0.3} />
      {/* Outer fill — Local (info blue) */}
      <circle cx={size / 2} cy={size / 2} r={outerR} fill="none"
        stroke="hsl(var(--info))" strokeWidth={strokeW} strokeLinecap="round"
        strokeDasharray={outerC}
        strokeDashoffset={mounted ? outerC * (1 - localPct / 100) : outerC}
        transform={`rotate(-90 ${size / 2} ${size / 2})`}
        style={{ transition: 'stroke-dashoffset 1.2s ease-out' }}
      />
      {/* Inner fill — Delivery (primary purple) */}
      <circle cx={size / 2} cy={size / 2} r={innerR} fill="none"
        stroke="hsl(var(--primary))" strokeWidth={strokeW} strokeLinecap="round"
        strokeDasharray={innerC}
        strokeDashoffset={mounted ? innerC * (1 - deliveryPct / 100) : innerC}
        transform={`rotate(-90 ${size / 2} ${size / 2})`}
        style={{ transition: 'stroke-dashoffset 1.2s ease-out 0.2s' }}
      />
    </svg>
  );
}

// ==================== TIMEFRAME HELPERS ====================
type Timeframe = 'today' | '7d' | 'month' | 'year';
const timeframeLabels: Record<Timeframe, string> = { today: 'Hoje', '7d': '7 Dias', month: 'Mês', year: 'Ano' };

function filterByTimeframe(appointments: Appointment[], tf: Timeframe): Appointment[] {
  const now = new Date();
  switch (tf) {
    case 'today': return appointments.filter(a => isSameDay(parseISO(a.datetime), now));
    case '7d': {
      const start = subDays(now, 7);
      return appointments.filter(a => parseISO(a.datetime) >= start);
    }
    case 'month': {
      const start = startOfMonth(now);
      return appointments.filter(a => parseISO(a.datetime) >= start);
    }
    case 'year': {
      const start = startOfYear(now);
      return appointments.filter(a => parseISO(a.datetime) >= start);
    }
  }
}

// ==================== SALES CONTAINER ====================
function SalesContainer({ appointments, privacyMode, lastWeekAppointments }: {
  appointments: Appointment[]; privacyMode: boolean; lastWeekAppointments: Appointment[];
}) {
  const [dayOffset, setDayOffset] = useState(0);
  const touchRef = useRef<number>(0);

  const dayAppts = useMemo(() => {
    const target = subDays(new Date(), dayOffset);
    return appointments.filter(a => isSameDay(parseISO(a.datetime), target));
  }, [appointments, dayOffset]);

  const completed = dayAppts.filter(a => a.status === 'completed');
  const total = completed.reduce((s, a) => s + (a.value || 0), 0);
  const displayDate = dayOffset === 0 ? 'Hoje' : dayOffset === 1 ? 'Ontem' : format(subDays(new Date(), dayOffset), "dd MMM", { locale: pt });

  // Payment breakdown
  const byCash = completed.filter(a => a.payment_method === 'cash').reduce((s, a) => s + (a.value || 0), 0);
  const byTPA = completed.filter(a => a.payment_method === 'card').reduce((s, a) => s + (a.value || 0), 0);
  const byOnline = completed.filter(a => a.payment_method === 'online').reduce((s, a) => s + (a.value || 0), 0);

  // Hourly chart data
  const hourlyData = useMemo(() => {
    const hours: Record<number, number> = {};
    for (let h = 8; h <= 20; h++) hours[h] = 0;
    completed.forEach(a => {
      const h = parseISO(a.datetime).getHours();
      if (hours[h] !== undefined) hours[h] += (a.value || 0);
    });
    return Object.entries(hours).map(([h, v]) => ({ hour: Number(h), value: v }));
  }, [completed]);

  // Health indicator (compare vs same weekday last week)
  const lastWeekCompleted = lastWeekAppointments.filter(a => a.status === 'completed');
  const lastWeekTotal = lastWeekCompleted.reduce((s, a) => s + (a.value || 0), 0);
  const pctChange = lastWeekTotal > 0 ? Math.round(((total - lastWeekTotal) / lastWeekTotal) * 100) : null;

  const onTouchStart = (e: React.TouchEvent) => { touchRef.current = e.touches[0].clientX; };
  const onTouchEnd = (e: React.TouchEvent) => {
    const diff = touchRef.current - e.changedTouches[0].clientX;
    if (Math.abs(diff) > 50) {
      if (diff > 0) setDayOffset(d => d + 1);
      else setDayOffset(d => Math.max(0, d - 1));
    }
  };

  return (
    <div className="frosted-glass p-5" onTouchStart={onTouchStart} onTouchEnd={onTouchEnd}>
      <div className="flex items-center justify-between mb-4">
        <div>
          <p className="text-xs text-muted-foreground uppercase tracking-widest font-medium">Faturação</p>
          <p className="text-sm font-semibold text-primary">{displayDate}</p>
        </div>
        <div className="flex items-center gap-1.5">
          <button onClick={() => setDayOffset(d => d + 1)}
            className="w-8 h-8 rounded-full bg-muted/50 hover:bg-muted flex items-center justify-center transition-colors">
            <ChevronLeft className="w-4 h-4" />
          </button>
          <button onClick={() => setDayOffset(d => Math.max(0, d - 1))} disabled={dayOffset === 0}
            className="w-8 h-8 rounded-full bg-muted/50 hover:bg-muted flex items-center justify-center transition-colors disabled:opacity-30">
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      <div className="flex items-end gap-3">
        <p className={cn("text-4xl font-bold tracking-tight font-display", privacyMode && "privacy-blur")}>
          <RollingNumber value={total.toFixed(2)} prefix="€" privacyMode={privacyMode} />
        </p>
        {pctChange !== null && dayOffset === 0 && (
          <span className={cn(
            "text-xs font-semibold px-2 py-0.5 rounded-full mb-1",
            pctChange >= 0 ? "bg-success/20 text-success" : "bg-destructive/20 text-destructive"
          )}>
            {pctChange >= 0 ? <TrendingUp className="w-3 h-3 inline mr-0.5" /> : <TrendingDown className="w-3 h-3 inline mr-0.5" />}
            {pctChange >= 0 ? '+' : ''}{pctChange}%
          </span>
        )}
      </div>

      {/* Payment breakdown */}
      <div className={cn("flex gap-4 mt-3 text-xs text-muted-foreground", privacyMode && "privacy-blur")}>
        {byCash > 0 && <span className="flex items-center gap-1"><Banknote className="w-3 h-3" /> €{byCash.toFixed(0)}</span>}
        {byTPA > 0 && <span className="flex items-center gap-1"><CreditCard className="w-3 h-3" /> €{byTPA.toFixed(0)}</span>}
        {byOnline > 0 && <span className="flex items-center gap-1"><Smartphone className="w-3 h-3" /> €{byOnline.toFixed(0)}</span>}
        <span>{completed.length} atendimentos</span>
      </div>

      {/* Mini hourly chart */}
      <div className="mt-4 h-12">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={hourlyData} barSize={4}>
            <Bar dataKey="value" fill="hsl(var(--primary))" radius={[2, 2, 0, 0]} opacity={0.6} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

// ==================== MODALITY CONTAINER ====================
function ModalityContainer({ appointments, privacyMode }: { appointments: Appointment[]; privacyMode: boolean }) {
  const completed = appointments.filter(a => a.status === 'completed');
  const home = completed.filter(a => a.type === 'home');
  const unit = completed.filter(a => a.type === 'unit');
  const total = completed.length || 1;
  const localPct = Math.round((unit.length / total) * 100);
  const deliveryPct = Math.round((home.length / total) * 100);
  const displacementRevenue = home.reduce((s, a) => s + (a.displacement_fee || 0), 0);

  return (
    <div className="frosted-glass p-5">
      <p className="text-xs text-muted-foreground uppercase tracking-widest font-medium mb-4">Modalidade</p>
      <div className="flex items-center gap-6">
        <AppleRings localPct={localPct} deliveryPct={deliveryPct} />
        <div className="flex-1 space-y-3">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-info" />
            <span className="text-sm flex-1">No Local</span>
            <span className="text-sm font-bold">{localPct}%</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-primary" />
            <span className="text-sm flex-1">Domicílio</span>
            <span className="text-sm font-bold">{deliveryPct}%</span>
          </div>
          {displacementRevenue > 0 && (
            <div className={cn("flex items-center gap-1 text-xs text-muted-foreground pt-1", privacyMode && "privacy-blur")}>
              <MapPin className="w-3 h-3" />
              <span>€{displacementRevenue.toFixed(2)} em deslocações</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ==================== TEAM RANKING ====================
function TeamRanking({ appointments, privacyMode }: { appointments: Appointment[]; privacyMode: boolean }) {
  const { data: teamMembers = [] } = useTeamMembers();
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const completed = appointments.filter(a => a.status === 'completed');
  const ranked = useMemo(() => {
    const rev: Record<string, number> = {};
    const cnt: Record<string, number> = {};
    const svcCnt: Record<string, Set<string>> = {};
    completed.forEach(a => {
      if (a.team_member_id) {
        rev[a.team_member_id] = (rev[a.team_member_id] || 0) + (a.value || 0);
        cnt[a.team_member_id] = (cnt[a.team_member_id] || 0) + 1;
        if (!svcCnt[a.team_member_id]) svcCnt[a.team_member_id] = new Set();
        a.service_ids?.forEach(s => svcCnt[a.team_member_id]!.add(s));
      }
    });
    return teamMembers
      .map(m => ({
        ...m,
        revenue: rev[m.id] || 0,
        count: cnt[m.id] || 0,
        serviceTypes: svcCnt[m.id]?.size || 0,
        avgTicket: cnt[m.id] ? (rev[m.id] || 0) / cnt[m.id] : 0,
      }))
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 4);
  }, [completed, teamMembers]);

  if (ranked.length === 0) return null;

  const medals = ['🥇', '🥈', '🥉'];

  return (
    <div className="frosted-glass p-5">
      <div className="flex items-center gap-2 mb-4">
        <Users className="w-4 h-4 text-muted-foreground" />
        <p className="text-xs text-muted-foreground uppercase tracking-widest font-medium">Ranking Equipa</p>
      </div>
      <div className="space-y-1">
        {ranked.map((m, i) => (
          <div key={m.id}>
            <button
              onClick={() => setExpandedId(expandedId === m.id ? null : m.id)}
              className="w-full flex items-center gap-3 py-2.5 px-1 rounded-xl hover:bg-muted/30 transition-colors"
            >
              <span className="text-lg w-7 text-center shrink-0">{medals[i] || `${i + 1}`}</span>
              <div className="w-9 h-9 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center text-xs font-bold text-white shrink-0">
                {m.name?.charAt(0)?.toUpperCase()}
              </div>
              <div className="flex-1 min-w-0 text-left">
                <p className="text-sm font-medium truncate">{m.name}</p>
                <p className="text-xs text-muted-foreground">{m.count} atendimentos</p>
              </div>
              <p className={cn("text-sm font-bold text-primary", privacyMode && "privacy-blur")}>
                €{m.revenue.toFixed(0)}
              </p>
            </button>
            {/* Expandable mini-report */}
            <div className={cn(
              "overflow-hidden transition-all duration-300",
              expandedId === m.id ? "max-h-40 opacity-100" : "max-h-0 opacity-0"
            )}>
              <div className="ml-10 pl-7 border-l border-border/50 py-2 space-y-1.5 text-xs text-muted-foreground">
                <div className="flex justify-between">
                  <span>Ticket Médio</span>
                  <span className={cn("font-semibold text-foreground", privacyMode && "privacy-blur")}>
                    €{m.avgTicket.toFixed(2)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Tipos de Serviço</span>
                  <span className="font-semibold text-foreground">{m.serviceTypes}</span>
                </div>
                <div className="flex justify-between">
                  <span>Atendimentos</span>
                  <span className="font-semibold text-foreground">{m.count}</span>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ==================== SERVICES RANKING ====================
function ServicesRanking({ appointments, isLoading, privacyMode }: {
  appointments: Appointment[]; isLoading: boolean; privacyMode: boolean;
}) {
  const { data: services = [] } = useServices();

  const ranked = useMemo(() => {
    const counts: Record<string, number> = {};
    const revenue: Record<string, number> = {};
    const completed = appointments.filter(a => a.status === 'completed');
    completed.forEach(a => {
      const perService = a.service_ids?.length ? (a.value || 0) / a.service_ids.length : 0;
      a.service_ids?.forEach(sid => {
        counts[sid] = (counts[sid] || 0) + 1;
        revenue[sid] = (revenue[sid] || 0) + perService;
      });
    });
    const totalRev = Object.values(revenue).reduce((a, b) => a + b, 0) || 1;
    return services
      .map(s => ({ ...s, count: counts[s.id] || 0, revenue: revenue[s.id] || 0, weight: ((revenue[s.id] || 0) / totalRev) * 100 }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);
  }, [appointments, services]);

  const max = ranked[0]?.count || 1;

  return (
    <div className="frosted-glass p-5">
      <div className="flex items-center gap-2 mb-4">
        <Briefcase className="w-4 h-4 text-muted-foreground" />
        <p className="text-xs text-muted-foreground uppercase tracking-widest font-medium">Serviços Populares</p>
      </div>
      {isLoading ? (
        <div className="space-y-0">{[...Array(5)].map((_, i) => <ShimmerRow key={i} />)}</div>
      ) : ranked.length === 0 ? (
        <p className="text-sm text-muted-foreground text-center py-6">Sem dados ainda</p>
      ) : (
        <div className="space-y-3">
          {ranked.map((s) => (
            <div key={s.id}>
              <div className="flex justify-between text-sm mb-1.5">
                <span className="font-medium truncate flex-1">{s.name}</span>
                <span className="text-muted-foreground text-xs ml-2">{s.count}× · <span className={privacyMode ? 'privacy-blur' : ''}>{s.weight.toFixed(0)}%</span></span>
              </div>
              <div className="w-full h-2 bg-muted/50 rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-700 bg-gradient-to-r from-primary to-accent"
                  style={{ width: `${(s.count / max) * 100}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ==================== DASHBOARD PAGE ====================
export default function Dashboard() {
  const { data: unit } = useUnit();
  const { data: profile } = useProfile();
  const [timeframe, setTimeframe] = useState<Timeframe>('today');
  const [privacyMode, setPrivacyMode] = useState(false);

  // Fetch all appointments (no date filter) for client-side filtering
  const { data: allAppointments = [], isLoading } = useAppointments();

  // Last week same day for health comparison
  const lastWeekDate = format(subDays(new Date(), 7), 'yyyy-MM-dd');
  const { data: lastWeekAppts = [] } = useAppointments(lastWeekDate);

  const filtered = useMemo(() => filterByTimeframe(allAppointments, timeframe), [allAppointments, timeframe]);

  const isIndependent = profile?.business_type === 'independent';

  return (
    <div className="p-4 md:p-6 space-y-4 max-w-2xl mx-auto pb-24 relative z-10 stagger-container">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs text-muted-foreground">Bem-vindo de volta 👋</p>
          <h1 className="text-xl font-bold font-display">{unit?.name || 'Dashboard'}</h1>
        </div>
        <button
          onClick={() => setPrivacyMode(p => !p)}
          className="w-10 h-10 rounded-full bg-muted/50 hover:bg-muted flex items-center justify-center transition-colors"
          title={privacyMode ? 'Mostrar valores' : 'Ocultar valores'}
        >
          {privacyMode ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
        </button>
      </div>

      {/* Timeframe pills */}
      <div className="flex gap-1.5 bg-muted/30 rounded-xl p-1">
        {(Object.keys(timeframeLabels) as Timeframe[]).map(tf => (
          <button
            key={tf}
            onClick={() => setTimeframe(tf)}
            className={cn(
              "flex-1 text-xs font-medium py-2 rounded-lg transition-all duration-200",
              timeframe === tf
                ? "bg-primary text-primary-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            {timeframeLabels[tf]}
          </button>
        ))}
      </div>

      {/* Sales Container */}
      <SalesContainer appointments={filtered} privacyMode={privacyMode} lastWeekAppointments={lastWeekAppts} />

      {/* Modality */}
      <ModalityContainer appointments={filtered} privacyMode={privacyMode} />

      {/* Team Ranking — hidden for independents */}
      {!isIndependent && <TeamRanking appointments={filtered} privacyMode={privacyMode} />}

      {/* Services Ranking */}
      <ServicesRanking appointments={filtered} isLoading={isLoading} privacyMode={privacyMode} />
    </div>
  );
}
