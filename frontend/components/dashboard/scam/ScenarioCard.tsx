"use client";

import React from "react";
import type { Scenario } from "@/lib/scam/patterns";
import DMCard from "./DMCard";
import TweetCard from "./TweetCard";
import WalletPopupCard from "./WalletPopupCard";
import PageCard from "./PageCard";

interface ScenarioCardProps {
  scenario: Scenario;
}

const ScenarioCard = ({ scenario }: ScenarioCardProps) => {
  switch (scenario.kind) {
    case "dm":
      return <DMCard scenario={scenario} />;
    case "tweet":
      return <TweetCard scenario={scenario} />;
    case "wallet_popup":
      return <WalletPopupCard scenario={scenario} />;
    case "page":
    default:
      return <PageCard scenario={scenario} />;
  }
}

export default ScenarioCard;