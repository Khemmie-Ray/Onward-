import { UBIClaimCard } from "@/components/dashboard/UBIClaimCard";
import { RankCard } from "../../dashboard/leaderboard/RankCard";
import { DailyQuestsCard } from "@/components/dashboard/quests/DailyQuestsCard";

export function BoardRightPanel() {
  return (
    <>
      <UBIClaimCard />
      <DailyQuestsCard />
      <RankCard />
    </>
  );
}
