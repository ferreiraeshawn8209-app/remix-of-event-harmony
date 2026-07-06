// Event-day command center engine - Phase 11

import type {
  TimelineCue,
  DjControl,
  DjCommand,
  AudienceReaction,
  CommandCenterState,
  StaffMessage,
  LiveNotification,
  EventDayIssue,
  AudienceSongRequest,
  AudiencePoll,
} from '@/packages/shared-types/event-day-command';

export class CommandCenterEngine {
  private state: CommandCenterState;

  constructor(eventId: string, cueList: any[] = []) {
    this.state = {
      eventId,
      eventDayStatus: {
        eventId,
        status: 'not_started',
        currentCueId: undefined,
        currentPhase: undefined,
        nextPhaseId: undefined,
        timelineProgress: 0,
        audioSystemStatus: 'online',
        lightingStatus: 'online',
        danceFloorActive: false,
        issues: [],
      },
      cueList: this.initializeCueList(cueList),
      djControl: {
        id: `dj-${eventId}`,
        eventId,
        isLive: false,
        volume: 75,
        isMuted: false,
        commandHistory: [],
      },
      audienceReactions: [],
      audienceSongRequests: [],
      audiencePolls: [],
      staffMessages: [],
      liveNotifications: [],
    };
  }

  private initializeCueList(timelinePhases: any[]): TimelineCue[] {
    return timelinePhases.map((phase, idx) => ({
      id: `cue-${idx + 1}`,
      phaseId: phase.id,
      phaseName: phase.name,
      scheduledTime: phase.startTime,
      duration: phase.duration || 30,
      status: 'pending' as const,
      description: `${phase.name} - ${phase.description || ''}`.trim(),
      notes: undefined,
      musicTrack: phase.music,
    }));
  }

  // DJ Controls
  startEvent(): void {
    this.state.eventDayStatus.status = 'in_progress';
    this.state.eventDayStatus.startTime = new Date().toISOString();
    this.addNotification({
      type: 'system',
      title: 'Event Started',
      message: 'Welcome to the event day command center!',
      timestamp: new Date().toISOString(),
      actionRequired: false,
    });
  }

  pauseEvent(): void {
    this.state.eventDayStatus.status = 'paused';
    this.addNotification({
      type: 'system',
      title: 'Event Paused',
      message: 'Event playback paused.',
      timestamp: new Date().toISOString(),
      actionRequired: false,
    });
  }

  resumeEvent(): void {
    this.state.eventDayStatus.status = 'in_progress';
    this.addNotification({
      type: 'system',
      title: 'Event Resumed',
      message: 'Event playback resumed.',
      timestamp: new Date().toISOString(),
      actionRequired: false,
    });
  }

  endEvent(): void {
    this.state.eventDayStatus.status = 'completed';
    this.state.eventDayStatus.endTime = new Date().toISOString();
    this.state.eventDayStatus.timelineProgress = 100;
    this.addNotification({
      type: 'system',
      title: 'Event Completed',
      message: 'Event day concluded. Thank you!',
      timestamp: new Date().toISOString(),
      actionRequired: false,
    });
  }

  advanceCue(): void {
    const currentIdx = this.state.cueList.findIndex((c) => c.status === 'active');
    if (currentIdx >= 0) {
      this.state.cueList[currentIdx].status = 'completed';
      this.state.cueList[currentIdx].actualEndTime = new Date().toISOString();

      if (currentIdx + 1 < this.state.cueList.length) {
        const nextCue = this.state.cueList[currentIdx + 1];
        nextCue.status = 'active';
        nextCue.actualStartTime = new Date().toISOString();
        this.state.eventDayStatus.currentCueId = nextCue.id;
        this.state.eventDayStatus.currentPhase = nextCue.phaseName;

        this.recordCommand('cue_advance', 'system', { cueId: nextCue.id });
        this.addNotification({
          type: 'cue_active',
          title: `Now: ${nextCue.phaseName}`,
          message: nextCue.description,
          timestamp: new Date().toISOString(),
          actionRequired: false,
        });

        // Update progress
        this.state.eventDayStatus.timelineProgress = Math.round(
          ((currentIdx + 2) / this.state.cueList.length) * 100
        );
      }
    } else {
      // Start first cue
      const firstCue = this.state.cueList[0];
      if (firstCue) {
        firstCue.status = 'active';
        firstCue.actualStartTime = new Date().toISOString();
        this.state.eventDayStatus.currentCueId = firstCue.id;
        this.state.eventDayStatus.currentPhase = firstCue.phaseName;
        this.recordCommand('cue_advance', 'system', { cueId: firstCue.id });
      }
    }
  }

  rewindCue(): void {
    const currentIdx = this.state.cueList.findIndex((c) => c.status === 'active');
    if (currentIdx > 0) {
      this.state.cueList[currentIdx].status = 'pending';
      this.state.cueList[currentIdx].actualStartTime = undefined;
      this.state.cueList[currentIdx].actualEndTime = undefined;

      const prevCue = this.state.cueList[currentIdx - 1];
      prevCue.status = 'active';
      prevCue.actualStartTime = new Date().toISOString();
      prevCue.actualEndTime = undefined;
      this.state.eventDayStatus.currentCueId = prevCue.id;
      this.state.eventDayStatus.currentPhase = prevCue.phaseName;

      this.recordCommand('cue_rewind', 'system', { cueId: prevCue.id });
      this.addNotification({
        type: 'cue_active',
        title: `Rewound: ${prevCue.phaseName}`,
        message: prevCue.description,
        timestamp: new Date().toISOString(),
        actionRequired: false,
      });

      // Update progress
      this.state.eventDayStatus.timelineProgress = Math.round(
        ((currentIdx) / this.state.cueList.length) * 100
      );
    }
  }

  setVolume(level: number): void {
    const clamped = Math.max(0, Math.min(100, level));
    this.state.djControl.volume = clamped;
    this.recordCommand('volume_change', 'system', { newVolume: clamped });
  }

  toggleMute(): void {
    this.state.djControl.isMuted = !this.state.djControl.isMuted;
    this.recordCommand('play', 'system', { action: this.state.djControl.isMuted ? 'mute' : 'unmute' });
  }

  // Staff Communication
  addStaffMessage(senderId: string, senderRole: string, message: string, isUrgent: boolean = false): void {
    const staffMsg: StaffMessage = {
      id: `msg-${Date.now()}`,
      senderId,
      senderRole,
      message,
      timestamp: new Date().toISOString(),
      isUrgent,
    };
    this.state.staffMessages.push(staffMsg);

    if (isUrgent) {
      this.addNotification({
        type: 'staff_message',
        title: `Urgent from ${senderRole}`,
        message,
        timestamp: new Date().toISOString(),
        actionRequired: true,
      });
    }
  }

  // Audience Reactions
  recordAudienceReaction(type: any, intensity: number, count: number = 1): void {
    const reaction: AudienceReaction = {
      id: `reaction-${Date.now()}`,
      eventId: this.state.eventId,
      type,
      intensity,
      count,
      timestamp: new Date().toISOString(),
      relatedCueId: this.state.eventDayStatus.currentCueId,
    };
    this.state.audienceReactions.push(reaction);

    // Auto-notify for high-intensity reactions
    if (intensity > 80) {
      this.addNotification({
        type: 'audience_reaction',
        title: `🔥 ${type.toUpperCase()}!`,
        message: `Audience is ${type}! (${intensity}% intensity)`,
        timestamp: new Date().toISOString(),
        actionRequired: false,
      });
    }
  }

  // Audience Requests & Polls
  addAudienceSongRequest(songTitle: string, artist: string, guestName?: string): void {
    const request: AudienceSongRequest = {
      id: `req-${Date.now()}`,
      eventId: this.state.eventId,
      songTitle,
      artist,
      guestName,
      requestedAt: new Date().toISOString(),
      votes: 1,
      status: 'queued',
    };
    this.state.audienceSongRequests.push(request);
    this.addNotification({
      type: 'audience_reaction',
      title: 'New Song Request',
      message: `${songTitle} - ${artist}`,
      timestamp: new Date().toISOString(),
      actionRequired: false,
    });
  }

  voteAudienceSongRequest(requestId: string): void {
    const request = this.state.audienceSongRequests.find((item) => item.id === requestId && item.status === 'queued');
    if (!request) {
      return;
    }
    request.votes += 1;
  }

  markSongRequestPlayed(requestId: string): void {
    const request = this.state.audienceSongRequests.find((item) => item.id === requestId);
    if (!request) {
      return;
    }
    request.status = 'played';
  }

  createAudiencePoll(prompt: string, optionLabels: string[], closesAt?: string): void {
    const normalizedOptions = optionLabels
      .map((label) => label.trim())
      .filter((label) => label.length > 0)
      .slice(0, 6);

    if (normalizedOptions.length < 2) {
      return;
    }

    const poll: AudiencePoll = {
      id: `poll-${Date.now()}`,
      eventId: this.state.eventId,
      prompt,
      createdAt: new Date().toISOString(),
      closesAt,
      status: 'active',
      options: normalizedOptions.map((label, index) => ({
        id: `option-${index + 1}`,
        label,
        votes: 0,
      })),
    };

    this.state.audiencePolls.push(poll);
    this.addNotification({
      type: 'system',
      title: 'Audience Poll Started',
      message: prompt,
      timestamp: new Date().toISOString(),
      actionRequired: false,
    });
  }

  castAudiencePollVote(pollId: string, optionId: string): void {
    const poll = this.state.audiencePolls.find((item) => item.id === pollId && item.status === 'active');
    if (!poll) {
      return;
    }
    const option = poll.options.find((item) => item.id === optionId);
    if (!option) {
      return;
    }
    option.votes += 1;
  }

  closeAudiencePoll(pollId: string): void {
    const poll = this.state.audiencePolls.find((item) => item.id === pollId);
    if (!poll) {
      return;
    }
    poll.status = 'closed';
  }

  // Issue Tracking
  reportIssue(severity: any, title: string, description: string): void {
    const issue: EventDayIssue = {
      id: `issue-${Date.now()}`,
      severity,
      title,
      description,
      timestamp: new Date().toISOString(),
      resolved: false,
    };
    this.state.eventDayStatus.issues.push(issue);

    this.addNotification({
      type: 'issue_alert',
      title: `${severity.toUpperCase()} ISSUE`,
      message: title,
      timestamp: new Date().toISOString(),
      actionRequired: severity === 'critical' || severity === 'high',
    });
  }

  resolveIssue(issueId: string, resolutionNotes: string): void {
    const issue = this.state.eventDayStatus.issues.find((i) => i.id === issueId);
    if (issue) {
      issue.resolved = true;
      issue.resolvedAt = new Date().toISOString();
      issue.resolutionNotes = resolutionNotes;
    }
  }

  // Notifications
  private addNotification(notif: Omit<LiveNotification, 'id'>): void {
    this.state.liveNotifications.push({
      id: `notif-${Date.now()}`,
      ...notif,
    });

    // Keep only recent 50 notifications
    if (this.state.liveNotifications.length > 50) {
      this.state.liveNotifications = this.state.liveNotifications.slice(-50);
    }
  }

  clearNotifications(): void {
    this.state.liveNotifications = [];
  }

  // Command History
  private recordCommand(command: any, executedBy: string, details?: Record<string, any>): void {
    const cmd: DjCommand = {
      id: `cmd-${Date.now()}`,
      command,
      timestamp: new Date().toISOString(),
      executedBy,
      details,
    };
    this.state.djControl.commandHistory.push(cmd);

    // Keep only recent 100 commands
    if (this.state.djControl.commandHistory.length > 100) {
      this.state.djControl.commandHistory = this.state.djControl.commandHistory.slice(-100);
    }
  }

  // State Getters
  getState(): CommandCenterState {
    return { ...this.state };
  }

  getCurrentCue(): TimelineCue | undefined {
    return this.state.cueList.find((c) => c.status === 'active');
  }

  getUpcomingCues(count: number = 3): TimelineCue[] {
    const currentIdx = this.state.cueList.findIndex((c) => c.status === 'active');
    return this.state.cueList.slice(currentIdx + 1, currentIdx + 1 + count);
  }

  getPendingIssues(): EventDayIssue[] {
    return this.state.eventDayStatus.issues.filter((i) => !i.resolved);
  }

  getRecentMessages(count: number = 10): StaffMessage[] {
    return [...this.state.staffMessages].reverse().slice(0, count);
  }

  getTopAudienceSongRequests(count: number = 5): AudienceSongRequest[] {
    return [...this.state.audienceSongRequests]
      .filter((request) => request.status === 'queued')
      .sort((a, b) => b.votes - a.votes)
      .slice(0, count);
  }

  getActiveAudiencePoll(): AudiencePoll | undefined {
    return [...this.state.audiencePolls].reverse().find((poll) => poll.status === 'active');
  }
}
