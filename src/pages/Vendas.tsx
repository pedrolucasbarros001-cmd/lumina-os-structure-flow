import { useState, useMemo } from 'react';
import { Receipt, TrendingUp, CreditCard, Banknote, Smartphone, Filter } from 'lucide-react';
import { useAppointments } from '@/hooks/useAppointments';
import { format, subDays, startOfMonth, startOfYear, isAfter } from 'date-fns';
import { pt } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';

const TIME_FILTERS = [
  { key: 'today', label: 'Hoje' },
  { key: '7d', label: '7 Dias' },
  { key: 'month', label: 'Mês' },
  { key: 'year', label: 'Ano' },
] as const;

const METHOD_FILTERS = [
  { key: 'all', label: 'Todos' },
  { key: 'cash', label: 'Numerário' },
  { key: 'card', label: 'TPA' },
  { key: 'online', label: 'Online' },
] as const;

type TimeFilter = typeof TIME_FILTERS[number]['key'];
type MethodFilter = typeof METHOD_FILTERS[number]['key'];

const PAYMENT_STATUS_MAP: Record<string, { label: string; className: string }> = {
  paid: { label: 'Pago', className: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30' },
  unpaid: { label: 'Pendente', className: 'bg-amber-500/15 text-amber-400 border-amber-500/30' },
  refunded: { label: 'Reembolsado', className: 'bg-destructive/15 text-destructive border-destructive/30' },
};

const METHOD_ICON: Record<string, React.ReactNode> = {
  cash: <Banknote className="w-3.5 h-3.5" />,
  card: <CreditCard className="w-3.5 h-3.5" />,
  online: <Smartphone className="w-3.5 h-3.5" />,
};

export default function Vendas() {
  const { data: appointments, isLoading } = useAppointments();
  const [timeFilter, setTimeFilter] = useState<TimeFilter>('month');
  const [methodFilter, setMethodFilter] = useState<MethodFilter>('all');

  const filtered = useMemo(() => {
    if (!appointments) return [];
    const now = new Date();
    let cutoff: Date;
    switch (timeFilter) {
      case 'today': cutoff = new Date(now.getFullYear(), now.getMonth(), now.getDate()); break;
      case '7d': cutoff = subDays(now, 7); break;
      case 'month': cutoff = startOfMonth(now); break;
      case 'year': cutoff = startOfYear(now); break;
    }
    return appointments.filter(a => {
      if (!isAfter(new Date(a.datetime), cutoff)) return false;
      if (methodFilter !== 'all' && a.payment_method !== methodFilter) return false;
      return true;
    });
  }, [appointments, timeFilter, methodFilter]);

  const totalRevenue = filtered.reduce((s, a) => s + (a.payment_status === 'paid' ? Number(a.value) : 0), 0);
  const paidCount = filtered.filter(a => a.payment_status === 'paid').length;

  if (isLoading) {
    return (
      <div className="max-w-xl mx-auto px-4 py-4 space-y-4">
        <Skeleton className="h-28 rounded-2xl" />
        <Skeleton className="h-10 rounded-xl" />
        {[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-20 rounded-2xl" />)}
      </div>
    );
  }

  return (
    <div className="max-w-xl mx-auto px-4 py-4 space-y-5 pb-28">
      {/* Summary Card */}
      <div className="frosted-glass p-5 space-y-1">
        <p className="text-xs uppercase tracking-widest text-muted-foreground">Receita Total</p>
        <p className="text-3xl font-bold tracking-tight">€ {totalRevenue.toFixed(2)}</p>
        <div className="flex items-center gap-3 text-sm text-muted-foreground pt-1">
          <span className="flex items-center gap-1"><TrendingUp className="w-3.5 h-3.5 text-emerald-400" /> {paidCount} transações pagas</span>
          <span>•</span>
          <span>{filtered.length} total</span>
        </div>
      </div>

      {/* Time Filter Pills */}
      <div className="flex gap-2">
        {TIME_FILTERS.map(f => (
          <button
            key={f.key}
            onClick={() => setTimeFilter(f.key)}
            className={cn(
              'px-3 py-1.5 rounded-xl text-xs font-medium transition-all',
              timeFilter === f.key ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground hover:bg-muted/80'
            )}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* Method Filter */}
      <div className="flex gap-2 items-center">
        <Filter className="w-3.5 h-3.5 text-muted-foreground" />
        {METHOD_FILTERS.map(f => (
          <button
            key={f.key}
            onClick={() => setMethodFilter(f.key)}
            className={cn(
              'px-2.5 py-1 rounded-lg text-xs transition-all',
              methodFilter === f.key ? 'bg-secondary text-foreground font-medium' : 'text-muted-foreground hover:text-foreground'
            )}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* Transaction List */}
      <div className="space-y-2">
        {filtered.length === 0 && (
          <div className="text-center py-12 text-muted-foreground">
            <Receipt className="w-10 h-10 mx-auto mb-2 opacity-40" />
            <p className="text-sm">Sem transações neste período.</p>
          </div>
        )}
        {filtered.map(a => {
          const statusInfo = PAYMENT_STATUS_MAP[a.payment_status] || PAYMENT_STATUS_MAP.unpaid;
          return (
            <div key={a.id} className="frosted-glass p-4 flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-muted flex items-center justify-center shrink-0">
                {METHOD_ICON[a.payment_method || ''] || <Receipt className="w-4 h-4 text-muted-foreground" />}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{a.client_name || 'Cliente'}</p>
                <p className="text-xs text-muted-foreground">{format(new Date(a.datetime), "dd MMM · HH:mm", { locale: pt })}</p>
              </div>
              <div className="text-right shrink-0 space-y-1">
                <p className="text-sm font-bold">€ {Number(a.value).toFixed(2)}</p>
                <Badge variant="outline" className={cn('text-[10px] px-1.5 py-0', statusInfo.className)}>
                  {statusInfo.label}
                </Badge>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
