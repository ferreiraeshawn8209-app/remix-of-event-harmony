// Event-day command center types - Phase 11

export type CueStatus = 'pending' | 'active' | 'completed' | 'skipped';
export type EventDayStatus = 'not_started' | 'in_progress' | 'completed' | 'paused';
export type AudienceReactionType = 'cheering' | 'applause' | 'dancing' | 'quiet' | 'confused';

export interface TimelineCue {
  id: string;
  phaseId: string;
  phaseName: string;
  scheduledTime: string;
  actualStartTime?: string;
  actualEndTime?: string;
  duration: number; // minutes
  status: CueStatus;
  description: string;
  notes?: string;
  musicTrack?: {
    title: string;
    artist: string;
    duration: number;
  };
}

export interface DjControl {
  id: string;
  eventId: string;
  currentCueId?: string;
  isLive: boolean;
  volume: number; // 0-100
  isMuted: boolean;
  currentTrack?: {
    title: string;
    artist: string;
    duration: number;
    elapsedSeconds: number;
  };
  nextTrack?: {
    title: string;
    artist: string;
  };
  commandHistory: DjCommand[];
}

export interface DjCommand {
  id: string;
  command: 'play' | 'pause' | 'skip' | 'volume_change' | 'cue_advance' | 'cue_rewind' | 'announcement';
  timestamp: string;
  executedBy: string;
  details?: Record<string, any>;
}

export interface AudienceReaction {
  id: string;
  eventId: string;
  type: AudienceReactionType;
  intensity: number; // 0-100
  count: number; // how many reported it
  timestamp: string;
  relatedCueId?: string;
}

export interface EventDayStatus {
  eventId: string;
  status: EventDayStatus;
  startTime?: string;
  endTime?: string;
  currentCueId?: string;
  currentPhase?: string;
  nextPhaseId?: string;
  timelineProgress: number; // percentage
  guestCount?: number;
  staffPresent?: number;
  audioSystemStatus: 'online' | 'offline' | 'warning';
  lightingStatus: 'online' | 'offline' | 'warning';
  danceFloorActive: boolean;
  issues: EventDayIssue[];
}

export interface EventDayIssue {
  id: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  title: string;
  description: string;
  timestamp: string;
  resolved: boolean;
  resolvedAt?: string;
  resolutionNotes?: string;
}

export interface CommandCenterState {
  eventId: string;
  eventDayStatus: EventDayStatus;
  cueList: TimelineCue[];
  djControl: DjControl;
  audienceReactions: AudienceReaction[];
  staffMessages: StaffMessage[];
  liveNotifications: LiveNotification[];
}

export interface StaffMessage {
  id: string;
  senderId: string;
  senderRole: string; // 'mc', 'dj', 'coordinator', 'lighting', 'video'
  message: string;
  timestamp: string;
  isUrgent: boolean;
}

export interface LiveNotification {
  id: string;
  type: 'cue_upcoming' | 'cue_active' | 'issue_alert' | 'audience_reaction' | 'staff_message' | 'system';
  title: string;
  message: string;
  timestamp: string;
  actionRequired: boolean;
  action?: {
    label: string;
    handler: string;
  };
}
