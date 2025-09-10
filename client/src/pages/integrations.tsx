import { useState } from 'react';
import { Header } from '@/components/header';
import { Sidebar } from '@/components/sidebar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { 
  ExternalLink, 
  Plus, 
  Settings, 
  Check, 
  AlertCircle,
  Zap,
  Globe,
  Shield,
  Clock,
  MessageSquare
} from 'lucide-react';
import { SiNotion, SiTrello, SiSlack, SiGmail, SiZapier, SiGoogle } from 'react-icons/si';
import { useWebSocket } from '@/hooks/use-websocket';
import { useToast } from '@/hooks/use-toast';

export default function Integrations() {
  const [currentUser] = useState({
    id: "user_1",
    name: "John Smith",
    initials: "JS",
    role: "Newsletter Publisher"
  });

  const [integrations, setIntegrations] = useState([
    {
      id: 'notion',
      name: 'Notion',
      description: 'Sync action items and meeting notes to your Notion workspace',
      icon: SiNotion,
      color: 'text-black',
      category: 'Productivity',
      isConnected: false,
      isPopular: true,
      config: {
        workspaceId: '',
        databaseId: '',
        autoSync: false
      }
    },
    {
      id: 'trello',
      name: 'Trello',
      description: 'Create cards from action items in your Trello boards',
      icon: SiTrello,
      color: 'text-blue-600',
      category: 'Project Management',
      isConnected: true,
      isPopular: true,
      config: {
        boardId: 'newsletter-planning',
        listId: 'action-items',
        autoSync: true
      }
    },
    {
      id: 'slack',
      name: 'Slack',
      description: 'Send meeting summaries and action items to Slack channels',
      icon: SiSlack,
      color: 'text-purple-600',
      category: 'Communication',
      isConnected: true,
      isPopular: true,
      config: {
        channelId: '#team-updates',
        webhookUrl: 'https://hooks.slack.com/...',
        autoSync: false
      }
    },
    {
      id: 'gmail',
      name: 'Gmail',
      description: 'Email meeting summaries and action items to team members',
      icon: SiGmail,
      color: 'text-red-500',
      category: 'Communication',
      isConnected: false,
      isPopular: false,
      config: {
        emailTemplate: 'professional',
        autoSend: false,
        recipients: []
      }
    },
    {
      id: 'zapier',
      name: 'Zapier',
      description: 'Connect MeetingFlow to 5000+ apps through Zapier automation',
      icon: SiZapier,
      color: 'text-orange-500',
      category: 'Automation',
      isConnected: false,
      isPopular: true,
      config: {
        webhookUrl: '',
        triggerEvents: ['meeting_completed', 'action_item_created']
      }
    },
    {
      id: 'teams',
      name: 'Microsoft Teams',
      description: 'Share meeting insights and action items in Teams channels',
      icon: MessageSquare,
      color: 'text-blue-700',
      category: 'Communication',
      isConnected: false,
      isPopular: false,
      config: {
        teamId: '',
        channelId: '',
        autoPost: false
      }
    },
    {
      id: 'calendar',
      name: 'Google Calendar',
      description: 'Create calendar events for action items with due dates',
      icon: SiGoogle,
      color: 'text-green-600',
      category: 'Productivity',
      isConnected: false,
      isPopular: false,
      config: {
        calendarId: 'primary',
        defaultDuration: '30m',
        autoCreate: false
      }
    }
  ]);

  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');

  const { connectionState, activeUsers } = useWebSocket({ autoConnect: false });
  const { toast } = useToast();

  const categories = ['all', 'Productivity', 'Project Management', 'Communication', 'Automation'];

  const filteredIntegrations = integrations.filter(integration => {
    const matchesCategory = selectedCategory === 'all' || integration.category === selectedCategory;
    const matchesSearch = integration.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         integration.description.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const handleToggleIntegration = (integrationId: string) => {
    setIntegrations(prev => prev.map(integration => {
      if (integration.id === integrationId) {
        const newState = !integration.isConnected;
        toast({
          title: newState ? "Integration Connected" : "Integration Disconnected",
          description: `${integration.name} has been ${newState ? 'connected' : 'disconnected'} successfully`
        });
        return { ...integration, isConnected: newState };
      }
      return integration;
    }));
  };

  const handleConfigUpdate = (integrationId: string, configKey: string, value: any) => {
    setIntegrations(prev => prev.map(integration => {
      if (integration.id === integrationId) {
        return {
          ...integration,
          config: { ...integration.config, [configKey]: value }
        };
      }
      return integration;
    }));
  };

  const connectedCount = integrations.filter(i => i.isConnected).length;
  const popularIntegrations = integrations.filter(i => i.isPopular);

  return (
    <div className="min-h-screen flex" data-testid="integrations-page">
      <Sidebar 
        connectionStatus={{
          isConnected: connectionState === 'connected',
          activeUsers
        }}
      />
      
      <main className="flex-1 overflow-hidden">
        <Header user={currentUser} activeUsers={activeUsers} />
        
        <div className="p-6">
          <div className="mb-6">
            <h1 className="text-2xl font-bold text-foreground mb-2" data-testid="page-title">
              Integrations
            </h1>
            <p className="text-muted-foreground" data-testid="page-description">
              Connect MeetingFlow with your favorite tools and automate your workflow
            </p>
          </div>

          {/* Stats Overview */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Connected</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600" data-testid="stat-connected">
                  {connectedCount}
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Available</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold" data-testid="stat-available">
                  {integrations.length}
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Categories</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold" data-testid="stat-categories">
                  {categories.length - 1}
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Popular</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold" data-testid="stat-popular">
                  {popularIntegrations.length}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Search and Filters */}
          <div className="flex gap-4 mb-6">
            <div className="relative flex-1">
              <Input
                placeholder="Search integrations..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                data-testid="input-search-integrations"
              />
            </div>
            <div className="flex gap-2">
              {categories.map(category => (
                <Button
                  key={category}
                  variant={selectedCategory === category ? "default" : "outline"}
                  size="sm"
                  onClick={() => setSelectedCategory(category)}
                  data-testid={`filter-${category.toLowerCase()}`}
                >
                  {category === 'all' ? 'All' : category}
                </Button>
              ))}
            </div>
          </div>

          {/* Quick Actions */}
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Zap className="w-5 h-5 text-yellow-500" />
                Quick Setup
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Button
                  variant="outline"
                  className="h-auto p-4 justify-start"
                  onClick={() => toast({ title: "Coming Soon", description: "Auto-setup wizard is coming soon!" })}
                  data-testid="button-auto-setup"
                >
                  <div className="text-left">
                    <div className="font-medium mb-1">Auto-Setup Popular Apps</div>
                    <div className="text-sm text-muted-foreground">Connect Notion, Slack, and Trello in one click</div>
                  </div>
                </Button>
                <Button
                  variant="outline"
                  className="h-auto p-4 justify-start"
                  onClick={() => toast({ title: "Coming Soon", description: "Import feature is coming soon!" })}
                  data-testid="button-import-config"
                >
                  <div className="text-left">
                    <div className="font-medium mb-1">Import Configuration</div>
                    <div className="text-sm text-muted-foreground">Import settings from another workspace</div>
                  </div>
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Integrations Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6" data-testid="integrations-grid">
            {filteredIntegrations.map((integration) => {
              const IconComponent = integration.icon;
              
              return (
                <Card key={integration.id} className="relative">
                  {integration.isPopular && (
                    <Badge className="absolute -top-2 -right-2 bg-yellow-500 text-white">
                      Popular
                    </Badge>
                  )}
                  
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg border flex items-center justify-center">
                          <IconComponent className={`text-xl ${integration.color}`} />
                        </div>
                        <div>
                          <CardTitle className="text-lg" data-testid={`integration-title-${integration.id}`}>
                            {integration.name}
                          </CardTitle>
                          <Badge variant="outline" className="text-xs" data-testid={`integration-category-${integration.id}`}>
                            {integration.category}
                          </Badge>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        {integration.isConnected ? (
                          <Check className="w-5 h-5 text-green-600" />
                        ) : (
                          <AlertCircle className="w-5 h-5 text-yellow-500" />
                        )}
                        <Switch
                          checked={integration.isConnected}
                          onCheckedChange={() => handleToggleIntegration(integration.id)}
                          data-testid={`switch-${integration.id}`}
                        />
                      </div>
                    </div>
                  </CardHeader>

                  <CardContent>
                    <p className="text-sm text-muted-foreground mb-4" data-testid={`integration-description-${integration.id}`}>
                      {integration.description}
                    </p>

                    {integration.isConnected && (
                      <div className="space-y-3 p-3 bg-muted/50 rounded-md">
                        <div className="text-sm font-medium text-foreground">Configuration</div>
                        
                        {integration.id === 'trello' && (
                          <div className="space-y-2">
                            <div>
                              <label className="text-xs text-muted-foreground">Board ID</label>
                              <Input
                                value={integration.config.boardId}
                                onChange={(e) => handleConfigUpdate(integration.id, 'boardId', e.target.value)}
                                className="h-8 text-sm"
                                data-testid={`config-boardId-${integration.id}`}
                              />
                            </div>
                            <div className="flex items-center justify-between">
                              <span className="text-xs text-muted-foreground">Auto-sync new items</span>
                              <Switch
                                checked={integration.config.autoSync}
                                onCheckedChange={(checked) => handleConfigUpdate(integration.id, 'autoSync', checked)}
                                data-testid={`config-autoSync-${integration.id}`}
                              />
                            </div>
                          </div>
                        )}

                        {integration.id === 'slack' && (
                          <div className="space-y-2">
                            <div>
                              <label className="text-xs text-muted-foreground">Channel</label>
                              <Input
                                value={integration.config.channelId}
                                onChange={(e) => handleConfigUpdate(integration.id, 'channelId', e.target.value)}
                                className="h-8 text-sm"
                                data-testid={`config-channelId-${integration.id}`}
                              />
                            </div>
                          </div>
                        )}

                        {integration.id === 'notion' && (
                          <div className="space-y-2">
                            <div>
                              <label className="text-xs text-muted-foreground">Database ID</label>
                              <Input
                                value={integration.config.databaseId}
                                onChange={(e) => handleConfigUpdate(integration.id, 'databaseId', e.target.value)}
                                className="h-8 text-sm"
                                placeholder="Enter Notion database ID"
                                data-testid={`config-databaseId-${integration.id}`}
                              />
                            </div>
                          </div>
                        )}
                      </div>
                    )}

                    <div className="flex gap-2 mt-4">
                      <Button
                        variant="outline"
                        size="sm"
                        className="flex-1"
                        onClick={() => toast({ title: "Settings", description: `Opening ${integration.name} settings` })}
                        data-testid={`button-settings-${integration.id}`}
                      >
                        <Settings className="w-4 h-4 mr-1" />
                        Settings
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => window.open('#', '_blank')}
                        data-testid={`button-docs-${integration.id}`}
                      >
                        <ExternalLink className="w-4 h-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          {filteredIntegrations.length === 0 && (
            <div className="text-center py-8 text-muted-foreground" data-testid="empty-integrations">
              No integrations match your search criteria.
            </div>
          )}

          {/* Help Section */}
          <Card className="mt-8">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="w-5 h-5 text-blue-500" />
                Security & Privacy
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                <div className="flex items-start gap-2">
                  <Shield className="w-4 h-4 text-green-600 mt-0.5" />
                  <div>
                    <div className="font-medium">Secure Connections</div>
                    <div className="text-muted-foreground">All integrations use OAuth 2.0 and encrypted connections</div>
                  </div>
                </div>
                <div className="flex items-start gap-2">
                  <Globe className="w-4 h-4 text-blue-600 mt-0.5" />
                  <div>
                    <div className="font-medium">Data Privacy</div>
                    <div className="text-muted-foreground">Your data is never stored on third-party servers</div>
                  </div>
                </div>
                <div className="flex items-start gap-2">
                  <Clock className="w-4 h-4 text-purple-600 mt-0.5" />
                  <div>
                    <div className="font-medium">Real-time Sync</div>
                    <div className="text-muted-foreground">Changes sync instantly across all connected apps</div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}