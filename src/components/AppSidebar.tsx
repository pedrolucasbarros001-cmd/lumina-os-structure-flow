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
import { NavLink } from '@/components/NavLink';
import { useAuth } from '@/contexts/AuthContext';
import { useUnit } from '@/hooks/useUnit';
import { useUserContext } from '@/hooks/useUserContext';
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
  const { state, isMobile, setOpenMobile } = useSidebar();
  const collapsed = state === 'collapsed';
  const { signOut } = useAuth();
  const { data: unit } = useUnit();
  const { isStaff } = useUserContext();

  const visibleItems = NAV_ITEMS.filter(item => {
    // Hide owner/admin sections for staff users
    if (isStaff && ['team', 'unit', 'settings'].includes(item.key)) return false;

    // Hide "Equipa" for solo businesses
    if (item.key === 'team' && unit?.business_type === 'solo') return false;

    return true;
  });

  const handleNavClick = () => {
    if (isMobile) {
      setOpenMobile(false);
    }
  };

  return (
    <Sidebar 
      collapsible="icon" 
      className="glass-surface border-r border-border/30 bg-gradient-to-b from-background via-background/95 to-background/90 backdrop-blur-sm"
    >
      <SidebarContent>
        <div className="px-2 md:px-3 py-4 md:py-5">
          <CompanySwitcher collapsed={collapsed} />
        </div>
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu className="gap-1">
              {visibleItems.map((item) => (
                <SidebarMenuItem key={item.key}>
                  <SidebarMenuButton asChild>
                    <NavLink
                      to={item.path}
                      end
                      className="hover:bg-sidebar-accent/50 transition-all duration-200 haptic-press rounded-lg md:rounded-xl text-sm md:text-base px-3 py-2.5 md:py-3"
                      activeClassName="bg-gradient-to-r from-primary/20 to-accent/20 text-primary font-medium shadow-sm"
                      onClick={handleNavClick}
                    >
                      <item.icon className="mr-3 h-4 w-4 md:h-5 md:w-5 shrink-0" />
                      {!collapsed && <span className="truncate">{item.label}</span>}
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
          className="w-full justify-start text-xs md:text-sm text-muted-foreground hover:text-foreground hover:bg-destructive/10 transition-all duration-200 rounded-lg md:rounded-xl py-2 md:py-2.5"
          onClick={signOut}
        >
          <LogOut className="mr-2 h-4 w-4" />
          {!collapsed && <span className="truncate">Sair</span>}
        </Button>
      </SidebarFooter>
    </Sidebar>
  );
}
