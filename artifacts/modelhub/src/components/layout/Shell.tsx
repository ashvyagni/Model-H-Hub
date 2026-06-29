import React, { useEffect } from 'react';
import { Link, useLocation } from 'wouter';
import { 
  LayoutDashboard, Server, Cuboid, PlaySquare, History, Settings as SettingsIcon,
  Search
} from 'lucide-react';
import { useGetSettings, useListProviders, useHealthCheck, getGetSettingsQueryKey } from '@workspace/api-client-react';
import { CommandPalette } from '../CommandPalette';

export default function Shell({ children }: { children: React.ReactNode }) {
  const [location] = useLocation();
  const [cmdOpen, setCmdOpen] = React.useState(false);
  
  const { data: settings } = useGetSettings({ query: { queryKey: getGetSettingsQueryKey() } });
  const { data: providers } = useListProviders();
  const { data: health } = useHealthCheck();
  
  const defaultProvider = providers?.find(p => p.id === settings?.defaultProviderId);
  const isHealthy = health?.status === 'ok';

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setCmdOpen((open) => !open);
      }
    };
    document.addEventListener('keydown', down);
    return () => document.removeEventListener('keydown', down);
  }, []);

  const nav = [
    { label: 'Dashboard', icon: LayoutDashboard, href: '/' },
    { label: 'Providers', icon: Server, href: '/providers' },
    { label: 'Models', icon: Cuboid, href: '/models' },
    { label: 'Playground', icon: PlaySquare, href: '/playground' },
    { label: 'History', icon: History, href: '/history' },
    { label: 'Settings', icon: SettingsIcon, href: '/settings' },
  ];

  return (
    <div className="flex h-screen overflow-hidden bg-background text-foreground selection:bg-primary selection:text-primary-foreground font-sans">
      {/* Sidebar */}
      <aside className="w-64 border-r border-border bg-card flex flex-col shrink-0">
        <div className="h-14 flex items-center px-4 border-b border-border">
          <div className="flex items-center gap-2 font-bold text-lg tracking-tight">
            <div className="w-6 h-6 rounded bg-primary text-primary-foreground flex items-center justify-center text-xs">M</div>
            ModelHub
          </div>
        </div>
        
        <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
          {nav.map((item) => {
            const active = location === item.href;
            return (
              <Link key={item.href} href={item.href} className={`flex items-center gap-3 px-3 py-2 text-sm rounded-md transition-colors ${active ? 'bg-secondary text-secondary-foreground font-medium' : 'text-muted-foreground hover:bg-secondary/50 hover:text-foreground'}`}>
                <item.icon size={16} />
                {item.label}
              </Link>
            )
          })}
        </nav>
        
        <div className="p-4 border-t border-border flex items-center gap-3">
          <div className="flex-1 min-w-0">
            <div className="text-xs text-muted-foreground">Active Provider</div>
            <div className="text-sm font-medium truncate">{defaultProvider?.name || 'None selected'}</div>
          </div>
          <div className={`w-2 h-2 shrink-0 rounded-full ${isHealthy ? 'bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.5)]' : 'bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.5)]'}`} title={isHealthy ? 'API Connected' : 'API Disconnected'} />
        </div>
      </aside>
      
      {/* Main Content */}
      <main className="flex-1 flex flex-col min-w-0 bg-background">
        <header className="h-14 border-b border-border bg-background flex items-center justify-between px-6 shrink-0 z-10">
          <div className="flex-1 max-w-md">
            <button 
              onClick={() => setCmdOpen(true)}
              className="flex items-center gap-2 w-full px-3 py-1.5 text-sm bg-secondary/30 hover:bg-secondary border border-border rounded-md text-muted-foreground transition-colors outline-none focus-visible:ring-1 focus-visible:ring-primary"
            >
              <Search size={14} />
              <span className="flex-1 text-left">Search commands...</span>
              <kbd className="hidden sm:inline-flex h-5 items-center gap-1 rounded border border-border bg-card px-1.5 font-mono text-[10px] font-medium text-muted-foreground opacity-100">
                <span className="text-xs">⌘</span>K
              </kbd>
            </button>
          </div>
        </header>
        
        <div className="flex-1 overflow-auto relative">
          {children}
        </div>
      </main>

      <CommandPalette open={cmdOpen} onOpenChange={setCmdOpen} nav={nav} />
    </div>
  );
}
