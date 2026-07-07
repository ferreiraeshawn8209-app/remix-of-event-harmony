import { useState } from 'react';
import { useCommandCenter } from '@/hooks/useCommandCenter';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { BeatkultureMascot } from '@/components/BeatkultureMascot';
import { CinematicAmbient } from '@/components/CinematicAmbient';
import {
  Play,
  Pause,
  Square,
  SkipForward,
  SkipBack,
  Volume2,
  AlertCircle,
  MessageSquare,
  Zap,
  Clock,
  Music2,
  Vote,
  ThumbsUp,
} from 'lucide-react';

interface EventDayCommandCenterProps {
  eventId: string;
  timelinePhases: any[];
}

export function EventDayCommandCenter({ eventId, timelinePhases }: EventDayCommandCenterProps) {
  const { state, actions, getters } = useCommandCenter(eventId, timelinePhases);
  const [songTitle, setSongTitle] = useState('');
  const [songArtist, setSongArtist] = useState('');

  const currentCue = getters.getCurrentCue();
  const upcomingCues = getters.getUpcomingCues(3);
  const pendingIssues = getters.getPendingIssues();
  const recentMessages = getters.getRecentMessages(5);
  const topSongRequests = getters.getTopAudienceSongRequests(5);
  const activePoll = getters.getActiveAudiencePoll();

  const statusColor = {
    not_started: 'bg-gray-500/20 text-gray-400',
    in_progress: 'bg-green-500/20 text-green-400',
    paused: 'bg-yellow-500/20 text-yellow-400',
    completed: 'bg-blue-500/20 text-blue-400',
  };

  const submitSongRequest = () => {
    if (!songTitle.trim() || !songArtist.trim()) {
      return;
    }
    actions.addAudienceSongRequest(songTitle.trim(), songArtist.trim(), 'Live Guest');
    setSongTitle('');
    setSongArtist('');
  };

  const launchQuickPoll = () => {
    if (activePoll) {
      return;
    }
    actions.createAudiencePoll('What should happen next?', [
      'Open dance floor now',
      'Play another slow song',
      'Bring in MC hype line',
    ]);
  };

  return (
    <div className="cinematic-shell min-h-screen p-6">
      <CinematicAmbient intensity="high" />
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="font-display text-3xl font-bold gradient-text">Event Day Command Center</h1>
            <p className="text-muted-foreground mt-2">Real-time event management & DJ control</p>
          </div>
          <Badge className={statusColor[state.eventDayStatus as keyof typeof statusColor]}>
            {state.eventDayStatus.replace(/_/g, ' ').toUpperCase()}
          </Badge>
        </div>

        <Card variant="glass" className="feature-card-luxe border-primary/25">
          <CardContent className="py-4 flex flex-col lg:flex-row gap-4 items-center justify-between">
            <div className="flex items-center gap-4">
              <BeatkultureMascot mood={state.eventDayStatus === 'in_progress' ? 'speaking' : 'idle'} />
              <div>
                <p className="text-sm uppercase tracking-[0.2em] text-primary/80">AI Concierge</p>
                <h2 className="text-xl font-display font-semibold">Tonight's Luxury Event Experience</h2>
                <p className="text-sm text-muted-foreground">Command center + music momentum + guest interaction in one cinematic flow.</p>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-3 w-full max-w-md">
              <div className="feature-card-luxe rounded-xl p-3 text-center">
                <p className="text-xs text-muted-foreground">Live Cues</p>
                <p className="text-xl font-bold text-primary">{state.cueList.filter((cue) => cue.status === 'active').length}</p>
              </div>
              <div className="feature-card-luxe rounded-xl p-3 text-center">
                <p className="text-xs text-muted-foreground">Song Requests</p>
                <p className="text-xl font-bold text-secondary">{state.audienceSongRequests.filter((request) => request.status === 'queued').length}</p>
              </div>
              <div className="feature-card-luxe rounded-xl p-3 text-center">
                <p className="text-xs text-muted-foreground">Engagement</p>
                <p className="text-xl font-bold text-accent">{Math.round(state.audienceReactions.reduce((sum, reaction) => sum + reaction.intensity, 0) / Math.max(1, state.audienceReactions.length))}%</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Control Panel */}
          <div className="lg:col-span-2 space-y-6">
            {/* DJ Controls */}
            <Card className="feature-card-luxe border-amber-500/30 bg-gradient-to-br from-amber-500/10 to-orange-500/10">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Zap className="w-5 h-5 text-amber-400" />
                  DJ Control
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Playback Controls */}
                <div className="flex gap-2 flex-wrap">
                  {state.eventDayStatus === 'not_started' ? (
                    <Button
                      onClick={actions.startEvent}
                      size="lg"
                      className="flex-1 bg-green-600 hover:bg-green-700"
                    >
                      <Play className="w-4 h-4 mr-2" />
                      Start Event
                    </Button>
                  ) : state.eventDayStatus === 'completed' ? (
                    <Button disabled size="lg" className="flex-1">
                      <Square className="w-4 h-4 mr-2" />
                      Event Ended
                    </Button>
                  ) : state.eventDayStatus === 'paused' ? (
                    <Button
                      onClick={actions.resumeEvent}
                      size="lg"
                      className="flex-1 bg-blue-600 hover:bg-blue-700"
                    >
                      <Play className="w-4 h-4 mr-2" />
                      Resume
                    </Button>
                  ) : (
                    <>
                      <Button
                        onClick={actions.pauseEvent}
                        variant="outline"
                        size="lg"
                        className="flex-1"
                      >
                        <Pause className="w-4 h-4 mr-2" />
                        Pause
                      </Button>
                      <Button
                        onClick={actions.endEvent}
                        variant="outline"
                        size="lg"
                        className="flex-1 border-red-500/50 text-red-400 hover:bg-red-500/10"
                      >
                        <Square className="w-4 h-4 mr-2" />
                        End Event
                      </Button>
                    </>
                  )}
                </div>

                {/* Timeline Navigation */}
                <div className="flex gap-2">
                  <Button
                    onClick={actions.rewindCue}
                    variant="outline"
                    disabled={!currentCue}
                    className="flex-1"
                  >
                    <SkipBack className="w-4 h-4 mr-2" />
                    Previous
                  </Button>
                  <Button
                    onClick={actions.advanceCue}
                    className="flex-1 bg-amber-600 hover:bg-amber-700"
                  >
                    <SkipForward className="w-4 h-4 mr-2" />
                    Next Cue
                  </Button>
                </div>

                {/* Volume Control */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-sm font-medium flex items-center gap-2">
                      <Volume2 className="w-4 h-4" />
                      Volume
                    </label>
                    <span className="text-sm text-amber-400 font-semibold">
                      {state.djControl.volume}%
                    </span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={state.djControl.volume}
                    onChange={(e) => actions.setVolume(Number(e.target.value))}
                    className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer"
                  />
                  <Button
                    onClick={actions.toggleMute}
                    variant={state.djControl.isMuted ? 'destructive' : 'outline'}
                    className="w-full"
                  >
                    {state.djControl.isMuted ? '🔇 Muted' : '🔊 Unmute'}
                  </Button>
                </div>

                {/* Progress */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Event Progress</span>
                    <span className="font-semibold text-amber-400">{getters.getTimelineProgressPercent()}%</span>
                  </div>
                  <div className="w-full bg-gray-700 rounded-full h-2 overflow-hidden">
                    <div
                      className="bg-gradient-to-r from-amber-500 to-orange-500 h-full transition-all"
                      style={{ width: `${getters.getTimelineProgressPercent()}%` }}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Current Cue Display */}
            {currentCue && (
              <Card className="feature-card-luxe border-green-500/30 bg-gradient-to-br from-green-500/10 to-emerald-500/10">
                <CardHeader>
                  <CardTitle className="text-green-400">Now Playing</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div>
                    <p className="text-2xl font-bold">{currentCue.phaseName}</p>
                    <p className="text-sm text-muted-foreground">{currentCue.description}</p>
                  </div>
                  <div className="flex gap-4 text-sm">
                    <div>
                      <span className="text-muted-foreground">Start:</span>
                      <p className="font-mono text-sm">{currentCue.actualStartTime?.substring(11, 19)}</p>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Duration:</span>
                      <p className="font-mono text-sm">{currentCue.duration} min</p>
                    </div>
                  </div>
                  {currentCue.musicTrack && (
                    <div className="p-2 rounded bg-black/30">
                      <p className="text-xs text-muted-foreground">Music</p>
                      <p className="font-semibold">{currentCue.musicTrack.title}</p>
                      <p className="text-sm text-muted-foreground">{currentCue.musicTrack.artist}</p>
                      <div className="mt-2 flex items-end gap-1 h-6">
                        {Array.from({ length: 14 }).map((_, index) => (
                          <span key={index} className="wave-bar" style={{ animationDelay: `${index * 0.08}s` }} />
                        ))}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Upcoming Cues */}
            <Card className="feature-card-luxe border-purple-500/30">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Clock className="w-5 h-5" />
                  Upcoming Cues
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {upcomingCues.length === 0 ? (
                    <p className="text-sm text-muted-foreground">No upcoming cues</p>
                  ) : (
                    upcomingCues.map((cue, idx) => (
                      <div key={cue.id} className="p-3 rounded-lg border border-border/50 hover:bg-accent/30">
                        <div className="flex items-start justify-between">
                          <div>
                            <p className="font-medium">
                              #{idx + 1} - {cue.phaseName}
                            </p>
                            <p className="text-xs text-muted-foreground">{cue.description}</p>
                          </div>
                          <Badge variant="outline">{cue.duration}min</Badge>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar - Issues & Messages */}
          <div className="space-y-6">
            {/* Audience Requests */}
            <Card className="feature-card-luxe border-fuchsia-500/30 bg-fuchsia-500/10">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Music2 className="w-5 h-5 text-fuchsia-400" />
                  Audience Requests
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="grid grid-cols-1 gap-2">
                  <Input
                    placeholder="Song title"
                    value={songTitle}
                    onChange={(e) => setSongTitle(e.target.value)}
                  />
                  <Input
                    placeholder="Artist"
                    value={songArtist}
                    onChange={(e) => setSongArtist(e.target.value)}
                  />
                  <Button
                    onClick={submitSongRequest}
                    disabled={!songTitle.trim() || !songArtist.trim()}
                    className="bg-fuchsia-600 hover:bg-fuchsia-700"
                  >
                    Add request
                  </Button>
                </div>

                {topSongRequests.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No live requests yet</p>
                ) : (
                  <div className="space-y-2">
                    {topSongRequests.map((request) => (
                      <div key={request.id} className="rounded border border-border/40 p-2">
                        <p className="text-sm font-semibold">{request.songTitle}</p>
                        <p className="text-xs text-muted-foreground">{request.artist}</p>
                        <div className="mt-2 flex items-center justify-between">
                          <Badge variant="outline">{request.votes} votes</Badge>
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => actions.voteAudienceSongRequest(request.id)}
                            >
                              <ThumbsUp className="mr-1 h-3 w-3" />
                              Vote
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => actions.markSongRequestPlayed(request.id)}
                            >
                              Played
                            </Button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Audience Poll */}
            <Card className="feature-card-luxe border-cyan-500/30 bg-cyan-500/10">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Vote className="w-5 h-5 text-cyan-400" />
                  Audience Poll
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {!activePoll ? (
                  <Button onClick={launchQuickPoll} className="w-full bg-cyan-600 hover:bg-cyan-700">
                    Launch quick poll
                  </Button>
                ) : (
                  <div className="space-y-2">
                    <p className="text-sm font-semibold">{activePoll.prompt}</p>
                    {activePoll.options.map((option) => (
                      <div key={option.id} className="rounded border border-border/40 p-2">
                        <div className="mb-1 flex items-center justify-between text-xs">
                          <span>{option.label}</span>
                          <span>{option.votes} votes</span>
                        </div>
                        <Button
                          size="sm"
                          variant="outline"
                          className="w-full"
                          onClick={() => actions.castAudiencePollVote(activePoll.id, option.id)}
                        >
                          Add vote
                        </Button>
                      </div>
                    ))}
                    <Button
                      variant="outline"
                      className="w-full border-cyan-400/40"
                      onClick={() => actions.closeAudiencePoll(activePoll.id)}
                    >
                      Close poll
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Issues */}
            <Card
              className={
                pendingIssues.length > 0
                  ? 'feature-card-luxe border-red-500/50 bg-red-500/10'
                  : 'feature-card-luxe border-green-500/30 bg-green-500/10'
              }
            >
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <AlertCircle
                    className={`w-5 h-5 ${pendingIssues.length > 0 ? 'text-red-400' : 'text-green-400'}`}
                  />
                  Issues ({pendingIssues.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                {pendingIssues.length === 0 ? (
                  <p className="text-sm text-green-400">✓ No active issues</p>
                ) : (
                  <div className="space-y-2">
                    {pendingIssues.map((issue) => (
                      <div key={issue.id} className="p-2 rounded border border-border/50">
                        <div className="flex items-start gap-2">
                          <span
                            className={`text-xs font-bold px-2 py-1 rounded ${
                              issue.severity === 'critical'
                                ? 'bg-red-600 text-white'
                                : issue.severity === 'high'
                                ? 'bg-orange-600 text-white'
                                : issue.severity === 'medium'
                                ? 'bg-yellow-600 text-white'
                                : 'bg-blue-600 text-white'
                            }`}
                          >
                            {issue.severity}
                          </span>
                          <div>
                            <p className="text-sm font-medium">{issue.title}</p>
                            <p className="text-xs text-muted-foreground">{issue.description}</p>
                          </div>
                        </div>
                        {issue.resolved && (
                          <p className="text-xs text-green-400 mt-1">✓ Resolved</p>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Staff Messages */}
            <Card className="feature-card-luxe border-blue-500/30">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MessageSquare className="w-5 h-5" />
                  Staff Messages ({recentMessages.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {recentMessages.length === 0 ? (
                    <p className="text-sm text-muted-foreground">No messages</p>
                  ) : (
                    recentMessages.map((msg) => (
                      <div
                        key={msg.id}
                        className={`p-2 rounded text-sm ${
                          msg.isUrgent
                            ? 'bg-red-500/20 border border-red-500/50'
                            : 'bg-black/30 border border-border/30'
                        }`}
                      >
                        <p className="text-xs font-semibold text-amber-400">
                          {msg.senderRole.toUpperCase()}
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">{msg.message}</p>
                        <p className="text-xs text-muted-foreground mt-1 opacity-50">
                          {new Date(msg.timestamp).toLocaleTimeString()}
                        </p>
                      </div>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Live Notifications */}
            <Card className="feature-card-luxe border-purple-500/30">
              <CardHeader>
                <CardTitle>Live Feed ({state.liveNotifications.length})</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 max-h-48 overflow-y-auto">
                  {state.liveNotifications.length === 0 ? (
                    <p className="text-sm text-muted-foreground">No notifications</p>
                  ) : (
                    [...state.liveNotifications].reverse().slice(0, 5).map((notif) => (
                      <div
                        key={notif.id}
                        className="p-2 rounded text-sm bg-black/30 border border-border/30"
                      >
                        <p className="font-semibold text-amber-400">{notif.title}</p>
                        <p className="text-xs text-muted-foreground mt-1">{notif.message}</p>
                      </div>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
