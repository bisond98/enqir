import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  Target, 
  Users, 
  Star, 
  MapPin, 
  Clock, 
  TrendingUp, 
  Shield, 
  Sparkles,
  MessageSquare,
  Phone,
  Mail,
  ExternalLink,
  ChevronDown,
  ChevronUp,
  Zap,
  Award,
  CheckCircle,
  AlertCircle,
  Info
} from 'lucide-react';
import { 
  findSmartMatches, 
  getMatchQualityLabel,
  type MatchScore,
  type Enquiry,
  type User,
  type MatchmakingConfig
} from '@/services/ai/smartMatchmaking';

interface SmartMatchmakingProps {
  enquiry: Enquiry;
  sellers: User[];
  onContactSeller?: (sellerId: string) => void;
  onViewProfile?: (sellerId: string) => void;
  config?: Partial<MatchmakingConfig>;
  className?: string;
}

const SmartMatchmaking: React.FC<SmartMatchmakingProps> = ({
  enquiry,
  sellers,
  onContactSeller,
  onViewProfile,
  config = {},
  className = ""
}) => {
  const [matches, setMatches] = useState<MatchScore[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [expandedMatch, setExpandedMatch] = useState<string | null>(null);
  const [showAllMatches, setShowAllMatches] = useState(false);

  // Load smart matches
  useEffect(() => {
    const loadMatches = async () => {
      try {
        setIsLoading(true);
        const smartMatches = await findSmartMatches(enquiry, sellers, config);
        setMatches(smartMatches);
      } catch (error) {
        console.error('Failed to load smart matches:', error);
        setMatches([]);
      } finally {
        setIsLoading(false);
      }
    };

    if (enquiry && sellers.length > 0) {
      loadMatches();
    }
  }, [enquiry, sellers, config]);

  // Get factor color based on score
  const getFactorColor = (score: number): string => {
    if (score >= 0.8) return 'text-green-600';
    if (score >= 0.6) return 'text-blue-600';
    if (score >= 0.4) return 'text-yellow-600';
    return 'text-red-600';
  };

  // Get factor label
  const getFactorLabel = (score: number): string => {
    if (score >= 0.8) return 'Excellent';
    if (score >= 0.6) return 'Good';
    if (score >= 0.4) return 'Fair';
    return 'Poor';
  };

  // Format factor name
  const formatFactorName = (factor: string): string => {
    return factor
      .replace(/([A-Z])/g, ' $1')
      .replace(/^./, str => str.toUpperCase());
  };

  // Get factor icon
  const getFactorIcon = (factor: string) => {
    switch (factor) {
      case 'skillMatch': return <Target className="w-4 h-4" />;
      case 'budgetMatch': return <TrendingUp className="w-4 h-4" />;
      case 'locationMatch': return <MapPin className="w-4 h-4" />;
      case 'experienceMatch': return <Award className="w-4 h-4" />;
      case 'responseTime': return <Clock className="w-4 h-4" />;
      case 'successRate': return <CheckCircle className="w-4 h-4" />;
      case 'verificationBonus': return <Shield className="w-4 h-4" />;
      default: return <Info className="w-4 h-4" />;
    }
  };

  if (isLoading) {
    return (
      <Card className={`${className}`}>
        <CardHeader className="pb-3">
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-pal-blue" />
            <h3 className="text-lg font-semibold text-slate-800">Smart Matches</h3>
            <Badge variant="secondary" className="text-xs">AI Powered</Badge>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <div className="w-8 h-8 border-2 border-slate-300 border-t-pal-blue rounded-full animate-spin" />
            <span className="ml-3 text-sm text-slate-500">Finding the best matches...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (matches.length === 0) {
    return (
      <Card className={`${className}`}>
        <CardHeader className="pb-3">
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-pal-blue" />
            <h3 className="text-lg font-semibold text-slate-800">Smart Matches</h3>
            <Badge variant="secondary" className="text-xs">AI Powered</Badge>
          </div>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <Target className="w-12 h-12 mx-auto mb-3 text-slate-300" />
            <p className="text-slate-600 mb-2">No smart matches found</p>
            <p className="text-sm text-slate-500">Try adjusting your requirements or check back later</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const displayedMatches = showAllMatches ? matches : matches.slice(0, 3);

  return (
    <Card className={`${className}`}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-pal-blue" />
            <h3 className="text-lg font-semibold text-slate-800">Smart Matches</h3>
            <Badge variant="secondary" className="text-xs">AI Powered</Badge>
          </div>
          <div className="text-sm text-slate-500">
            {matches.length} match{matches.length !== 1 ? 'es' : ''} found
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Top Matches */}
        <div className="space-y-3">
          {displayedMatches.map((match, index) => {
            const qualityLabel = getMatchQualityLabel(match.score);
            const isExpanded = expandedMatch === match.sellerId;
            
            return (
              <Card key={match.sellerId} className="border border-slate-200 hover:border-slate-300 transition-colors">
                <CardContent className="p-4">
                  {/* Match Header */}
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-gradient-to-r from-pal-blue to-blue-600 rounded-full flex items-center justify-center text-white font-semibold">
                        {index + 1}
                      </div>
                      <div>
                        <h4 className="font-semibold text-slate-900">{match.sellerName}</h4>
                        <div className="flex items-center gap-2 mt-1">
                          <Badge 
                            variant="outline" 
                            className={`text-xs ${qualityLabel.color}`}
                          >
                            {qualityLabel.label}
                          </Badge>
                          <span className="text-sm text-slate-500">
                            {match.score}% match
                          </span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setExpandedMatch(isExpanded ? null : match.sellerId)}
                        className="h-8 w-8 p-0"
                      >
                        {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                      </Button>
                    </div>
                  </div>

                  {/* Match Score Progress */}
                  <div className="mb-3">
                    <div className="flex items-center justify-between text-sm mb-1">
                      <span className="text-slate-600">Overall Match Score</span>
                      <span className="font-medium">{match.score}%</span>
                    </div>
                    <Progress 
                      value={match.score} 
                      className="h-2"
                      indicatorClassName={
                        match.score >= 85 ? 'bg-green-500' : 
                        match.score >= 70 ? 'bg-blue-500' : 
                        match.score >= 50 ? 'bg-yellow-500' : 'bg-orange-500'
                      }
                    />
                  </div>

                  {/* Match Reasons */}
                  {match.reasons.length > 0 && (
                    <div className="mb-3">
                      <h5 className="text-sm font-medium text-slate-700 mb-2 flex items-center gap-2">
                        <Zap className="w-4 h-4 text-green-600" />
                        Why this match works
                      </h5>
                      <div className="space-y-1">
                        {match.reasons.slice(0, 3).map((reason, idx) => (
                          <div key={idx} className="flex items-center gap-2 text-sm text-slate-600">
                            <CheckCircle className="w-3 h-3 text-green-600 flex-shrink-0" />
                            <span>{reason}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Expanded Details */}
                  {isExpanded && (
                    <div className="pt-3 border-t border-slate-200 space-y-4">
                      {/* Factor Breakdown */}
                      <div>
                        <h5 className="text-sm font-medium text-slate-700 mb-3">Match Factors</h5>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          {Object.entries(match.factors).map(([factor, score]) => (
                            <div key={factor} className="flex items-center justify-between p-2 bg-slate-50 rounded-lg">
                              <div className="flex items-center gap-2">
                                <div className={`${getFactorColor(score)}`}>
                                  {getFactorIcon(factor)}
                                </div>
                                <span className="text-sm text-slate-700">
                                  {formatFactorName(factor)}
                                </span>
                              </div>
                              <div className="text-right">
                                <div className={`text-sm font-medium ${getFactorColor(score)}`}>
                                  {Math.round(score * 100)}%
                                </div>
                                <div className="text-xs text-slate-500">
                                  {getFactorLabel(score)}
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Recommendations */}
                      {match.recommendations.length > 0 && (
                        <div>
                          <h5 className="text-sm font-medium text-slate-700 mb-2 flex items-center gap-2">
                            <AlertCircle className="w-4 h-4 text-amber-600" />
                            Recommendations
                          </h5>
                          <div className="space-y-1">
                            {match.recommendations.map((rec, idx) => (
                              <div key={idx} className="flex items-start gap-2 text-sm text-slate-600">
                                <div className="w-1.5 h-1.5 bg-amber-500 rounded-full mt-2 flex-shrink-0" />
                                <span>{rec}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Action Buttons */}
                  <div className="flex items-center gap-2 pt-3 border-t border-slate-200">
                    {onContactSeller && (
                      <Button
                        size="sm"
                        onClick={() => onContactSeller(match.sellerId)}
                        className="flex-1 bg-gradient-to-r from-pal-blue to-blue-600 hover:from-pal-blue/90 hover:to-blue-600/90 text-white"
                      >
                        <MessageSquare className="w-4 h-4 mr-2" />
                        Contact
                      </Button>
                    )}
                    {onViewProfile && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => onViewProfile(match.sellerId)}
                        className="flex-1"
                      >
                        <ExternalLink className="w-4 h-4 mr-2" />
                        View Profile
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Show More/Less Button */}
        {matches.length > 3 && (
          <div className="text-center pt-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowAllMatches(!showAllMatches)}
              className="text-slate-600 hover:text-slate-800"
            >
              {showAllMatches ? (
                <>
                  <ChevronUp className="w-4 h-4 mr-2" />
                  Show Less
                </>
              ) : (
                <>
                  <ChevronDown className="w-4 h-4 mr-2" />
                  Show All {matches.length} Matches
                </>
              )}
            </Button>
          </div>
        )}

        {/* Matchmaking Info */}
        <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
          <div className="flex items-start gap-2">
            <Info className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" />
            <div className="text-xs text-blue-800">
              <p className="font-medium mb-1">💡 How Smart Matching Works:</p>
              <ul className="space-y-1">
                <li>• <strong>Skills:</strong> Matches seller expertise with your requirements</li>
                <li>• <strong>Budget:</strong> Ensures pricing compatibility</li>
                <li>• <strong>Location:</strong> Considers proximity and remote work options</li>
                <li>• <strong>Experience:</strong> Evaluates seller track record and verification</li>
                <li>• <strong>Response Time:</strong> Prioritizes quick communicators</li>
              </ul>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default SmartMatchmaking;





