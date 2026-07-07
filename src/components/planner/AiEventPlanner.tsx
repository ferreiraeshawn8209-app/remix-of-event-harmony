// React component: AI Event Planner interface - Phase 1
// Real-time conversation-driven event planning UI

import React, { useEffect, useRef } from 'react';
import { useAiPlanner } from '../../hooks/useAiPlanner';
import { Button } from '../../components/ui/button';
import { Textarea } from '../../components/ui/textarea';
import { Card } from '../../components/ui/card';
import { ScrollArea } from '../../components/ui/scroll-area';
import { Badge } from '../../components/ui/badge';
import { Alert, AlertDescription } from '../../components/ui/alert';
import { Loader2, Send, RotateCcw } from 'lucide-react';

interface AiEventPlannerProps {
  eventId: string;
  onPlanReady?: (plan: any) => void;
}

export const AiEventPlanner: React.FC<AiEventPlannerProps> = ({ eventId, onPlanReady }) => {
  const { state, startConversation, sendMessage, reset } = useAiPlanner();
  const [input, setInput] = React.useState('');
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  // Initialize conversation on component mount
  useEffect(() => {
    if (eventId && !state.conversationId) {
      startConversation(eventId);
    }
  }, [eventId, state.conversationId, startConversation]);

  // Auto-scroll to latest message
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [state.messages]);

  // Notify parent when plan is ready
  useEffect(() => {
    if (state.isComplete && onPlanReady) {
      onPlanReady(state.collectedData);
    }
  }, [state.isComplete, state.collectedData, onPlanReady]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || state.loading) return;

    await sendMessage(input.trim());
    setInput('');
    inputRef.current?.focus();
  };

  const handleReset = () => {
    if (confirm('Start a new planning session?')) {
      reset();
      setInput('');
    }
  };

  return (
    <div className="flex flex-col h-full bg-gradient-to-br from-slate-50 to-slate-100">
      {/* Header */}
      <div className="bg-gradient-to-r from-yellow-400 via-purple-500 to-orange-400 text-white p-4 shadow-md">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold">Beatkulture Event Planner</h2>
            <p className="text-sm opacity-90">Let's create your perfect event together</p>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleReset}
            className="text-white hover:bg-white/20"
          >
            <RotateCcw className="w-4 h-4 mr-2" />
            New Session
          </Button>
        </div>
      </div>

      {/* Messages Area */}
      <ScrollArea className="flex-1 p-4">
        <div className="space-y-4">
          {state.messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <Card
                className={`max-w-xs lg:max-w-md px-4 py-3 ${
                  msg.role === 'user'
                    ? 'bg-blue-500 text-white rounded-2xl rounded-tr-none'
                    : 'bg-white text-slate-900 rounded-2xl rounded-tl-none border border-slate-200'
                }`}
              >
                <p className="text-sm leading-relaxed">{msg.content}</p>
                <p className="text-xs opacity-70 mt-1">
                  {new Date(msg.created_at).toLocaleTimeString([], {
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </p>
              </Card>
            </div>
          ))}

          {state.loading && (
            <div className="flex justify-start">
              <Card className="bg-white text-slate-900 rounded-2xl rounded-tl-none px-4 py-3 border border-slate-200">
                <div className="flex items-center gap-2">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span className="text-sm">Beatkulture is thinking...</span>
                </div>
              </Card>
            </div>
          )}

          {state.isComplete && (
            <Alert className="bg-green-50 border-green-300">
              <AlertDescription className="text-green-900">
                ✓ Your event plan is ready! Review the timeline and rehearsal visualization.
              </AlertDescription>
            </Alert>
          )}

          {state.error && (
            <Alert className="bg-red-50 border-red-300">
              <AlertDescription className="text-red-900">{state.error}</AlertDescription>
            </Alert>
          )}

          {Object.keys(state.collectedData).length > 0 && (
            <Card className="bg-slate-100 p-4 mt-4">
              <h3 className="font-semibold text-sm mb-2 text-slate-900">Collected Information</h3>
              <div className="flex flex-wrap gap-2">
                {Object.entries(state.collectedData).map(([key, value]) => (
                  <Badge key={key} variant="secondary" className="text-xs">
                    {key}: {String(value).substring(0, 30)}...
                  </Badge>
                ))}
              </div>
            </Card>
          )}

          <div ref={scrollRef} />
        </div>
      </ScrollArea>

      {/* Input Area */}
      <div className="border-t bg-white p-4 shadow-lg">
        <form onSubmit={handleSendMessage} className="flex gap-2">
          <Textarea
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Tell me about your event... (Press Enter to send, Shift+Enter for new line)"
            className="resize-none focus-visible:ring-purple-400"
            rows={3}
            disabled={state.loading || state.isComplete}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSendMessage(e as any);
              }
            }}
          />
          <Button
            type="submit"
            disabled={!input.trim() || state.loading}
            className="self-end bg-gradient-to-r from-purple-500 to-orange-400 hover:opacity-90 text-white"
          >
            <Send className="w-4 h-4" />
          </Button>
        </form>

        {/* Suggested prompts for new conversations */}
        {state.messages.length === 0 && (
          <div className="mt-3 text-xs text-slate-600">
            <p className="font-medium mb-2">Get started:</p>
            <div className="flex flex-wrap gap-2">
              {[
                'I\'m planning a wedding',
                'Tell me about event types',
                'What information do you need?',
              ].map((suggestion) => (
                <Button
                  key={suggestion}
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setInput(suggestion);
                    inputRef.current?.focus();
                  }}
                  className="text-xs"
                >
                  {suggestion}
                </Button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AiEventPlanner;
