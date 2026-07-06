// Event analytics & engagement tracking types - Phase 12

export type EngagementMetricType = 'applause' | 'laughter' | 'dancing' | 'photo' | 'video' | 'comment';
export type TimelineAccuracy = 'on_time' | 'early' | 'late' | 'skipped';
export type JokeLandingStatus = 'landed' | 'missed' | 'neutral' | 'offended';

export interface JokeMetric {
  id: string;
  eventId: string;
  jokeId: string;
  jokeText: string;
  category: string;
  deliveredAt: string;
  landingStatus: JokeLandingStatus;
  applianceIntensity: number; // 0-100
  laughterScore: number; // 0-100 (detected via audio)
  socialMediaMentions: number;
  retellCount: number; // how many times retold
}

export interface TimelineAdherenceMetric {
  id: string;
  eventId: string;
  cueId: string;
  phaseName: string;
  scheduledTime: string;
  actualStartTime?: string;
  actualEndTime?: string;
  accuracy: TimelineAccuracy;
  deltaMinutes: number; // positive = late, negative = early
  durationVariance: number; // actual vs planned duration difference
}

export interface EngagementEvent {
  id: string;
  eventId: string;
  timestamp: string;
  type: EngagementMetricType;
  intensity: number; // 0-100
  location?: string; // 'dance_floor' | 'bar' | 'tables' | 'stage'
  guestSegment?: string; // 'family' | 'friends' | 'coworkers'
  relatedCueId?: string;
  notes?: string;
}

export interface SpeechMetric {
  id: string;
  eventId: string;
  speechId: string;
  speaker: string; // 'best_man' | 'maid_of_honor' | 'father' | 'mother' | 'groom' | 'bride'
  duration: number; // seconds
  laughCount: number; // detected pauses for laughter
  applauseIntensity: number; // 0-100
  emotionalHighPoints: number; // detected peaks in emotion
  audioQualityScore: number; // 0-100 (clarity, volume)
  audienceEngagement: number; // 0-100 (calculated from reactions)
}

export interface MusicMetrics {
  id: string;
  eventId: string;
  trackId: string;
  title: string;
  artist: string;
  duration: number; // seconds
  playedDuration: number; // how long actually played
  skipCount: number;
  replayCount: number;
  engagementScore: number; // 0-100 (based on dancing/applause)
  crowdResponse: 'loved' | 'liked' | 'neutral' | 'skipped';
}

export interface GuestSurveyResponse {
  id: string;
  eventId: string;
  guestId?: string;
  guestName?: string;
  timestamp: string;
  overallRating: number; // 1-5 stars
  entertainmentRating: number; // 1-5
  musicRating: number; // 1-5
  foodRating: number; // 1-5
  ambiance: string; // free-form
  highlights: string[];
  improvements: string[];
  wouldRecommend: boolean;
}

export interface SessionReplayCheckpoint {
  id: string;
  eventId: string;
  timestamp: string;
  cueId: string;
  cuePhase: string;
  djVolume: number;
  currentTrack?: string;
  engagementLevel: number; // 0-100
  audienceSize: number;
  staffActions: string[];
  notes?: string;
}

export interface PostEventAnalytics {
  eventId: string;
  eventTitle: string;
  eventDate: string;
  eventDuration: number; // minutes

  // Timeline metrics
  timelineAdherence: number; // percentage on-time
  cueSkipCount: number;
  averageDelayMinutes: number;

  // Engagement metrics
  totalEngagementScore: number; // 0-100
  peakEngagementTime: string;
  averageEngagementPerCue: Record<string, number>;

  // Joke metrics
  topPerformingJokes: JokeMetric[];
  averageJokeScore: number;
  bestJokeLanding: JokeMetric | null;

  // Speech metrics
  topSpeech: SpeechMetric | null;
  averageSpeechLength: number;
  totalLaughsDetected: number;

  // Music metrics
  mostPopularTracks: MusicMetrics[];
  averageMusicEngagement: number;
  trackSkipRate: number; // percentage

  // Guest feedback
  surveyResponseRate: number; // percentage
  averageOverallRating: number; // 1-5
  recommendationRate: number; // percentage

  // Timeline
  sessionCheckpoints: SessionReplayCheckpoint[];
  recordingUrl?: string; // URL to video replay

  // Insights
  keyHighlights: string[];
  improvementAreas: string[];
  nextEventRecommendations: string[];
}

export interface EngagementDashboardState {
  eventId: string;
  isLive: boolean;
  analytics: PostEventAnalytics;
  realtimeMetrics: {
    currentEngagement: number;
    activeDancers: number;
    photosPerMinute: number;
    mentionsPerMinute: number;
  };
  sessionRecording: {
    isRecording: boolean;
    startTime: string;
    checkpointCount: number;
    fileSize: number;
  };
}
