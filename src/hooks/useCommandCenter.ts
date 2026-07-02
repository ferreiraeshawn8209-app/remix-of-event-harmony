import { useState, useCallback } from 'react';
import type { CommandCenterState } from '@/packages/shared-types/event-day-command';
import { CommandCenterEngine } from '@/services/event-day-command/command-center-engine';

export function useCommandCenter(eventId: string, initialCueList: any[] = []) {
  const [engine] = useState(() => new CommandCenterEngine(eventId, initialCueList));
  const [state, setState] = useState<CommandCenterState>(engine.getState());

  const updateState = useCallback(() => {
    setState(engine.getState());
  }, [engine]);

  const startEvent = useCallback(() => {
    engine.startEvent();
    updateState();
  }, [engine, updateState]);

  const pauseEvent = useCallback(() => {
    engine.pauseEvent();
    updateState();
  }, [engine, updateState]);

  const resumeEvent = useCallback(() => {
    engine.resumeEvent();
    updateState();
  }, [engine, updateState]);

  const endEvent = useCallback(() => {
    engine.endEvent();
    updateState();
  }, [engine, updateState]);

  const advanceCue = useCallback(() => {
    engine.advanceCue();
    updateState();
  }, [engine, updateState]);

  const rewindCue = useCallback(() => {
    engine.rewindCue();
    updateState();
  }, [engine, updateState]);

  const setVolume = useCallback(
    (level: number) => {
      engine.setVolume(level);
      updateState();
    },
    [engine, updateState]
  );

  const toggleMute = useCallback(() => {
    engine.toggleMute();
    updateState();
  }, [engine, updateState]);

  const addStaffMessage = useCallback(
    (senderId: string, senderRole: string, message: string, isUrgent = false) => {
      engine.addStaffMessage(senderId, senderRole, message, isUrgent);
      updateState();
    },
    [engine, updateState]
  );

  const recordAudienceReaction = useCallback(
    (type: string, intensity: number, count = 1) => {
      engine.recordAudienceReaction(type, intensity, count);
      updateState();
    },
    [engine, updateState]
  );

  const reportIssue = useCallback(
    (severity: string, title: string, description: string) => {
      engine.reportIssue(severity, title, description);
      updateState();
    },
    [engine, updateState]
  );

  const resolveIssue = useCallback(
    (issueId: string, resolutionNotes: string) => {
      engine.resolveIssue(issueId, resolutionNotes);
      updateState();
    },
    [engine, updateState]
  );

  const clearNotifications = useCallback(() => {
    engine.clearNotifications();
    updateState();
  }, [engine, updateState]);

  return {
    state,
    actions: {
      startEvent,
      pauseEvent,
      resumeEvent,
      endEvent,
      advanceCue,
      rewindCue,
      setVolume,
      toggleMute,
      addStaffMessage,
      recordAudienceReaction,
      reportIssue,
      resolveIssue,
      clearNotifications,
    },
    getters: {
      getCurrentCue: () => engine.getCurrentCue(),
      getUpcomingCues: (count?: number) => engine.getUpcomingCues(count),
      getPendingIssues: () => engine.getPendingIssues(),
      getRecentMessages: (count?: number) => engine.getRecentMessages(count),
    },
  };
}
