import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { 
  BarChart3, 
  Clock, 
  MessageSquare, 
  TrendingUp, 
  Users, 
  Target,
  Lightbulb,
  Activity,
  Zap,
  Calendar,
  MapPin,
  DollarSign
} from 'lucide-react';
import { getChatAnalytics, type ChatMessage } from '@/services/ai/smartChat';

interface ChatAnalyticsProps {
  messages: ChatMessage[];
  enquiryTitle?: string;
  enquiryCategory?: string;
  enquiryBudget?: string;
  enquiryLocation?: string;
  className?: string;
}

const ChatAnalytics: React.FC<ChatAnalyticsProps> = ({
  messages,
  enquiryTitle,
  enquiryCategory,
  enquiryBudget,
  enquiryLocation,
  className = ""
}) => {
  const [analytics, setAnalytics] = useState<any>(null);
  const [isExpanded, setIsExpanded] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Calculate analytics when messages change
  useEffect(() => {
    const calculateAnalytics = async () => {
      try {
        setIsLoading(true);
        const chatAnalytics = getChatAnalytics(messages);
        setAnalytics(chatAnalytics);
      } catch (error) {
        console.error('Failed to calculate chat analytics:', error);
        setAnalytics({
          totalMessages: messages.length,
          averageResponseTime: 0,
          responseRate: 0,
          engagementScore: 0,
          commonTopics: [],
          suggestedActions: ['Unable to analyze chat data']
        });
      } finally {
        setIsLoading(false);
      }
    };

    if (messages.length > 0) {
      calculateAnalytics();
    }
  }, [messages]);

  // Format response time
  const formatResponseTime = (ms: number): string => {
    if (ms === 0) return 'N/A';
    
    const minutes = Math.floor(ms / (1000 * 60));
    const hours = Math.floor(minutes / 60);
    
    if (hours > 0) {
      return `${hours}h ${minutes % 60}m`;
    } else if (minutes > 0) {
      return `${minutes}m`;
    } else {
      return '< 1m';
    }
  };

  // Get engagement color
  const getEngagementColor = (score: number): string => {
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-yellow-600';
    if (score >= 40) return 'text-orange-600';
    return 'text-red-600';
  };

  // Get engagement label
  const getEngagementLabel = (score: number): string => {
    if (score >= 80) return 'Excellent';
    if (score >= 60) return 'Good';
    if (score >= 40) return 'Fair';
    return 'Poor';
  };

  if (!analytics || messages.length === 0) {
    return (
      <Card className={`${className}`}>
        <CardHeader className="pb-3">
          <div className="flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-slate-600" />
            <h3 className="text-lg font-semibold text-slate-800">Chat Analytics</h3>
          </div>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-slate-500">
            <MessageSquare className="w-12 h-12 mx-auto mb-3 text-slate-300" />
            <p>No messages yet</p>
            <p className="text-sm">Start chatting to see analytics</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={`${className}`}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-slate-600" />
            <h3 className="text-lg font-semibold text-slate-800">Chat Analytics</h3>
            <Badge variant="secondary" className="text-xs">AI Powered</Badge>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsExpanded(!isExpanded)}
            className="h-8 px-3 text-xs"
          >
            {isExpanded ? 'Show Less' : 'Show More'}
          </Button>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Loading State */}
        {isLoading && (
          <div className="flex items-center justify-center py-4">
            <div className="w-6 h-6 border-2 border-slate-300 border-t-pal-blue rounded-full animate-spin" />
            <span className="ml-2 text-sm text-slate-500">Analyzing chat...</span>
          </div>
        )}

        {/* Basic Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Total Messages */}
          <div className="text-center p-3 bg-blue-50 rounded-lg border border-blue-200">
            <MessageSquare className="w-6 h-6 mx-auto mb-2 text-blue-600" />
            <div className="text-2xl font-bold text-blue-800">{analytics.totalMessages}</div>
            <div className="text-xs text-blue-600">Total Messages</div>
          </div>

          {/* Response Time */}
          <div className="text-center p-3 bg-green-50 rounded-lg border border-green-200">
            <Clock className="w-6 h-6 mx-auto mb-2 text-green-600" />
            <div className="text-lg font-bold text-green-800">
              {formatResponseTime(analytics.averageResponseTime)}
            </div>
            <div className="text-xs text-green-600">Avg Response</div>
          </div>

          {/* Response Rate */}
          <div className="text-center p-3 bg-purple-50 rounded-lg border border-purple-200">
            <Users className="w-6 h-6 mx-auto mb-2 text-purple-600" />
            <div className="text-lg font-bold text-purple-800">
              {analytics.responseRate.toFixed(1)}
            </div>
            <div className="text-xs text-purple-600">Response Rate</div>
          </div>

          {/* Engagement Score */}
          <div className="text-center p-3 bg-amber-50 rounded-lg border border-amber-200">
            <TrendingUp className="w-6 h-6 mx-auto mb-2 text-amber-600" />
            <div className={`text-lg font-bold ${getEngagementColor(analytics.engagementScore)}`}>
              {analytics.engagementScore}
            </div>
            <div className="text-xs text-amber-600">Engagement</div>
          </div>
        </div>

        {/* Engagement Progress */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-slate-600">Engagement Level</span>
            <span className={`font-medium ${getEngagementColor(analytics.engagementScore)}`}>
              {getEngagementLabel(analytics.engagementScore)}
            </span>
          </div>
          <Progress 
            value={analytics.engagementScore} 
            className="h-2"
            indicatorClassName={analytics.engagementScore >= 80 ? 'bg-green-500' : 
                              analytics.engagementScore >= 60 ? 'bg-yellow-500' : 
                              analytics.engagementScore >= 40 ? 'bg-orange-500' : 'bg-red-500'}
          />
        </div>

        {/* Enquiry Context */}
        {(enquiryTitle || enquiryCategory || enquiryBudget || enquiryLocation) && (
          <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
            <h4 className="text-sm font-medium text-slate-700 mb-2 flex items-center gap-2">
              <Target className="w-4 h-4" />
              Enquiry Context
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
              {enquiryTitle && (
                <div className="flex items-center gap-2">
                  <MessageSquare className="w-3 h-3 text-slate-500" />
                  <span className="text-slate-600">Title:</span>
                  <span className="font-medium truncate">{enquiryTitle}</span>
                </div>
              )}
              {enquiryCategory && (
                <div className="flex items-center gap-2">
                  <Target className="w-3 h-3 text-slate-500" />
                  <span className="text-slate-600">Category:</span>
                  <span className="font-medium">{enquiryCategory}</span>
                </div>
              )}
              {enquiryBudget && (
                <div className="flex items-center gap-2">
                  <DollarSign className="w-3 h-3 text-slate-500" />
                  <span className="text-slate-600">Budget:</span>
                  <span className="font-medium">{enquiryBudget}</span>
                </div>
              )}
              {enquiryLocation && (
                <div className="flex items-center gap-2">
                  <MapPin className="w-3 h-3 text-slate-500" />
                  <span className="text-slate-600">Location:</span>
                  <span className="font-medium">{enquiryLocation}</span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Expanded Analytics */}
        {isExpanded && (
          <div className="space-y-4 pt-4 border-t border-slate-200">
            {/* Common Topics */}
            {analytics.commonTopics.length > 0 && (
              <div className="space-y-2">
                <h4 className="text-sm font-medium text-slate-700 flex items-center gap-2">
                  <Activity className="w-4 h-4" />
                  Common Topics
                </h4>
                <div className="flex flex-wrap gap-2">
                  {analytics.commonTopics.map((topic: string, index: number) => (
                    <Badge key={index} variant="outline" className="text-xs">
                      {topic}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            {/* Suggested Actions */}
            {analytics.suggestedActions.length > 0 && (
              <div className="space-y-2">
                <h4 className="text-sm font-medium text-slate-700 flex items-center gap-2">
                  <Lightbulb className="w-4 h-4" />
                  Smart Suggestions
                </h4>
                <div className="space-y-2">
                  {analytics.suggestedActions.map((action: string, index: number) => (
                    <div key={index} className="flex items-center gap-2 p-2 bg-amber-50 rounded-lg border border-amber-200">
                      <Zap className="w-4 h-4 text-amber-600" />
                      <span className="text-sm text-amber-800">{action}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Chat Timeline */}
            <div className="space-y-2">
              <h4 className="text-sm font-medium text-slate-700 flex items-center gap-2">
                <Calendar className="w-4 h-4" />
                Chat Timeline
              </h4>
              <div className="text-xs text-slate-600 space-y-1">
                <div>Started: {messages[0]?.timestamp.toLocaleString()}</div>
                <div>Latest: {messages[messages.length - 1]?.timestamp.toLocaleString()}</div>
                <div>Duration: {formatResponseTime(
                  messages[messages.length - 1]?.timestamp.getTime() - messages[0]?.timestamp.getTime()
                )}</div>
              </div>
            </div>
          </div>
        )}

        {/* Quick Tips */}
        <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
          <div className="flex items-start gap-2">
            <Lightbulb className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" />
            <div className="text-xs text-blue-800">
              <p className="font-medium mb-1">💡 Pro Tips:</p>
              <ul className="space-y-1">
                <li>• Respond quickly to improve engagement</li>
                <li>• Ask questions to keep conversation flowing</li>
                <li>• Use templates for professional responses</li>
                <li>• Follow up on important discussions</li>
              </ul>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default ChatAnalytics;
