// frontend/components/shell/panels/PlayRightPanel.tsx
import { UBIClaimCard } from "@/components/dashboard/UBIClaimCard";
import { LeaderboardCard } from "@/components/shell/LeaderboardCard";
import { DailyQuestsCard } from "@/components/dashboard/quests/DailyQuestsCard";

export function PlayRightPanel() {
  return (
    <>
      <UBIClaimCard />
      <DailyQuestsCard />
      <LeaderboardCard />
    </>
  );
}