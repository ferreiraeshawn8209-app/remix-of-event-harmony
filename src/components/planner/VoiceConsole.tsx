// Voice Console UI Component - Phase 2
// Push-to-talk and continuous listening modes with visual feedback

import React, { useEffect, useRef } from 'react';
import { useVoiceAi } from '../../hooks/useVoiceAi';
import { Button } from '../../components/ui/button';
import { Badge } from '../../components/ui/badge';
import { Card } from '../../components/ui/card';
import { Alert, AlertDescription } from '../../components/ui/alert';
import { 
  Mic, 
  MicOff, 
  Volume2, 
  Square, 
  AlertTriangle,
  Zap
} from 'lucide-react';

interface VoiceConsoleProps {
  conversationId: string;
  onTranscript: (text: string) => void;
  onSpeak?: (text: string) => Promise<void>;
  isWaitingForResponse?: boolean;
  mode?: 'push-to-talk' | 'continuous';
}

export const VoiceConsole: React.FC<VoiceConsoleProps> = ({
  conversationId,
  onTranscript,
  onSpeak,
  isWaitingForResponse = false,
  mode = 'push-to-talk',
}) => {
  const {
    isInitialized,
    isListening,
    isSpeaking,
    transcript,
    error,
    sessionStatus,
    mode: voiceMode,
    startListening,
    stopListening,
    toggleListening,
    speak,
    interrupt,
    clearTranscript,
  } = useVoiceAi(conversationId, {
    mode,
    onTranscript,
    autoStartListening: false,
  });

  const micButtonRef = useRef<HTMLButtonElement>(null);
  const visualizerRef = useRef<HTMLDivElement>(null);

  // Animate microphone button during listening
  useEffect(() => {
    if (!isListening || !micButtonRef.current) return;

    const animate = () => {
      if (micButtonRef.current) {
        micButtonRef.current.style.transform = 'scale(1.05)';
        setTimeout(() => {
          if (micButtonRef.current) {
            micButtonRef.current.style.transform = 'scale(1)';
          }
        }, 100);
      }
      if (isListening) {
        setTimeout(animate, 300);
      }
    };

    animate();
  }, [isListening]);

  // Update visualizer
  useEffect(() => {
    if (!visualizerRef.current) return;

    const bars = visualizerRef.current.querySelectorAll('.bar');
    if (isListening) {
      bars.forEach((bar, i) => {
        (bar as HTMLElement).style.height = `${Math.random() * 60 + 20}%`;
      });
    } else {
      bars.forEach((bar) => {
        (bar as HTMLElement).style.height = '8px';
      });
    }
  }, [isListening, transcript]);

  const getStatusColor = () => {
    if (error) return 'bg-red-50 border-red-300';
    if (isSpeaking) return 'bg-blue-50 border-blue-300';
    if (isListening) return 'bg-purple-50 border-purple-300';
    return 'bg-slate-50 border-slate-200';
  };

  const getStatusText = () => {
    if (error) return `Error: ${error}`;
    if (isSpeaking) return 'Speaking...';
    if (isListening) return 'Listening...';
    if (transcript) return `Heard: "${transcript}"`;
    return 'Ready to listen';
  };

  return (
    <div className="space-y-4">
      {/* Status Display */}
      <Card className={`border-2 p-4 ${getStatusColor()} transition-colors`}>
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              {isListening && (
                <div className="flex gap-1 items-end">
                  {[...Array(4)].map((_, i) => (
                    <div
                      key={i}
                      className="bar w-1 bg-purple-500 rounded-full transition-all"
                      style={{ height: '8px' }}
                    />
                  ))}
                </div>
              )}
              {isSpeaking && <Volume2 className="w-5 h-5 text-blue-500 animate-pulse" />}
              <span className="font-medium text-sm">{getStatusText()}</span>
            </div>
            <Badge variant={error ? 'destructive' : 'secondary'} className="text-xs">
              {sessionStatus}
            </Badge>
          </div>

          {/* Transcript Display */}
          {transcript && (
            <div className="bg-white/50 rounded p-2 text-sm text-slate-700 italic">
              "{transcript}"
            </div>
          )}
        </div>
      </Card>

      {/* Error Alert */}
      {error && (
        <Alert className="bg-red-50 border-red-300">
          <AlertTriangle className="h-4 w-4 text-red-600" />
          <AlertDescription className="text-red-900">{error}</AlertDescription>
        </Alert>
      )}

      {/* Controls */}
      <div className="flex gap-2 flex-wrap">
        {/* Microphone Button */}
        <Button
          ref={micButtonRef}
          onClick={toggleListening}
          disabled={!isInitialized || isSpeaking || isWaitingForResponse}
          variant={isListening ? 'default' : 'outline'}
          size="lg"
          className={`transition-all ${
            isListening
              ? 'bg-gradient-to-r from-purple-500 to-blue-500 text-white hover:opacity-90'
              : 'border-2'
          }`}
        >
          {isListening ? (
            <>
              <MicOff className="w-5 h-5 mr-2" />
              Stop Listening
            </>
          ) : (
            <>
              <Mic className="w-5 h-5 mr-2" />
              Start Listening
            </>
          )}
        </Button>

        {/* Interrupt Button */}
        {(isListening || isSpeaking) && (
          <Button
            onClick={interrupt}
            variant="destructive"
            size="lg"
            className="gap-2"
          >
            <Square className="w-4 h-4" />
            Interrupt
          </Button>
        )}

        {/* Clear Transcript Button */}
        {transcript && (
          <Button
            onClick={clearTranscript}
            variant="outline"
            size="sm"
          >
            Clear
          </Button>
        )}

        {/* Mode Indicator */}
        <div className="flex items-center gap-2 ml-auto">
          <Badge variant="outline" className="text-xs">
            {voiceMode === 'continuous' ? '🔄 Continuous' : '🎤 Push-to-Talk'}
          </Badge>
          {!isInitialized && (
            <Badge variant="secondary" className="text-xs animate-pulse">
              Initializing...
            </Badge>
          )}
        </div>
      </div>

      {/* Feature Highlights */}
      <div className="text-xs text-slate-600 space-y-1">
        <div className="flex items-center gap-2">
          <Zap className="w-3 h-3" />
          <span>Echo cancellation and noise suppression enabled</span>
        </div>
        {mode === 'push-to-talk' && (
          <div className="text-slate-500">
            Press and hold to record, or click button to toggle listening
          </div>
        )}
        {mode === 'continuous' && (
          <div className="text-slate-500">
            Continuous listening with auto-stop after silence (1s)
          </div>
        )}
      </div>
    </div>
  );
};

export default VoiceConsole;
