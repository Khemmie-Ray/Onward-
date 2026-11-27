import type { Metadata } from "next";
import { AnalyticsView } from "@/components/analytics/AnalyticsView";

export const revalidate = 600;

export const metadata: Metadata = {
  title: "Onward on-chain · All time",
  description:
    "Onward's on-chain numbers on Celo since launch: transactions, G$ volume, verified active users and onboarded users.",
};

export default function AnalyticsAllTimePage() {
  return <AnalyticsView view="all" />;
}
