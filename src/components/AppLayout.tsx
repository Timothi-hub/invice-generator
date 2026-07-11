import { SidebarProvider, SidebarTrigger, SidebarInset } from '@/components/ui/sidebar';
import { AppSidebar } from '@/components/AppSidebar';
import { useProfile } from '@/hooks/useProfile';
import CompanySettings from '@/components/invoice/CompanySettings';
import { useWorkspace } from '@/contexts/WorkspaceContext';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useTheme } from '@/contexts/ThemeContext';
import { Sun, Moon } from 'lucide-react';

interface AppLayoutProps {
  children: React.ReactNode;
  title: string;
}

const AppLayout = ({ children, title }: AppLayoutProps) => {
  const { profile, updateProfile } = useProfile();
  const { isOwner, workspaces, activeOwnerId } = useWorkspace();
  const { theme, toggleTheme } = useTheme();
  const activeWs = workspaces.find((w) => w.ownerId === activeOwnerId);

  const defaultProfile = profile || {
    companyName: 'Your Company',
    address: 'Your Address Here',
    phone: '+91 XXXXX XXXXX',
    website: 'www.yourcompany.com',
    directorName: 'Director Name',
  };

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full">
        <AppSidebar />
        <SidebarInset className="flex-1 min-w-0 overflow-hidden">
          <header className="sticky top-0 z-40 bg-background border-b">
            <div className="flex items-center justify-between px-4 py-3">
              <div className="flex items-center gap-3">
                <SidebarTrigger />
                <h1 className="text-xl font-bold text-foreground">{title}</h1>
                {activeWs && !activeWs.isOwn && (
                  <Badge variant="secondary">Shared: {activeWs.label}</Badge>
                )}
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={toggleTheme}
                  aria-label="Toggle theme"
                  title={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
                >
                  {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
                </Button>
                {isOwner && <CompanySettings profile={defaultProfile} onSave={updateProfile} />}
              </div>
            </div>
          </header>
          <main className="p-3 md:p-4">{children}</main>
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
};

export default AppLayout;
