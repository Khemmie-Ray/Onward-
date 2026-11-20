// frontend/components/shell/panels/ProfileRightPanel.tsx
import { UBIClaimCard } from "@/components/dashboard/UBIClaimCard";
import { ReferralCard } from "@/components/dashboard/profile/ReferralCard";
import { MobileSignOut } from "@/components/dashboard/nav/MobileSignout";
import { DailyQuestsCard } from "@/components/dashboard/quests/DailyQuestsCard";

export function ProfileRightPanel() {
  return (
    <>
      <UBIClaimCard />
      <DailyQuestsCard />
      <ReferralCard />
      <MobileSignOut />
    </>
  );
}
