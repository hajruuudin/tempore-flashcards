import { ReviewModeType } from "@/types";

export type FirstSide = "front" | "back";

export interface ReviewOptions {
  deckId: string;
  limit: number;
  order: string;
  firstSide: FirstSide;
  mode: ReviewModeType;
  weakOnly: boolean;
  todayOnly: boolean;
}

export const DEFAULT_REVIEW_OPTIONS: Omit<ReviewOptions, "deckId"> = {
  limit: 10,
  order: "random",
  firstSide: "front",
  mode: "Standard",
  weakOnly: false,
  todayOnly: false,
};

export function reviewOptionsToQuery(options: ReviewOptions): string {
  const qs = new URLSearchParams({
    deckId: options.deckId,
    limit: String(options.limit),
    order: options.order,
    first: options.firstSide,
    mode: options.mode,
  });
  if (options.weakOnly) qs.set("weak", "1");
  if (options.todayOnly) qs.set("today", "1");
  return qs.toString();
}

export function reviewOptionsFromParams(params: URLSearchParams): ReviewOptions {
  const limit = Number(params.get("limit"));
  const order = params.get("order");
  return {
    deckId: params.get("deckId") || "",
    limit:
      params.has("limit") && Number.isFinite(limit) && limit >= 0
        ? limit
        : DEFAULT_REVIEW_OPTIONS.limit,
    order: ["random", "hardest", "oldest", "newest"].includes(order || "")
      ? (order as string)
      : DEFAULT_REVIEW_OPTIONS.order,
    firstSide: params.get("first") === "back" ? "back" : "front",
    mode: params.get("mode") === "ExactMatch" ? "ExactMatch" : "Standard",
    weakOnly: params.get("weak") === "1",
    todayOnly: params.get("today") === "1",
  };
}

// Half-answers count as half-correct
export function correctnessPercent(
  easy: number,
  normal: number,
  hard: number
): number {
  const total = easy + normal + hard;
  if (total === 0) return 0;
  return Math.round(((easy + normal * 0.5) / total) * 100);
}
