import { FileText, Users, BarChart3, Download, Upload, LogOut, Settings, History, Package, UserCog, Building2 } from 'lucide-react';
import { NavLink } from '@/components/NavLink';
import { useAuth } from '@/contexts/AuthContext';
import { useWorkspace } from '@/contexts/WorkspaceContext';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarHeader,
  SidebarFooter,
  useSidebar,
} from '@/components/ui/sidebar';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

const menuItems = [
  { title: 'Invoices', url: '/', icon: FileText },
  { title: 'Invoice History', url: '/history', icon: History },
  { title: 'Saved Items', url: '/saved-items', icon: Package },
  { title: 'Customers', url: '/customers', icon: Users },
  { title: 'Reports', url: '/reports', icon: BarChart3 },
  { title: 'Data', url: '/data', icon: Download },
  { title: 'Collaborators', url: '/members', icon: UserCog },
];

export function AppSidebar() {
  const { signOut, user } = useAuth();
  const { workspaces, activeOwnerId, setActiveOwnerId } = useWorkspace();
  const { state } = useSidebar();
  const collapsed = state === 'collapsed';

  const handleSignOut = async () => {
    await signOut();
    toast.success('Logged out successfully');
  };

  return (
    <Sidebar collapsible="icon" className="border-r">
      <SidebarHeader className="p-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg invoice-header-gradient flex items-center justify-center flex-shrink-0">
            <FileText className="w-5 h-5 text-primary-foreground" />
          </div>
          {!collapsed && (
            <div>
              <h1 className="font-bold text-foreground">Billing Pro</h1>
              <p className="text-xs text-muted-foreground">Invoice Manager</p>
            </div>
          )}
        </div>
      </SidebarHeader>

      <SidebarContent>
        {!collapsed && workspaces.length > 1 && (
          <div className="px-3 pt-3">
            <p className="text-xs text-muted-foreground mb-1 flex items-center gap-1">
              <Building2 className="w-3 h-3" /> Workspace
            </p>
            <Select value={activeOwnerId || ''} onValueChange={setActiveOwnerId}>
              <SelectTrigger className="h-9">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {workspaces.map((w) => (
                  <SelectItem key={w.ownerId} value={w.ownerId}>
                    {w.label}{!w.isOwn && ' (shared)'}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}
        <SidebarGroup>
          <SidebarGroupLabel>Menu</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {menuItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <NavLink
                      to={item.url}
                      end={item.url === '/'}
                      className="flex items-center gap-3 px-3 py-2 rounded-md hover:bg-muted/50 transition-colors"
                      activeClassName="bg-primary/10 text-primary font-medium"
                    >
                      <item.icon className="w-5 h-5 flex-shrink-0" />
                      {!collapsed && <span>{item.title}</span>}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="p-4 border-t">
        <div className="space-y-2">
          {!collapsed && user && (
            <p className="text-xs text-muted-foreground truncate">{user.email}</p>
          )}
          <Button
            variant="ghost"
            size={collapsed ? 'icon' : 'default'}
            onClick={handleSignOut}
            className="w-full justify-start text-muted-foreground hover:text-foreground"
          >
            <LogOut className="w-4 h-4" />
            {!collapsed && <span className="ml-2">Logout</span>}
          </Button>
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}
