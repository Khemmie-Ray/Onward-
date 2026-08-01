"use client";

import { useState } from "react";
import { VisualCard } from "../learn/VisualCard";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { FlipCard } from "./FlipCard";
import { ChoiceCard } from "./ChoiceCard";
import { SpotterCard } from "./SpotterCard";
import { CompletionScreen } from "./CompletionScreen";
import { useAuthFetch } from "@/hooks/useAuthFetch";
import type { LessonContent } from "@/lib/lessons/lesson-data";
import { useIdentityContext } from "@/contexts/IdentityContext";

type Answer = {
  cardIndex: number;
  answer: number | "scam" | "real";
  correct: boolean;
};

type CompletionState = {
  rewardAmount: number;
  correctCount: number;
  totalQuestions: number;
  badgeImageUrl: string | null;
  badgeTxHash: string | null;
  rewardTxHash: string | null;
  onchainError: string | null;
};

export function LessonRunner({
  lesson,
  badgeImageUrl,
  onChooseNext,
  basePath = "/api/modules",
}: {
  lesson: LessonContent;
  badgeImageUrl?: string | null;
  onChooseNext: () => void;
  basePath?: string;
}) {
  const authFetch = useAuthFetch();
  const { isVerified } = useIdentityContext();

  const [cardIndex, setCardIndex] = useState(0);
  const [answers, setAnswers] = useState<Answer[]>([]);
  const [cardAnswered, setCardAnswered] = useState(false);
  const [flipped, setFlipped] = useState(false);

  const [completion, setCompletion] = useState<CompletionState | null>(null);
  const [submissionError, setSubmissionError] = useState<string | null>(null);

  const currentCard = lesson.cards[cardIndex];
  const totalCards = lesson.cards.length;
  const isLastCard = cardIndex === totalCards - 1;
  const isFirstCard = cardIndex === 0;

  const canAdvance =
    currentCard.type === "flip"
      ? flipped
      : currentCard.type === "visual"
        ? true 
        : cardAnswered;

  const recordAnswer = (answer: number | "scam" | "real", correct: boolean) => {
    setCardAnswered(true);
    setAnswers((prev) => [
      ...prev.filter((a) => a.cardIndex !== cardIndex),
      { cardIndex, answer, correct },
    ]);
  };

  const handleNext = () => {
    if (!canAdvance) return;
    if (isLastCard) {
      submitCompletion();
      return;
    }
    setCardIndex((i) => i + 1);
    setCardAnswered(false);
    setFlipped(false);
  };

  const handleBack = () => {
    if (isFirstCard) return;
    setCardIndex((i) => i - 1);
    setCardAnswered(false);
    setFlipped(false);
    setAnswers((prev) => prev.filter((a) => a.cardIndex < cardIndex - 1));
  };

  const submitCompletion = async () => {
    const gradedLocal = answers.filter(
      (a) => lesson.cards[a.cardIndex].type !== "flip",
    );
    const correctCount = gradedLocal.filter((a) => a.correct).length;

    setCompletion({
      rewardAmount: lesson.module.reward,
      correctCount,
      totalQuestions: gradedLocal.length,
      badgeImageUrl: badgeImageUrl ?? null,
      badgeTxHash: null,
      rewardTxHash: null,
      onchainError: null,
    });

    try {
      const payload = {
        answers: answers.map((a) => ({
          card_index: a.cardIndex + 1,
          answer: a.answer,
        })),
        isVerified,
      };

      const res = await authFetch(
        `${basePath}/${lesson.module.slug}/complete`,
        { method: "POST", body: JSON.stringify(payload) },
      );

      const data = await res.json();

      if (data.status === "incomplete" && data.passed === false) {
        setCompletion(null);
        setSubmissionError(
          `You answered ${data.correct} of ${data.total} correctly. You need ${data.threshold} to earn the badge. Try the missed cards again.`,
        );
        const firstIncorrect = (data.incorrect_cards?.[0] ?? 1) - 1;
        setCardIndex(firstIncorrect);
        setCardAnswered(false);
        setFlipped(false);
        setAnswers((prev) => prev.filter((a) => a.cardIndex < firstIncorrect));
        return;
      }

      setCompletion((prev) =>
        prev
          ? {
              ...prev,
              badgeTxHash: data.onchain?.badgeTxHash ?? null,
              rewardTxHash: data.onchain?.rewardTxHash ?? null,
              onchainError: data.onchain?.onchainError ?? null,
            }
          : prev,
      );
    } catch (err) {
      console.error("[submitCompletion]", err);
      setCompletion((prev) =>
        prev
          ? {
              ...prev,
              onchainError:
                err instanceof Error ? err.message : "Network error",
            }
          : prev,
      );
    }
  };

  if (completion) {
    return (
      <CompletionScreen
        moduleTitle={lesson.module.title}
        moduleSlug={lesson.module.slug}
        rewardAmount={completion.rewardAmount}
        correctCount={completion.correctCount}
        totalQuestions={completion.totalQuestions}
        badgeImageUrl={completion.badgeImageUrl}
        badgeTxHash={completion.badgeTxHash}
        rewardTxHash={completion.rewardTxHash}
        onchainError={completion.onchainError}
        onNext={onChooseNext}
      />
    );
  }

  return (
    <div className="flex flex-col gap-4 rounded-[24px] bg-paper/50 p-6 h-[calc(100vh-160px)] max-h-[820px] min-h-[500px]">
      {/* Header: fixed */}
      <div className="flex flex-col items-center gap-3 pt-1 shrink-0">
        <div className="text-[10px] font-bold uppercase tracking-[0.16em] text-fg-soft">
          {lesson.module.category}
        </div>
        <div className="display text-[20px] font-semibold text-indigo text-center">
          {lesson.module.title}
        </div>
        <div
          className="flex items-center gap-2 mt-1"
          aria-label={`Card ${cardIndex + 1} of ${totalCards}`}
        >
          {lesson.cards.map((_, i) => {
            const isPast = i < cardIndex;
            const isCurrent = i === cardIndex;
            return (
              <span
                key={i}
                className={`rounded-full transition-all ${
                  isCurrent
                    ? "w-8 h-2 bg-terracotta"
                    : isPast
                      ? "w-2 h-2 bg-forest"
                      : "w-2 h-2 bg-canvas-warm"
                }`}
              />
            );
          })}
        </div>
      </div>

      {submissionError && (
        <div className="mx-auto max-w-[480px] rounded-[14px] bg-terracotta-tint p-4 text-center animate-fade-up shrink-0">
          <div className="text-[12px] font-bold text-terracotta">
            {submissionError}
          </div>
        </div>
      )}

      <div className="flex-1 min-h-0 overflow-y-auto no-scrollbar flex items-start justify-center py-4">
        {currentCard.type === "flip" && (
          <FlipCard key={cardIndex} data={currentCard} onFlip={setFlipped} />
        )}
        {currentCard.type === "choice" && (
          <ChoiceCard
            key={cardIndex}
            data={currentCard}
            onAnswer={(idx, correct) => recordAnswer(idx, correct)}
          />
        )}
        {currentCard.type === "visual" && (
          <VisualCard key={cardIndex} data={currentCard} />
        )}
        {currentCard.type === "spotter" && (
          <SpotterCard
            key={cardIndex}
            data={currentCard}
            onAnswer={(ans, correct) => recordAnswer(ans, correct)}
          />
        )}
      </div>

      <div className="flex items-center justify-between gap-4 pt-2 shrink-0">
        <button
          onClick={handleBack}
          disabled={isFirstCard}
          className={`inline-flex items-center gap-1.5 rounded-full px-5 py-3 text-[13px] font-semibold transition-all ${
            isFirstCard
              ? "opacity-30 cursor-not-allowed text-fg-soft"
              : "text-indigo hover:bg-canvas-warm"
          }`}
        >
          <ArrowLeft size={14} strokeWidth={2.5} />
          Back
        </button>

        <button
          onClick={handleNext}
          disabled={!canAdvance}
          className={`group inline-flex items-center gap-2 rounded-full px-7 py-3.5 text-[14px] font-bold shadow-[0_6px_20px_rgba(199,93,63,0.35)] transition-all ${
            canAdvance
              ? "bg-terracotta text-paper hover:-translate-y-0.5"
              : "bg-canvas-warm text-fg-faint cursor-not-allowed shadow-none"
          }`}
        >
          {isLastCard ? "Complete lesson" : "Continue"}
          <ArrowRight
            size={16}
            strokeWidth={2.8}
            className="transition-transform group-hover:translate-x-0.5"
          />
        </button>
      </div>
    </div>
  );
}