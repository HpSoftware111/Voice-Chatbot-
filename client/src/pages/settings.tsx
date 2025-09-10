import { useState } from 'react';
import { Header } from '@/components/header';
import { Sidebar } from '@/components/sidebar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  User, 
  Bell, 
  Shield, 
  Mic, 
  Palette, 
  Globe, 
  Database,
  Download,
  Trash2,
  Save,
  Key,
  Volume2
} from 'lucide-react';
import { useWebSocket } from '@/hooks/use-websocket';
import { useToast } from '@/hooks/use-toast';

export default function Settings() {
  const [currentUser, setCurrentUser] = useState({
    id: "user_1",
    name: "John Smith",
    initials: "JS",
    role: "Newsletter Publisher",
    email: "john.smith@example.com",
    timezone: "America/New_York"
  });

  const [settings, setSettings] = useState({
    // Profile settings
    profile: {
      name: currentUser.name,
      email: currentUser.email,
      role: currentUser.role,
      timezone: currentUser.timezone,
      language: 'en-US'
    },
    // Notification settings
    notifications: {
      emailSummaries: true,
      actionItemReminders: true,
      meetingStarted: false,
      weeklyReports: true,
      mentionAlerts: true,
      browserNotifications: true
    },
    // Audio & Recording settings
    audio: {
      autoRecord: true,
      enhanceAudio: true,
      speakerDetection: true,
      backgroundNoiseReduction: true,
      audioQuality: 'high',
      microphoneGain: 75
    },
    // AI & Transcription settings
    ai: {
      autoActionItems: true,
      sentimentAnalysis: true,
      keywordExtraction: true,
      summaryLength: 'medium',
      confidenceThreshold: 85,
      brandTone: 'professional'
    },
    // Privacy & Security settings
    privacy: {
      dataRetention: '90days',
      shareAnalytics: false,
      encryptTranscriptions: true,
      autoDelete: false,
      exportAccess: 'owner-only'
    },
    // Appearance settings
    appearance: {
      theme: 'system',
      compactMode: false,
      showTimestamps: true,
      colorCodeSpeakers: true,
      fontSize: 'medium'
    }
  });

  const { connectionState, activeUsers } = useWebSocket({ autoConnect: false });
  const { toast } = useToast();

  const handleSettingChange = (category: string, key: string, value: any) => {
    setSettings(prev => ({
      ...prev,
      [category]: {
        ...prev[category as keyof typeof prev],
        [key]: value
      }
    }));
  };

  const handleSaveSettings = () => {
    // In a real app, this would send settings to the backend
    toast({
      title: "Settings Saved",
      description: "Your preferences have been updated successfully"
    });
  };

  const handleExportData = () => {
    toast({
      title: "Export Started",
      description: "Your data export will be ready shortly"
    });
  };

  const handleDeleteAccount = () => {
    toast({
      title: "Account Deletion",
      description: "Please contact support to delete your account",
      variant: "destructive"
    });
  };

  return (
    <div className="min-h-screen flex" data-testid="settings-page">
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
              Settings
            </h1>
            <p className="text-muted-foreground" data-testid="page-description">
              Customize your MeetingFlow experience and manage your preferences
            </p>
          </div>

          <Tabs defaultValue="profile" className="space-y-6">
            <TabsList className="grid w-full grid-cols-6">
              <TabsTrigger value="profile" data-testid="tab-profile">
                <User className="w-4 h-4 mr-2" />
                Profile
              </TabsTrigger>
              <TabsTrigger value="notifications" data-testid="tab-notifications">
                <Bell className="w-4 h-4 mr-2" />
                Notifications
              </TabsTrigger>
              <TabsTrigger value="audio" data-testid="tab-audio">
                <Mic className="w-4 h-4 mr-2" />
                Audio
              </TabsTrigger>
              <TabsTrigger value="ai" data-testid="tab-ai">
                <Palette className="w-4 h-4 mr-2" />
                AI & Analysis
              </TabsTrigger>
              <TabsTrigger value="privacy" data-testid="tab-privacy">
                <Shield className="w-4 h-4 mr-2" />
                Privacy
              </TabsTrigger>
              <TabsTrigger value="appearance" data-testid="tab-appearance">
                <Globe className="w-4 h-4 mr-2" />
                Appearance
              </TabsTrigger>
            </TabsList>

            {/* Profile Tab */}
            <TabsContent value="profile">
              <Card>
                <CardHeader>
                  <CardTitle>Profile Information</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium mb-2 block">Full Name</label>
                      <Input
                        value={settings.profile.name}
                        onChange={(e) => handleSettingChange('profile', 'name', e.target.value)}
                        data-testid="input-profile-name"
                      />
                    </div>
                    <div>
                      <label className="text-sm font-medium mb-2 block">Email</label>
                      <Input
                        type="email"
                        value={settings.profile.email}
                        onChange={(e) => handleSettingChange('profile', 'email', e.target.value)}
                        data-testid="input-profile-email"
                      />
                    </div>
                    <div>
                      <label className="text-sm font-medium mb-2 block">Role</label>
                      <select
                        value={settings.profile.role}
                        onChange={(e) => handleSettingChange('profile', 'role', e.target.value)}
                        className="w-full px-3 py-2 border border-input rounded-md bg-background text-foreground"
                        data-testid="select-profile-role"
                      >
                        <option value="Newsletter Publisher">Newsletter Publisher</option>
                        <option value="Content Creator">Content Creator</option>
                        <option value="Marketing Manager">Marketing Manager</option>
                        <option value="Team Lead">Team Lead</option>
                        <option value="Other">Other</option>
                      </select>
                    </div>
                    <div>
                      <label className="text-sm font-medium mb-2 block">Timezone</label>
                      <select
                        value={settings.profile.timezone}
                        onChange={(e) => handleSettingChange('profile', 'timezone', e.target.value)}
                        className="w-full px-3 py-2 border border-input rounded-md bg-background text-foreground"
                        data-testid="select-profile-timezone"
                      >
                        <option value="America/New_York">Eastern Time</option>
                        <option value="America/Chicago">Central Time</option>
                        <option value="America/Denver">Mountain Time</option>
                        <option value="America/Los_Angeles">Pacific Time</option>
                        <option value="Europe/London">GMT</option>
                        <option value="Europe/Paris">Central European Time</option>
                      </select>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Notifications Tab */}
            <TabsContent value="notifications">
              <Card>
                <CardHeader>
                  <CardTitle>Notification Preferences</CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="font-medium">Email Summaries</div>
                        <div className="text-sm text-muted-foreground">Receive meeting summaries via email</div>
                      </div>
                      <Switch
                        checked={settings.notifications.emailSummaries}
                        onCheckedChange={(checked) => handleSettingChange('notifications', 'emailSummaries', checked)}
                        data-testid="switch-email-summaries"
                      />
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="font-medium">Action Item Reminders</div>
                        <div className="text-sm text-muted-foreground">Get reminded about pending action items</div>
                      </div>
                      <Switch
                        checked={settings.notifications.actionItemReminders}
                        onCheckedChange={(checked) => handleSettingChange('notifications', 'actionItemReminders', checked)}
                        data-testid="switch-action-reminders"
                      />
                    </div>

                    <div className="flex items-center justify-between">
                      <div>
                        <div className="font-medium">Meeting Started</div>
                        <div className="text-sm text-muted-foreground">Notify when someone starts a meeting</div>
                      </div>
                      <Switch
                        checked={settings.notifications.meetingStarted}
                        onCheckedChange={(checked) => handleSettingChange('notifications', 'meetingStarted', checked)}
                        data-testid="switch-meeting-started"
                      />
                    </div>

                    <div className="flex items-center justify-between">
                      <div>
                        <div className="font-medium">Weekly Reports</div>
                        <div className="text-sm text-muted-foreground">Receive weekly productivity insights</div>
                      </div>
                      <Switch
                        checked={settings.notifications.weeklyReports}
                        onCheckedChange={(checked) => handleSettingChange('notifications', 'weeklyReports', checked)}
                        data-testid="switch-weekly-reports"
                      />
                    </div>

                    <div className="flex items-center justify-between">
                      <div>
                        <div className="font-medium">Browser Notifications</div>
                        <div className="text-sm text-muted-foreground">Show desktop notifications</div>
                      </div>
                      <Switch
                        checked={settings.notifications.browserNotifications}
                        onCheckedChange={(checked) => handleSettingChange('notifications', 'browserNotifications', checked)}
                        data-testid="switch-browser-notifications"
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Audio Tab */}
            <TabsContent value="audio">
              <Card>
                <CardHeader>
                  <CardTitle>Audio & Recording Settings</CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="font-medium">Auto Record Meetings</div>
                        <div className="text-sm text-muted-foreground">Automatically start recording when meeting begins</div>
                      </div>
                      <Switch
                        checked={settings.audio.autoRecord}
                        onCheckedChange={(checked) => handleSettingChange('audio', 'autoRecord', checked)}
                        data-testid="switch-auto-record"
                      />
                    </div>

                    <div className="flex items-center justify-between">
                      <div>
                        <div className="font-medium">Enhanced Audio Processing</div>
                        <div className="text-sm text-muted-foreground">Use AI to improve audio quality</div>
                      </div>
                      <Switch
                        checked={settings.audio.enhanceAudio}
                        onCheckedChange={(checked) => handleSettingChange('audio', 'enhanceAudio', checked)}
                        data-testid="switch-enhance-audio"
                      />
                    </div>

                    <div className="flex items-center justify-between">
                      <div>
                        <div className="font-medium">Speaker Detection</div>
                        <div className="text-sm text-muted-foreground">Automatically identify different speakers</div>
                      </div>
                      <Switch
                        checked={settings.audio.speakerDetection}
                        onCheckedChange={(checked) => handleSettingChange('audio', 'speakerDetection', checked)}
                        data-testid="switch-speaker-detection"
                      />
                    </div>

                    <div>
                      <label className="text-sm font-medium mb-2 block">Audio Quality</label>
                      <select
                        value={settings.audio.audioQuality}
                        onChange={(e) => handleSettingChange('audio', 'audioQuality', e.target.value)}
                        className="w-full px-3 py-2 border border-input rounded-md bg-background text-foreground"
                        data-testid="select-audio-quality"
                      >
                        <option value="low">Low (faster processing)</option>
                        <option value="medium">Medium (balanced)</option>
                        <option value="high">High (best accuracy)</option>
                      </select>
                    </div>

                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <label className="text-sm font-medium">Microphone Gain</label>
                        <span className="text-sm text-muted-foreground">{settings.audio.microphoneGain}%</span>
                      </div>
                      <input
                        type="range"
                        min="0"
                        max="100"
                        value={settings.audio.microphoneGain}
                        onChange={(e) => handleSettingChange('audio', 'microphoneGain', parseInt(e.target.value))}
                        className="w-full"
                        data-testid="slider-microphone-gain"
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* AI Tab */}
            <TabsContent value="ai">
              <Card>
                <CardHeader>
                  <CardTitle>AI & Analysis Settings</CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="font-medium">Auto Action Item Detection</div>
                        <div className="text-sm text-muted-foreground">Automatically extract action items from conversations</div>
                      </div>
                      <Switch
                        checked={settings.ai.autoActionItems}
                        onCheckedChange={(checked) => handleSettingChange('ai', 'autoActionItems', checked)}
                        data-testid="switch-auto-action-items"
                      />
                    </div>

                    <div className="flex items-center justify-between">
                      <div>
                        <div className="font-medium">Sentiment Analysis</div>
                        <div className="text-sm text-muted-foreground">Analyze meeting tone and participant engagement</div>
                      </div>
                      <Switch
                        checked={settings.ai.sentimentAnalysis}
                        onCheckedChange={(checked) => handleSettingChange('ai', 'sentimentAnalysis', checked)}
                        data-testid="switch-sentiment-analysis"
                      />
                    </div>

                    <div className="flex items-center justify-between">
                      <div>
                        <div className="font-medium">Keyword Extraction</div>
                        <div className="text-sm text-muted-foreground">Identify key topics and themes</div>
                      </div>
                      <Switch
                        checked={settings.ai.keywordExtraction}
                        onCheckedChange={(checked) => handleSettingChange('ai', 'keywordExtraction', checked)}
                        data-testid="switch-keyword-extraction"
                      />
                    </div>

                    <div>
                      <label className="text-sm font-medium mb-2 block">Summary Length</label>
                      <select
                        value={settings.ai.summaryLength}
                        onChange={(e) => handleSettingChange('ai', 'summaryLength', e.target.value)}
                        className="w-full px-3 py-2 border border-input rounded-md bg-background text-foreground"
                        data-testid="select-summary-length"
                      >
                        <option value="brief">Brief (1-2 sentences)</option>
                        <option value="medium">Medium (1 paragraph)</option>
                        <option value="detailed">Detailed (multiple paragraphs)</option>
                      </select>
                    </div>

                    <div>
                      <label className="text-sm font-medium mb-2 block">Brand Tone</label>
                      <select
                        value={settings.ai.brandTone}
                        onChange={(e) => handleSettingChange('ai', 'brandTone', e.target.value)}
                        className="w-full px-3 py-2 border border-input rounded-md bg-background text-foreground"
                        data-testid="select-brand-tone"
                      >
                        <option value="professional">Professional</option>
                        <option value="casual">Casual</option>
                        <option value="friendly">Friendly</option>
                        <option value="formal">Formal</option>
                        <option value="creative">Creative</option>
                      </select>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Privacy Tab */}
            <TabsContent value="privacy">
              <Card>
                <CardHeader>
                  <CardTitle>Privacy & Security</CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="space-y-4">
                    <div>
                      <label className="text-sm font-medium mb-2 block">Data Retention</label>
                      <select
                        value={settings.privacy.dataRetention}
                        onChange={(e) => handleSettingChange('privacy', 'dataRetention', e.target.value)}
                        className="w-full px-3 py-2 border border-input rounded-md bg-background text-foreground"
                        data-testid="select-data-retention"
                      >
                        <option value="30days">30 days</option>
                        <option value="90days">90 days</option>
                        <option value="1year">1 year</option>
                        <option value="indefinite">Indefinite</option>
                      </select>
                    </div>

                    <div className="flex items-center justify-between">
                      <div>
                        <div className="font-medium">Encrypt Transcriptions</div>
                        <div className="text-sm text-muted-foreground">Use end-to-end encryption for all recordings</div>
                      </div>
                      <Switch
                        checked={settings.privacy.encryptTranscriptions}
                        onCheckedChange={(checked) => handleSettingChange('privacy', 'encryptTranscriptions', checked)}
                        data-testid="switch-encrypt-transcriptions"
                      />
                    </div>

                    <div className="flex items-center justify-between">
                      <div>
                        <div className="font-medium">Share Usage Analytics</div>
                        <div className="text-sm text-muted-foreground">Help improve MeetingFlow by sharing anonymous usage data</div>
                      </div>
                      <Switch
                        checked={settings.privacy.shareAnalytics}
                        onCheckedChange={(checked) => handleSettingChange('privacy', 'shareAnalytics', checked)}
                        data-testid="switch-share-analytics"
                      />
                    </div>

                    <div className="flex items-center justify-between">
                      <div>
                        <div className="font-medium">Auto Delete Old Meetings</div>
                        <div className="text-sm text-muted-foreground">Automatically delete meetings after retention period</div>
                      </div>
                      <Switch
                        checked={settings.privacy.autoDelete}
                        onCheckedChange={(checked) => handleSettingChange('privacy', 'autoDelete', checked)}
                        data-testid="switch-auto-delete"
                      />
                    </div>
                  </div>

                  <div className="pt-4 border-t">
                    <div className="space-y-3">
                      <Button
                        variant="outline"
                        onClick={handleExportData}
                        className="w-full justify-start"
                        data-testid="button-export-data"
                      >
                        <Download className="w-4 h-4 mr-2" />
                        Export My Data
                      </Button>
                      <Button
                        variant="destructive"
                        onClick={handleDeleteAccount}
                        className="w-full justify-start"
                        data-testid="button-delete-account"
                      >
                        <Trash2 className="w-4 h-4 mr-2" />
                        Delete Account
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Appearance Tab */}
            <TabsContent value="appearance">
              <Card>
                <CardHeader>
                  <CardTitle>Appearance & Display</CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="space-y-4">
                    <div>
                      <label className="text-sm font-medium mb-2 block">Theme</label>
                      <select
                        value={settings.appearance.theme}
                        onChange={(e) => handleSettingChange('appearance', 'theme', e.target.value)}
                        className="w-full px-3 py-2 border border-input rounded-md bg-background text-foreground"
                        data-testid="select-theme"
                      >
                        <option value="light">Light</option>
                        <option value="dark">Dark</option>
                        <option value="system">System</option>
                      </select>
                    </div>

                    <div>
                      <label className="text-sm font-medium mb-2 block">Font Size</label>
                      <select
                        value={settings.appearance.fontSize}
                        onChange={(e) => handleSettingChange('appearance', 'fontSize', e.target.value)}
                        className="w-full px-3 py-2 border border-input rounded-md bg-background text-foreground"
                        data-testid="select-font-size"
                      >
                        <option value="small">Small</option>
                        <option value="medium">Medium</option>
                        <option value="large">Large</option>
                      </select>
                    </div>

                    <div className="flex items-center justify-between">
                      <div>
                        <div className="font-medium">Compact Mode</div>
                        <div className="text-sm text-muted-foreground">Use smaller spacing and elements</div>
                      </div>
                      <Switch
                        checked={settings.appearance.compactMode}
                        onCheckedChange={(checked) => handleSettingChange('appearance', 'compactMode', checked)}
                        data-testid="switch-compact-mode"
                      />
                    </div>

                    <div className="flex items-center justify-between">
                      <div>
                        <div className="font-medium">Show Timestamps</div>
                        <div className="text-sm text-muted-foreground">Display time for each message</div>
                      </div>
                      <Switch
                        checked={settings.appearance.showTimestamps}
                        onCheckedChange={(checked) => handleSettingChange('appearance', 'showTimestamps', checked)}
                        data-testid="switch-show-timestamps"
                      />
                    </div>

                    <div className="flex items-center justify-between">
                      <div>
                        <div className="font-medium">Color Code Speakers</div>
                        <div className="text-sm text-muted-foreground">Use different colors for each speaker</div>
                      </div>
                      <Switch
                        checked={settings.appearance.colorCodeSpeakers}
                        onCheckedChange={(checked) => handleSettingChange('appearance', 'colorCodeSpeakers', checked)}
                        data-testid="switch-color-speakers"
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>

          {/* Save Button */}
          <div className="flex justify-end">
            <Button onClick={handleSaveSettings} data-testid="button-save-settings">
              <Save className="w-4 h-4 mr-2" />
              Save All Settings
            </Button>
          </div>
        </div>
      </main>
    </div>
  );
}