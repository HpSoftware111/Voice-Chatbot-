interface HeaderProps {
  user: {
    name: string;
    initials: string;
    role: string;
  };
  activeUsers: number;
}

export function Header({ user, activeUsers }: HeaderProps) {
  return (
    <header className="bg-card border-b border-border px-6 py-4" data-testid="header">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-foreground" data-testid="page-title">
            Live Meeting Transcription
          </h2>
          <p className="text-sm text-muted-foreground" data-testid="page-subtitle">
            Real-time AI-powered transcription with action item extraction
          </p>
        </div>
        
        <div className="flex items-center space-x-4">
          {/* Connection Status */}
          <div 
            className="flex items-center space-x-2 bg-accent/10 px-3 py-1 rounded-full"
            data-testid="active-users"
          >
            <div className="w-2 h-2 bg-accent rounded-full" />
            <span className="text-sm font-medium text-accent">
              {activeUsers}+ users online
            </span>
          </div>
          
          {/* User Profile */}
          <div className="flex items-center space-x-3" data-testid="user-profile">
            <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center">
              <span className="text-sm font-medium text-primary-foreground" data-testid="user-initials">
                {user.initials}
              </span>
            </div>
            <div className="text-sm">
              <p className="font-medium text-foreground" data-testid="user-name">
                {user.name}
              </p>
              <p className="text-muted-foreground" data-testid="user-role">
                {user.role}
              </p>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
