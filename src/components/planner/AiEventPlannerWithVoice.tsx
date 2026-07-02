// AI Event Planner with Voice Integration - Phase 2
// Combines text and voice interfaces for natural conversation

import React, { useEffect, useRef } from 'react';
import { useAiPlanner } from '../../hooks/useAiPlanner';
import { useVoiceAi } from '../../hooks/useVoiceAi';
import { AiEventPlanner } from './AiEventPlanner';
import { VoiceConsole } from './VoiceConsole';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../components/ui/tabs';
import { Card } from '../../components/ui/card';
import { MessageCircle, Mic } from 'lucide-react';

interface AiEventPlannerWithVoiceProps {
  eventId: string;
  onPlanReady?: (plan: any) => void;
}

export const AiEventPlannerWithVoice: React.FC<AiEventPlannerWithVoiceProps> = ({
  eventId,
  onPlanReady,
}) => {
  const { state, sendMessage, startConversation } = useAiPlanner();
  const [activeTab, setActiveTab] = React.useState<'text' | 'voice'>('text');

  // Handle voice transcript as text input
  const handleVoiceTranscript = React.useCallback(
    async (transcript: string) => {
      if (!state.conversationId) {
        // Start conversation if not already started
        await startConversation(eventId);
        return;
      }

      // Send transcript as message
      await sendMessage(transcript);
    },
    [state.conversationId, eventId, startConversation, sendMessage]
  );

  // Initialize conversation on mount
  useEffect(() => {
    if (eventId && !state.conversationId) {
      startConversation(eventId);
    }
  }, [eventId, state.conversationId, startConversation]);

  // Notify parent when plan is ready
  useEffect(() => {
    if (state.isComplete && onPlanReady) {
      onPlanReady(state.collectedData);
    }
  }, [state.isComplete, state.collectedData, onPlanReady]);

  return (
    <div className="w-full h-full bg-gradient-to-br from-slate-50 to-slate-100">
      <Tabs
        value={activeTab}
        onValueChange={(value) => setActiveTab(value as 'text' | 'voice')}
        className="w-full h-full flex flex-col"
      >
        {/* Tab Header */}
        <div className="bg-white border-b shadow-sm p-4">
          <TabsList className="w-full justify-start gap-2 bg-slate-100">
            <TabsTrigger value="text" className="gap-2">
              <MessageCircle className="w-4 h-4" />
              Text Mode
            </TabsTrigger>
            <TabsTrigger value="voice" className="gap-2">
              <Mic className="w-4 h-4" />
              Voice Mode
            </TabsTrigger>
          </TabsList>
        </div>

        {/* Text Tab */}
        <TabsContent value="text" className="flex-1 overflow-hidden p-0">
          <AiEventPlanner eventId={eventId} onPlanReady={onPlanReady} />
        </TabsContent>

        {/* Voice Tab */}
        <TabsContent value="voice" className="flex-1 overflow-auto p-4">
          <div className="max-w-2xl mx-auto space-y-6">
            {/* Voice Console */}
            <Card className="p-4 border-2">
              <VoiceConsole
                conversationId={state.conversationId || ''}
                onTranscript={handleVoiceTranscript}
                mode="continuous"
                isWaitingForResponse={state.loading}
              />
            </Card>

            {/* Conversation Summary */}
            {state.messages.length > 0 && (
              <Card className="p-4 bg-gradient-to-br from-slate-50 to-slate-100">
                <h3 className="font-semibold mb-3 text-slate-900">Conversation So Far</h3>
                <div className="space-y-3 max-h-96 overflow-y-auto">
                  {state.messages.map((msg) => (
                    <div
                      key={msg.id}
                      className={`text-sm p-2 rounded ${
                        msg.role === 'user'
                          ? 'bg-blue-100 text-blue-900 ml-4'
                          : 'bg-purple-100 text-purple-900 mr-4'
                      }`}
                    >
                      <span className="font-medium">
                        {msg.role === 'user' ? 'You: ' : 'Beatkulture: '}
                      </span>
                      {msg.content}
                    </div>
                  ))}
                </div>
              </Card>
            )}

            {/* Collected Data Summary */}
            {Object.keys(state.collectedData).length > 0 && (
              <Card className="p-4 bg-gradient-to-br from-green-50 to-emerald-50 border-green-300">
                <h3 className="font-semibold mb-3 text-green-900">Data Collected</h3>
                <ul className="space-y-2 text-sm">
                  {Object.entries(state.collectedData).map(([key, value]) => (
                    <li key={key} className="text-green-800">
                      <span className="font-medium">{key}:</span>{' '}
                      {typeof value === 'object'
                        ? JSON.stringify(value).substring(0, 50)
                        : String(value).substring(0, 50)}
                    </li>
                  ))}
                </ul>
              </Card>
            )}

            {/* Tips */}
            <Card className="p-4 bg-blue-50 border-blue-200">
              <h4 className="font-semibold text-blue-900 mb-2">💡 Voice Tips</h4>
              <ul className="text-xs text-blue-800 space-y-1">
                <li>• Speak naturally and clearly</li>
                <li>• The system listens for about 1 second of silence before processing</li>
                <li>• Click "Interrupt" to stop listening anytime</li>
                <li>• Your transcript appears above and is sent automatically</li>
              </ul>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AiEventPlannerWithVoice;
