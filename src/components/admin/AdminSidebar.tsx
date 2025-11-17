import { NavLink, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  Users,
  Car,
  Briefcase,
  Clock,
  Route,
  Fuel,
  BarChart3,
  Calendar,
  Settings,
  Sparkles,
  DollarSign,
} from 'lucide-react';
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from '@/components/ui/sidebar';
import { useAuth } from '@/contexts/AuthContext';

const items = [
  { title: 'Dashboard', url: '/admin', icon: LayoutDashboard },
  { title: 'Zamestnanci', url: '/admin/employees', icon: Users },
  { title: 'Vozidlá', url: '/admin/vehicles', icon: Car },
  { title: 'Projekty', url: '/admin/projects', icon: Briefcase },
];

const viewItems = [
  { title: 'Dochádzka', url: '/admin/attendance-overview', icon: Clock },
  { title: 'Jazdy', url: '/admin/drives-overview', icon: Route },
  { title: 'Tankovania', url: '/admin/fuelings-overview', icon: Fuel },
  { title: 'Kalendár', url: '/admin/calendar', icon: Calendar },
  { title: 'Reporty', url: '/admin/reports', icon: BarChart3 },
  { title: 'AI Asistent', url: '/admin/ai-reports', icon: Sparkles },
];

const settingsItems = [
  { title: 'Nastavenia', url: '/admin/settings', icon: Settings },
];

export function AdminSidebar() {
  const { state, isMobile, setOpenMobile } = useSidebar();
  const { user } = useAuth();
  const location = useLocation();
  const currentPath = location.pathname;
  const collapsed = state === 'collapsed';

  const isActive = (path: string) => currentPath === path;

  const handleNavClick = () => {
    if (isMobile) {
      setOpenMobile(false);
    }
  };

  // Check if user has access to finance section
  const hasFinanceAccess = user?.email === 'pikolo@pikolo.sk';

  // Add finance item to items array if user has access
  const itemsWithFinance = hasFinanceAccess 
    ? [...items, { title: 'Financie', url: '/admin/finance', icon: DollarSign }]
    : items;

  return (
    <Sidebar 
      collapsible="icon" 
      variant="sidebar"
      className="border-r"
    >
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Správa</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {itemsWithFinance.map((item) => {
                const Icon = item.icon;
                const active = isActive(item.url);
                
                return (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton asChild isActive={active}>
                      <NavLink to={item.url} onClick={handleNavClick}>
                        <Icon className="h-4 w-4" />
                        <span>{item.title}</span>
                      </NavLink>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup>
          <SidebarGroupLabel>Prehľady</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {viewItems.map((item) => {
                const Icon = item.icon;
                const active = isActive(item.url);
                
                return (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton asChild isActive={active}>
                      <NavLink to={item.url} onClick={handleNavClick}>
                        <Icon className="h-4 w-4" />
                        <span>{item.title}</span>
                      </NavLink>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup>
          <SidebarGroupLabel>Účet</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {settingsItems.map((item) => {
                const Icon = item.icon;
                const active = isActive(item.url);
                
                return (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton asChild isActive={active}>
                      <NavLink to={item.url} onClick={handleNavClick}>
                        <Icon className="h-4 w-4" />
                        <span>{item.title}</span>
                      </NavLink>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
}
