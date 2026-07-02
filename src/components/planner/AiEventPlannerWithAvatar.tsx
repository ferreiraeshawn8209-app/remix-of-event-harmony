// AI Event Planner with Avatar - Integrated Phase 1, 2, 3
import { useState, useRef, useEffect } from "react";
import { motion } from "framer-motion";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Loader2, Mic, Send, MessageCircle } from "lucide-react";
import { AvatarConcierge } from "@/components/avatar/AvatarConcierge";
import { useAiPlanner } from "@/hooks/useAiPlanner";
import { useVoiceAi } from "@/hooks/useVoiceAi";
import type { AvatarEmotion } from "@/packages/shared-types/avatar";

interface AiEventPlannerWithAvatarProps {
  eventId: string;
  clientId: string;
}

/**
 * Integrated experience: Avatar + AI Planner + Voice
 * The avatar guides the user through event planning with emotional responses
 */
export function AiEventPlannerWithAvatar({ eventId, clientId }: AiEventPlannerWithAvatarProps) {
  const messageEndRef = useRef<HTMLDivElement>(null);
  const [userMessage, setUserMessage] = useState("");
  const [inputMode, setInputMode] = useState<"text" | "voice">("text");
  const [avatarEmotion, setAvatarEmotion] = useState<AvatarEmotion>("idle");
  const [isProcessing, setIsProcessing] = useState(false);

  // Phase 1: AI Planner
  const {
    messages,
    isLoading: plannerLoading,
    error: plannerError,
    sendMessage: sendPlannerMessage,
    startPlanning,
  } = useAiPlanner(eventId, clientId);

  // Phase 2: Voice AI
  const {
    isListening,
    isSpeaking,
    transcript,
    isReady: voiceReady,
    startListening: voiceStartListening,
    stopListening: voiceStopListening,
  } = useVoiceAi();

  // Auto-scroll messages
  useEffect(() => {
    messageEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Update avatar emotion based on state
  useEffect(() => {
    if (plannerLoading || voiceReady) {
      setAvatarEmotion("listening");
    } else if (isSpeaking) {
      setAvatarEmotion("speaking");
    } else if (isProcessing) {
      setAvatarEmotion("thinking");
    } else {
      setAvatarEmotion("idle");
    }
  }, [plannerLoading, voiceReady, isSpeaking, isProcessing]);

  // Initialize planner on mount
  useEffect(() => {
    void startPlanning();
  }, [startPlanning]);

  /**
   * Handle text message submission
   */
  const handleSendMessage = async () => {
    if (!userMessage.trim()) return;

    const message = userMessage.trim();
    setUserMessage("");
    setIsProcessing(true);
    setAvatarEmotion("thinking");

    try {
      await sendPlannerMessage(message);
    } finally {
      setIsProcessing(false);
    }
  };

  /**
   * Handle voice input
   */
  const handleVoiceInput = async () => {
    if (isListening) {
      voiceStopListening();
    } else {
      voiceStartListening();
    }
  };

  /**
   * Submit transcribed voice message
   */
  const handleSubmitVoiceMessage = async () => {
    if (!transcript) return;

    setIsProcessing(true);
    setAvatarEmotion("thinking");

    try {
      await sendPlannerMessage(transcript);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-950 via-purple-950 to-slate-950">
      <div className="container mx-auto px-4 py-6 max-w-6xl">
        {/* Header */}
        <div className="mb-6">
          <h1 className="font-display text-3xl font-bold gradient-text mb-2">Beatkulture Event Planner</h1>
          <p className="text-muted-foreground">Plan your perfect event with AI guidance</p>
        </div>

        {/* Main Layout: Avatar (left) + Chat (right) */}
        <div className="grid lg:grid-cols-2 gap-6">
          {/* Avatar Section */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5 }}
          >
            <Card variant="glass" className="h-full overflow-hidden">
              <CardHeader className="pb-2">
                <CardTitle className="text-lg flex items-center gap-2">
                  <MessageCircle className="w-4 h-4" /> Your AI Host
                </CardTitle>
              </CardHeader>
              <CardContent>
                <AvatarConcierge enabled currentEmotion={avatarEmotion} />
              </CardContent>
            </Card>
          </motion.div>

          {/* Chat Section */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5 }}
            className="flex flex-col"
          >
            <Card variant="glass" className="flex-1 flex flex-col overflow-hidden">
              <CardHeader className="pb-2">
                <CardTitle className="text-lg">Conversation</CardTitle>
                <CardDescription>Chat with your AI event planning assistant</CardDescription>
              </CardHeader>

              {/* Messages Area */}
              <CardContent className="flex-1 overflow-y-auto space-y-4 pb-4">
                {plannerError && (
                  <div className="p-3 rounded-lg bg-destructive/10 border border-destructive/30 text-sm text-destructive">
                    {plannerError}
                  </div>
                )}

                {messages.length === 0 && !plannerLoading && (
                  <div className="flex items-center justify-center h-32 text-muted-foreground">
                    <p className="text-center">
                      <span className="block font-semibold mb-2">Welcome!</span>
                      <span className="text-sm">Let's start planning your perfect event.</span>
                    </p>
                  </div>
                )}

                {messages.map((msg, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3 }}
                    className={`flex gap-2 ${msg.role === "user" ? "justify-end" : "justify-start"}`}
                  >
                    <div
                      className={`max-w-xs px-4 py-2 rounded-lg ${
                        msg.role === "user"
                          ? "bg-primary/20 text-primary border border-primary/40"
                          : "bg-purple-500/20 text-purple-200 border border-purple-500/40"
                      }`}
                    >
                      <p className="text-sm leading-relaxed">{msg.content}</p>
                    </div>
                  </motion.div>
                ))}

                {isProcessing && (
                  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex gap-2">
                    <div className="bg-purple-500/20 text-purple-200 border border-purple-500/40 px-4 py-2 rounded-lg">
                      <div className="flex items-center gap-2">
                        <Loader2 className="w-3 h-3 animate-spin" />
                        <span className="text-sm">Avatar is thinking...</span>
                      </div>
                    </div>
                  </motion.div>
                )}

                <div ref={messageEndRef} />
              </CardContent>

              {/* Input Area */}
              <div className="border-t border-border/50 p-4 space-y-3">
                {/* Voice Mode */}
                {inputMode === "voice" && (
                  <div className="space-y-2">
                    {isListening && (
                      <div className="p-3 rounded-lg bg-blue-500/10 border border-blue-500/30">
                        <div className="flex items-center gap-2 text-blue-300 text-sm">
                          <Loader2 className="w-3 h-3 animate-spin" />
                          Listening...
                        </div>
                      </div>
                    )}

                    {transcript && (
                      <div className="p-3 rounded-lg bg-slate-700/40 border border-border">
                        <p className="text-sm text-muted-foreground">{transcript}</p>
                      </div>
                    )}

                    {transcript && !isListening && (
                      <Button onClick={handleSubmitVoiceMessage} disabled={isProcessing} className="w-full" variant="hero" size="sm">
                        <Send className="w-3 h-3 mr-2" />
                        Send Voice Message
                      </Button>
                    )}
                  </div>
                )}

                {/* Text Mode */}
                {inputMode === "text" && (
                  <div className="flex gap-2">
                    <input
                      type="text"
                      placeholder="Type your response..."
                      value={userMessage}
                      onChange={(e) => setUserMessage(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" && !e.shiftKey) {
                          e.preventDefault();
                          void handleSendMessage();
                        }
                      }}
                      disabled={isProcessing}
                      className="flex-1 px-3 py-2 rounded-lg bg-slate-900 border border-border/50 text-sm placeholder-muted-foreground focus:outline-none focus:border-primary/50 transition disabled:opacity-50"
                    />
                    <Button onClick={handleSendMessage} disabled={isProcessing || !userMessage.trim()} size="sm" variant="hero">
                      <Send className="w-3 h-3" />
                    </Button>
                  </div>
                )}

                {/* Mode Toggle */}
                <div className="flex gap-2 justify-center">
                  <Badge
                    variant={inputMode === "text" ? "default" : "outline"}
                    className="cursor-pointer"
                    onClick={() => setInputMode("text")}
                  >
                    Text
                  </Badge>
                  <Badge
                    variant={inputMode === "voice" ? "default" : "outline"}
                    className={`cursor-pointer ${voiceReady ? "" : "opacity-50"}`}
                    onClick={() => voiceReady && setInputMode("voice")}
                  >
                    <Mic className="w-3 h-3 mr-1" />
                    Voice
                  </Badge>
                </div>

                {inputMode === "voice" && voiceReady && !isListening && (
                  <Button onClick={handleVoiceInput} disabled={isProcessing} className="w-full" variant="outline" size="sm">
                    <Mic className="w-3 h-3 mr-2" />
                    Start Listening
                  </Button>
                )}

                {isListening && (
                  <Button onClick={handleVoiceInput} disabled={isProcessing} className="w-full" variant="destructive" size="sm">
                    Stop Listening
                  </Button>
                )}
              </div>
            </Card>

            {/* Status Badge */}
            <div className="mt-3 flex gap-2 justify-center flex-wrap">
              {plannerLoading && (
                <Badge variant="outline" className="bg-purple-500/20">
                  <Loader2 className="w-2 h-2 mr-1 animate-spin" /> Planning...
                </Badge>
              )}
              {isSpeaking && (
                <Badge variant="outline" className="bg-green-500/20">
                  <div className="w-2 h-2 mr-1 rounded-full bg-green-500" /> Speaking
                </Badge>
              )}
              {voiceReady && (
                <Badge variant="outline" className="bg-blue-500/20">
                  🎤 Voice Ready
                </Badge>
              )}
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
