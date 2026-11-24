import type { ReactNode } from "react";

type PanelCardVariant = "white" | "paper" | "dark" | "mustard" | "aubergine" | "outline";

const VARIANT: Record<PanelCardVariant, string> = {
  white: "bg-white text-black",
  paper: "bg-paper text-blue",
  dark: "bg-blue text-paper",
  mustard: "bg-mustard text-blue",
  aubergine: "bg-[#CDC4FB] text-blue",
  outline: "bg-paper text-blue border-2 border-forest",
};

export function PanelCard({
  variant = "paper",
  className = "",
  children,
}: {
  variant?: PanelCardVariant;
  className?: string;
  children: ReactNode;
}) {
  return (
    <div
      className={`rounded-2xl p-4 shadow-[0_4px_14px_rgba(31,58,110,0.06)] w-full mb-3 ${VARIANT[variant]} ${className}`}
    >
      {children}
    </div>
  );
}

export function PanelCardHeader({
  title,
  meta,
}: {
  title: ReactNode;
  meta?: ReactNode;
}) {
  return (
    <div className="mb-3 flex items-baseline justify-between">
      <h3 className="display text-[17px] font-bold">{title}</h3>
      {meta && <span className="text-[11px] opacity-70">{meta}</span>}
    </div>
  );
}
