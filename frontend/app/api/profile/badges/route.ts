import { NextResponse } from "next/server";
import { keccak256, toBytes, type Address } from "viem";
import { requireAuth } from "@/lib/auth";
import { publicClient } from "@/lib/onchain/badges";
import { onwardBadgesAbi } from "@/constants/abis";
import { CONTRACT_ADDRESSES } from "@/constants/contracts/address";
import { ALL_BADGE_SLUGS } from "@/lib/badges/badge-slugs";

type OnchainBadge = {
  slug: string;
  label: string;
  category: string;
  deprecated: boolean;
  owned: boolean;
  tokenId: string | null;
  tokenURI: string | null;
  explorerUrl: string | null;
  metadata: {
    name?: string;
    description?: string;
    image?: string;
  } | null;
};

const CELOSCAN_BASE = "https://celoscan.io";

function ipfsToHttp(uri: string): string {
  if (uri.startsWith("ipfs://")) {
    return `https://gateway.pinata.cloud/ipfs/${uri.slice(7)}`;
  }
  return uri;
}

export async function GET(request: Request) {
  const auth = await requireAuth(request);
  if ("error" in auth) return auth.error;
  const { user } = auth;

  const userWallet = user.wallet_address as Address;

  const results = await Promise.all(
    ALL_BADGE_SLUGS.map(async (badge): Promise<OnchainBadge> => {
      const slugHash = keccak256(toBytes(badge.slug));

      let tokenId = 0n;
      try {
        tokenId = (await publicClient.readContract({
          address: CONTRACT_ADDRESSES.onwardBadges,
          abi: onwardBadgesAbi,
          functionName: "earnedTokenId",
          args: [userWallet, slugHash],
        })) as bigint;
      } catch {
        tokenId = 0n;
      }

      const owned = tokenId > 0n;
      let tokenURI: string | null = null;
      let explorerUrl: string | null = null;
      let metadata: OnchainBadge["metadata"] = null;

      if (owned) {
        explorerUrl = `${CELOSCAN_BASE}/token/${CONTRACT_ADDRESSES.onwardBadges}?a=${tokenId.toString()}`;

        try {
          tokenURI = (await publicClient.readContract({
            address: CONTRACT_ADDRESSES.onwardBadges,
            abi: onwardBadgesAbi,
            functionName: "tokenURI",
            args: [tokenId],
          })) as string;

          if (tokenURI) {
            const res = await fetch(ipfsToHttp(tokenURI), {
              next: { revalidate: 3600 },
            });
            if (res.ok) {
              const json = await res.json();
              metadata = {
                name: json.name,
                description: json.description,
                image: json.image,
              };
            }
          }
        } catch {
          // metadata fetch failed — badge still owned
        }
      }

      return {
        slug: badge.slug,
        label: badge.label,
        category: badge.category,
        deprecated: badge.deprecated ?? false,
        owned,
        tokenId: owned ? tokenId.toString() : null,
        tokenURI,
        explorerUrl,
        metadata,
      };
    }),
  );

  const owned = results.filter((b) => b.owned);
  const unearned = results.filter((b) => !b.owned && !b.deprecated);

  return NextResponse.json({
    owned,
    unearned,
    total_owned: owned.length,
  });
}
