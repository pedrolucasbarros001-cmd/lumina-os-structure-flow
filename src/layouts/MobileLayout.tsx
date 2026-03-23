import { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { Plus } from 'lucide-react';
import QuickActionSheet from '@/components/QuickActionSheet';
import { MobileBottomNav } from '@/components/MobileBottomNav';
import { cn } from '@/lib/utils';

export default function MobileLayout() {
  const [fabOpen, setFabOpen] = useState(false);
  const showFab = true; // Show FAB on all pages for now

  return (
    <div className="w-full h-screen flex flex-col overflow-hidden bg-background">
      {/* Header - removed for agenda to maximize space */}
      
      {/* Main Content Area - flex with proper overflow handling */}
      <main
        className={cn(
          "flex-1 overflow-y-auto overflow-x-hidden w-full relative",
          showFab ? "pb-32 md:pb-24" : "pb-24 md:pb-20",
          "safe-area-bottom"
        )}
      >
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
