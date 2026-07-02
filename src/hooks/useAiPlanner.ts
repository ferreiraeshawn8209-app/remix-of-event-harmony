// React hook for AI Event Planner - Phase 1
// Integrates with conversation state and Beatkulture API

import { useCallback, useReducer, useRef, useEffect } from 'react';
import type { BkAiMessage, PlannerContext, AiPlannerResponse } from '../shared-types/beatkulture';

export interface PlannerState {
  conversationId: string | null;
  eventId: string | null;
  messages: BkAiMessage[];
  loading: boolean;
  error: string | null;
  collectedData: Record<string, any>;
  isComplete: boolean;
}

export type PlannerAction =
  | { type: 'START_CONVERSATION'; payload: { conversationId: string; eventId: string } }
  | { type: 'ADD_MESSAGE'; payload: BkAiMessage }
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_ERROR'; payload: string }
  | { type: 'COLLECT_DATA'; payload: Record<string, any> }
  | { type: 'MARK_COMPLETE' }
  | { type: 'RESET' };

function plannerReducer(state: PlannerState, action: PlannerAction): PlannerState {
  switch (action.type) {
    case 'START_CONVERSATION':
      return {
        ...state,
        conversationId: action.payload.conversationId,
        eventId: action.payload.eventId,
        messages: [],
        error: null,
      };
    case 'ADD_MESSAGE':
      return {
        ...state,
        messages: [...state.messages, action.payload],
      };
    case 'SET_LOADING':
      return { ...state, loading: action.payload };
    case 'SET_ERROR':
      return { ...state, error: action.payload, loading: false };
    case 'COLLECT_DATA':
      return {
        ...state,
        collectedData: { ...state.collectedData, ...action.payload },
      };
    case 'MARK_COMPLETE':
      return { ...state, isComplete: true };
    case 'RESET':
      return {
        conversationId: null,
        eventId: null,
        messages: [],
        loading: false,
        error: null,
        collectedData: {},
        isComplete: false,
      };
    default:
      return state;
  }
}

const initialState: PlannerState = {
  conversationId: null,
  eventId: null,
  messages: [],
  loading: false,
  error: null,
  collectedData: {},
  isComplete: false,
};

export function useAiPlanner(apiBaseUrl: string = '/api/v1') {
  const [state, dispatch] = useReducer(plannerReducer, initialState);
  const abortControllerRef = useRef<AbortController | null>(null);

  /**
   * Start a new planning conversation
   */
  const startConversation = useCallback(
    async (eventId: string) => {
      try {
        dispatch({ type: 'SET_LOADING', payload: true });

        const response = await fetch(`${apiBaseUrl}/events/${eventId}/ai/conversations`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ channel: 'text' }),
        });

        if (!response.ok) throw new Error('Failed to start conversation');

        const data = await response.json();
        dispatch({
          type: 'START_CONVERSATION',
          payload: { conversationId: data.id, eventId },
        });

        // Fetch initial greeting message
        const initialMsg: BkAiMessage = {
          id: data.id,
          conversation_id: data.id,
          role: 'assistant',
          content: 'Welcome to Beatkulture! I\'m your AI event host. What type of event are you planning?',
          metadata_json: {},
          created_at: new Date().toISOString(),
        };
        dispatch({ type: 'ADD_MESSAGE', payload: initialMsg });
        dispatch({ type: 'SET_LOADING', payload: false });
      } catch (error) {
        const errorMsg = error instanceof Error ? error.message : 'Unknown error';
        dispatch({ type: 'SET_ERROR', payload: errorMsg });
      }
    },
    [apiBaseUrl]
  );

  /**
   * Send user message and get AI response
   */
  const sendMessage = useCallback(
    async (userContent: string) => {
      if (!state.conversationId) {
        dispatch({ type: 'SET_ERROR', payload: 'No active conversation' });
        return;
      }

      try {
        // Abort previous request if still pending
        abortControllerRef.current?.abort();
        abortControllerRef.current = new AbortController();

        dispatch({ type: 'SET_LOADING', payload: true });

        // Add user message to state
        const userMsg: BkAiMessage = {
          id: `user-${Date.now()}`,
          conversation_id: state.conversationId,
          role: 'user',
          content: userContent,
          metadata_json: {},
          created_at: new Date().toISOString(),
        };
        dispatch({ type: 'ADD_MESSAGE', payload: userMsg });

        // Send to API
        const response = await fetch(
          `${apiBaseUrl}/ai/conversations/${state.conversationId}/messages`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ content: userContent }),
            signal: abortControllerRef.current.signal,
          }
        );

        if (!response.ok) throw new Error('Failed to send message');

        const data: AiPlannerResponse = await response.json();

        // Add assistant message to state
        const assistantMsg: BkAiMessage = {
          id: `assistant-${Date.now()}`,
          conversation_id: state.conversationId,
          role: 'assistant',
          content: data.message,
          metadata_json: data.metadata_json || {},
          created_at: new Date().toISOString(),
        };
        dispatch({ type: 'ADD_MESSAGE', payload: assistantMsg });

        // Collect any extracted data
        if (data.dataCollected) {
          dispatch({ type: 'COLLECT_DATA', payload: data.dataCollected });
        }

        // Mark complete if plan is ready
        if (data.structuredPlan) {
          dispatch({ type: 'MARK_COMPLETE' });
        }

        dispatch({ type: 'SET_LOADING', payload: false });
      } catch (error) {
        if (error instanceof Error && error.name === 'AbortError') {
          return; // Request was cancelled
        }
        const errorMsg = error instanceof Error ? error.message : 'Unknown error';
        dispatch({ type: 'SET_ERROR', payload: errorMsg });
      }
    },
    [state.conversationId, apiBaseUrl]
  );

  /**
   * Reset conversation
   */
  const reset = useCallback(() => {
    dispatch({ type: 'RESET' });
  }, []);

  // Cleanup abort controller on unmount
  useEffect(() => {
    return () => {
      abortControllerRef.current?.abort();
    };
  }, []);

  return {
    state,
    startConversation,
    sendMessage,
    reset,
  };
}
