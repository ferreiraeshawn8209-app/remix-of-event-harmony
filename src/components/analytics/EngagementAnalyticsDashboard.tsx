import { useEventAnalytics } from '@/hooks/useEventAnalytics';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  TrendingUp,
  Laugh,
  Music,
  MessageSquare,
  Users,
  Star,
  BarChart3,
  Video,
  CheckCircle2,
  AlertCircle,
} from 'lucide-react';

interface EngagementAnalyticsDashboardProps {
  eventId: string;
}

export function EngagementAnalyticsDashboard({ eventId }: EngagementAnalyticsDashboardProps) {
  const { state, actions } = useEventAnalytics(eventId);
  const { analytics, realtimeMetrics, sessionRecording } = state;

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-950 via-purple-950 to-slate-950 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="font-display text-3xl font-bold gradient-text">Event Analytics & Engagement</h1>
            <p className="text-muted-foreground mt-2">Post-event insights & real-time metrics</p>
          </div>
          <div className="flex gap-2">
            {sessionRecording.isRecording && (
              <Badge className="bg-red-600 text-white animate-pulse">🔴 RECORDING</Badge>
            )}
            <Badge className="bg-green-600 text-white">Post-Event Analysis</Badge>
          </div>
        </div>

        {/* Real-time Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card className="border-amber-500/20 bg-amber-500/5">
            <CardContent className="pt-6">
              <p className="text-xs uppercase text-muted-foreground">Current Engagement</p>
              <p className="text-3xl font-bold mt-2">{realtimeMetrics.currentEngagement}%</p>
              <p className="text-xs text-amber-400 mt-2">Live engagement score</p>
            </CardContent>
          </Card>

          <Card className="border-purple-500/20 bg-purple-500/5">
            <CardContent className="pt-6">
              <p className="text-xs uppercase text-muted-foreground">Active Dancers</p>
              <p className="text-3xl font-bold mt-2">{realtimeMetrics.activeDancers}</p>
              <p className="text-xs text-purple-400 mt-2">On dance floor</p>
            </CardContent>
          </Card>

          <Card className="border-pink-500/20 bg-pink-500/5">
            <CardContent className="pt-6">
              <p className="text-xs uppercase text-muted-foreground">Photos Captured</p>
              <p className="text-3xl font-bold mt-2">{Math.round(realtimeMetrics.photosPerMinute * 60)}</p>
              <p className="text-xs text-pink-400 mt-2">Per hour average</p>
            </CardContent>
          </Card>

          <Card className="border-blue-500/20 bg-blue-500/5">
            <CardContent className="pt-6">
              <p className="text-xs uppercase text-muted-foreground">Recording</p>
              <p className="text-3xl font-bold mt-2">{Math.round(sessionRecording.fileSize / 1024)}MB</p>
              <p className="text-xs text-blue-400 mt-2">{sessionRecording.checkpointCount} checkpoints</p>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left - Jokes & Speeches */}
          <div className="space-y-6">
            {/* Jokes */}
            <Card className="border-green-500/20 bg-green-500/5">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Laugh className="w-5 h-5 text-green-400" />
                  Joke Performance
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Average Landing Rate</p>
                  <p className="text-2xl font-bold text-green-400">{analytics.averageJokeScore}%</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Top Jokes</p>
                  {analytics.topPerformingJokes.length === 0 ? (
                    <p className="text-sm text-muted-foreground">No jokes recorded yet</p>
                  ) : (
                    <div className="space-y-2">
                      {analytics.topPerformingJokes.slice(0, 3).map((joke) => (
                        <div key={joke.id} className="p-2 rounded bg-black/30 border border-border/30">
                          <p className="text-xs line-clamp-2 font-medium">{joke.jokeText}</p>
                          <div className="flex items-center justify-between mt-1">
                            <span className="text-xs text-muted-foreground">{joke.category}</span>
                            <Badge variant="outline" className="text-green-400">
                              {joke.applianceIntensity}%
                            </Badge>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Speeches */}
            <Card className="border-blue-500/20 bg-blue-500/5">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MessageSquare className="w-5 h-5 text-blue-400" />
                  Speech Analytics
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Total Laughs Detected</p>
                  <p className="text-2xl font-bold text-blue-400">{analytics.totalLaughsDetected}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Avg Speech Length</p>
                  <p className="text-lg font-semibold">{analytics.averageSpeechLength}s</p>
                </div>
                {analytics.topSpeech && (
                  <div className="p-2 rounded bg-black/30 border border-border/30">
                    <p className="text-xs font-medium">Best Speech</p>
                    <p className="text-sm mt-1 text-blue-400">{analytics.topSpeech.speaker}</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      Engagement: {analytics.topSpeech.audienceEngagement}%
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Center - Timeline & Music */}
          <div className="space-y-6">
            {/* Timeline Adherence */}
            <Card className="border-orange-500/20 bg-orange-500/5">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="w-5 h-5 text-orange-400" />
                  Timeline Adherence
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <p className="text-xs text-muted-foreground mb-1">On-Time Completion</p>
                  <p className="text-3xl font-bold text-orange-400">{analytics.timelineAdherence}%</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Avg delay: {analytics.averageDelayMinutes} min
                  </p>
                </div>
                <div className="pt-2 space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span>Skipped Cues</span>
                    <Badge variant="outline">{analytics.cueSkipCount}</Badge>
                  </div>
                  <div className="w-full bg-gray-700 rounded h-2">
                    <div
                      className="bg-gradient-to-r from-orange-500 to-yellow-500 h-full rounded transition-all"
                      style={{ width: `${analytics.timelineAdherence}%` }}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Music */}
            <Card className="border-pink-500/20 bg-pink-500/5">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Music className="w-5 h-5 text-pink-400" />
                  Music Performance
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Avg Engagement</p>
                  <p className="text-2xl font-bold text-pink-400">{analytics.averageMusicEngagement}%</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground mb-2">Top Tracks</p>
                  {analytics.mostPopularTracks.length === 0 ? (
                    <p className="text-sm text-muted-foreground">No tracks recorded</p>
                  ) : (
                    <div className="space-y-2">
                      {analytics.mostPopularTracks.slice(0, 2).map((track) => (
                        <div key={track.id} className="p-2 rounded bg-black/30 border border-border/30">
                          <p className="text-xs font-medium">{track.title}</p>
                          <p className="text-xs text-muted-foreground">{track.artist}</p>
                          <div className="flex items-center justify-between mt-1">
                            <span className="text-xs">{track.crowdResponse}</span>
                            <Badge variant="outline" className="text-pink-400">
                              {track.engagementScore}%
                            </Badge>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Right - Guest Feedback */}
          <div className="space-y-6">
            {/* Surveys */}
            <Card className="border-green-500/20 bg-green-500/5">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Star className="w-5 h-5 text-green-400" />
                  Guest Feedback
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Overall Rating</p>
                  <p className="text-3xl font-bold text-green-400">{analytics.averageOverallRating}/5 ⭐</p>
                </div>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div>
                    <p className="text-xs text-muted-foreground">Response Rate</p>
                    <p className="font-bold text-green-400">{analytics.surveyResponseRate}%</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Recommend</p>
                    <p className="font-bold text-green-400">{analytics.recommendationRate}%</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Insights */}
            <Card className="border-purple-500/20 bg-purple-500/5">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-purple-400" />
                  Key Insights
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {analytics.keyHighlights.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No insights yet</p>
                ) : (
                  analytics.keyHighlights.map((highlight, idx) => (
                    <div key={idx} className="flex gap-2 text-sm">
                      <CheckCircle2 className="w-4 h-4 text-purple-400 flex-shrink-0 mt-0.5" />
                      <p className="text-muted-foreground">{highlight}</p>
                    </div>
                  ))
                )}

                {analytics.improvementAreas.length > 0 && (
                  <div className="pt-2 mt-2 border-t border-border/30">
                    {analytics.improvementAreas.map((area, idx) => (
                      <div key={idx} className="flex gap-2 text-sm mt-2">
                        <AlertCircle className="w-4 h-4 text-yellow-400 flex-shrink-0 mt-0.5" />
                        <p className="text-muted-foreground">{area}</p>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Recommendations */}
        <Card className="border-cyan-500/20 bg-cyan-500/5">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Video className="w-5 h-5 text-cyan-400" />
              Next Event Recommendations
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {analytics.nextEventRecommendations.map((rec, idx) => (
                <div key={idx} className="p-3 rounded border border-cyan-500/30 bg-black/30">
                  <p className="text-sm text-cyan-300">{rec}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
