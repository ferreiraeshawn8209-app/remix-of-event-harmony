// Beatkulture AI Prompts - Phase 1 Event Planner

export const PLANNER_SYSTEM_PROMPT = `You are Beatkulture, an intelligent AI event host and planning assistant. Your role is to help clients create the perfect event experience through thoughtful conversation.

Your personality:
- Warm, enthusiastic, and professional
- Curious and detail-oriented
- Celebratory and supportive
- Clear and organized in communication

Your approach:
1. Ask one focused question at a time
2. Listen actively and remember all context from previous messages
3. Build structured event plans step-by-step
4. Provide recommendations based on client preferences
5. Confirm information before proceeding
6. Guide clients toward a complete event vision

Your goal:
Collect comprehensive event information including client details, event logistics, music preferences, special moments, and entertainment needs to generate a complete event plan and timeline.

Never:
- Ask the same question twice (you have access to conversation history)
- Rush the client or ask multiple questions at once
- Make assumptions; always ask for clarification
- Skip important details

When the client has provided sufficient information, offer to generate a formal event timeline and rehearsal visualization.`;

export const INITIAL_GREETING = `Welcome to Beatkulture! I'm your AI event host, and I'm here to help you create an unforgettable experience.

To get started, I'd love to learn about your event. What type of event are you planning?`;

export const FOLLOW_UP_QUESTIONS = {
  eventType: [
    "Is this a wedding, corporate event, birthday celebration, anniversary, or something else?",
    "Tell me about the nature of this event.",
    "What's the occasion we're celebrating?",
  ],
  date: [
    "When are you planning to host this event?",
    "What date works best for you?",
    "Do you have a preferred date in mind?",
  ],
  venue: [
    "Where will the event take place? (venue name or location)",
    "Have you selected a venue, or would you like venue suggestions?",
    "What's the venue's capacity and setting?",
  ],
  guestCount: [
    "How many guests are you expecting?",
    "What's your anticipated guest count?",
    "Are you expecting an intimate gathering or a larger celebration?",
  ],
  budget: [
    "What's your approximate budget for entertainment and services?",
    "Do you have a specific budget range in mind?",
    "What's your investment level for the DJ and entertainment services?",
  ],
  musicPreferences: [
    "What's your favorite music style or genre?",
    "Are there specific songs or artists you'd love to hear?",
    "What's the vibe you're going for musically?",
  ],
  specialMoments: [
    "Are there any special moments or traditions you want to highlight?",
    "What are the must-have moments for your event?",
    "Any first dances, toasts, or other key moments to plan around?",
  ],
};

export const CONFIRMATION_TEMPLATE = `Perfect! Here's what I've gathered about your event:

**Event Summary:**
- Type: {eventType}
- Date: {eventDate}
- Venue: {venueName}
- Guest Count: {guestCount}
- Music Style: {musicPreferences}
- Special Moments: {specialMoments}

Does this look correct? Would you like to adjust anything, or shall I proceed with generating your event timeline and rehearsal visualization?`;

export const PLAN_READY_MESSAGE = `Excellent! I have everything I need to create your event plan. Let me generate:

1. **Event Timeline** - A minute-by-minute schedule optimized for flow and timing
2. **Music Strategy** - DJ set breakdown aligned with your preferences
3. **Rehearsal Visualization** - A 30-90 second video preview of your event

This will give you a complete vision of your special day before it happens. Let's create something amazing!`;

export const RECOMMENDATION_TEMPLATE = `Based on what you've shared, here are my recommendations:

**Timeline Suggestions:**
{timelineRecommendations}

**Music Selections:**
{musicRecommendations}

**Entertainment Ideas:**
{entertainmentRecommendations}

Would you like me to adjust any of these recommendations?`;

export function extractEventTypeFromResponse(response: string): string | null {
  const patterns = [
    /wedding/i,
    /corporate|company|business/i,
    /birthday/i,
    /anniversary/i,
    /engagement/i,
    /rehearsal.dinner/i,
  ];

  for (const pattern of patterns) {
    if (pattern.test(response)) {
      return response.toLowerCase().match(/\b(wedding|corporate|birthday|anniversary|engagement|rehearsal dinner)\b/i)?.[0] || null;
    }
  }
  return null;
}

export function extractDateFromResponse(response: string): string | null {
  // Simple date extraction - could be enhanced with NLP
  const datePatterns = [
    /(\d{1,2})[/-](\d{1,2})[/-](\d{4})/,
    /(January|February|March|April|May|June|July|August|September|October|November|December)\s+(\d{1,2}),?\s+(\d{4})/i,
    /(\w+)\s+(\d{1,2})/,
  ];

  for (const pattern of datePatterns) {
    const match = response.match(pattern);
    if (match) return match[0];
  }
  return null;
}

export function extractNumberFromResponse(response: string): number | null {
  const match = response.match(/\b(\d+)\b/);
  return match ? parseInt(match[1], 10) : null;
}
