import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Bot, 
  CheckCircle, 
  Clock, 
  AlertTriangle, 
  XCircle, 
  Activity,
  Settings,
  Play,
  Pause,
  RefreshCw
} from 'lucide-react';
import { backgroundAIService } from '@/services/ai/backgroundAI';
import { realtimeAI } from '@/services/ai/realtimeAI';
import { db } from '@/firebase';
import { collection, query, where, orderBy, onSnapshot, doc, updateDoc, serverTimestamp } from 'firebase/firestore';

interface AIStats {
  totalProcessed: number;
  autoApproved: number;
  flaggedForReview: number;
  autoRejected: number;
  averageConfidence: number;
  processingQueue: number;
}

interface AIActivity {
  id: string;
  type: 'enquiry' | 'profile' | 'response';
  action: 'approved' | 'flagged' | 'rejected';
  confidence: number;
  timestamp: Date;
  reason: string;
}

const AIApprovalDashboard: React.FC = () => {
  const [aiStats, setAiStats] = useState<AIStats>({
    totalProcessed: 0,
    autoApproved: 0,
    flaggedForReview: 0,
    autoRejected: 0,
    averageConfidence: 0,
    processingQueue: 0
  });
  
  const [recentActivity, setRecentActivity] = useState<AIActivity[]>([]);
  const [serviceStatus, setServiceStatus] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isAIModeEnabled, setIsAIModeEnabled] = useState(true);

  useEffect(() => {
    // Get initial service status
    setServiceStatus(backgroundAIService.getStatus());
    setIsAIModeEnabled(realtimeAI.isAIModeActive());

    // Monitor AI approval activities
    const q = query(
      collection(db, 'aiActivities'),
      orderBy('timestamp', 'desc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const activities = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        timestamp: doc.data().timestamp?.toDate() || new Date()
      })) as AIActivity[];

      setRecentActivity(activities.slice(0, 10)); // Show last 10 activities

      // Calculate stats
      const stats = activities.reduce((acc, activity) => {
        acc.totalProcessed++;
        acc.averageConfidence += activity.confidence;
        
        switch (activity.action) {
          case 'approved':
            acc.autoApproved++;
            break;
          case 'flagged':
            acc.flaggedForReview++;
            break;
          case 'rejected':
            acc.autoRejected++;
            break;
        }
        
        return acc;
      }, {
        totalProcessed: 0,
        autoApproved: 0,
        flaggedForReview: 0,
        autoRejected: 0,
        averageConfidence: 0,
        processingQueue: serviceStatus?.processingQueue?.length || 0
      });

      if (stats.totalProcessed > 0) {
        stats.averageConfidence = Math.round(stats.averageConfidence / stats.totalProcessed);
      }

      setAiStats(stats);
      setIsLoading(false);
    });

    // Update service status every 5 seconds
    const statusInterval = setInterval(() => {
      setServiceStatus(backgroundAIService.getStatus());
      setIsAIModeEnabled(realtimeAI.isAIModeActive());
    }, 5000);

    return () => {
      unsubscribe();
      clearInterval(statusInterval);
    };
  }, [serviceStatus?.processingQueue?.length]);

  const handleToggleService = () => {
    if (serviceStatus?.isRunning) {
      backgroundAIService.stop();
    } else {
      backgroundAIService.start();
    }
    setServiceStatus(backgroundAIService.getStatus());
  };

  const handleProcessExisting = () => {
    backgroundAIService.processExistingPendingItems();
  };

  const handleToggleAIMode = () => {
    const newMode = !isAIModeEnabled;
    realtimeAI.setAIMode(newMode);
    setIsAIModeEnabled(newMode);
  };

  const getActionIcon = (action: string) => {
    switch (action) {
      case 'approved':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'flagged':
        return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
      case 'rejected':
        return <XCircle className="h-4 w-4 text-red-500" />;
      default:
        return <Clock className="h-4 w-4 text-gray-500" />;
    }
  };

  const getActionColor = (action: string) => {
    switch (action) {
      case 'approved':
        return 'bg-green-100 text-green-800';
      case 'flagged':
        return 'bg-yellow-100 text-yellow-800';
      case 'rejected':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'enquiry':
        return '📝';
      case 'profile':
        return '👤';
      case 'response':
        return '💬';
      default:
        return '📄';
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <RefreshCw className="h-6 w-6 animate-spin" />
        <span className="ml-2">Loading AI Dashboard...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center space-x-3">
          <Bot className="h-6 w-6 sm:h-8 sm:w-8 text-blue-400" />
          <div>
            <h2 className="text-xl sm:text-2xl font-bold text-white">AI Approval Dashboard</h2>
            <p className="text-sm sm:text-base text-gray-400">Automated approval system monitoring</p>
          </div>
        </div>
        
        <div className="flex flex-wrap items-center gap-2 sm:gap-3">
          <Badge 
            variant={isAIModeEnabled ? "default" : "secondary"}
            className={isAIModeEnabled ? "bg-blue-900/30 text-blue-400 border border-blue-500/30" : "bg-black text-gray-400 border border-gray-900"}
          >
            <Bot className="h-3 w-3 mr-1" />
            {isAIModeEnabled ? 'AI Mode ON' : 'Manual Mode'}
          </Badge>
          
          <Badge 
            variant={serviceStatus?.isRunning ? "default" : "secondary"}
            className={serviceStatus?.isRunning ? "bg-green-900/30 text-green-400 border border-green-500/30" : "bg-black text-gray-400 border border-gray-900"}
          >
            <Activity className="h-3 w-3 mr-1" />
            {serviceStatus?.isRunning ? 'Running' : 'Stopped'}
          </Badge>
          
          <Button
            variant="outline"
            size="sm"
            onClick={handleToggleService}
            className="flex items-center space-x-1 sm:space-x-2 text-xs sm:text-sm border-gray-900 text-gray-300 hover:bg-black"
          >
            {serviceStatus?.isRunning ? (
              <>
                <Pause className="h-3 w-3 sm:h-4 sm:w-4" />
                <span className="hidden sm:inline">Pause AI</span>
                <span className="sm:hidden">Pause</span>
              </>
            ) : (
              <>
                <Play className="h-3 w-3 sm:h-4 sm:w-4" />
                <span className="hidden sm:inline">Start AI</span>
                <span className="sm:hidden">Start</span>
              </>
            )}
          </Button>
          
          <Button
            variant="outline"
            size="sm"
            onClick={handleProcessExisting}
            className="flex items-center space-x-1 sm:space-x-2 text-xs sm:text-sm border-gray-900 text-gray-300 hover:bg-black"
          >
            <RefreshCw className="h-3 w-3 sm:h-4 sm:w-4" />
            <span className="hidden sm:inline">Process Existing</span>
            <span className="sm:hidden">Process</span>
          </Button>
          
          <Button
            variant={isAIModeEnabled ? "default" : "outline"}
            size="sm"
            onClick={handleToggleAIMode}
            className={`flex items-center space-x-1 sm:space-x-2 text-xs sm:text-sm ${
              isAIModeEnabled 
                ? "bg-blue-600 hover:bg-blue-700 text-white" 
                : "border-blue-500 text-blue-400 hover:bg-blue-900/20"
            }`}
          >
            <Bot className="h-3 w-3 sm:h-4 sm:w-4" />
            <span className="hidden sm:inline">{isAIModeEnabled ? 'Disable AI' : 'Enable AI'}</span>
            <span className="sm:hidden">{isAIModeEnabled ? 'Disable' : 'Enable'}</span>
          </Button>
        </div>
      </div>

      {/* Service Status Alert */}
      {isAIModeEnabled ? (
        <Alert className="border-blue-500/30 bg-blue-900/20">
          <Bot className="h-4 w-4 text-blue-400" />
          <AlertDescription className="text-blue-300">
            <strong>AI Mode Active (Testing Phase):</strong> All new submissions will be processed automatically in real-time. 
            Items with 40%+ confidence will be approved instantly for testing purposes.
          </AlertDescription>
        </Alert>
      ) : (
        <Alert className="border-yellow-500/30 bg-yellow-900/20">
          <AlertTriangle className="h-4 w-4 text-yellow-400" />
          <AlertDescription className="text-yellow-300">
            <strong>Manual Mode Active:</strong> All submissions will require manual review. 
            Enable AI mode for automatic processing.
          </AlertDescription>
        </Alert>
      )}

      {serviceStatus?.processingQueue?.length > 0 && (
        <Alert className="border-gray-900 bg-black">
          <Activity className="h-4 w-4 text-gray-400" />
          <AlertDescription className="text-gray-300">
            AI is currently processing {serviceStatus.processingQueue.length} items in the queue.
          </AlertDescription>
        </Alert>
      )}

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="bg-black border-gray-900">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-300">Total Processed</CardTitle>
            <Bot className="h-4 w-4 text-gray-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">{aiStats.totalProcessed}</div>
            <p className="text-xs text-gray-400">
              Items processed by AI
            </p>
          </CardContent>
        </Card>

        <Card className="bg-black border-gray-900">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-300">Auto-Approved</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-400">{aiStats.autoApproved}</div>
            <p className="text-xs text-gray-400">
              {aiStats.totalProcessed > 0 ? Math.round((aiStats.autoApproved / aiStats.totalProcessed) * 100) : 0}% approval rate
            </p>
          </CardContent>
        </Card>

        <Card className="bg-black border-gray-900">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-300">Flagged for Review</CardTitle>
            <AlertTriangle className="h-4 w-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-400">{aiStats.flaggedForReview}</div>
            <p className="text-xs text-gray-400">
              Requires human review
            </p>
          </CardContent>
        </Card>

        <Card className="bg-black border-gray-900">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-300">Average Confidence</CardTitle>
            <Settings className="h-4 w-4 text-gray-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">{aiStats.averageConfidence}%</div>
            <Progress value={aiStats.averageConfidence} className="mt-2" />
          </CardContent>
        </Card>
      </div>

      {/* Recent Activity */}
      <Card className="bg-black border-gray-900">
        <CardHeader>
          <CardTitle className="text-white">Recent AI Activity</CardTitle>
          <CardDescription className="text-gray-400">
            Latest automated approval decisions
          </CardDescription>
        </CardHeader>
        <CardContent>
          {recentActivity.length === 0 ? (
            <div className="text-center py-8 text-gray-400">
              <Bot className="h-12 w-12 mx-auto mb-4 text-gray-600" />
              <p className="text-gray-300">No AI activity yet</p>
              <p className="text-sm text-gray-500">AI will start processing items automatically</p>
            </div>
          ) : (
            <div className="space-y-3">
              {recentActivity.map((activity) => (
                <div key={activity.id} className="flex flex-col sm:flex-row sm:items-center sm:justify-between p-3 border border-gray-900 rounded-lg gap-3 bg-black">
                  <div className="flex items-center space-x-3">
                    <span className="text-lg">{getTypeIcon(activity.type)}</span>
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        {getActionIcon(activity.action)}
                        <span className="font-medium capitalize text-sm sm:text-base text-white">{activity.type}</span>
                        <Badge className={`${getActionColor(activity.action)} text-xs border`}>
                          {activity.action}
                        </Badge>
                      </div>
                      <p className="text-xs sm:text-sm text-gray-400 mt-1 break-words">{activity.reason}</p>
                    </div>
                  </div>
                  <div className="flex items-center justify-between sm:flex-col sm:text-right sm:items-end">
                    <div className="text-sm font-medium text-white">{activity.confidence}%</div>
                    <div className="text-xs text-gray-500">
                      {activity.timestamp.toLocaleTimeString()}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* AI Settings */}
      <Card className="bg-black border-gray-900">
        <CardHeader>
          <CardTitle className="text-white">AI Configuration</CardTitle>
          <CardDescription className="text-gray-400">
            Current AI approval settings and thresholds
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-300">Auto-Approval Threshold</label>
              <div className="text-2xl font-bold text-green-400">40%</div>
              <p className="text-xs text-gray-400">Confidence required for auto-approval (Testing Phase)</p>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-300">Review Threshold</label>
              <div className="text-2xl font-bold text-yellow-400">25%</div>
              <p className="text-xs text-gray-400">Confidence for human review</p>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-300">Rejection Threshold</label>
              <div className="text-2xl font-bold text-red-400">15%</div>
              <p className="text-xs text-gray-400">Confidence for auto-rejection</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AIApprovalDashboard;
