import type { CardAnswer, LessonCard } from "@/lib/lessons/lesson-data";

export function gradeLessonCard(card: LessonCard, answer: CardAnswer): boolean {
  switch (card.type) {
    case "choice":
      return answer === card.correctIndex;
    case "fill_gap":
    case "spot_scam":
      return answer === card.answer;
    case "match_pairs":
      return isIdentity(answer, card.pairs.length);
    case "order_steps":
      return isIdentity(answer, card.steps.length);
    case "sort_buckets":
      return (
        Array.isArray(answer) &&
        answer.length === card.cards.length &&
        card.cards.every((c, i) => answer[i] === c.bucket)
      );
    default:
      return false;
  }
}

/** The explanation shown after Check, plus the right answer when it helps. */
export type CardFeedback = { text: string; reveal: string[] };

export function feedbackFor(
  card: LessonCard,
  answer: CardAnswer,
  correct: boolean,
): CardFeedback {
  switch (card.type) {
    case "choice": {
      const own =
        typeof answer === "number" ? card.optionFeedback?.[answer] : undefined;
      return { text: own ?? card.explanation, reveal: [] };
    }
    case "match_pairs":
      return {
        text: card.explanation,
        reveal: correct ? [] : card.pairs.map((p) => `${p.left}: ${p.right}`),
      };
    case "order_steps":
      return {
        text: card.explanation,
        reveal: correct ? [] : card.steps.map((s, i) => `${i + 1}. ${s}`),
      };
    case "fill_gap":
      return {
        text: card.explanation,
        reveal: correct ? [] : [`The missing word is "${card.answer}".`],
      };
    case "sort_buckets":
      return { text: card.explanation, reveal: [] };
    case "spot_scam":
      return { text: card.teaching, reveal: [] };
    default:
      return { text: "", reveal: [] };
  }
}

const isIdentity = (answer: CardAnswer, length: number) =>
  Array.isArray(answer) &&
  answer.length === length &&
  answer.every((a, i) => a === i);
