import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  Image, 
  Shield, 
  AlertTriangle, 
  Camera,
  Zap,
  RefreshCw,
  Lightbulb,
  CheckCircle
} from 'lucide-react';
import { 
  analyzeImage, 
  getImageAnalysisSummary,
  type ImageAnalysis,
  type ImageRecognitionConfig
} from '@/services/ai/imageRecognition';

interface ImageRecognitionProps {
  imageUrl: string;
  fileName: string;
  fileSize: number;
  dimensions: { width: number; height: number };
  existingImages?: any[];
  config?: Partial<ImageRecognitionConfig>;
  onAnalysisComplete?: (analysis: ImageAnalysis) => void;
  onStatusChange?: (status: 'approved' | 'review' | 'rejected') => void;
  className?: string;
}

const ImageRecognition: React.FC<ImageRecognitionProps> = ({
  imageUrl,
  fileName,
  fileSize,
  dimensions,
  existingImages = [],
  config = {},
  onAnalysisComplete,
  onStatusChange,
  className = ""
}) => {
  const [analysis, setAnalysis] = useState<ImageAnalysis | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);


  // Analyze image
  const performAnalysis = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      const imageAnalysis = await analyzeImage(
        imageUrl,
        fileName,
        fileSize,
        dimensions,
        existingImages,
        config
      );
      
      setAnalysis(imageAnalysis);
      
      if (onAnalysisComplete) {
        onAnalysisComplete(imageAnalysis);
      }
      
      // Get summary and notify status change
      if (onStatusChange) {
        const summary = getImageAnalysisSummary(imageAnalysis);
        onStatusChange(summary.status);
      }
      
    } catch (err) {
      console.error('Image analysis failed:', err);
      setError(err instanceof Error ? err.message : 'Analysis failed');
    } finally {
      setIsLoading(false);
    }
  };

  // Auto-analyze on mount
  useEffect(() => {
    if (imageUrl && fileName) {
      performAnalysis();
    }
  }, [imageUrl, fileName, fileSize, dimensions]);

  // Get status color and icon
  const getStatusInfo = (status: 'approved' | 'review' | 'rejected') => {
    switch (status) {
      case 'approved':
        return { color: 'text-green-600', bgColor: 'bg-green-50', icon: CheckCircle };
      case 'review':
        return { color: 'text-yellow-600', bgColor: 'bg-yellow-50', icon: Clock };
      case 'rejected':
        return { color: 'text-red-600', bgColor: 'bg-red-50', icon: XCircle };
      default:
        return { color: 'text-gray-600', bgColor: 'bg-gray-50', icon: Info };
    }
  };

  // Get quality color
  const getQualityColor = (score: number): string => {
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  // Get safety color
  const getSafetyColor = (status: string): string => {
    switch (status) {
      case 'safe': return 'text-green-600';
      case 'moderate': return 'text-yellow-600';
      case 'unsafe': return 'text-red-600';
      default: return 'text-gray-600';
    }
  };

  if (isLoading) {
    return (
      <Card className={`${className}`}>
        <CardHeader className="pb-3">
          <div className="flex items-center gap-2">
            <Shield className="w-5 h-5 text-pal-blue" />
            <h3 className="text-lg font-semibold text-slate-800">Trust Badge Analysis</h3>
            <Badge variant="secondary" className="text-xs">AI Powered</Badge>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <div className="w-8 h-8 border-2 border-slate-300 border-t-pal-blue rounded-full animate-spin" />
            <span className="ml-3 text-sm text-slate-500">Verifying ID document...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className={`${className}`}>
        <CardHeader className="pb-3">
          <div className="flex items-center gap-2">
            <Shield className="w-5 h-5 text-pal-blue" />
            <h3 className="text-lg font-semibold text-slate-800">Trust Badge Analysis</h3>
            <Badge variant="secondary" className="text-xs">AI Powered</Badge>
          </div>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <AlertCircle className="w-12 h-12 mx-auto mb-3 text-red-300" />
            <p className="text-red-600 mb-2">Analysis failed</p>
            <p className="text-sm text-slate-500 mb-4">{error}</p>
            <Button onClick={performAnalysis} variant="outline" size="sm">
              <RefreshCw className="w-4 h-4 mr-2" />
              Retry Analysis
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!analysis) {
    return (
      <Card className={`${className}`}>
        <CardHeader className="pb-3">
          <div className="flex items-center gap-2">
            <Shield className="w-5 h-5 text-pal-blue" />
            <h3 className="text-lg font-semibold text-slate-800">Trust Badge Analysis</h3>
            <Badge variant="secondary" className="text-xs">AI Powered</Badge>
          </div>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <Image className="w-12 h-12 mx-auto mb-3 text-slate-300" />
            <p className="text-slate-600 mb-2">No ID document to verify</p>
            <p className="text-sm text-slate-500">Upload your ID to get started</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const summary = getImageAnalysisSummary(analysis);
  const statusInfo = getStatusInfo(summary.status);

  return (
    <Card className={`${className}`}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Shield className="w-5 h-5 text-pal-blue" />
            <h3 className="text-lg font-semibold text-slate-800">Trust Badge Analysis</h3>
            <Badge variant="secondary" className="text-xs">AI Powered</Badge>
          </div>
          <div className="flex items-center gap-2">
            <Badge 
              variant="outline" 
              className={`text-xs ${statusInfo.color} ${statusInfo.bgColor}`}
            >
              <statusInfo.icon className="w-3 h-3 mr-1" />
              {summary.status.charAt(0).toUpperCase() + summary.status.slice(1)}
            </Badge>
            <Button
              variant="ghost"
              size="sm"
              onClick={performAnalysis}
              className="h-8 w-8 p-0"
            >
              <RefreshCw className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Image Preview */}
        <div className="relative">
          <img 
            src={imageUrl} 
            alt={fileName}
            className="w-full h-48 object-cover rounded-lg border border-slate-200"
          />
          <div className="absolute top-2 right-2 bg-black/50 text-white text-xs px-2 py-1 rounded">
            {dimensions.width} × {dimensions.height}
          </div>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-2 gap-4">
          <div className="text-center p-3 bg-slate-50 rounded-lg">
            <div className={`text-2xl font-bold ${getQualityColor(analysis.analysis.quality.overall)}`}>
              {analysis.analysis.quality.overall}%
            </div>
            <div className="text-xs text-slate-600">Quality Score</div>
          </div>
          <div className="text-center p-3 bg-slate-50 rounded-lg">
            <div className={`text-2xl font-bold ${getSafetyColor(analysis.analysis.safety.overall)}`}>
              {analysis.analysis.safety.overall.toUpperCase()}
            </div>
            <div className="text-xs text-slate-600">Safety Status</div>
          </div>
        </div>

        {/* Quality Assessment */}
        <div className="border border-slate-200 rounded-lg">
          <div className="p-3">
            <div className="flex items-center gap-2 mb-3">
              <Camera className="w-4 h-4 text-blue-600" />
              <span className="font-medium text-slate-800">Quality Assessment</span>
            </div>
            
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-slate-600">Overall Quality</span>
                <span className={`text-sm font-medium ${getQualityColor(analysis.analysis.quality.overall)}`}>
                  {analysis.analysis.quality.overall}%
                </span>
              </div>
              <Progress 
                value={analysis.analysis.quality.overall} 
                className="h-2"
              />
              
              {analysis.analysis.quality.issues.length > 0 && (
                <div>
                  <h5 className="text-sm font-medium text-slate-700 mb-2 flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 text-amber-600" />
                    Issues Found
                  </h5>
                  <ul className="space-y-1">
                    {analysis.analysis.quality.issues.map((issue, idx) => (
                      <li key={idx} className="text-xs text-slate-600 flex items-start gap-2">
                        <div className="w-1 h-1 bg-amber-500 rounded-full mt-1.5 flex-shrink-0" />
                        {issue}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </div>
        </div>



        {/* Safety & Moderation */}
        <div className="border border-slate-200 rounded-lg">
          <div className="p-3">
            <div className="flex items-center gap-2 mb-3">
              <Shield className="w-4 h-4 text-purple-600" />
              <span className="font-medium text-slate-800">Safety & Moderation</span>
              <Badge 
                variant="outline" 
                className={`text-xs ${getSafetyColor(analysis.analysis.safety.overall)}`}
              >
                {analysis.analysis.safety.overall}
              </Badge>
            </div>
            
            <div className="space-y-3">
              <div className="p-2 bg-slate-50 rounded">
                <div className="text-sm font-medium text-slate-800">
                  {analysis.analysis.safety.moderation.action.charAt(0).toUpperCase() + 
                   analysis.analysis.safety.moderation.action.slice(1)}
                </div>
                <div className="text-xs text-slate-600">
                  {analysis.analysis.safety.moderation.reason}
                </div>
              </div>
              
              {analysis.analysis.safety.flags.length > 0 && (
                <div>
                  <h5 className="text-sm font-medium text-slate-700 mb-2">Safety Flags</h5>
                  <div className="space-y-2">
                    {analysis.analysis.safety.flags.map((flag, idx) => (
                      <div key={idx} className="flex items-center justify-between p-2 bg-red-50 rounded">
                        <div>
                          <div className="text-sm font-medium text-red-800 capitalize">
                            {flag.type}
                          </div>
                          <div className="text-xs text-red-600">{flag.description}</div>
                        </div>
                        <Badge 
                          variant="outline" 
                          className={`text-xs ${
                            flag.severity === 'high' ? 'text-red-600' :
                            flag.severity === 'medium' ? 'text-yellow-600' : 'text-gray-600'
                          }`}
                        >
                          {flag.severity}
                        </Badge>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>





        {/* Verification Tips */}
        {analysis.analysis.suggestions.length > 0 && (
          <div className="border border-slate-200 rounded-lg">
            <div className="p-3">
              <div className="flex items-center gap-2 mb-3">
                <Lightbulb className="w-4 h-4 text-yellow-600" />
                <span className="font-medium text-slate-800">Verification Tips</span>
              </div>
              
              <ul className="space-y-2">
                {analysis.analysis.suggestions.map((suggestion, idx) => (
                  <li key={idx} className="flex items-start gap-2 text-sm text-slate-600">
                    <Zap className="w-4 h-4 text-yellow-600 mt-0.5 flex-shrink-0" />
                    <span>{suggestion}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        )}


      </CardContent>
    </Card>
  );
};

export default ImageRecognition;
