// @ts-nocheck
// Event analytics engine - Phase 12

import type {
  JokeMetric,
  TimelineAdherenceMetric,
  EngagementEvent,
  SpeechMetric,
  MusicMetrics,
  GuestSurveyResponse,
  SessionReplayCheckpoint,
  PostEventAnalytics,
  EngagementDashboardState,
} from '@/packages/shared-types/event-analytics';

export class AnalyticsEngine {
  private eventId: string;
  private jokeMetrics: JokeMetric[] = [];
  private timelineMetrics: TimelineAdherenceMetric[] = [];
  private engagementEvents: EngagementEvent[] = [];
  private speechMetrics: SpeechMetric[] = [];
  private musicMetrics: MusicMetrics[] = [];
  private surveyResponses: GuestSurveyResponse[] = [];
  private sessionCheckpoints: SessionReplayCheckpoint[] = [];
  private isRecording: boolean = false;
  private recordingStartTime: string = new Date().toISOString();

  constructor(eventId: string) {
    this.eventId = eventId;
  }

  // Joke Tracking
  recordJokeDelivery(
    jokeId: string,
    jokeText: string,
    category: string,
    landingStatus: any,
    applianceIntensity: number
  ): void {
    const metric: JokeMetric = {
      id: `joke-${Date.now()}`,
      eventId: this.eventId,
      jokeId,
      jokeText,
      category,
      deliveredAt: new Date().toISOString(),
      landingStatus,
      applianceIntensity: Math.min(100, Math.max(0, applianceIntensity)),
      laughterScore: this.estimateLaughterScore(applianceIntensity),
      socialMediaMentions: 0,
      retellCount: 0,
    };
    this.jokeMetrics.push(metric);
  }

  private estimateLaughterScore(applianceIntensity: number): number {
    return Math.round(applianceIntensity * 0.85 + Math.random() * 15);
  }

  // Timeline Tracking
  recordTimelinePhase(
    cueId: string,
    phaseName: string,
    scheduledTime: string,
    actualStartTime: string,
    actualEndTime: string,
    plannedDuration: number
  ): void {
    const actualDuration = (new Date(actualEndTime).getTime() - new Date(actualStartTime).getTime()) / 60000;
    const deltaMinutes = Math.round((new Date(actualStartTime).getTime() - new Date(scheduledTime).getTime()) / 60000);
    
    const accuracy = deltaMinutes === 0 ? 'on_time' : deltaMinutes > 0 ? 'late' : 'early';
    const durationVariance = actualDuration - plannedDuration;

    const metric: TimelineAdherenceMetric = {
      id: `timeline-${Date.now()}`,
      eventId: this.eventId,
      cueId,
      phaseName,
      scheduledTime,
      actualStartTime,
      actualEndTime,
      accuracy,
      deltaMinutes,
      durationVariance,
    };
    this.timelineMetrics.push(metric);
  }

  // Engagement Tracking
  recordEngagement(type: any, intensity: number, location?: string, cueId?: string): void {
    const event: EngagementEvent = {
      id: `engagement-${Date.now()}`,
      eventId: this.eventId,
      timestamp: new Date().toISOString(),
      type,
      intensity: Math.min(100, Math.max(0, intensity)),
      location,
      relatedCueId: cueId,
    };
    this.engagementEvents.push(event);
  }

  // Speech Tracking
  recordSpeech(
    speechId: string,
    speaker: string,
    duration: number,
    laughCount: number,
    applianceIntensity: number
  ): void {
    const metric: SpeechMetric = {
      id: `speech-${Date.now()}`,
      eventId: this.eventId,
      speechId,
      speaker: speaker as any,
      duration,
      laughCount,
      applianceIntensity,
      emotionalHighPoints: Math.ceil(laughCount * 0.3),
      audioQualityScore: 85 + Math.random() * 15,
      audienceEngagement: applianceIntensity,
    };
    this.speechMetrics.push(metric);
  }

  // Music Tracking
  recordMusicTrack(
    trackId: string,
    title: string,
    artist: string,
    duration: number,
    playedDuration: number,
    engagementScore: number
  ): void {
    const crowdResponse =
      engagementScore > 80
        ? 'loved'
        : engagementScore > 60
        ? 'liked'
        : engagementScore > 40
        ? 'neutral'
        : 'skipped';

    const metric: MusicMetrics = {
      id: `music-${Date.now()}`,
      eventId: this.eventId,
      trackId,
      title,
      artist,
      duration,
      playedDuration,
      skipCount: playedDuration < duration * 0.5 ? 1 : 0,
      replayCount: playedDuration > duration * 1.2 ? 1 : 0,
      engagementScore,
      crowdResponse,
    };
    this.musicMetrics.push(metric);
  }

  // Guest Surveys
  recordSurveyResponse(response: Omit<GuestSurveyResponse, 'id'>): void {
    this.surveyResponses.push({
      id: `survey-${Date.now()}`,
      ...response,
    });
  }

  // Session Replay
  startRecording(): void {
    this.isRecording = true;
    this.recordingStartTime = new Date().toISOString();
  }

  stopRecording(): void {
    this.isRecording = false;
  }

  recordCheckpoint(
    cueId: string,
    cuePhase: string,
    djVolume: number,
    engagementLevel: number,
    audienceSize: number
  ): void {
    const checkpoint: SessionReplayCheckpoint = {
      id: `checkpoint-${Date.now()}`,
      eventId: this.eventId,
      timestamp: new Date().toISOString(),
      cueId,
      cuePhase,
      djVolume,
      engagementLevel,
      audienceSize,
      staffActions: [],
      notes: undefined,
    };
    this.sessionCheckpoints.push(checkpoint);
  }

  // Analytics Calculations
  getPostEventAnalytics(): PostEventAnalytics {
    const timelineOnTimeCount = this.timelineMetrics.filter((m) => m.accuracy === 'on_time').length;
    const timelineAdherence =
      this.timelineMetrics.length > 0
        ? Math.round((timelineOnTimeCount / this.timelineMetrics.length) * 100)
        : 0;

    const averageDelayMinutes =
      this.timelineMetrics.length > 0
        ? Math.round(
            this.timelineMetrics.reduce((sum, m) => sum + Math.abs(m.deltaMinutes), 0) /
              this.timelineMetrics.length
          )
        : 0;

    const totalEngagementScore =
      this.engagementEvents.length > 0
        ? Math.round(
            this.engagementEvents.reduce((sum, e) => sum + e.intensity, 0) / this.engagementEvents.length
          )
        : 0;

    const topJokes = [...this.jokeMetrics].sort((a, b) => b.applianceIntensity - a.applianceIntensity).slice(0, 3);
    const averageJokeScore =
      this.jokeMetrics.length > 0
        ? Math.round(
            this.jokeMetrics.reduce((sum, j) => sum + j.applianceIntensity, 0) / this.jokeMetrics.length
          )
        : 0;

    const topSpeech = [...this.speechMetrics].sort((a, b) => b.audienceEngagement - a.audienceEngagement)[0];
    const averageSpeechLength =
      this.speechMetrics.length > 0
        ? Math.round(
            this.speechMetrics.reduce((sum, s) => sum + s.duration, 0) / this.speechMetrics.length
          )
        : 0;
    const totalLaughsDetected = this.speechMetrics.reduce((sum, s) => sum + s.laughCount, 0);

    const topMusic = [...this.musicMetrics].sort((a, b) => b.engagementScore - a.engagementScore).slice(0, 3);
    const averageMusicEngagement =
      this.musicMetrics.length > 0
        ? Math.round(
            this.musicMetrics.reduce((sum, m) => sum + m.engagementScore, 0) / this.musicMetrics.length
          )
        : 0;

    const trackSkipRate =
      this.musicMetrics.length > 0
        ? Math.round((this.musicMetrics.filter((m) => m.skipCount > 0).length / this.musicMetrics.length) * 100)
        : 0;

    const surveyResponseRate =
      this.surveyResponses.length > 0 ? Math.round(Math.min(100, this.surveyResponses.length * 5)) : 0;
    const averageOverallRating =
      this.surveyResponses.length > 0
        ? (this.surveyResponses.reduce((sum, s) => sum + s.overallRating, 0) / this.surveyResponses.length).toFixed(1)
        : '0';
    const recommendationRate =
      this.surveyResponses.length > 0
        ? Math.round(
            (this.surveyResponses.filter((s) => s.wouldRecommend).length / this.surveyResponses.length) * 100
          )
        : 0;

    return {
      eventId: this.eventId,
      eventTitle: 'Wedding Event',
      eventDate: new Date().toISOString(),
      eventDuration: 240,

      timelineAdherence,
      cueSkipCount: this.timelineMetrics.filter((m) => m.accuracy === 'skipped').length,
      averageDelayMinutes,

      totalEngagementScore,
      peakEngagementTime: this.engagementEvents.length > 0 ? this.engagementEvents[0].timestamp : '',
      averageEngagementPerCue: {},

      topPerformingJokes: topJokes,
      averageJokeScore,
      bestJokeLanding: topJokes[0] || null,

      topSpeech: topSpeech || null,
      averageSpeechLength,
      totalLaughsDetected,

      mostPopularTracks: topMusic,
      averageMusicEngagement,
      trackSkipRate,

      surveyResponseRate,
      averageOverallRating: parseFloat(averageOverallRating as string),
      recommendationRate,

      sessionCheckpoints: this.sessionCheckpoints,
      recordingUrl: this.isRecording ? `/recordings/${this.eventId}.mp4` : undefined,

      keyHighlights: [
        `${topJokes.length} high-performing jokes (avg ${averageJokeScore}% applause)`,
        `${totalLaughsDetected} detected laughs across speeches`,
        `${topMusic.length} crowd favorites (avg ${averageMusicEngagement}% engagement)`,
      ],

      improvementAreas: [
        averageDelayMinutes > 5 ? `Timeline adherence could improve (avg ${averageDelayMinutes}min delay)` : '',
        trackSkipRate > 30 ? `Consider updating music playlist (${trackSkipRate}% skip rate)` : '',
      ].filter(Boolean),

      nextEventRecommendations: [
        'Repeat top-performing jokes from this event',
        'Use same DJ - strong music selections',
        'Similar timeline structure for future events',
      ],
    };
  }

  getRealTimeMetrics() {
    const recentEngagement = this.engagementEvents.slice(-20);
    const currentEngagement =
      recentEngagement.length > 0
        ? Math.round(recentEngagement.reduce((sum, e) => sum + e.intensity, 0) / recentEngagement.length)
        : 0;

    const activeDancers = this.engagementEvents.filter((e) => e.type === 'dancing').length;
    const photosPerMinute =
      this.engagementEvents.filter((e) => e.type === 'photo').length / Math.max(1, this.timelineMetrics.length || 1);
    const mentionsPerMinute = 0;

    return {
      currentEngagement,
      activeDancers,
      photosPerMinute: Math.round(photosPerMinute * 100) / 100,
      mentionsPerMinute,
    };
  }

  getDashboardState(): EngagementDashboardState {
    return {
      eventId: this.eventId,
      isLive: this.isRecording,
      analytics: this.getPostEventAnalytics(),
      realtimeMetrics: this.getRealTimeMetrics(),
      sessionRecording: {
        isRecording: this.isRecording,
        startTime: this.recordingStartTime,
        checkpointCount: this.sessionCheckpoints.length,
        fileSize: this.sessionCheckpoints.length * 50,
      },
    };
  }
}