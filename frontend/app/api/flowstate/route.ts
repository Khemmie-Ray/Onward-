import { NextRequest, NextResponse } from "next/server";
import { isAddress, verifyMessage } from "viem";
import { requireCompletedProfile } from "@/lib/auth";
import {
  PROJECT_NAME,
  PROJECT_RECIPIENT,
  FLOW_CHAIN,
  FLOW_COUNCIL,
  FLOW_QUERY,
  flowClaimMessage,
  normalizeName,
} from "@/lib/onchain/flowstate";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const BASE = "https://flowstate.network/api/flow-council";

const reply = (body: unknown, status = 200) =>
  NextResponse.json(body, {
    status,
    headers: { "Cache-Control": "no-store" },
  });

async function upstream(path: string, init?: RequestInit) {
  const response = await fetch(`${BASE}/${path}`, {
    ...init,
    cache: "no-store",
    signal: AbortSignal.timeout(15_000),
    redirect: "error",
  });
  const data = await response.json().catch(() => null);
  if (!data || typeof data !== "object") {
    throw new Error(
      "Flow State returned an incomplete response. Please retry.",
    );
  }
  return { response, data };
}

/** Public council details: Onward's listing and the GoodDollar vote allowance. */
export async function GET() {
  try {
    const [recipients, groups] = await Promise.all([
      upstream(`recipients?${FLOW_QUERY}`),
      upstream(`voter-groups/public?${FLOW_QUERY}&includeMembers=0`),
    ]);
    if (
      !recipients.response.ok ||
      !groups.response.ok ||
      !Array.isArray(recipients.data.recipients) ||
      !Array.isArray(groups.data.groups)
    ) {
      throw new Error("Flow State voting details are unavailable.");
    }

    const list = recipients.data.recipients;
    if (
      list.length > 1000 ||
      list.some(
        (r: { address?: unknown; name?: unknown }) =>
          typeof r.address !== "string" ||
          !isAddress(r.address) ||
          (r.name !== null && typeof r.name !== "string"),
      )
    ) {
      throw new Error("Flow State returned invalid recipient details.");
    }

    const target = list.find(
      (r: { address: string }) => r.address.toLowerCase() === PROJECT_RECIPIENT,
    );
    if (
      !target ||
      normalizeName(target.name ?? "") !== normalizeName(PROJECT_NAME)
    ) {
      return reply(
        { error: `${PROJECT_NAME} is not open for voting right now.` },
        503,
      );
    }

    const community = groups.data.groups.find(
      (g: { eligibilityMethod: string }) =>
        g.eligibilityMethod === "gooddollar",
    );
    if (
      !community ||
      !Number.isSafeInteger(community.defaultVotingPower) ||
      community.defaultVotingPower <= 0
    ) {
      return reply(
        { error: "GoodDollar community voting is unavailable right now." },
        503,
      );
    }

    return reply({
      communityVotes: community.defaultVotingPower,
      recipients: list.map((r: { address: string; name: string | null }) => ({
        address: r.address.toLowerCase(),
        name: r.name?.slice(0, 120) ?? null,
      })),
    });
  } catch {
    return reply(
      { error: "Couldn't load the voting details. Please try again." },
      503,
    );
  }
}

export async function POST(req: NextRequest) {
  const auth = await requireCompletedProfile(req);
  if ("error" in auth) return auth.error;
  const { user } = auth;

  // Same origin only, plus a custom header a cross-site form cannot send.
  const origin = req.headers.get("origin");
  if (
    req.headers.get("x-flow-vote") !== "1" ||
    (origin && origin !== req.nextUrl.origin)
  ) {
    return reply({ error: "Requests must come from this site." }, 403);
  }

  try {
    const reader = req.body?.getReader();
    const decoder = new TextDecoder();
    let text = "";
    let size = 0;
    if (reader) {
      for (;;) {
        const { value, done } = await reader.read();
        if (done) break;
        size += value.byteLength;
        if (size > 2048) {
          await reader.cancel();
          return reply({ error: "Request is too large." }, 413);
        }
        text += decoder.decode(value, { stream: true });
      }
    }
    text += decoder.decode();

    let body;
    try {
      body = JSON.parse(text);
    } catch {
      return reply({ error: "Invalid request." }, 400);
    }

    const { address, issuedAt, signature } = body ?? {};
    if (
      typeof address !== "string" ||
      !isAddress(address) ||
      !Number.isSafeInteger(issuedAt) ||
      Math.abs(Date.now() - issuedAt) > 180_000 ||
      typeof signature !== "string" ||
      !/^0x[0-9a-fA-F]{130}$/.test(signature)
    ) {
      return reply(
        {
          error:
            "Your voting-rights signature is invalid or expired. Please try again.",
        },
        400,
      );
    }

    if (address.toLowerCase() !== user.wallet_address?.toLowerCase()) {
      return reply(
        { error: "Use the wallet on your Onward account to vote." },
        403,
      );
    }

    const valid = await verifyMessage({
      address,
      message: flowClaimMessage(address, issuedAt),
      signature: signature as `0x${string}`,
    });
    if (!valid) {
      return reply({ error: "The signature does not match this wallet." }, 401);
    }

    const { response, data } = await upstream("eligibility", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        address,
        issuedAt,
        signature,
        chainId: FLOW_CHAIN,
        councilId: FLOW_COUNCIL,
      }),
    });

    if (response.ok && data.success === true) return reply({ ok: true });
    if (data.alreadyClaimed) {
      return reply(
        {
          error:
            "Your GoodDollar identity already has voting rights on another wallet. Vote from that wallet on Flow State.",
          code: "IDENTITY_ALREADY_CLAIMED",
        },
        409,
      );
    }
    if (data.notWhitelisted) {
      return reply(
        {
          error:
            "This wallet isn't verified with GoodDollar yet. Verify, then try again.",
          code: "VERIFICATION_REQUIRED",
        },
        403,
      );
    }
    if (data.reason === "expired_signature") {
      return reply(
        { error: "The signature expired. Claim your voting rights again." },
        400,
      );
    }
    return reply(
      {
        error:
          "Flow State couldn't give you voting rights right now. Refresh your status before trying again.",
      },
      response.status === 429 ? 429 : 503,
    );
  } catch {
    return reply(
      {
        error:
          "The request was interrupted. Refresh your status before trying again.",
      },
      503,
    );
  }
}
