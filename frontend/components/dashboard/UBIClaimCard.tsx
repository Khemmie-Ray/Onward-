"use client";

import { useIdentityContext } from "@/contexts/IdentityContext";
import { VerifyUbiCard } from "./ubi/VerifyUbiCard";
import { ClaimUbiCard } from "./ubi/ClaimUbiCard";

export function UBIClaimCard() {
  const { isVerified } = useIdentityContext();
  if (!isVerified) return <VerifyUbiCard />;
  return <ClaimUbiCard />;
}
