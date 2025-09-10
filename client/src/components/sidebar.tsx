import { Link, useLocation } from 'wouter';
import { 
  Mic, 
  Home, 
  Play, 
  History, 
  CheckSquare, 
  Plug, 
  Settings 
} from 'lucide-react';

interface SidebarProps {
  connectionStatus: {
    isConnected: boolean;
    activeUsers: number;
  };
}

export function Sidebar({ connectionStatus }: SidebarProps) {
  const [location] = useLocation();

  const navigationItems = [
    { path: '/', icon: Home, label: 'Dashboard', active: location === '/' },
    { path: '/live', icon: Play, label: 'Live Transcription', active: location === '/live' },
    { path: '/history', icon: History, label: 'Meeting History', active: location === '/history' },
    { path: '/action-items', icon: CheckSquare, label: 'Action Items', active: location === '/action-items' },
    { path: '/integrations', icon: Plug, label: 'Integrations', active: location === '/integrations' },
    { path: '/settings', icon: Settings, label: 'Settings', active: location === '/settings' }
  ];

  return (
    <aside className="w-64 bg-card border-r border-border flex-shrink-0" data-testid="sidebar">
      <div className="p-6">
        <div className="flex items-center space-x-3 mb-8" data-testid="logo">
          <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center">
            <Mic className="w-5 h-5 text-primary-foreground" />
          </div>
          <div>
            <h1 className="font-semibold text-foreground">MeetingFlow</h1>
            <p className="text-xs text-muted-foreground">AI Transcription</p>
          </div>
        </div>
        
        <nav className="space-y-2" data-testid="navigation">
          {navigationItems.map((item) => {
            const IconComponent = item.icon;
            return (
              <Link
                key={item.path}
                href={item.path}
                className={`flex items-center space-x-3 px-3 py-2 rounded-md transition-colors ${
                  item.active
                    ? 'bg-primary/10 text-primary'
                    : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                }`}
                data-testid={`nav-${item.label.toLowerCase().replace(' ', '-')}`}
              >
                <IconComponent className="w-4 h-4" />
                <span className={item.active ? 'font-medium' : ''}>{item.label}</span>
              </Link>
            );
          })}
        </nav>
      </div>
      
      <div className="absolute bottom-6 left-6 right-6">
        <div className="bg-muted rounded-lg p-4" data-testid="connection-status">
          <div className="flex items-center space-x-2 mb-2">
            <div 
              className={`connection-indicator ${connectionStatus.isConnected ? 'bg-accent' : 'bg-destructive'}`}
              data-testid="connection-indicator"
            />
            <span className="text-sm font-medium text-foreground">
              {connectionStatus.isConnected ? 'Connected' : 'Disconnected'}
            </span>
          </div>
          <p className="text-xs text-muted-foreground">
            {connectionStatus.isConnected 
              ? 'WebSocket streaming active'
              : 'Attempting to reconnect...'
            }
          </p>
          {connectionStatus.isConnected && (
            <p className="text-xs text-muted-foreground mt-1">
              {connectionStatus.activeUsers} users online
            </p>
          )}
        </div>
      </div>
    </aside>
  );
}
