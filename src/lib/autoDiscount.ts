export interface SpecialDiscountSource {
  title: string | null;
  discount_percent: number | null;
  is_active?: boolean;
}

function normalize(value: string | null | undefined): string {
  return String(value || "").toLowerCase();
}

function getEventBucket(eventType: string | null | undefined): "birthday" | "wedding" | "corporate" | "other" {
  const event = normalize(eventType);
  if (event.includes("birthday") || event.includes("bday") || event.includes("party")) return "birthday";
  if (event.includes("wedding") || event.includes("wed")) return "wedding";
  if (event.includes("corporate") || event.includes("company") || event.includes("business")) return "corporate";
  return "other";
}

function getSpecialBuckets(title: string | null | undefined): Array<"birthday" | "wedding" | "corporate" | "all"> {
  const value = normalize(title);
  const buckets: Array<"birthday" | "wedding" | "corporate" | "all"> = [];

  if (value.includes("birthday") || value.includes("bday") || value.includes("party")) buckets.push("birthday");
  if (value.includes("wedding") || value.includes("wed")) buckets.push("wedding");
  if (value.includes("corporate") || value.includes("company") || value.includes("business")) buckets.push("corporate");
  if (buckets.length === 0) buckets.push("all");
  return buckets;
}

export function inferAutoDiscountPercent(
  eventType: string | null | undefined,
  activeSpecials: SpecialDiscountSource[],
): number {
  const bucket = getEventBucket(eventType);

  const explicitMatch = activeSpecials
    .filter((special) => (special.is_active ?? true) && Number(special.discount_percent || 0) > 0)
    .filter((special) => {
      const buckets = getSpecialBuckets(special.title);
      return buckets.includes("all") || (bucket !== "other" && buckets.includes(bucket));
    })
    .map((special) => Number(special.discount_percent || 0));

  if (explicitMatch.length > 0) {
    return Math.max(...explicitMatch);
  }

  if (bucket === "birthday") return 30;
  if (bucket === "wedding" || bucket === "corporate") return 15;
  return 0;
}
