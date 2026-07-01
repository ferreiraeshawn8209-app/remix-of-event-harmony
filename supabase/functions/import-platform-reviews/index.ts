const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

type Platform = "google" | "facebook" | "bark";

type ParsedReview = {
  externalId: string;
  author: string;
  message: string;
  rating: number;
  createdAt: string | null;
  sourceUrl: string;
};

function inferPlatform(url: string): Platform | null {
  const lower = url.toLowerCase();
  if (lower.includes("google.") || lower.includes("g.page") || lower.includes("maps.")) return "google";
  if (lower.includes("facebook.") || lower.includes("fb.")) return "facebook";
  if (lower.includes("bark.")) return "bark";
  return null;
}

function parseJsonLdBlocks(html: string): any[] {
  const blocks: any[] = [];
  const scriptRegex = /<script[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi;
  let match: RegExpExecArray | null;

  while ((match = scriptRegex.exec(html)) !== null) {
    const rawBlock = match[1]?.trim();
    if (!rawBlock) continue;

    try {
      const parsed = JSON.parse(rawBlock);
      blocks.push(parsed);
      continue;
    } catch {
      // Some sites output multiple JSON objects in one script tag.
    }

    const objectRegex = /\{[\s\S]*?\}(?=\s*\{|$)/g;
    const objectCandidates = rawBlock.match(objectRegex) || [];
    for (const candidate of objectCandidates) {
      try {
        blocks.push(JSON.parse(candidate));
      } catch {
        // Ignore invalid fragments and continue.
      }
    }
  }

  return blocks;
}

function normalizeRating(value: unknown): number {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return 5;
  return Math.max(1, Math.min(5, Math.round(parsed)));
}

function normalizeAuthor(author: unknown): string {
  if (typeof author === "string" && author.trim()) return author.trim();
  if (author && typeof author === "object" && "name" in author) {
    const name = String((author as { name?: unknown }).name || "").trim();
    if (name) return name;
  }
  return "Verified Client";
}

function normalizeReview(
  node: Record<string, unknown>,
  sourceUrl: string,
  fallbackIdPrefix: string,
  fallbackIndex: number,
): ParsedReview | null {
  const messageCandidate =
    typeof node.reviewBody === "string"
      ? node.reviewBody
      : typeof node.description === "string"
        ? node.description
        : typeof node.comment === "string"
          ? node.comment
          : typeof node.text === "string"
            ? node.text
            : "";
  const message = messageCandidate.trim();
  if (!message) return null;

  const ratingNode = node.reviewRating && typeof node.reviewRating === "object" ? (node.reviewRating as Record<string, unknown>) : {};
  const rating = normalizeRating(ratingNode.ratingValue ?? node.ratingValue ?? node.rating);
  const author = normalizeAuthor(node.author);
  const sourceId = String(node["@id"] || node.identifier || node.url || `${fallbackIdPrefix}-${fallbackIndex}`).trim();
  const createdAtRaw = node.datePublished || node.dateCreated;
  const createdAt = createdAtRaw ? String(createdAtRaw) : null;

  return {
    externalId: sourceId,
    author,
    message,
    rating,
    createdAt,
    sourceUrl,
  };
}

function collectReviews(node: unknown, sourceUrl: string, store: ParsedReview[], prefix: string): void {
  if (!node) return;

  if (Array.isArray(node)) {
    for (const item of node) {
      collectReviews(item, sourceUrl, store, prefix);
    }
    return;
  }

  if (typeof node !== "object") return;
  const record = node as Record<string, unknown>;

  const direct = normalizeReview(record, sourceUrl, prefix, store.length + 1);
  if (direct) {
    store.push(direct);
  }

  const reviewNode = record.review;
  if (reviewNode) {
    collectReviews(reviewNode, sourceUrl, store, prefix);
  }

  const reviewListNode = record.reviews;
  if (reviewListNode) {
    collectReviews(reviewListNode, sourceUrl, store, prefix);
  }
}

function dedupeReviews(reviews: ParsedReview[]): ParsedReview[] {
  const seen = new Set<string>();
  const result: ParsedReview[] = [];

  for (const review of reviews) {
    const key = `${review.externalId}::${review.message.toLowerCase()}`;
    if (seen.has(key)) continue;
    seen.add(key);
    result.push(review);
  }

  return result;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  try {
    const body = await req.json();
    const url = String(body?.url || "").trim();
    const providedPlatform = String(body?.platform || "").trim() as Platform | "";

    if (!url) {
      return new Response(JSON.stringify({ error: "url is required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const platform = providedPlatform || inferPlatform(url);
    if (!platform) {
      return new Response(JSON.stringify({ error: "Unsupported platform url" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const response = await fetch(url, {
      headers: {
        "user-agent": "Mozilla/5.0 (compatible; BeatKultureReviewImporter/1.0)",
        accept: "text/html,application/xhtml+xml",
      },
    });

    if (!response.ok) {
      return new Response(JSON.stringify({ error: `Could not load platform page (${response.status})` }), {
        status: 502,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const html = await response.text();
    const blocks = parseJsonLdBlocks(html);
    const extracted: ParsedReview[] = [];

    blocks.forEach((block, index) => collectReviews(block, url, extracted, `${platform}-${index + 1}`));

    const reviews = dedupeReviews(extracted).slice(0, 20);
    return new Response(JSON.stringify({ platform, count: reviews.length, reviews }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
