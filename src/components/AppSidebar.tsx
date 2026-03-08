import {
  LayoutDashboard,
  CalendarDays,
  Users,
  UserCog,
  ShoppingBag,
  Receipt,
  Building2,
  Settings,
  LogOut,
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useLocation } from 'react-router-dom';
import { NavLink } from '@/components/NavLink';
import { useAuth } from '@/contexts/AuthContext';
import { useUnit } from '@/hooks/useUnit';
import { CompanySwitcher } from '@/components/CompanySwitcher';
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarFooter,
  useSidebar,
} from '@/components/ui/sidebar';
import { Button } from '@/components/ui/button';

// Nav items follow the Master Sitemap:
// Dashboard | Agenda | Clientes | Catálogo | Equipa* | Configurações
const NAV_ITEMS = [
  { key: 'dashboard', label: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
  { key: 'agenda', label: 'Agenda', path: '/agenda', icon: CalendarDays },
  { key: 'clients', label: 'Clientes', path: '/clients', icon: Users },
  { key: 'catalogo', label: 'Catálogo', path: '/catalogo', icon: ShoppingBag },
  { key: 'vendas', label: 'Vendas', path: '/vendas', icon: Receipt },
  { key: 'team', label: 'Equipa', path: '/team', icon: UserCog },
  { key: 'unit', label: 'A Minha Empresa', path: '/unit', icon: Building2 },
  { key: 'settings', label: 'Configurações', path: '/settings', icon: Settings },
];

export function AppSidebar() {
  const { state } = useSidebar();
  const collapsed = state === 'collapsed';
  const { signOut } = useAuth();
  const location = useLocation();
  const { data: unit } = useUnit();

  const visibleItems = NAV_ITEMS.filter(item => {
    // Hide "Equipa" for solo users
    if (item.key === 'team' && unit?.business_type === 'solo') return false;
    return true;
  });

  return (
    <Sidebar collapsible="icon" className="glass-surface border-r border-border/30">
      <SidebarContent>
        <div className="px-3 py-4">
          <CompanySwitcher collapsed={collapsed} />
        </div>
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              {visibleItems.map((item) => (
                <SidebarMenuItem key={item.key}>
                  <SidebarMenuButton asChild>
                    <NavLink
                      to={item.path}
                      end
                      className="hover:bg-sidebar-accent/50 transition-smooth haptic-press rounded-xl"
                      activeClassName="bg-sidebar-accent text-sidebar-primary font-medium"
                    >
                      <item.icon className="mr-2 h-4 w-4 shrink-0" />
                      {!collapsed && <span>{item.label}</span>}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter>
        <Button
          variant="ghost"
          size="sm"
          className="w-full justify-start text-muted-foreground hover:text-foreground"
          onClick={signOut}
        >
          <LogOut className="mr-2 h-4 w-4" />
          {!collapsed && 'Sair'}
        </Button>
      </SidebarFooter>
    </Sidebar>
  );
}
