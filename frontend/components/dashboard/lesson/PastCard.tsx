import { Check, X } from "lucide-react";
import type { CardAnswer, LessonCard } from "@/lib/lessons/lesson-data";
import { feedbackFor } from "@/lib/lessons/grade";
import { ConceptCard } from "./exercises/ConceptCard";
import { ExerciseFrame } from "./exercises/ExerciseFrame";

export function PastCard({
  card,
  answer,
}: {
  card: LessonCard;
  answer: { answer: CardAnswer; correct: boolean } | null;
}) {
  if (card.type === "concept") return <ConceptCard data={card} />;

  if (card.type === "recap") {
    return (
      <ExerciseFrame label="Recap" tone="mustard" title="The words">
        <ul className="flex flex-col gap-3">
          {card.terms.map((t) => (
            <li key={t.word} className="rounded-2xl bg-paper p-4 md:bg-canvas">
              <p className="display text-[18px] font-bold text-indigo">
                {t.word}
              </p>
              <p className="mt-1 text-[14px] leading-normal text-indigo/80">
                {t.meaning}
              </p>
            </li>
          ))}
        </ul>
      </ExerciseFrame>
    );
  }

  const yours = answer ? describeAnswer(card, answer.answer) : null;
  const feedback = answer
    ? feedbackFor(card, answer.answer, answer.correct)
    : null;

  return (
    <ExerciseFrame label="Answered" title={promptOf(card)}>
      {card.type === "spot_scam" && (
        <p className="mb-4 whitespace-pre-line rounded-2xl bg-paper p-4 text-[14px] leading-normal text-indigo md:bg-canvas">
          {card.sender ? (
            <b className="block text-[12px] text-fg-soft">
              From: {card.sender}
            </b>
          ) : null}
          {card.body}
        </p>
      )}

      {answer && (
        <div
          className={`flex items-center gap-2.5 rounded-2xl p-3.5 ${
            answer.correct ? "bg-forest-tint" : "bg-terracotta-tint"
          }`}
        >
          <span
            className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-paper ${
              answer.correct ? "bg-forest" : "bg-terracotta"
            }`}
          >
            {answer.correct ? (
              <Check size={14} strokeWidth={3.2} />
            ) : (
              <X size={14} strokeWidth={3} />
            )}
          </span>
          <p className="text-[14px] font-semibold text-indigo">
            {answer.correct ? "You got this right" : "You missed this one"}
            {yours ? `: ${yours}` : ""}
          </p>
        </div>
      )}

      <div className="mt-4 rounded-2xl bg-paper p-4 md:bg-canvas">
        <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-aubergine">
          The answer
        </p>
        <ul className="mt-2 flex flex-col gap-1 text-[14px] font-semibold text-indigo">
          {rightAnswer(card).map((line) => (
            <li key={line}>{line}</li>
          ))}
        </ul>
        {feedback?.text && (
          <p className="mt-3 text-[14px] leading-[1.55] text-indigo/85">
            {feedback.text}
          </p>
        )}
      </div>
    </ExerciseFrame>
  );
}

function promptOf(card: LessonCard): string {
  switch (card.type) {
    case "choice":
      return card.question;
    case "fill_gap":
      return card.sentence.replace("___", "____");
    case "spot_scam":
      return "Real or scam?";
    case "match_pairs":
    case "sort_buckets":
    case "order_steps":
      return card.prompt;
    default:
      return "";
  }
}

function describeAnswer(card: LessonCard, answer: CardAnswer): string | null {
  switch (card.type) {
    case "choice":
      return typeof answer === "number" ? (card.options[answer] ?? null) : null;
    case "fill_gap":
      return typeof answer === "string" ? `"${answer}"` : null;
    case "spot_scam":
      return answer === "scam" ? "Scam" : answer === "real" ? "Real" : null;
    default:
      return null;
  }
}

function rightAnswer(card: LessonCard): string[] {
  switch (card.type) {
    case "choice":
      return [card.options[card.correctIndex] ?? ""];
    case "fill_gap":
      return [card.sentence.replace("___", card.answer)];
    case "spot_scam":
      return [card.answer === "scam" ? "Scam" : "Real"];
    case "match_pairs":
      return card.pairs.map((p) => `${p.left}: ${p.right}`);
    case "order_steps":
      return card.steps.map((step, i) => `${i + 1}. ${step}`);
    case "sort_buckets":
      return card.buckets.map(
        (b) =>
          `${b.label}: ${card.cards
            .filter((c) => c.bucket === b.id)
            .map((c) => c.text)
            .join(", ")}`,
      );
    default:
      return [];
  }
}
