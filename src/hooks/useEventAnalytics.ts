import { useState, useCallback } from 'react';
import type { EngagementDashboardState } from '@/packages/shared-types/event-analytics';
import { AnalyticsEngine } from '@/services/event-analytics/analytics-engine';

export function useEventAnalytics(eventId: string) {
  const [engine] = useState(() => new AnalyticsEngine(eventId));
  const [state, setState] = useState<EngagementDashboardState>(engine.getDashboardState());

  const updateState = useCallback(() => {
    setState(engine.getDashboardState());
  }, [engine]);

  const recordJoke = useCallback(
    (jokeId: string, jokeText: string, category: string, landingStatus: string, applianceIntensity: number) => {
      engine.recordJokeDelivery(jokeId, jokeText, category, landingStatus, applianceIntensity);
      updateState();
    },
    [engine, updateState]
  );

  const recordTimelinePhase = useCallback(
    (
      cueId: string,
      phaseName: string,
      scheduledTime: string,
      actualStartTime: string,
      actualEndTime: string,
      plannedDuration: number
    ) => {
      engine.recordTimelinePhase(cueId, phaseName, scheduledTime, actualStartTime, actualEndTime, plannedDuration);
      updateState();
    },
    [engine, updateState]
  );

  const recordEngagement = useCallback(
    (type: string, intensity: number, location?: string, cueId?: string) => {
      engine.recordEngagement(type, intensity, location, cueId);
      updateState();
    },
    [engine, updateState]
  );

  const recordSpeech = useCallback(
    (speechId: string, speaker: string, duration: number, laughCount: number, applianceIntensity: number) => {
      engine.recordSpeech(speechId, speaker, duration, laughCount, applianceIntensity);
      updateState();
    },
    [engine, updateState]
  );

  const recordMusic = useCallback(
    (trackId: string, title: string, artist: string, duration: number, playedDuration: number, engagementScore: number) => {
      engine.recordMusicTrack(trackId, title, artist, duration, playedDuration, engagementScore);
      updateState();
    },
    [engine, updateState]
  );

  const recordSurvey = useCallback(
    (response: any) => {
      engine.recordSurveyResponse(response);
      updateState();
    },
    [engine, updateState]
  );

  const startRecording = useCallback(() => {
    engine.startRecording();
    updateState();
  }, [engine, updateState]);

  const stopRecording = useCallback(() => {
    engine.stopRecording();
    updateState();
  }, [engine, updateState]);

  const recordCheckpoint = useCallback(
    (cueId: string, cuePhase: string, djVolume: number, engagementLevel: number, audienceSize: number) => {
      engine.recordCheckpoint(cueId, cuePhase, djVolume, engagementLevel, audienceSize);
      updateState();
    },
    [engine, updateState]
  );

  return {
    state,
    actions: {
      recordJoke,
      recordTimelinePhase,
      recordEngagement,
      recordSpeech,
      recordMusic,
      recordSurvey,
      startRecording,
      stopRecording,
      recordCheckpoint,
    },
  };
}
