import { useState } from 'react';
import { SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar';
import { AppSidebar } from '@/components/AppSidebar';
import { Outlet, useLocation } from 'react-router-dom';
import { Plus, Building2 } from 'lucide-react';
import QuickActionSheet from '@/components/QuickActionSheet';
import { useUnit } from '@/hooks/useUnit';
import { cn } from '@/lib/utils';

const PAGE_TITLES: Record<string, string> = {
  '/dashboard': 'Dashboard',
  '/agenda': 'Agenda',
  '/appointments': 'Atendimentos',
  '/clients': 'Clientes',
  '/team': 'Equipa',
  '/services': 'Serviços',
  '/unit': 'A Minha Empresa',
  '/vendas': 'Vendas',
  '/settings': 'Configurações',
};

export default function PanelLayout() {
  const [fabOpen, setFabOpen] = useState(false);
  const location = useLocation();
  const title = PAGE_TITLES[location.pathname] ?? 'LUMINA OS';
  const isAgenda = location.pathname === '/agenda';
  const { unit } = useUnit();

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-background">
        <AppSidebar />
        <div className="flex-1 flex flex-col min-w-0">
          {!isAgenda && (
            <header className="flex flex-col border-b border-border/30 sticky top-0 z-30 glass-surface">
              <div className="h-14 flex items-center px-4 gap-3">
                <SidebarTrigger className="shrink-0" />
                <div className="flex-1 min-w-0">
                  <h1 className="text-base font-semibold truncate">{title}</h1>
                </div>
              </div>
              {unit && (
                <div className="border-t border-border/20 px-4 py-2 bg-muted/40">
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <Building2 className="w-3.5 h-3.5 flex-shrink-0" />
                    <span className="font-medium">Filial: {unit.name}</span>
                  </div>
                </div>
              )}
            </header>
          )}

          <main className={cn("flex-1 overflow-auto", !isAgenda && "pb-24")}>
            <Outlet />
          </main>
        </div>
      </div>

      {/* Central FAB Button — only on actionable pages */}
      {['/dashboard', '/agenda', '/clients'].includes(location.pathname) && (
        <button
          onClick={() => setFabOpen(true)}
          className={cn(
            'fixed bottom-6 left-1/2 -translate-x-1/2 z-50',
            'w-14 h-14 rounded-full bg-primary shadow-2xl shadow-primary/40',
            'flex items-center justify-center',
            'hover:scale-110 transition-all duration-200 haptic-press',
            'ring-4 ring-primary/20',
          )}
          aria-label="Ações rápidas"
        >
          <Plus className={cn('w-7 h-7 text-primary-foreground transition-transform duration-300', fabOpen && 'rotate-45')} />
        </button>
      )}

      <QuickActionSheet open={fabOpen} onClose={() => setFabOpen(false)} />
    </SidebarProvider>
  );
}
