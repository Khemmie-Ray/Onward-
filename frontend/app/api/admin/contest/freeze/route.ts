import { NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import { freezeContest, CONTEST_SLUG, contestIsOver } from "@/lib/contest/contest";

// Admin wallets. Keep in sync with proxy.ts and useIsAdmin.ts.
const ADMIN_ADDRESSES = [
  "0xe25327d529a722bb05ca7cc495528e2cb2da520f",
  "0x617b8e03d30b26910e2fc783333708061017a379",
];

export async function POST(request: Request) {
  // token.sub is CAIP formatted ("42220:0xabc…"), not a bare address.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const token = await getToken({ req: request as any });
  const address = String(token?.sub ?? "").split(":").pop()?.toLowerCase();

  if (!address || !ADMIN_ADDRESSES.includes(address)) {
    return NextResponse.json({ error: "Not authorized" }, { status: 403 });
  }

  try {
    const counts = await freezeContest();
    return NextResponse.json({
      ok: true,
      contest_slug: CONTEST_SLUG,
      contest_over: contestIsOver(),
      frozen: counts,
    });
  } catch (err) {
    console.error("[contest/freeze]", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Freeze failed" },
      { status: 500 },
    );
  }
}