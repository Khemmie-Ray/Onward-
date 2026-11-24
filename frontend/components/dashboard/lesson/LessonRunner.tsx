"use client";

import { useCallback, useState } from "react";
import { ArrowLeft, ArrowRight, Check, RotateCcw, X } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import { ChoiceCard } from "./ChoiceCard";
import { CompletionScreen } from "./CompletionScreen";
import { ConceptCard } from "./exercises/ConceptCard";
import { MatchPairsCard } from "./exercises/MatchPairsCard";
import { SortBucketsCard } from "./exercises/SortBucketsCard";
import { OrderStepsCard } from "./exercises/OrderStepsCard";
import { FillGapCard } from "./exercises/FillGapCard";
import { SpotScamCard } from "./exercises/SpotScamCard";
import { RecapCard } from "./exercises/RecapCard";
import { PastCard } from "./PastCard";
import { useAuthFetch } from "@/hooks/useAuthFetch";
import type {
  CardAnswer,
  LessonCard,
  LessonContent,
} from "@/lib/lessons/lesson-data";
import { feedbackFor, gradeLessonCard } from "@/lib/lessons/grade";
import { UNGRADED_CARD_TYPES } from "@/lib/learn/grading";
import { useIdentityContext } from "@/contexts/IdentityContext";

/** The learner's first answer to a card. This is what gets graded. */
type Answer = {
  cardIndex: number;
  answer: CardAnswer;
  correct: boolean;
};

type Step = { card: number; retry: boolean };

const baseSteps = (count: number): Step[] =>
  Array.from({ length: count }, (_, card) => ({ card, retry: false }));

const HINTS: Partial<Record<LessonCard["type"], string>> = {
  choice: "Pick one answer, then check it.",
  match_pairs: "Tap a word, then its match. Tap a match to undo it.",
  sort_buckets: "Tap a card, then the box it belongs in.",
  order_steps: "Tap the steps in the order they happen.",
  fill_gap: "Tap the word that fits the gap.",
  spot_scam: "Look at who sent it, what they want, and how fast.",
};

type CompletionState = {
  rewardAmount: number;
  correctCount: number;
  totalQuestions: number;
  badgeImageUrl: string | null;
  badgeTxHash: string | null;
  badgeTokenId: string | null;
  alreadyMinted: boolean;
  onchainError: string | null;
};

export function LessonRunner({
  lesson,
  badgeImageUrl,
  onChooseNext,
  onExit,
  trackTitle,
  sectionNumber,
  sectionCount,
  basePath = "/api/learn/modules",
}: {
  lesson: LessonContent;
  badgeImageUrl?: string | null;
  onChooseNext: () => void;
  onExit: () => void;
  trackTitle?: string;
  sectionNumber?: number;
  sectionCount?: number;
  basePath?: string;
}) {
  const authFetch = useAuthFetch();
  const { isVerified } = useIdentityContext();
  const queryClient = useQueryClient();

  const [steps, setSteps] = useState<Step[]>(() =>
    baseSteps(lesson.cards.length),
  );
  const [position, setPosition] = useState(0);
  const [answers, setAnswers] = useState<Answer[]>([]);
  // The answer being built on the current card, and its result once checked.
  const [draft, setDraft] = useState<CardAnswer | null>(null);
  const [checked, setChecked] = useState<{
    answer: CardAnswer;
    correct: boolean;
  } | null>(null);

  const [completion, setCompletion] = useState<CompletionState | null>(null);
  const [submissionError, setSubmissionError] = useState<string | null>(null);
  const [back, setBack] = useState(0);
  const [recapReady, setRecapReady] = useState(false);
  const onRecapReady = useCallback(
    (ready: boolean) => setRecapReady(ready),
    [],
  );
  const [reviewDone, setReviewDone] = useState(false);

  const step = steps[position];
  const cardIndex = step.card;
  const currentCard = lesson.cards[cardIndex];
  const totalSteps = steps.length;
  const isLastStep = position === totalSteps - 1;
  const ungraded = UNGRADED_CARD_TYPES.has(currentCard.type);
  const verdict = checked ? checked.correct : null;
  const continueBlocked = currentCard.type === "recap" && !recapReady;
  const viewing = back > 0 ? steps[position - back] : null;

  const recordAnswer = (answer: CardAnswer, correct: boolean) => {
    if (step.retry) return;
    setAnswers((prev) => [
      ...prev.filter((a) => a.cardIndex !== cardIndex),
      { cardIndex, answer, correct },
    ]);
  
    if (!correct) {
      setSteps((prev) =>
        prev.some((s) => s.card === cardIndex && s.retry)
          ? prev
          : [...prev, { card: cardIndex, retry: true }],
      );
    }
  };

  const handleCheck = () => {
    if (draft === null || checked) return;
    const correct = gradeLessonCard(currentCard, draft);
    setChecked({ answer: draft, correct });
    recordAnswer(draft, correct);
  };

  const handleNext = () => {
    if (!ungraded && !checked) return;
    if (continueBlocked) return;
    setDraft(null);
    setChecked(null);
    if (position >= steps.length - 1) {
      if (lesson.review) setReviewDone(true);
      else submitCompletion();
      return;
    }
    setPosition((p) => p + 1);
  };

  const goBack = () => {
    if (checked || back >= position) return;
    setDraft(null);
    setBack((b) => b + 1);
  };
  const goForward = () => setBack((b) => Math.max(0, b - 1));

  const submitCompletion = async () => {
    const gradedLocal = answers.filter(
      (a) => !UNGRADED_CARD_TYPES.has(lesson.cards[a.cardIndex].type),
    );
    const correctCount = gradedLocal.filter((a) => a.correct).length;

    setCompletion({
      rewardAmount: lesson.module.reward,
      correctCount,
      totalQuestions: gradedLocal.length,
      badgeImageUrl: badgeImageUrl ?? null,
      badgeTxHash: null,
      badgeTokenId: null,
      alreadyMinted: false,
      onchainError: null,
    });

    try {
      const payload = {
        answers: answers.map((a) => ({
          card_index: a.cardIndex + 1,
          answer: a.answer,
        })),
        isVerified,
        version_id: lesson.versionId,
      };

      const res = await authFetch(
        `${basePath}/${lesson.module.slug}/complete`,
        {
          method: "POST",
          body: JSON.stringify(payload),
        },
      );

      const data = await res.json();

      if (!res.ok) {
        setCompletion(null);
        setSubmissionError(
          data.error ?? "We couldn't finish this section. Please try again.",
        );
        return;
      }

      if (data.status === "incomplete" && data.passed === false) {
        setCompletion(null);
        setSubmissionError(
          `You answered ${data.correct} of ${data.total} correctly. You need ${data.threshold} to earn the badge. Try the missed cards again.`,
        );
        const firstIncorrect = (data.incorrect_cards?.[0] ?? 1) - 1;
        setSteps(baseSteps(lesson.cards.length));
        setBack(0);
        setPosition(firstIncorrect);
        setAnswers((prev) => prev.filter((a) => a.cardIndex < firstIncorrect));
        return;
      }

      setCompletion((prev) =>
        prev
          ? {
              ...prev,
              badgeTxHash: data.onchain?.badgeTxHash ?? null,
              badgeTokenId: data.onchain?.badgeTokenId ?? null,
              alreadyMinted: data.onchain?.alreadyMinted === true,
              onchainError: data.onchain?.onchainError ?? null,
            }
          : prev,
      );

      queryClient.invalidateQueries({ queryKey: ["me", "status"] });
      queryClient.invalidateQueries({ queryKey: ["learn"] });
      queryClient.invalidateQueries({ queryKey: ["modules"] });
      queryClient.invalidateQueries({ queryKey: ["quests"] });
      queryClient.invalidateQueries({ queryKey: ["leaderboard", "quests"] });
      queryClient.invalidateQueries({ queryKey: ["milestones"] });
      queryClient.invalidateQueries({ queryKey: ["streak", "rewards"] });
      queryClient.invalidateQueries({ queryKey: ["points"] });
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

  if (reviewDone) {
    return (
      <ReviewDone
        title={lesson.module.title}
        trackTitle={trackTitle}
        onExit={onExit}
      />
    );
  }

  if (completion) {
    return (
      <CompletionScreen
        moduleTitle={lesson.module.title}
        moduleSlug={lesson.module.slug}
        rewardAmount={completion.rewardAmount}
        correctCount={completion.correctCount}
        totalQuestions={completion.totalQuestions}
        recapPoints={lesson.module.whatYouWillLearn}
        badgeImageUrl={completion.badgeImageUrl}
        badgeTxHash={completion.badgeTxHash}
        badgeTokenId={completion.badgeTokenId}
        alreadyMinted={completion.alreadyMinted}
        onchainError={completion.onchainError}
        onNext={onChooseNext}
        onExit={onExit}
        trackTitle={trackTitle}
      />
    );
  }

  const feedback = checked
    ? feedbackFor(currentCard, checked.answer, checked.correct)
    : null;
  const isScam = currentCard.type === "spot_scam";
  const finishLabel = position >= steps.length - 1 ? "Finish section" : null;

  return (
    <div className="fixed inset-0 z-60 flex flex-col bg-canvas md:static md:z-auto md:h-[calc(100vh-48px)] md:min-h-130 md:gap-5">
      <div className="hidden shrink-0 items-start justify-between gap-4 md:flex">
        <div className="flex min-w-0 flex-col gap-1.5">
          <button
            type="button"
            onClick={onExit}
            className="inline-flex items-center gap-1.5 self-start rounded-full text-[13px] font-semibold text-fg-soft transition hover:text-indigo focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo"
          >
            <ArrowLeft size={15} strokeWidth={2.5} />
            {trackTitle ?? lesson.module.category}
          </button>
          {sectionNumber !== undefined && sectionCount !== undefined && (
            <span className="text-[11px] font-bold uppercase tracking-[0.14em] text-aubergine">
              Section {sectionNumber} of {sectionCount}
            </span>
          )}
          <h1 className="display truncate text-[30px] font-bold leading-[1.05] tracking-[-0.025em] text-indigo lg:text-[34px]">
            {lesson.module.title}
          </h1>
        </div>
        <ExitButton onExit={onExit} />
      </div>
      <div className="flex shrink-0 items-center gap-3 px-5 pb-3 pt-5 md:p-0">
        <span className="md:hidden">
          <ExitButton onExit={onExit} />
        </span>
        <div
          className="flex flex-1 gap-1 md:gap-1.5"
          role="progressbar"
          aria-valuemin={1}
          aria-valuemax={totalSteps}
          aria-valuenow={position - back + 1}
          aria-label={`Card ${position - back + 1} of ${totalSteps}`}
        >
          {steps.map((s, i) => (
            <span
              key={`${s.card}-${s.retry ? "r" : "f"}`}
              className={`h-2 flex-1 rounded-full transition-colors md:h-2.5 ${
                i === position - back
                  ? "bg-indigo"
                  : i < position
                    ? "bg-mint"
                    : i === position
                      ? "bg-indigo/40"
                      : "bg-canvas-warm"
              }`}
            />
          ))}
        </div>
        <span className="hidden text-[13px] font-bold tabular-nums text-indigo md:inline">
          {position - back + 1} of {totalSteps}
        </span>
      </div>
      <div className="no-scrollbar flex min-h-0 flex-1 flex-col gap-3 overflow-y-auto px-5 py-3 md:px-0 md:py-2">
        {lesson.review && back === 0 && position === 0 && (
          <div className="mx-auto flex items-center gap-2 rounded-full bg-[#CDC4FB] px-4 py-1.5 text-[12px] font-bold text-indigo">
            <RotateCcw size={13} strokeWidth={2.6} />
            Review: you&apos;ve finished this section, so nothing to earn
          </div>
        )}
        {viewing && (
          <div className="mx-auto rounded-full bg-canvas-warm px-4 py-1.5 text-[12px] font-bold text-indigo">
            Re-reading an earlier card
          </div>
        )}
        {submissionError && (
          <div className="mx-auto w-full max-w-160 rounded-2xl bg-terracotta-tint p-4 text-center text-[13px] font-bold text-terracotta">
            {submissionError}
          </div>
        )}
        {step.retry && (
          <div className="mx-auto rounded-full bg-mustard-tint px-4 py-1.5 text-[12px] font-bold text-indigo">
            Let&apos;s try this one again
          </div>
        )}
        {viewing ? (
          <PastCard
            key={`past-${position - back}`}
            card={lesson.cards[viewing.card]}
            answer={answers.find((a) => a.cardIndex === viewing.card) ?? null}
          />
        ) : (
          <Exercise
            key={position}
            card={currentCard}
            verdict={verdict}
            onDraft={setDraft}
            onRecapReady={onRecapReady}
          />
        )}
      </div>
      {viewing ? (
        <div className="flex shrink-0 items-center justify-between gap-3 px-5 pb-[max(28px,env(safe-area-inset-bottom))] pt-3 md:border-t-2 md:border-canvas-warm md:px-0 md:pb-2 md:pt-5">
          <PreviousButton onClick={goBack} disabled={back >= position} />
          <button
            type="button"
            onClick={goForward}
            className="inline-flex min-h-13.5 flex-1 items-center justify-center gap-2 rounded-full bg-indigo text-[16px] font-bold text-paper shadow-[0_4px_0_#0E0920] transition hover:bg-indigo/90 active:translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo focus-visible:ring-offset-2 md:ml-auto md:w-auto md:flex-none md:min-w-50 md:px-8"
          >
            {back === 1 ? "Back to where I was" : "Next"}
            <ArrowRight size={16} strokeWidth={2.8} />
          </button>
        </div>
      ) : checked && feedback ? (
        <div
          role="status"
          className={`shrink-0 animate-[fade-up_0.3s_ease_both] rounded-t-[28px] px-5 pb-[max(28px,env(safe-area-inset-bottom))] pt-5 md:mx-auto md:mb-2 md:w-full md:max-w-160 md:rounded-[24px] md:p-5 ${
            checked.correct ? "bg-forest-tint" : "bg-terracotta-tint"
          }`}
        >
          <div className="flex items-center gap-2.5">
            <span
              className={`flex h-8 w-8 items-center justify-center rounded-full text-paper ${
                checked.correct ? "bg-forest" : "bg-terracotta"
              }`}
            >
              {checked.correct ? (
                <Check size={16} strokeWidth={3.2} />
              ) : (
                <X size={16} strokeWidth={3} />
              )}
            </span>
            <b
              className={`display text-[20px] ${checked.correct ? "text-forest" : "text-terracotta"}`}
            >
              {checked.correct
                ? isScam
                  ? "You spotted it"
                  : "Nice, that's it"
                : isScam
                  ? "Look again"
                  : "Not quite"}
            </b>
          </div>
          {feedback.reveal.length > 0 && (
            <ul className="mt-3 flex flex-col gap-1 text-[13.5px] font-semibold text-indigo">
              {feedback.reveal.map((line) => (
                <li key={line}>{line}</li>
              ))}
            </ul>
          )}
          {feedback.text && (
            <p className="mt-2.5 text-[14px] leading-[1.55] text-indigo/85">
              {feedback.text}
            </p>
          )}
          {!checked.correct && !step.retry && (
            <p className="mt-2 text-[13px] font-semibold text-indigo/70">
              You&apos;ll see this one again at the end.
            </p>
          )}
          <button
            type="button"
            onClick={handleNext}
            className={`mt-4 min-h-13.5 w-full rounded-full text-[16px] font-bold text-paper transition active:translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo focus-visible:ring-offset-2 ${
              checked.correct
                ? "bg-forest shadow-[0_4px_0_#24442D] hover:bg-forest/90"
                : "bg-terracotta shadow-[0_4px_0_#8E3A24] hover:bg-terracotta/90"
            }`}
          >
            {finishLabel ?? (checked.correct ? "Continue" : "Got it")}
          </button>
        </div>
      ) : (
        <div className="flex shrink-0 items-center justify-between gap-3 px-5 pb-[max(28px,env(safe-area-inset-bottom))] pt-3 md:gap-4 md:border-t-2 md:border-canvas-warm md:px-0 md:pb-2 md:pt-5">
          {position > 0 && <PreviousButton onClick={goBack} disabled={false} />}
          {!ungraded && HINTS[currentCard.type] && (
            <span className="hidden text-[14px] text-fg-soft lg:inline">
              {HINTS[currentCard.type]}
            </span>
          )}
          {ungraded ? (
            <button
              type="button"
              onClick={handleNext}
              disabled={continueBlocked}
              className="min-h-13.5 w-full rounded-full bg-indigo text-[16px] font-bold text-paper shadow-[0_4px_0_#0E0920] transition hover:bg-indigo/90 active:translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo focus-visible:ring-offset-2 md:ml-auto md:w-auto md:min-w-50 md:px-8 disabled:cursor-not-allowed disabled:bg-shadow disabled:text-fg-dim disabled:shadow-none"
            >
              {isLastStep
                ? lesson.review
                  ? "Finish review"
                  : "Finish section"
                : "Continue"}
            </button>
          ) : (
            <button
              type="button"
              onClick={handleCheck}
              disabled={draft === null}
              className="min-h-13.5 w-full rounded-full bg-indigo text-[16px] font-bold text-paper shadow-[0_4px_0_#0E0920] transition hover:bg-indigo/90 active:translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:bg-shadow disabled:text-fg-dim disabled:shadow-none md:ml-auto md:w-auto md:min-w-50 md:px-8"
            >
              Check
            </button>
          )}
        </div>
      )}
    </div>
  );
}

function PreviousButton({
  onClick,
  disabled,
}: {
  onClick: () => void;
  disabled: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-label="Previous card"
      className="inline-flex min-h-13.5 shrink-0 items-center justify-center gap-1.5 rounded-full border-2 border-shadow bg-paper px-4 text-[15px] font-bold text-indigo transition hover:bg-canvas-warm active:translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-40 md:px-5"
    >
      <ArrowLeft size={16} strokeWidth={2.8} />
      <span className="hidden sm:inline">Previous</span>
    </button>
  );
}

function ReviewDone({
  title,
  trackTitle,
  onExit,
}: {
  title: string;
  trackTitle?: string;
  onExit: () => void;
}) {
  return (
    <div className="flex min-h-125 flex-col items-center justify-center rounded-[28px] bg-paper p-10 text-center animate-[fade-up_0.5s_ease_both]">
      <span className="flex h-14 w-14 items-center justify-center rounded-full bg-forest text-paper">
        <Check size={26} strokeWidth={3} />
      </span>
      <div className="display mt-4 text-[24px] font-bold text-indigo">
        Review done
      </div>
      <p className="mt-2 max-w-80 text-[13.5px] text-fg-soft">
        You went back over &ldquo;{title}&rdquo;. Reviews don&apos;t earn
        points, but they help the words stick.
      </p>
      <button
        type="button"
        onClick={onExit}
        className="mt-6 rounded-full bg-indigo px-6 py-3 text-[14px] font-bold text-paper transition hover:bg-indigo/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo focus-visible:ring-offset-2"
      >
        Back to {trackTitle ?? "the track"}
      </button>
    </div>
  );
}

function ExitButton({ onExit }: { onExit: () => void }) {
  return (
    <button
      type="button"
      onClick={onExit}
      aria-label="Leave lesson"
      className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-canvas-warm text-indigo transition hover:bg-shadow focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo md:h-11 md:w-11"
    >
      <X size={17} strokeWidth={2.5} />
    </button>
  );
}

function Exercise({
  card,
  verdict,
  onDraft,
  onRecapReady,
}: {
  card: LessonCard;
  verdict: boolean | null;
  onDraft: (answer: CardAnswer | null) => void;
  onRecapReady: (ready: boolean) => void;
}) {
  switch (card.type) {
    case "choice":
      return <ChoiceCard data={card} verdict={verdict} onDraft={onDraft} />;
    case "concept":
      return <ConceptCard data={card} />;
    case "match_pairs":
      return <MatchPairsCard data={card} verdict={verdict} onDraft={onDraft} />;
    case "sort_buckets":
      return (
        <SortBucketsCard data={card} verdict={verdict} onDraft={onDraft} />
      );
    case "order_steps":
      return <OrderStepsCard data={card} verdict={verdict} onDraft={onDraft} />;
    case "fill_gap":
      return <FillGapCard data={card} verdict={verdict} onDraft={onDraft} />;
    case "spot_scam":
      return <SpotScamCard data={card} verdict={verdict} onDraft={onDraft} />;
    case "recap":
      return <RecapCard data={card} onReady={onRecapReady} />;
  }
}
