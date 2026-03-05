import { useState, useEffect } from 'react';
import {
  TrendingUp, Users, Clock, MapPin, BarChart3,
  Calendar, ChevronLeft, ChevronRight
} from 'lucide-react';
import { format, subDays, parseISO } from 'date-fns';
import { pt } from 'date-fns/locale';
import { useAppointments } from '@/hooks/useAppointments';
import { useServices } from '@/hooks/useServices';
import { useTeamMembers } from '@/hooks/useTeamMembers';
import { useUnit } from '@/hooks/useUnit';
import { cn } from '@/lib/utils';

// ---------- Stat Card ----------
function StatCard({
  icon: Icon,
  label,
  value,
  sub,
  color,
}: {
  icon: React.ElementType;
  label: string;
  value: string;
  sub?: string;
  color: string;
}) {
  return (
    <div className="bg-card border border-border/50 rounded-2xl p-4 flex flex-col gap-2 hover:border-primary/30 transition-colors">
      <div className="flex items-center justify-between">
        <span className="text-xs text-muted-foreground font-medium uppercase tracking-widest">{label}</span>
        <div className={cn('w-8 h-8 rounded-lg flex items-center justify-center', color)}>
          <Icon className="w-4 h-4 text-white" />
        </div>
      </div>
      <div>
        <p className="text-2xl font-bold tracking-tight">{value}</p>
        {sub && <p className="text-xs text-muted-foreground mt-0.5">{sub}</p>}
      </div>
    </div>
  );
}

// ---------- Sales Container (swipeable days) ----------
function SalesContainer() {
  const [dayOffset, setDayOffset] = useState(0);
  const date = format(subDays(new Date(), dayOffset), 'yyyy-MM-dd');
  const displayDate = dayOffset === 0 ? 'Hoje' : dayOffset === 1 ? 'Ontem' : format(subDays(new Date(), dayOffset), 'dd/MM');

  const { data: appointments = [] } = useAppointments(date);
  const completed = appointments.filter(a => a.status === 'completed');
  const total = completed.reduce((s, a) => s + (a.value || 0), 0);
  const homeTotal = completed.filter(a => a.type === 'home').reduce((s, a) => s + (a.value || 0), 0);

  return (
    <div className="bg-gradient-to-br from-primary/10 to-primary/5 border border-primary/20 rounded-2xl p-5">
      <div className="flex items-center justify-between mb-4">
        <div>
          <p className="text-xs text-muted-foreground uppercase tracking-widest font-medium">Faturamento</p>
          <p className="text-sm font-semibold text-primary">{displayDate}</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setDayOffset(d => d + 1)}
            className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <button
            onClick={() => setDayOffset(d => Math.max(0, d - 1))}
            disabled={dayOffset === 0}
            className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors disabled:opacity-30"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>
      <p className="text-3xl font-bold">€{total.toFixed(2)}</p>
      <div className="flex gap-4 mt-3 text-sm text-muted-foreground">
        <span>{completed.length} atendimentos</span>
        {homeTotal > 0 && <span>🚗 €{homeTotal.toFixed(2)} domicílio</span>}
      </div>
    </div>
  );
}

// ---------- Modality Container ----------
function ModalityContainer() {
  const { data: appointments = [] } = useAppointments();
  const completed = appointments.filter(a => a.status === 'completed');
  const home = completed.filter(a => a.type === 'home').length;
  const unit = completed.filter(a => a.type === 'unit').length;
  const total = completed.length || 1;
  const homePct = Math.round((home / total) * 100);
  const unitPct = 100 - homePct;

  return (
    <div className="bg-card border border-border/50 rounded-2xl p-4">
      <p className="text-xs text-muted-foreground uppercase tracking-widest font-medium mb-3">Modalidade</p>
      <div className="space-y-2">
        <div>
          <div className="flex justify-between text-sm mb-1">
            <span>🏪 No Local</span>
            <span className="font-semibold">{unitPct}%</span>
          </div>
          <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
            <div className="h-full bg-primary rounded-full transition-all duration-700" style={{ width: `${unitPct}%` }} />
          </div>
        </div>
        <div>
          <div className="flex justify-between text-sm mb-1">
            <span>🚗 Ao Domicílio</span>
            <span className="font-semibold">{homePct}%</span>
          </div>
          <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
            <div className="h-full bg-accent rounded-full transition-all duration-700" style={{ width: `${homePct}%` }} />
          </div>
        </div>
      </div>
    </div>
  );
}

// ---------- Services Ranking ----------
function ServicesRanking() {
  const { data: appointments = [] } = useAppointments();
  const { data: services = [] } = useServices();

  const counts: Record<string, number> = {};
  appointments.forEach(a => {
    a.service_ids?.forEach(sid => {
      counts[sid] = (counts[sid] || 0) + 1;
    });
  });

  const ranked = services
    .map(s => ({ ...s, count: counts[s.id] || 0 }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 5);

  const max = ranked[0]?.count || 1;

  return (
    <div className="bg-card border border-border/50 rounded-2xl p-4">
      <p className="text-xs text-muted-foreground uppercase tracking-widest font-medium mb-3">Serviços Populares</p>
      {ranked.length === 0 ? (
        <p className="text-sm text-muted-foreground text-center py-4">Sem dados ainda</p>
      ) : (
        <div className="space-y-3">
          {ranked.map((s, i) => (
            <div key={s.id}>
              <div className="flex justify-between text-sm mb-1">
                <span className="font-medium">{s.name}</span>
                <span className="text-muted-foreground">{s.count}×</span>
              </div>
              <div className="w-full h-1.5 bg-muted rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-700"
                  style={{
                    width: `${(s.count / max) * 100}%`,
                    background: `hsl(var(--primary) / ${1 - i * 0.15})`
                  }}
                />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ---------- Team Ranking ----------
function TeamRanking() {
  const { data: appointments = [] } = useAppointments();
  const { data: teamMembers = [] } = useTeamMembers();

  const revenue: Record<string, number> = {};
  const count: Record<string, number> = {};
  appointments.filter(a => a.status === 'completed').forEach(a => {
    if (a.team_member_id) {
      revenue[a.team_member_id] = (revenue[a.team_member_id] || 0) + (a.value || 0);
      count[a.team_member_id] = (count[a.team_member_id] || 0) + 1;
    }
  });

  const ranked = teamMembers
    .map(m => ({ ...m, revenue: revenue[m.id] || 0, count: count[m.id] || 0 }))
    .sort((a, b) => b.revenue - a.revenue);

  if (ranked.length === 0) return null;

  return (
    <div className="bg-card border border-border/50 rounded-2xl p-4">
      <p className="text-xs text-muted-foreground uppercase tracking-widest font-medium mb-3">Ranking Equipa</p>
      <div className="space-y-3">
        {ranked.slice(0, 4).map((m, i) => (
          <div key={m.id} className="flex items-center gap-3">
            <div className="w-7 h-7 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center text-xs font-bold text-white shrink-0">
              {i + 1}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">{m.name}</p>
              <p className="text-xs text-muted-foreground">{m.count} atendimentos</p>
            </div>
            <p className="text-sm font-semibold text-primary">€{m.revenue.toFixed(0)}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

// ---------- Dashboard Page ----------
export default function Dashboard() {
  const { data: unit } = useUnit();
  const { data: appointments = [] } = useAppointments(format(new Date(), 'yyyy-MM-dd'));

  const todayCompleted = appointments.filter(a => a.status === 'completed');
  const todayTotal = appointments.length;
  const todayRevenue = todayCompleted.reduce((s, a) => s + (a.value || 0), 0);
  const occupancy = todayTotal > 0 ? Math.round((todayCompleted.length / todayTotal) * 100) : 0;
  const homeAppts = todayCompleted.filter(a => a.type === 'home').length;
  const homePct = todayCompleted.length > 0 ? Math.round((homeAppts / todayCompleted.length) * 100) : 0;

  return (
    <div className="p-4 md:p-6 space-y-4 max-w-2xl mx-auto">
      {/* Welcome banner */}
      {unit && (
        <div className="mb-2">
          <p className="text-xs text-muted-foreground">Bem-vindo de volta 👋</p>
          <h2 className="text-xl font-bold">{unit.name}</h2>
        </div>
      )}

      {/* Sales Container */}
      <SalesContainer />

      {/* Stats grid */}
      <div className="grid grid-cols-2 gap-3">
        <StatCard icon={Calendar} label="Agendamentos Hoje" value={String(todayTotal)} color="bg-blue-500" />
        <StatCard icon={BarChart3} label="Taxa de Ocupação" value={`${occupancy}%`} color="bg-violet-500" />
        <StatCard icon={TrendingUp} label="Ticket Médio" value={todayCompleted.length > 0 ? `€${(todayRevenue / todayCompleted.length).toFixed(2)}` : '€0.00'} color="bg-emerald-500" />
        <StatCard icon={MapPin} label="Visitas Domicílio" value={`${homePct}%`} color="bg-orange-500" />
      </div>

      {/* Modality */}
      <ModalityContainer />

      {/* Services Ranking */}
      <ServicesRanking />

      {/* Team Ranking */}
      <TeamRanking />
    </div>
  );
}
