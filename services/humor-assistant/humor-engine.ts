import type {
  HumorCategory,
  HumorContext,
  HumorStyle,
  HumorSuggestion,
  SpeechDraft,
  SpeechLength,
  SpeechRequest,
} from "@/packages/shared-types/humor";

const bannedTopics = [
  "offensive",
  "nsfw",
  "explicit",
  "racist",
  "sexist",
  "violent",
  "crude",
];

const styleLead: Record<HumorStyle, string> = {
  lighthearted: "Light one for the room:",
  "family-friendly": "Family-safe line:",
  witty: "Witty angle:",
  "self-deprecating": "Self-aware option:",
  "story-based": "Story-style opener:",
  observational: "Observational bit:",
  "romantic-comedy": "Rom-com flavor:",
  "professional-mc": "MC-ready line:",
};

const categoryLines: Record<HumorCategory, string[]> = {
  wedding: [
    "Marriage is proof that teamwork can start with deciding on one playlist.",
    "Weddings are the only events where both romance and timeline management are headline acts.",
  ],
  "best-man": [
    "As best man, your job is simple: be memorable, but not more memorable than the groom.",
    "I promised to keep this speech short, like the groom promised he'd be ready on time.",
  ],
  "maid-of-honor": [
    "A great maid of honor speech is equal parts heart, humor, and selective editing.",
    "I knew this couple was solid when even their arguments ended in snack-sharing.",
  ],
  "father-of-bride": [
    "Today I gain peace of mind and lose one parking spot in my driveway.",
    "I always hoped for someone who'd make my daughter laugh this much. Mission accomplished.",
  ],
  groom: [
    "The groom looks confident tonight, mostly because he found his vows before the ceremony.",
    "He said he was ready for marriage the day he started labeling leftovers correctly.",
  ],
  bride: [
    "The bride planned this day with military precision and cinematic style.",
    "She made elegance look effortless and timelines look optional.",
  ],
  couple: [
    "Together, they prove that love is patient, kind, and excellent at calendar invites.",
    "They met, they laughed, and they built a team no group chat can keep up with.",
  ],
  anniversary: [
    "Anniversaries are proof that 'for better or worse' includes assembling furniture together.",
    "Years later, they still choose each other and still debate thermostat settings.",
  ],
  corporate: [
    "Welcome everyone: where networking is just friendship with better name tags.",
    "Corporate events are like group projects, but with better catering.",
  ],
  "mc-icebreaker": [
    "Quick warm-up: if you're excited for tonight, make some noise and blame the DJ tomorrow.",
    "If you're not dancing yet, don't worry, the beat has a strong persuasion department.",
  ],
  "crowd-warmup": [
    "Let's loosen up: clap if you came for good vibes, clap louder if you came for dessert too.",
    "Energy check: if your table is loud, you're already winning tonight.",
  ],
  "dance-floor": [
    "Dance floor opens now. If your move has no name yet, tonight is its debut.",
    "No pressure, just rhythm. If you miss a beat, call it choreography.",
  ],
  "mc-transition": [
    "As we move to the next moment, keep that energy up and those smiles bigger.",
    "Smooth transition time: great memories loading, dance floor preparing for action.",
  ],
  "filler-material": [
    "Quick family-friendly filler: if your table has the loudest laugh, you're tonight's VIP section.",
    "While we reset for the next highlight, give a shout if you're celebrating something special tonight.",
  ],
  trivia: [
    "Event trivia: the fastest way to find your people is to ask who controls the playlist.",
    "Tonight's trivia: how many photos can one table take before dinner arrives?",
  ],
  personalized: [
    "This couple turns ordinary moments into stories worth retelling.",
    "Their secret ingredient is equal parts humor, patience, and shared snacks.",
  ],
};

const speechMinutesByLength: Record<SpeechLength, number> = {
  short: 2,
  medium: 4,
  long: 7,
};

export class HumorEngine {
  generateHumor(
    category: HumorCategory,
    style: HumorStyle,
    context: HumorContext,
    count = 3,
  ): HumorSuggestion[] {
    const source = categoryLines[category] || categoryLines.personalized;
    const selected = source.slice(0, Math.max(1, Math.min(count, source.length)));

    return selected
      .map((line, index) => this.personalize(line, context))
      .filter((line) => this.isSafe(line))
      .map((line, index) => ({
        id: `${category}-${style}-${Date.now()}-${index}`,
        category,
        style,
        line: `${styleLead[style]} ${line}`,
        audienceSafe: true,
      }));
  }

  generateSpeech(request: SpeechRequest, context: HumorContext): SpeechDraft {
    const names = context.coupleNames?.filter(Boolean).join(" & ") || "our amazing couple";
    const title = `${this.readableRole(request.role)} Speech`;
    const openerTone =
      request.tone === "funny"
        ? `Good evening everyone. If you're wondering how this speech got approved, I am too.`
        : request.tone === "emotional"
          ? `Good evening everyone. It's an honor to share this moment with ${names}.`
          : `Good evening everyone, thank you for being here to celebrate ${names}.`;

    const sharedHobby = context.sharedHobbies?.[0];
    const story = context.funnyStories?.[0] || context.howTheyMet || "their journey together";

    const body: string[] = [
      `What stands out most about ${names} is how naturally they support each other through every season.`,
      sharedHobby
        ? `You can see it in the small things too, like how they turn ${sharedHobby} into quality time.`
        : `You can see it in the small things: patience, laughter, and consistent teamwork.`,
      `One of my favorite moments has to be ${story}.`,
    ];

    if (request.includeHumor) {
      body.push(`They balance each other perfectly: one makes the plans, the other makes the plans fun.`);
    }

    const closing =
      request.tone === "professional"
        ? `Please join me in wishing ${names} a lifetime of joy, growth, and unforgettable memories.`
        : `Please raise a glass to ${names} — may your next chapter be your best one yet.`;

    return {
      id: `speech-${request.role}-${Date.now()}`,
      title,
      opening: openerTone,
      body,
      closing,
      estimatedMinutes: speechMinutesByLength[request.length],
    };
  }

  generateEntertainmentMoment(context: HumorContext): HumorSuggestion {
    const picks: HumorCategory[] = ["mc-icebreaker", "dance-floor", "mc-transition", "filler-material", "trivia", "personalized"];
    const category = picks[Math.floor(Math.random() * picks.length)];
    return this.generateHumor(category, "family-friendly", context, 1)[0];
  }

  private readableRole(role: SpeechRequest["role"]) {
    return role
      .split("-")
      .map((chunk) => chunk.charAt(0).toUpperCase() + chunk.slice(1))
      .join(" ");
  }

  private personalize(line: string, context: HumorContext) {
    const names = context.coupleNames?.filter(Boolean);
    if (names && names.length >= 2) {
      return line.replace("This couple", `${names[0]} and ${names[1]}`);
    }
    return line;
  }

  private isSafe(line: string) {
    const lower = line.toLowerCase();
    return !bannedTopics.some((topic) => lower.includes(topic));
  }
}

export const humorEngine = new HumorEngine();
