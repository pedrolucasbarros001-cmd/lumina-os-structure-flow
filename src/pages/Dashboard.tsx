import { useState } from 'react';
import {
  Clipboard, Wrench, Factory, PackageOpen, Hourglass,
  Tag, FileText, Check, Flag, Search, User,
  TrendingUp, BarChart3, MapPin, ChevronLeft, ChevronRight
} from 'lucide-react';
import { format, subDays } from 'date-fns';
import { useAppointments } from '@/hooks/useAppointments';
import { useUnit } from '@/hooks/useUnit';
import { cn } from '@/lib/utils';
import { useNavigate } from 'react-router-dom';

// ---------- Cockpit Status Card ----------
function CockpitCard({
  icon: Icon,
  label,
  count,
  color,
  status,
  onClick,
}: {
  icon: React.ElementType;
  label: string;
  count: number;
  color: string;
  status: string;
  onClick: (status: string) => void;
}) {
  return (
    <button
      onClick={() => onClick(status)}
      className={cn(
        "relative overflow-hidden group rounded-2xl p-5 flex flex-col justify-between aspect-square transition-all duration-300 hover:scale-[1.02] hover:shadow-xl active:scale-95",
        color
      )}
    >
      <div className="flex justify-between items-start">
        <div className="p-2 rounded-lg bg-white/20 backdrop-blur-sm">
          <Icon className="w-5 h-5 text-white" />
        </div>
        <span className="text-4xl font-black text-white/90 tracking-tighter">{count}</span>
      </div>
      <div>
        <p className="text-sm font-bold text-white/90 text-left leading-tight uppercase tracking-wider">{label}</p>
      </div>
      <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16 blur-3xl group-hover:bg-white/20 transition-colors" />
    </button>
  );
}

// ---------- Sales Container ----------
function SalesContainer() {
  const [dayOffset, setDayOffset] = useState(0);
  const date = format(subDays(new Date(), dayOffset), 'yyyy-MM-dd');
  const displayDate = dayOffset === 0 ? 'Hoje' : dayOffset === 1 ? 'Ontem' : format(subDays(new Date(), dayOffset), 'dd/MM');

  const { data: appointments = [] } = useAppointments(date);
  const completed = appointments.filter(a => a.status === 'paid' || a.status === 'completed');
  const total = completed.reduce((s, a) => s + (a.value || 0), 0);

  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-6 shadow-2xl">
      <div className="flex items-center justify-between mb-6">
        <div>
          <p className="text-[10px] text-zinc-500 uppercase tracking-[0.2em] font-black mb-1">Visão Financeira</p>
          <div className="flex items-center gap-2">
            <h3 className="text-xl font-bold text-white">{displayDate}</h3>
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
          </div>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setDayOffset(d => d + 1)}
            className="w-10 h-10 rounded-xl bg-zinc-800 hover:bg-zinc-700 flex items-center justify-center transition-all border border-zinc-700/50"
          >
            <ChevronLeft className="w-5 h-5 text-zinc-300" />
          </button>
          <button
            onClick={() => setDayOffset(d => Math.max(0, d - 1))}
            disabled={dayOffset === 0}
            className="w-10 h-10 rounded-xl bg-zinc-800 hover:bg-zinc-700 flex items-center justify-center transition-all border border-zinc-700/50 disabled:opacity-20"
          >
            <ChevronRight className="w-5 h-5 text-zinc-300" />
          </button>
        </div>
      </div>
      <div className="flex items-baseline gap-1">
        <span className="text-lg font-bold text-zinc-400">€</span>
        <p className="text-5xl font-black text-white tracking-tighter">{total.toLocaleString('pt-PT', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
      </div>
      <div className="flex items-center gap-4 mt-6">
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20">
          <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
          <span className="text-xs font-bold text-emerald-500">{completed.length} Atendimentos</span>
        </div>
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-blue-500/10 border border-blue-500/20">
          <TrendingUp className="w-3 h-3 text-blue-500" />
          <span className="text-xs font-bold text-blue-500">Ticket: €{(total / (completed.length || 1)).toFixed(0)}</span>
        </div>
      </div>
    </div>
  );
}

export default function Dashboard() {
  const navigate = useNavigate();
  const { data: unit } = useUnit();
  const { data: allAppointments = [] } = useAppointments();

  const handleCardClick = (status: string) => {
    navigate(`/calendar?status=${status}`);
  };

  const statusCounts = {
    pending: allAppointments.filter(a => a.status === 'confirmed' || a.status === 'pending_approval').length,
    in_progress: allAppointments.filter(a => a.status === 'arrived' || a.status === 'in_progress').length,
    in_workshop: allAppointments.filter(a => a.status === 'in_workshop').length,
    order_part: allAppointments.filter(a => a.status === 'order_part').length,
    waiting_part: allAppointments.filter(a => a.status === 'waiting_part').length,
    to_price: allAppointments.filter(a => a.status === 'to_price').length,
    unpaid: allAppointments.filter(a => a.status === 'unpaid').length,
    paid: allAppointments.filter(a => a.status === 'paid' || a.status === 'completed').length,
    finished: allAppointments.filter(a => a.status === 'finished').length,
  };

  return (
    <div className="min-h-screen bg-black text-white p-4 md:p-8 space-y-8">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 rounded bg-primary/20 text-primary text-[10px] font-black uppercase tracking-wider">Operação Real Time</span>
          </div>
          <h1 className="text-3xl font-black tracking-tighter">
            {unit?.name || 'Minha Empresa'}
          </h1>
          <p className="text-zinc-500 text-sm font-medium italic">Visão estratégica e controle total.</p>
        </div>

        <div className="flex items-center gap-4">
          <div className="relative group flex-1 md:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500 group-focus-within:text-white transition-colors" />
            <input
              type="text"
              placeholder="Busca global (Srv, Cli, Técn)..."
              className="w-full bg-zinc-900 border border-zinc-800 rounded-2xl py-2.5 pl-10 pr-4 text-sm focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all"
            />
          </div>
          <button className="w-12 h-12 rounded-2xl bg-zinc-900 border border-zinc-800 flex items-center justify-center hover:bg-zinc-800 transition-colors">
            <User className="w-5 h-5 text-zinc-400" />
          </button>
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          <div className="flex items-center justify-between px-1">
            <h2 className="text-sm font-black uppercase tracking-[0.2em] text-zinc-500">Cockpit de Operação</h2>
            <div className="flex items-center gap-2 text-xs text-zinc-400 bg-zinc-900 px-3 py-1 rounded-full border border-zinc-800">
              <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
              Sincronizado
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
            <CockpitCard
              icon={Clipboard} label="Por Fazer" count={statusCounts.pending}
              color="bg-[#3498db]" status="confirmed" onClick={handleCardClick}
            />
            <CockpitCard
              icon={Wrench} label="Em Execução" count={statusCounts.in_progress}
              color="bg-[#f39c12]" status="arrived" onClick={handleCardClick}
            />
            <CockpitCard
              icon={Factory} label="Na Oficina" count={statusCounts.in_workshop}
              color="bg-[#34495e]" status="in_workshop" onClick={handleCardClick}
            />
            <CockpitCard
              icon={PackageOpen} label="Pedir Peça" count={statusCounts.order_part}
              color="bg-[#e74c3c]" status="order_part" onClick={handleCardClick}
            />
            <CockpitCard
              icon={Hourglass} label="E. Peça" count={statusCounts.waiting_part}
              color="bg-[#f1c40f]" status="waiting_part" onClick={handleCardClick}
            />
            <CockpitCard
              icon={Tag} label="A Precificar" count={statusCounts.to_price}
              color="bg-[#9b59b6]" status="to_price" onClick={handleCardClick}
            />
            <CockpitCard
              icon={FileText} label="Em Débito" count={statusCounts.unpaid}
              color="bg-[#d35400]" status="unpaid" onClick={handleCardClick}
            />
            <CockpitCard
              icon={Check} label="Pago" count={statusCounts.paid}
              color="bg-[#2ecc71]" status="paid" onClick={handleCardClick}
            />
            <CockpitCard
              icon={Flag} label="Finalizados" count={statusCounts.finished}
              color="bg-[#2c3e50]" status="finished" onClick={handleCardClick}
            />
          </div>
        </div>

        <div className="space-y-8">
          <SalesContainer />

          <div className="bg-zinc-900/50 border border-zinc-800 rounded-3xl p-6">
            <h3 className="text-xs font-black uppercase tracking-[0.2em] text-zinc-500 mb-6 flex items-center gap-2">
              <BarChart3 className="w-4 h-4" /> Distribuição
            </h3>

            <div className="space-y-6">
              <DistributionItem label="Presencial" value={100} color="bg-primary" icon={MapPin} />
              <DistributionItem label="Domicílio" value={0} color="bg-accent" icon={TrendingUp} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function DistributionItem({ label, value, color, icon: Icon }: { label: string, value: number, color: string, icon: any }) {
  return (
    <div className="space-y-2">
      <div className="flex justify-between items-center text-sm">
        <div className="flex items-center gap-2">
          <Icon className="w-4 h-4 text-zinc-500" />
          <span className="font-bold text-zinc-300">{label}</span>
        </div>
        <span className="font-black text-white">{value}%</span>
      </div>
      <div className="w-full h-2.5 bg-zinc-800 rounded-full overflow-hidden">
        <div
          className={cn("h-full rounded-full transition-all duration-1000 ease-out", color)}
          style={{ width: `${value}%` }}
        />
      </div>
    </div>
  );
}
