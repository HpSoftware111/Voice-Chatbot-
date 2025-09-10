import { Button } from '@/components/ui/button';
import { Check, Square, Download, ExternalLink, CheckSquare } from 'lucide-react';
import { SiNotion, SiTrello, SiSlack } from 'react-icons/si';
import { Mail } from 'lucide-react';
import type { ActionItem } from '@shared/schema';

interface ActionItemsPanelProps {
  actionItems: ActionItem[];
  onToggleActionItem: (id: string) => void;
  onExportActionItems: () => void;
  onExportTo: (platform: string) => void;
}

export function ActionItemsPanel({ 
  actionItems, 
  onToggleActionItem, 
  onExportActionItems,
  onExportTo 
}: ActionItemsPanelProps) {
  const exportPlatforms = [
    { name: 'notion', label: 'Export to Notion', icon: SiNotion, color: 'text-black' },
    { name: 'trello', label: 'Export to Trello', icon: SiTrello, color: 'text-blue-600' },
    { name: 'slack', label: 'Send to Slack', icon: SiSlack, color: 'text-purple-600' },
    { name: 'email', label: 'Email Summary', icon: Mail, color: 'text-red-500' }
  ];

  // Mock insights data - in production this would come from props or API
  const insights = {
    keyTopics: ['Q4 Strategy', 'Analytics', 'Holiday Campaign'],
    sentiment: 'Positive and collaborative tone throughout the meeting',
    nextSteps: '3 action items identified, 2 follow-up meetings suggested'
  };

  return (
    <div className="w-96 p-6" data-testid="action-items-panel">
      <div className="space-y-6">
        {/* Action Items */}
        <div className="bg-card rounded-lg border border-border">
          <div className="p-4 border-b border-border">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-foreground" data-testid="action-items-title">
                Action Items
              </h3>
              <span className="bg-accent/10 text-accent px-2 py-1 rounded-full text-xs font-medium">
                Auto-detected
              </span>
            </div>
          </div>
          
          <div className="p-4 space-y-3" data-testid="action-items-list">
            {actionItems.length === 0 ? (
              <div className="text-center text-muted-foreground py-4" data-testid="empty-action-items">
                <CheckSquare className="w-8 h-8 mx-auto mb-2 opacity-50" />
                <p>No action items detected yet...</p>
              </div>
            ) : (
              actionItems.map((item) => (
                <div 
                  key={item.id} 
                  className="action-item p-3 rounded-md"
                  data-testid={`action-item-${item.id}`}
                >
                  <div className="flex items-start justify-between mb-2">
                    <h4 className="font-medium text-foreground text-sm" data-testid={`action-title-${item.id}`}>
                      {item.title}
                    </h4>
                    <button 
                      className="text-muted-foreground hover:text-foreground"
                      onClick={() => onToggleActionItem(item.id)}
                      data-testid={`button-toggle-${item.id}`}
                    >
                      {item.isCompleted ? (
                        <Check className="w-4 h-4 text-accent" />
                      ) : (
                        <Square className="w-4 h-4" />
                      )}
                    </button>
                  </div>
                  {item.description && (
                    <p className="text-sm text-muted-foreground mb-2" data-testid={`action-description-${item.id}`}>
                      {item.description}
                    </p>
                  )}
                  <div className="flex items-center justify-between text-xs">
                    {item.assignedTo && (
                      <span className="text-muted-foreground" data-testid={`action-assignee-${item.id}`}>
                        Assigned: {item.assignedTo}
                      </span>
                    )}
                    {item.dueDate && (
                      <span className="text-muted-foreground" data-testid={`action-due-${item.id}`}>
                        Due: {item.dueDate}
                      </span>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
          
          {actionItems.length > 0 && (
            <div className="p-4 border-t border-border">
              <Button 
                className="w-full"
                onClick={onExportActionItems}
                data-testid="button-export-action-items"
              >
                <Download className="w-4 h-4 mr-2" />
                Export to Task Manager
              </Button>
            </div>
          )}
        </div>

        {/* Meeting Insights */}
        <div className="bg-card rounded-lg border border-border">
          <div className="p-4 border-b border-border">
            <h3 className="font-semibold text-foreground" data-testid="insights-title">
              AI Insights
            </h3>
          </div>
          
          <div className="p-4 space-y-4" data-testid="insights-content">
            <div className="bg-blue-50 border-l-4 border-blue-400 p-3 rounded-r-md">
              <h4 className="font-medium text-blue-900 text-sm mb-1">Key Topics</h4>
              <div className="flex flex-wrap gap-1" data-testid="key-topics">
                {insights.keyTopics.map((topic, index) => (
                  <span 
                    key={index}
                    className="bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-xs"
                    data-testid={`topic-${index}`}
                  >
                    {topic}
                  </span>
                ))}
              </div>
            </div>
            
            <div className="bg-green-50 border-l-4 border-green-400 p-3 rounded-r-md">
              <h4 className="font-medium text-green-900 text-sm mb-1">Sentiment Analysis</h4>
              <p className="text-green-700 text-sm" data-testid="sentiment-analysis">
                {insights.sentiment}
              </p>
            </div>
            
            <div className="bg-yellow-50 border-l-4 border-yellow-400 p-3 rounded-r-md">
              <h4 className="font-medium text-yellow-900 text-sm mb-1">Next Steps</h4>
              <p className="text-yellow-700 text-sm" data-testid="next-steps">
                {insights.nextSteps}
              </p>
            </div>
          </div>
        </div>

        {/* Integration Quick Actions */}
        <div className="bg-card rounded-lg border border-border">
          <div className="p-4 border-b border-border">
            <h3 className="font-semibold text-foreground" data-testid="export-title">
              Quick Export
            </h3>
          </div>
          
          <div className="p-4 space-y-2" data-testid="export-options">
            {exportPlatforms.map((platform) => {
              const IconComponent = platform.icon;
              return (
                <button
                  key={platform.name}
                  onClick={() => onExportTo(platform.name)}
                  className="w-full flex items-center space-x-3 p-3 bg-muted hover:bg-muted/80 rounded-md text-sm transition-colors"
                  data-testid={`button-export-${platform.name}`}
                >
                  <IconComponent className={`text-xl ${platform.color}`} />
                  <span className="font-medium">{platform.label}</span>
                  <ExternalLink className="w-4 h-4 ml-auto text-muted-foreground" />
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
