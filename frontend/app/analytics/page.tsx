import type { Metadata } from "next";
import { AnalyticsView } from "@/components/analytics/AnalyticsView";

export const revalidate = 600;

export const metadata: Metadata = {
  title: "Onward on-chain · Analytics",
  description:
    "Live on-chain numbers for Onward on Celo: transactions, G$ volume, verified active users and onboarded users.",
};

export default function AnalyticsSeasonPage() {
  return <AnalyticsView view="season" />;
}
