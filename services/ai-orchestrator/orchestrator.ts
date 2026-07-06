// AI Orchestrator - Core LLM management for Beatkulture
// Handles conversation context, message routing, and response generation

import type { BkAiMessage, BkAiConversation, PlannerContext, AiPlannerResponse, MessageRole } from '../shared-types/beatkulture';

export interface OllamaConfig {
  baseUrl: string;
  model: string;
  temperature?: number;
  topK?: number;
  topP?: number;
  repeatPenalty?: number;
}

export interface ConversationMemory {
  conversationId: string;
  systemPrompt: string;
  messages: BkAiMessage[];
  maxHistoryLength: number;
}

export class AiOrchestrator {
  private config: OllamaConfig;
  private conversationMemory: Map<string, ConversationMemory> = new Map();

  constructor(config: OllamaConfig) {
    this.config = {
      temperature: 0.7,
      topK: 40,
      topP: 0.9,
      repeatPenalty: 1.1,
      ...config,
    };
  }

  /**
   * Initialize a conversation with system prompt and optional context
   */
  initializeConversation(
    conversationId: string,
    systemPrompt: string,
    existingMessages?: BkAiMessage[]
  ): void {
    this.conversationMemory.set(conversationId, {
      conversationId,
      systemPrompt,
      messages: existingMessages || [],
      maxHistoryLength: 50,
    });
  }

  /**
   * Process user message and generate AI response
   */
  async processMessage(
    conversationId: string,
    userMessage: string
  ): Promise<AiPlannerResponse> {
    const memory = this.conversationMemory.get(conversationId);
    if (!memory) {
      throw new Error(`Conversation ${conversationId} not initialized`);
    }

    // Add user message to history
    const userMsg: BkAiMessage = {
      id: this.generateId(),
      conversation_id: conversationId,
      role: 'user',
      content: userMessage,
      metadata_json: { timestamp: new Date().toISOString() },
      created_at: new Date().toISOString(),
    };
    memory.messages.push(userMsg);

    // Build context for LLM
    const contextMessages = this.buildContextMessages(memory);

    try {
      // Call Ollama or fallback mock
      const responseText = await this.callOllama(
        memory.systemPrompt,
        contextMessages,
        userMessage
      );

      // Add assistant message to history
      const assistantMsg: BkAiMessage = {
        id: this.generateId(),
        conversation_id: conversationId,
        role: 'assistant',
        content: responseText,
        metadata_json: { timestamp: new Date().toISOString() },
        created_at: new Date().toISOString(),
      };
      memory.messages.push(assistantMsg);

      // Trim history if it exceeds max length
      if (memory.messages.length > memory.maxHistoryLength) {
        memory.messages = memory.messages.slice(-memory.maxHistoryLength);
      }

      // Parse response into structured format
      return this.parseResponse(responseText);
    } catch (error) {
      console.error('Error calling LLM:', error);
      throw error;
    }
  }

  /**
   * Get conversation history
   */
  getConversation(conversationId: string): BkAiMessage[] {
    const memory = this.conversationMemory.get(conversationId);
    return memory ? memory.messages : [];
  }

  /**
   * Clear conversation memory (for cleanup)
   */
  clearConversation(conversationId: string): void {
    this.conversationMemory.delete(conversationId);
  }

  /**
   * Build messages array formatted for LLM context
   */
  private buildContextMessages(memory: ConversationMemory): Array<{ role: MessageRole; content: string }> {
    return memory.messages.map((msg) => ({
      role: msg.role,
      content: msg.content,
    }));
  }

  /**
   * Call Ollama API (or fallback mock for development)
   */
  private async callOllama(
    systemPrompt: string,
    contextMessages: Array<{ role: MessageRole; content: string }>,
    userMessage: string
  ): Promise<string> {
    // TODO: Implement actual Ollama API call
    // For now, return mock response demonstrating structure

    // Example mock response - in production, call actual Ollama endpoint
    const mockResponses = [
      "That sounds wonderful! And when are you thinking of hosting this event?",
      "I love that! About how many guests are you expecting?",
      "Perfect. What's your venue situation - do you have a space selected?",
      "Great! And what's your music style or favorite genre?",
      "Wonderful details! Let me confirm everything I've learned so far...",
    ];

    return mockResponses[Math.floor(Math.random() * mockResponses.length)];
  }

  /**
   * Parse LLM response into structured AiPlannerResponse
   */
  private parseResponse(responseText: string): AiPlannerResponse {
    return {
      message: responseText,
      nextQuestion: undefined, // Could extract from response
      recommendations: [], // Could extract from response
      confirmationNeeded: responseText.includes('confirm'),
    };
  }

  /**
   * Generate unique ID for messages
   */
  private generateId(): string {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }
}

// Export singleton or factory
export function createAiOrchestrator(config: Partial<OllamaConfig> = {}): AiOrchestrator {
  const defaultConfig: OllamaConfig = {
    baseUrl: process.env.OLLAMA_BASE_URL || 'http://localhost:11434',
    model: process.env.OLLAMA_MODEL || 'mistral',
  };

  return new AiOrchestrator({ ...defaultConfig, ...config });
}
