import { NextResponse } from "next/server";
import { runChainSync } from "@/lib/server/chain-sync";

export const maxDuration = 300;
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  if (
    request.headers.get("authorization") !== `Bearer ${process.env.CRON_SECRET}`
  ) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const deadline = Date.now() + (maxDuration - 30) * 1000;

  try {
    const result = await runChainSync({ deadline });
    return NextResponse.json(result);
  } catch (err) {
    console.error("[chain-sync] failed", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Chain sync failed" },
      { status: 502 },
    );
  }
}
