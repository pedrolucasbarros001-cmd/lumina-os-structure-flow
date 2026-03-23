import { useState } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { Plus, Building2 } from 'lucide-react';
import QuickActionSheet from '@/components/QuickActionSheet';
import { useUnit } from '@/hooks/useUnit';
import { MobileBottomNav } from '@/components/MobileBottomNav';
import { cn } from '@/lib/utils';

const PAGE_TITLES: Record<string, string> = {
  '/dashboard': 'Dashboard',
  '/agenda': 'Agenda',
  '/appointments': 'Atendimentos',
  '/clients': 'Clientes',
  '/team': 'Equipa',
  '/catalogo': 'Catálogo',
  '/vendas': 'Vendas',
  '/unit': 'A Minha Empresa',
  '/settings': 'Configurações',
};

export default function MobileLayout() {
  const [fabOpen, setFabOpen] = useState(false);
  const location = useLocation();
  const title = PAGE_TITLES[location.pathname] ?? 'LUMINA OS';
  const isAgenda = location.pathname === '/agenda';
  const { unit } = useUnit();
  const showFab = ['/dashboard', '/agenda', '/clients'].includes(location.pathname);

  return (
    <div className="min-h-screen flex flex-col w-full bg-background">
      {/* Header */}
      {!isAgenda && (
        <header className="flex flex-col border-b border-border/30 sticky top-0 z-20 glass-surface bg-background/95 backdrop-blur-md">
          <div className="h-14 md:h-16 flex items-center px-4 md:px-6 gap-3 min-w-0">
            <div className="flex-1 min-w-0">
              <h1 className="text-sm md:text-base font-semibold truncate text-foreground">{title}</h1>
            </div>
          </div>
          {unit && (
            <div className="border-t border-border/20 px-4 md:px-6 py-2.5 bg-muted/30">
              <div className="flex items-center gap-2 text-xs md:text-xs text-muted-foreground min-w-0">
                <Building2 className="w-3.5 h-3.5 flex-shrink-0" />
                <span className="font-medium truncate">{unit.name}</span>
              </div>
            </div>
          )}
        </header>
      )}

      {/* Main Content */}
      <main className={cn(
        "flex-1 overflow-y-auto overflow-x-hidden w-full safe-area-bottom",
        showFab ? "pb-32 md:pb-24" : "pb-24 md:pb-20"
      )}>
        <Outlet />
      </main>

      {/* Central FAB Button — only on actionable pages */}
      {showFab && (
        <button
          onClick={() => setFabOpen(true)}
          className={cn(
            'fixed z-40',
            'bottom-24 md:bottom-8 left-1/2 -translate-x-1/2',
            'w-14 h-14 md:w-16 md:h-16 rounded-full',
            'bg-gradient-to-br from-primary to-accent',
            'shadow-lg md:shadow-2xl shadow-primary/40',
            'flex items-center justify-center',
            'active:scale-95 transition-all duration-200 haptic-press',
            'ring-4 ring-primary/20 md:ring-primary/10',
            'hover:md:scale-110'
          )}
          aria-label="Ações rápidas"
        >
          <Plus className={cn(
            'w-6 h-6 md:w-7 md:h-7 text-primary-foreground transition-transform duration-300',
            fabOpen && 'rotate-45'
          )} />
        </button>
      )}

      {/* Bottom Navigation */}
      <MobileBottomNav />

      {/* Quick Action Sheet */}
      <QuickActionSheet open={fabOpen} onClose={() => setFabOpen(false)} />
    </div>
  );
}
