import { useLocation, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  CalendarDays,
  Users,
  Home,
  MoreVertical,
  ShoppingBag,
  Receipt,
  Settings,
  Building2,
  LogOut,
  X,
} from 'lucide-react';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { useUnit } from '@/hooks/useUnit';
import { useUserContext } from '@/hooks/useUserContext';
import { cn } from '@/lib/utils';

const NAV_ITEMS = [
  { key: 'dashboard', label: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
  { key: 'agenda', label: 'Agenda', path: '/agenda', icon: CalendarDays },
];

const MENU_ITEMS = [
  { key: 'clients', label: 'Clientes', path: '/clients', icon: Users },
  { key: 'catalogo', label: 'Catálogo', path: '/catalogo', icon: ShoppingBag },
  { key: 'vendas', label: 'Vendas', path: '/vendas', icon: Receipt },
  { key: 'team', label: 'Equipa', path: '/team', icon: Users },
  { key: 'unit', label: 'A Minha Empresa', path: '/unit', icon: Building2 },
  { key: 'settings', label: 'Configurações', path: '/settings', icon: Settings },
];

export function MobileBottomNav() {
  const location = useLocation();
  const navigate = useNavigate();
  const { signOut } = useAuth();
  const { data: unit } = useUnit();
  const { isStaff } = useUserContext();
  const [menuOpen, setMenuOpen] = useState(false);

  const handleNavClick = (path: string) => {
    navigate(path);
    setMenuOpen(false);
  };

  const handleLogout = () => {
    signOut();
    setMenuOpen(false);
  };

  // Filter menu items based on user type
  const visibleMenuItems = MENU_ITEMS.filter(item => {
    if (isStaff && ['team', 'unit', 'settings'].includes(item.key)) return false;
    if (item.key === 'team' && unit?.business_type === 'solo') return false;
    return true;
  });

  const isActive = (path: string) => location.pathname === path;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-40">
      {/* Menu Overlay */}
      {menuOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm"
          onClick={() => setMenuOpen(false)}
        />
      )}

      {/* Bottom Navigation Bar */}
      <nav className="relative bg-background/95 backdrop-blur-xl border-t border-border/30 safe-area-bottom">
        <div className="flex items-center justify-between px-6 h-20 md:h-24">
          {/* Left Items */}
          <div className="flex gap-6">
            {NAV_ITEMS.map(item => (
              <button
                key={item.key}
                onClick={() => handleNavClick(item.path)}
                className={cn(
                  'flex flex-col items-center gap-1 py-2 transition-all duration-200',
                  'hover:scale-110 active:scale-95',
                  isActive(item.path)
                    ? 'text-primary scale-110'
                    : 'text-muted-foreground hover:text-foreground'
                )}
                title={item.label}
              >
                <item.icon className="w-6 h-6" />
                <span className="text-xs font-medium">{item.label}</span>
              </button>
            ))}
          </div>

          {/* Center - Home Button */}
          <button
            onClick={() => handleNavClick('/dashboard')}
            className={cn(
              'absolute left-1/2 -translate-x-1/2 -top-8',
              'w-16 h-16 rounded-full',
              'bg-gradient-to-br from-primary to-accent',
              'shadow-2xl shadow-primary/40',
              'flex items-center justify-center',
              'hover:scale-110 active:scale-95 transition-all duration-200',
              'ring-4 ring-background',
              isActive('/dashboard') && 'ring-primary/50'
            )}
            title="Home"
          >
            <Home className="w-7 h-7 text-primary-foreground" />
          </button>

          {/* Right - Menu Button */}
          <div className="flex gap-6 ml-auto">
            <div className="relative">
              <button
                onClick={() => setMenuOpen(!menuOpen)}
                className={cn(
                  'flex flex-col items-center gap-1 py-2 transition-all duration-200',
                  'hover:scale-110 active:scale-95',
                  menuOpen ? 'text-primary scale-110' : 'text-muted-foreground hover:text-foreground'
                )}
                title="Menu"
              >
                {menuOpen ? (
                  <X className="w-6 h-6" />
                ) : (
                  <MoreVertical className="w-6 h-6" />
                )}
                <span className="text-xs font-medium">Menu</span>
              </button>

              {/* Dropdown Menu */}
              {menuOpen && (
                <div className="absolute bottom-full right-0 mb-2 bg-card/95 backdrop-blur-xl border border-border/50 rounded-2xl shadow-2xl animate-in fade-in slide-in-from-bottom-2 min-w-max">
                  <div className="p-2 space-y-1">
                    {visibleMenuItems.map(item => (
                      <button
                        key={item.key}
                        onClick={() => handleNavClick(item.path)}
                        className={cn(
                          'w-full flex items-center gap-3 px-4 py-3 rounded-lg',
                          'transition-all duration-150 text-left',
                          'hover:bg-accent/20 active:scale-95',
                          isActive(item.path)
                            ? 'bg-primary/20 text-primary font-medium'
                            : 'text-foreground/80'
                        )}
                      >
                        <item.icon className="w-5 h-5 shrink-0" />
                        <span className="text-sm">{item.label}</span>
                      </button>
                    ))}

                    {/* Divider */}
                    <div className="h-px bg-border/30 my-2" />

                    {/* Logout */}
                    <button
                      onClick={handleLogout}
                      className={cn(
                        'w-full flex items-center gap-3 px-4 py-3 rounded-lg',
                        'transition-all duration-150 text-left',
                        'hover:bg-destructive/20 text-foreground/80 active:scale-95'
                      )}
                    >
                      <LogOut className="w-5 h-5 shrink-0" />
                      <span className="text-sm">Sair</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </nav>
    </div>
  );
}
