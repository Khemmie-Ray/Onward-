"use client";

import { FreeAction } from "./FreeAction";
import { PremiumAction } from "./PremiumAction";
import type { Mode, FreeStep, PremiumStep, DailyCapMessage } from "./type";

export function PlayStage({
  activeTab,
  freeStep,
  freeCapMessage,
  freeError,
  onStartFree,
  onSwitchToPremium,
  premiumStep,
  premiumCapMessage,
  premiumError,
  hasEnoughBalance,
  balance,
  stakeAmount,
  needsApproval,
  isVerified,
  onStartPremium,
  onVerify,
  resumeInfo,
  checkingResume,
  onResumeStake,
  onForfeitStake,
  forfeiting,
}: {
  activeTab: Mode;
  freeStep: FreeStep;
  freeCapMessage: DailyCapMessage;
  freeError: string | null;
  onStartFree: () => void;
  onSwitchToPremium: () => void;
  premiumStep: PremiumStep;
  premiumCapMessage: DailyCapMessage;
  premiumError: string | null;
  hasEnoughBalance: boolean;
  balance: bigint;
  stakeAmount: bigint;
  needsApproval: boolean;
  isVerified: boolean;
  onStartPremium: () => void;
  onVerify: () => void;
  resumeInfo: {
    resumable: boolean;
    round_id?: string;
    round_id_hash?: string;
    needsForfeit?: boolean;
    message?: string;
  } | null;
  checkingResume: boolean;
  onResumeStake: () => void;
  onForfeitStake: () => void;
  forfeiting: boolean;
}) {
  return (
    <div className="rounded-[16px] bg-paper px-6 shadow-[0_2px_8px_rgba(31,58,110,0.05)] flex flex-col items-center justify-center py-10">
      <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-fg-soft">
        Whack-a-Scam
      </p>
      <PreviewBoard />
      <div className="w-full mt-6">
        {activeTab === "free" ? (
          <FreeAction
            step={freeStep}
            capMessage={freeCapMessage}
            errorMessage={freeError}
            onStart={onStartFree}
            onSwitchToPremium={onSwitchToPremium}
          />
        ) : (
          <PremiumAction
            step={premiumStep}
            capMessage={premiumCapMessage}
            errorMessage={premiumError}
            hasEnoughBalance={hasEnoughBalance}
            balance={balance}
            stakeAmount={stakeAmount}
            needsApproval={needsApproval}
            isVerified={isVerified}
            onStart={onStartPremium}
            onVerify={onVerify}
            resumeInfo={resumeInfo}
            checkingResume={checkingResume}
            onResumeStake={onResumeStake}
            onForfeitStake={onForfeitStake}
            forfeiting={forfeiting}
          />
        )}
      </div>
    </div>
  );
}

function PreviewBoard() {
  return (
    <div className="bg-aubergine/95 rounded-[18px] p-5 grid grid-cols-3 gap-3 shadow-[0_8px_24px_rgba(91,46,92,0.25)]">
      {[0, 1, 2].map((i) => (
        <div
          key={i}
          className="w-14 h-14 rounded-full bg-black/30 flex items-center justify-center overflow-hidden"
        >
          <div
            className="w-9 h-9 rounded-full bg-cream preview-pop"
            style={{ animationDelay: `${i * 1.05}s` }}
          />
        </div>
      ))}
      <style jsx>{`
        @keyframes preview-pop-kf {
          0%,
          70%,
          100% {
            opacity: 0;
            transform: scale(0.4);
          }
          15%,
          35% {
            opacity: 1;
            transform: scale(1);
          }
        }
        .preview-pop {
          animation: preview-pop-kf 3.2s ease-in-out infinite;
        }
      `}</style>
    </div>
  );
}
