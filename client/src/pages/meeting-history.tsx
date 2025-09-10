import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Header } from '@/components/header';
import { Sidebar } from '@/components/sidebar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Search, 
  Calendar, 
  Clock, 
  Users, 
  FileText, 
  CheckSquare,
  TrendingUp,
  Download,
  Eye
} from 'lucide-react';
import { useWebSocket } from '@/hooks/use-websocket';
import { apiRequest } from '@/lib/queryClient';
import type { Meeting } from '@shared/schema';

export default function MeetingHistory() {
  const [currentUser] = useState({
    id: "user_1",
    name: "John Smith",
    initials: "JS",
    role: "Newsletter Publisher"
  });

  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');

  const { connectionState, activeUsers } = useWebSocket({ autoConnect: false });

  // Fetch meetings data
  const { data: meetings = [], isLoading } = useQuery({
    queryKey: ['/api/users', currentUser.id, 'meetings'],
    queryFn: async () => {
      const response = await apiRequest('GET', `/api/users/${currentUser.id}/meetings`);
      return response.json();
    }
  });

  const filteredMeetings = meetings.filter((meeting: Meeting) => {
    const matchesSearch = meeting.title.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter = filterStatus === 'all' || meeting.status === filterStatus;
    return matchesSearch && matchesFilter;
  });

  const handleViewMeeting = (meetingId: string) => {
    window.open(`/meeting/${meetingId}`, '_blank');
  };

  const handleExportMeeting = async (meetingId: string) => {
    try {
      const response = await apiRequest('POST', `/api/meetings/${meetingId}/export`, {
        platform: 'json'
      });
      const result = await response.json();
      
      // Create download link
      const dataStr = JSON.stringify(result.data, null, 2);
      const dataBlob = new Blob([dataStr], { type: 'application/json' });
      const url = URL.createObjectURL(dataBlob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `meeting-${meetingId}-export.json`;
      link.click();
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Export failed:', error);
    }
  };

  const formatDuration = (seconds: number | null) => {
    if (!seconds) return '0:00';
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    
    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${minutes}:${secs.toString().padStart(2, '0')}`;
  };

  const getStatusColor = (status: string | null) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800';
      case 'completed': return 'bg-blue-100 text-blue-800';
      case 'paused': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="min-h-screen flex" data-testid="meeting-history">
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
              Meeting History
            </h1>
            <p className="text-muted-foreground" data-testid="page-description">
              Review past meetings, transcriptions, and extracted insights
            </p>
          </div>

          {/* Search and Filters */}
          <div className="flex gap-4 mb-6">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
              <Input
                placeholder="Search meetings..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
                data-testid="input-search-meetings"
              />
            </div>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="px-3 py-2 border border-input rounded-md bg-background text-foreground"
              data-testid="select-filter-status"
            >
              <option value="all">All Status</option>
              <option value="active">Active</option>
              <option value="completed">Completed</option>
              <option value="paused">Paused</option>
            </select>
          </div>

          {/* Analytics Overview */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Total Meetings</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold" data-testid="stat-total-meetings">
                  {meetings.length}
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Completed</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold" data-testid="stat-completed-meetings">
                  {meetings.filter((m: Meeting) => m.status === 'completed').length}
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Total Duration</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold" data-testid="stat-total-duration">
                  {formatDuration(meetings.reduce((acc: number, m: Meeting) => acc + (m.duration || 0), 0))}
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">This Month</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold" data-testid="stat-month-meetings">
                  {meetings.filter((m: Meeting) => {
                    const meetingDate = new Date(m.startTime || '');
                    const now = new Date();
                    return meetingDate.getMonth() === now.getMonth() && 
                           meetingDate.getFullYear() === now.getFullYear();
                  }).length}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Meetings List */}
          <div className="space-y-4" data-testid="meetings-list">
            {isLoading ? (
              <div className="text-center py-8 text-muted-foreground">
                Loading meetings...
              </div>
            ) : filteredMeetings.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground" data-testid="empty-meetings">
                {searchTerm || filterStatus !== 'all' 
                  ? 'No meetings match your search criteria'
                  : 'No meetings found. Start your first meeting from the dashboard.'
                }
              </div>
            ) : (
              filteredMeetings.map((meeting: Meeting) => (
                <Card key={meeting.id} className="hover:shadow-md transition-shadow">
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="font-semibold text-foreground" data-testid={`meeting-title-${meeting.id}`}>
                            {meeting.title}
                          </h3>
                          <Badge className={getStatusColor(meeting.status)} data-testid={`meeting-status-${meeting.id}`}>
                            {meeting.status || 'unknown'}
                          </Badge>
                        </div>
                        
                        <div className="flex items-center gap-6 text-sm text-muted-foreground mb-3">
                          <div className="flex items-center gap-1">
                            <Calendar className="w-4 h-4" />
                            <span data-testid={`meeting-date-${meeting.id}`}>
                              {meeting.startTime ? new Date(meeting.startTime).toLocaleDateString() : 'No date'}
                            </span>
                          </div>
                          <div className="flex items-center gap-1">
                            <Clock className="w-4 h-4" />
                            <span data-testid={`meeting-duration-${meeting.id}`}>
                              {formatDuration(meeting.duration)}
                            </span>
                          </div>
                          <div className="flex items-center gap-1">
                            <Users className="w-4 h-4" />
                            <span data-testid={`meeting-speakers-${meeting.id}`}>
                              {meeting.speakerCount || 0} speakers
                            </span>
                          </div>
                        </div>

                        <div className="flex items-center gap-4 text-xs text-muted-foreground">
                          <div className="flex items-center gap-1">
                            <FileText className="w-3 h-3" />
                            <span>Transcription Available</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <CheckSquare className="w-3 h-3" />
                            <span>Action Items Extracted</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <TrendingUp className="w-3 h-3" />
                            <span>AI Insights Generated</span>
                          </div>
                        </div>
                      </div>

                      <div className="flex gap-2 ml-4">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleViewMeeting(meeting.id)}
                          data-testid={`button-view-${meeting.id}`}
                        >
                          <Eye className="w-4 h-4 mr-1" />
                          View
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleExportMeeting(meeting.id)}
                          data-testid={`button-export-${meeting.id}`}
                        >
                          <Download className="w-4 h-4 mr-1" />
                          Export
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </div>
      </main>
    </div>
  );
}