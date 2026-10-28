"use client";

import { useState, useEffect } from "react";
import type { HoleState } from "./type";

const SCAM_MOLES = [
  "/whack-icons/scam-hat.svg",
  "/whack-icons/scam-hoodie.svg",
  "/whack-icons/scam-disguise.svg",
];
const REAL_MOLE = "/whack-icons/real.svg";
const SCAM_BONKED = "/whack-icons/scam-bonked.svg";
const REAL_BONKED = "/whack-icons/real-bonked.svg";

function moleSrc(state: HoleState, bonked: boolean): string {
  if (bonked) return state.isScam ? SCAM_BONKED : REAL_BONKED;
  if (!state.isScam) return REAL_MOLE;
  const idx = Math.abs(Math.floor(state.id)) % SCAM_MOLES.length;
  return SCAM_MOLES[idx];
}

export function Hole({
  state,
  onWhack,
}: {
  state: HoleState | null;
  onWhack: () => void;
}) {
  const [floatNum, setFloatNum] = useState<1 | -1 | null>(null);
  const [whacked, setWhacked] = useState(false);

  useEffect(() => {
    setWhacked(false);
    setFloatNum(null);
  }, [state?.id]);

  const handleClick = () => {
    if (!state || whacked) return;
    setWhacked(true);
    setFloatNum(state.isScam ? 1 : -1);
    onWhack();
    setTimeout(() => setFloatNum(null), 800);
  };

  return (
    <div className="relative h-full w-full">
      <div className="absolute inset-0 overflow-hidden rounded-[18px] bg-[#140E30]">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-x-0 bottom-0 h-6 rounded-b-[18px] bg-gradient-to-t from-black/60 to-transparent"
        />
        <div
          aria-hidden
          className="pointer-events-none absolute inset-x-5 bottom-2 h-3 rounded-[50%] bg-black/40"
        />
      </div>

      {state && (
        <button
          onClick={handleClick}
          disabled={whacked}
          aria-label={whacked ? "Bonked" : "Whack mole"}
          className={`absolute inset-0 flex items-end justify-center pb-1 ${
            whacked ? "cursor-default" : "cursor-pointer"
          }`}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={moleSrc(state, whacked)}
            alt=""
            className={`h-[86%] w-[86%] object-contain drop-shadow-[0_6px_10px_rgba(0,0,0,0.35)] ${
              whacked ? "" : "animate-[pop-up_0.18s_ease-out]"
            }`}
          />
        </button>
      )}

      {floatNum !== null && (
        <div
          aria-hidden
          className={`display pointer-events-none absolute inset-x-0 top-1 flex justify-center text-[28px] font-bold [text-shadow:0_2px_8px_rgba(0,0,0,0.5)] animate-[float-up_0.8s_ease-out_forwards] ${
            floatNum > 0 ? "text-mustard" : "text-terracotta"
          }`}
        >
          {floatNum > 0 ? "+1" : "−1"}
        </div>
      )}
    </div>
  );
}
