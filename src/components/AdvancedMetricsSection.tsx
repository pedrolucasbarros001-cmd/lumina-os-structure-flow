import { useMemo } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell } from 'recharts';
import { useAppointments } from '@/hooks/useAppointments';
import { useServices } from '@/hooks/useServices';
import { useClients } from '@/hooks/useClients';
import { useUserContext } from '@/hooks/useUserContext';

export function AdvancedMetricsSection() {
  const { unit } = useUserContext();
  const { data: appointments = [] } = useAppointments(unit?.id);
  const { data: services = [] } = useServices(unit?.id);
  const { data: clients = [] } = useClients();

  // Metric 1: New vs Returning Clients
  const clientMetrics = useMemo(() => {
    const returningAppts = new Map<string, number>();
    appointments.forEach((appt) => {
      const count = (returningAppts.get(appt.client_id) || 0) + 1;
      returningAppts.set(appt.client_id, count);
    });

    const newClients = clients.filter((c) => !returningAppts.has(c.id)).length;
    const returningClients = clients.filter((c) => returningAppts.has(c.id)).length;

    return [{ name: 'Novos', value: newClients }, { name: 'Recorrentes', value: returningClients }];
  }, [appointments, clients]);

  // Metric 2: No-Show Rate
  const noShowRate = useMemo(() => {
    const totalAppts = appointments.length;
    const noShows = appointments.filter((a) => a.status === 'no_show').length;
    return totalAppts > 0 ? ((noShows / totalAppts) * 100).toFixed(1) : '0';
  }, [appointments]);

  // Metric 3: Peak Hours
  const peakHours = useMemo(() => {
    const hourCounts = new Map<number, number>();
    appointments.forEach((appt) => {
      if (appt.start_time) {
        const hour = new Date(appt.start_time).getHours();
        hourCounts.set(hour, (hourCounts.get(hour) || 0) + 1);
      }
    });

    return Array.from(hourCounts.entries())
      .map(([hour, count]) => ({ hour: `${hour}:00`, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 8);
  }, [appointments]);

  // Metric 4: Top Services by Revenue
  const topServices = useMemo(() => {
    const serviceRevenue = new Map<string, { name: string; revenue: number }>();

    appointments.forEach((appt) => {
      if (appt.service_id && appt.price) {
        const service = services.find((s) => s.id === appt.service_id);
        if (service) {
          const current = serviceRevenue.get(appt.service_id) || { name: service.name, revenue: 0 };
          current.revenue += Number(appt.price);
          serviceRevenue.set(appt.service_id, current);
        }
      }
    });

    return Array.from(serviceRevenue.values())
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 5);
  }, [appointments, services]);

  const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'];

  return (
    <div className="space-y-6 p-6">
      <h2 className="text-2xl font-bold">Métricas Avançadas</h2>

      {/* New vs Returning Clients */}
      <div className="bg-card p-4 rounded-2xl border border-border/30">
        <h3 className="font-semibold mb-4">Clientes Novos vs Recorrentes</h3>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={clientMetrics}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="name" />
            <YAxis />
            <Tooltip />
            <Bar dataKey="value" fill="#3b82f6" />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* No-Show Rate */}
      <div className="bg-card p-4 rounded-2xl border border-border/30">
        <h3 className="font-semibold mb-2">Taxa de Ausência</h3>
        <div className="flex items-center gap-4">
          <div className="text-5xl font-bold text-red-600">{noShowRate}%</div>
          <p className="text-sm text-muted-foreground max-w-xs">
            De {appointments.length} agendamentos, {appointments.filter((a) => a.status === 'no_show').length} foram cancelados ou cliente não compareceu.
          </p>
        </div>
      </div>

      {/* Peak Hours */}
      <div className="bg-card p-4 rounded-2xl border border-border/30">
        <h3 className="font-semibold mb-4">Horários de Pico</h3>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={peakHours}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="hour" />
            <YAxis />
            <Tooltip />
            <Line type="monotone" dataKey="count" stroke="#10b981" strokeWidth={2} />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Top Services by Revenue */}
      <div className="bg-card p-4 rounded-2xl border border-border/30">
        <h3 className="font-semibold mb-4">Top Serviços por Receita</h3>
        {topServices.length > 0 ? (
          <div className="space-y-3">
            {topServices.map((service, i) => (
              <div key={i} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                <span className="font-medium">{service.name}</span>
                <span className="text-lg font-bold text-emerald-600">
                  {service.revenue.toLocaleString('pt-BR', { style: 'currency', currency: 'EUR' })}
                </span>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">Sem dados de receita disponíveis</p>
        )}
      </div>
    </div>
  );
}
