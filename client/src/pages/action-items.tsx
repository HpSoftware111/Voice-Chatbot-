import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Header } from '@/components/header';
import { Sidebar } from '@/components/sidebar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { 
  Search, 
  Filter, 
  CheckSquare, 
  Square, 
  Calendar, 
  User, 
  Plus,
  ExternalLink,
  Trash2
} from 'lucide-react';
import { SiNotion, SiTrello, SiSlack } from 'react-icons/si';
import { Mail } from 'lucide-react';
import { useWebSocket } from '@/hooks/use-websocket';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';
import type { ActionItem, Meeting } from '@shared/schema';

export default function ActionItemsPage() {
  const [currentUser] = useState({
    id: "user_1",
    name: "John Smith",
    initials: "JS",
    role: "Newsletter Publisher"
  });

  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filterAssignee, setFilterAssignee] = useState<string>('all');
  const [selectedItems, setSelectedItems] = useState<string[]>([]);

  const { connectionState, activeUsers } = useWebSocket({ autoConnect: false });
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch all meetings to get action items
  const { data: meetings = [], isLoading: meetingsLoading } = useQuery({
    queryKey: ['/api/users', currentUser.id, 'meetings'],
    queryFn: async () => {
      const response = await apiRequest('GET', `/api/users/${currentUser.id}/meetings`);
      return response.json();
    }
  });

  // Fetch action items for all meetings
  const { data: allActionItems = [], isLoading: itemsLoading } = useQuery({
    queryKey: ['/api/action-items'],
    queryFn: async () => {
      const items: ActionItem[] = [];
      for (const meeting of meetings) {
        try {
          const response = await apiRequest('GET', `/api/meetings/${meeting.id}/action-items`);
          const meetingItems = await response.json();
          items.push(...meetingItems);
        } catch (error) {
          console.error(`Failed to fetch action items for meeting ${meeting.id}:`, error);
        }
      }
      return items;
    },
    enabled: meetings.length > 0
  });

  // Update action item mutation
  const updateActionItemMutation = useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: Partial<ActionItem> }) => {
      const response = await apiRequest('PATCH', `/api/action-items/${id}`, updates);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/action-items'] });
      toast({
        title: "Action Item Updated",
        description: "Changes saved successfully"
      });
    },
    onError: (error) => {
      toast({
        title: "Update Failed",
        description: "Failed to update action item",
        variant: "destructive"
      });
    }
  });

  const filteredItems = allActionItems.filter((item: ActionItem) => {
    const matchesSearch = item.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (item.description && item.description.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesStatus = filterStatus === 'all' || 
                         (filterStatus === 'completed' && item.isCompleted) ||
                         (filterStatus === 'pending' && !item.isCompleted);
    const matchesAssignee = filterAssignee === 'all' || item.assignedTo === filterAssignee;
    
    return matchesSearch && matchesStatus && matchesAssignee;
  });

  const uniqueAssignees = Array.from(new Set(
    allActionItems.filter((item: ActionItem) => item.assignedTo)
      .map((item: ActionItem) => item.assignedTo)
  ));

  const handleToggleItem = (itemId: string) => {
    const item = allActionItems.find((item: ActionItem) => item.id === itemId);
    if (item) {
      updateActionItemMutation.mutate({
        id: itemId,
        updates: { 
          isCompleted: !item.isCompleted,
          status: !item.isCompleted ? 'completed' : 'pending'
        }
      });
    }
  };

  const handleSelectItem = (itemId: string, checked: boolean) => {
    if (checked) {
      setSelectedItems([...selectedItems, itemId]);
    } else {
      setSelectedItems(selectedItems.filter(id => id !== itemId));
    }
  };

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedItems(filteredItems.map((item: ActionItem) => item.id));
    } else {
      setSelectedItems([]);
    }
  };

  const handleBulkComplete = () => {
    selectedItems.forEach(itemId => {
      const item = allActionItems.find((item: ActionItem) => item.id === itemId);
      if (item && !item.isCompleted) {
        updateActionItemMutation.mutate({
          id: itemId,
          updates: { isCompleted: true, status: 'completed' }
        });
      }
    });
    setSelectedItems([]);
  };

  const handleExportTo = async (platform: string) => {
    try {
      const exportData = {
        platform,
        actionItems: selectedItems.length > 0 
          ? allActionItems.filter((item: ActionItem) => selectedItems.includes(item.id))
          : filteredItems,
        exportedAt: new Date().toISOString()
      };

      toast({
        title: "Export Started",
        description: `Exporting ${exportData.actionItems.length} action items to ${platform}`
      });
    } catch (error) {
      toast({
        title: "Export Failed",
        description: `Failed to export to ${platform}`,
        variant: "destructive"
      });
    }
  };

  const exportPlatforms = [
    { name: 'notion', label: 'Notion', icon: SiNotion, color: 'text-black' },
    { name: 'trello', label: 'Trello', icon: SiTrello, color: 'text-blue-600' },
    { name: 'slack', label: 'Slack', icon: SiSlack, color: 'text-purple-600' },
    { name: 'email', label: 'Email', icon: Mail, color: 'text-red-500' }
  ];

  const completedCount = allActionItems.filter((item: ActionItem) => item.isCompleted).length;
  const pendingCount = allActionItems.filter((item: ActionItem) => !item.isCompleted).length;

  return (
    <div className="min-h-screen flex" data-testid="action-items-page">
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
              Action Items
            </h1>
            <p className="text-muted-foreground" data-testid="page-description">
              Manage and track action items from all your meetings
            </p>
          </div>

          {/* Stats Overview */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Total Items</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold" data-testid="stat-total-items">
                  {allActionItems.length}
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Pending</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-yellow-600" data-testid="stat-pending-items">
                  {pendingCount}
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Completed</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600" data-testid="stat-completed-items">
                  {completedCount}
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Completion Rate</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold" data-testid="stat-completion-rate">
                  {allActionItems.length > 0 ? Math.round((completedCount / allActionItems.length) * 100) : 0}%
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Filters and Actions */}
          <div className="flex flex-wrap gap-4 mb-6">
            <div className="relative flex-1 min-w-64">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
              <Input
                placeholder="Search action items..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
                data-testid="input-search-items"
              />
            </div>
            
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="px-3 py-2 border border-input rounded-md bg-background text-foreground"
              data-testid="select-filter-status"
            >
              <option value="all">All Status</option>
              <option value="pending">Pending</option>
              <option value="completed">Completed</option>
            </select>

            <select
              value={filterAssignee}
              onChange={(e) => setFilterAssignee(e.target.value)}
              className="px-3 py-2 border border-input rounded-md bg-background text-foreground"
              data-testid="select-filter-assignee"
            >
              <option value="all">All Assignees</option>
              {uniqueAssignees.map((assignee) => (
                <option key={assignee || 'unassigned'} value={assignee || ''}>
                  {assignee || 'Unassigned'}
                </option>
              ))}
            </select>

            {selectedItems.length > 0 && (
              <div className="flex gap-2">
                <Button
                  onClick={handleBulkComplete}
                  data-testid="button-bulk-complete"
                >
                  Mark Complete ({selectedItems.length})
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setSelectedItems([])}
                  data-testid="button-clear-selection"
                >
                  Clear Selection
                </Button>
              </div>
            )}
          </div>

          {/* Bulk Actions */}
          {selectedItems.length > 0 && (
            <Card className="mb-6">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">
                    {selectedItems.length} items selected
                  </span>
                  <div className="flex gap-2">
                    {exportPlatforms.map((platform) => {
                      const IconComponent = platform.icon;
                      return (
                        <Button
                          key={platform.name}
                          variant="outline"
                          size="sm"
                          onClick={() => handleExportTo(platform.name)}
                          data-testid={`button-export-${platform.name}`}
                        >
                          <IconComponent className={`w-4 h-4 mr-1 ${platform.color}`} />
                          {platform.label}
                        </Button>
                      );
                    })}
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Action Items List */}
          <div className="space-y-4" data-testid="action-items-list">
            {itemsLoading || meetingsLoading ? (
              <div className="text-center py-8 text-muted-foreground">
                Loading action items...
              </div>
            ) : filteredItems.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground" data-testid="empty-action-items">
                {searchTerm || filterStatus !== 'all' || filterAssignee !== 'all'
                  ? 'No action items match your filters'
                  : 'No action items found. They will appear here as meetings generate them automatically.'
                }
              </div>
            ) : (
              <>
                {/* Select All Header */}
                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center gap-3">
                      <Checkbox
                        checked={filteredItems.length > 0 && selectedItems.length === filteredItems.length}
                        onCheckedChange={handleSelectAll}
                        data-testid="checkbox-select-all"
                      />
                      <span className="font-medium">
                        Select all {filteredItems.length} items
                      </span>
                    </div>
                  </CardContent>
                </Card>

                {filteredItems.map((item: ActionItem) => {
                  const meeting = meetings.find((m: Meeting) => m.id === item.meetingId);
                  const isSelected = selectedItems.includes(item.id);
                  
                  return (
                    <Card key={item.id} className={`transition-all ${isSelected ? 'ring-2 ring-primary' : ''}`}>
                      <CardContent className="p-4">
                        <div className="flex items-start gap-3">
                          <Checkbox
                            checked={isSelected}
                            onCheckedChange={(checked) => handleSelectItem(item.id, checked as boolean)}
                            data-testid={`checkbox-select-${item.id}`}
                          />
                          
                          <button
                            onClick={() => handleToggleItem(item.id)}
                            className="mt-1 text-muted-foreground hover:text-foreground"
                            data-testid={`button-toggle-${item.id}`}
                          >
                            {item.isCompleted ? (
                              <CheckSquare className="w-5 h-5 text-green-600" />
                            ) : (
                              <Square className="w-5 h-5" />
                            )}
                          </button>

                          <div className="flex-1">
                            <div className="flex items-start justify-between mb-2">
                              <h3 
                                className={`font-medium ${item.isCompleted ? 'line-through text-muted-foreground' : 'text-foreground'}`}
                                data-testid={`item-title-${item.id}`}
                              >
                                {item.title}
                              </h3>
                              <Badge 
                                className={item.isCompleted ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}
                                data-testid={`item-status-${item.id}`}
                              >
                                {item.isCompleted ? 'Completed' : 'Pending'}
                              </Badge>
                            </div>

                            {item.description && (
                              <p className="text-sm text-muted-foreground mb-3" data-testid={`item-description-${item.id}`}>
                                {item.description}
                              </p>
                            )}

                            <div className="flex items-center gap-6 text-xs text-muted-foreground">
                              {meeting && (
                                <div className="flex items-center gap-1">
                                  <Calendar className="w-3 h-3" />
                                  <span data-testid={`item-meeting-${item.id}`}>
                                    {meeting.title}
                                  </span>
                                </div>
                              )}
                              
                              {item.assignedTo && (
                                <div className="flex items-center gap-1">
                                  <User className="w-3 h-3" />
                                  <span data-testid={`item-assignee-${item.id}`}>
                                    {item.assignedTo}
                                  </span>
                                </div>
                              )}
                              
                              {item.dueDate && (
                                <div className="flex items-center gap-1">
                                  <Calendar className="w-3 h-3" />
                                  <span data-testid={`item-due-${item.id}`}>
                                    Due: {item.dueDate}
                                  </span>
                                </div>
                              )}

                              {item.extractedAt && (
                                <div className="flex items-center gap-1">
                                  <span data-testid={`item-extracted-${item.id}`}>
                                    Extracted: {new Date(item.extractedAt).toLocaleDateString()}
                                  </span>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}