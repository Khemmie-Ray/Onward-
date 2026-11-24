import type { CardAnswer } from "@/lib/lessons/lesson-data";

export const UNGRADED_CARD_TYPES = new Set([
  "flip",
  "visual",
  "concept",
  "recap",
]);

type Content = Record<string, unknown>;

const sameSequence = (answer: unknown, expected: unknown[]) =>
  Array.isArray(answer) &&
  answer.length === expected.length &&
  answer.every((a, i) => a === expected[i]);

export function isCardCorrect(
  type: string,
  content: Content,
  answer: CardAnswer | undefined,
): boolean {
  if (answer === undefined) return false;

  switch (type) {
    case "choice": {
      const options = content.options as unknown[] | undefined;
      if (
        Array.isArray(options) &&
        typeof options[0] === "object" &&
        options[0] !== null
      ) {
        return (
          typeof answer === "number" &&
          (options[answer] as { correct?: boolean } | undefined)?.correct ===
            true
        );
      }
      return answer === content.correct_index;
    }
    case "spotter":
      return answer === content.correct_answer;
    case "spot_scam":
    case "fill_gap":
      return answer === content.answer;
    case "match_pairs": {
      const pairs = (content.pairs as unknown[]) ?? [];
      return sameSequence(
        answer,
        pairs.map((_, i) => i),
      );
    }
    case "order_steps": {
      const steps = (content.steps as unknown[]) ?? [];
      return sameSequence(
        answer,
        steps.map((_, i) => i),
      );
    }
    case "sort_buckets": {
      const cards = (content.cards as { bucket: string }[]) ?? [];
      return sameSequence(
        answer,
        cards.map((c) => c.bucket),
      );
    }
    default:
      return false;
  }
}
