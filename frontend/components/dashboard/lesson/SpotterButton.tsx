import { Check, X } from "lucide-react";


export default function SpotterButton({
  answer,
  icon: Icon,
  label,
  selected,
  correct,
  onClick,
}: {
  answer: "scam" | "real";
  icon: React.ComponentType<
    React.SVGProps<SVGSVGElement> & { size?: number; strokeWidth?: number }
  >;
  label: string;
  selected: "scam" | "real" | null;
  correct: boolean;
  onClick: () => void;
}) {
  const locked = selected !== null;
  const isSelected = selected === answer;
  const showCorrect = locked && correct;
  const showWrong = locked && isSelected && !correct;

  let stateClass =
    "bg-canvas-warm text-indigo hover:bg-mustard-tint hover:-translate-y-0.5";
  if (showCorrect) stateClass = "bg-forest text-paper";
  else if (showWrong) stateClass = "bg-terracotta text-paper";
  else if (locked) stateClass = "bg-canvas-warm text-fg-soft opacity-60";

  return (
    <button
      onClick={onClick}
      disabled={locked}
      className={`flex items-center justify-center gap-2 p-4 rounded-[14px] text-[15px] font-bold transition-all ${stateClass}`}
    >
      {showCorrect ? (
        <Check size={18} strokeWidth={3} />
      ) : showWrong ? (
        <X size={18} strokeWidth={3} />
      ) : (
        <Icon size={18} strokeWidth={2.5} />
      )}
      {label}
    </button>
  );
}
