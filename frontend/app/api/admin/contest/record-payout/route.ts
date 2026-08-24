import { NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { CONTEST_SLUG } from "@/lib/contest/contest";

const ADMIN_ADDRESSES = [
  "0xe25327d529a722bb05ca7cc495528e2cb2da520f",
  "0x617b8e03d30b26910e2fc783333708061017a379",
];

type Body = {
  board?: string;
  batch_ref?: string;
  tx_hash?: string;
  recipients?: Array<{
    wallet_address: string;
    amount_g: string;
    user_id?: string | null;
    rank?: number | null;
  }>;
};

export async function POST(request: Request) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const token = await getToken({ req: request as any });
  const address = String(token?.sub ?? "").split(":").pop()?.toLowerCase();

  if (!address || !ADMIN_ADDRESSES.includes(address)) {
    return NextResponse.json({ error: "Not authorized" }, { status: 403 });
  }

  const body = (await request.json().catch(() => null)) as Body | null;

  if (!body?.board || !body?.batch_ref || !body?.recipients?.length) {
    return NextResponse.json(
      { error: "board, batch_ref and recipients are required" },
      { status: 400 },
    );
  }

  const rows = body.recipients.map((r) => ({
    contest_slug: CONTEST_SLUG,
    board: body.board as string,
    user_id: r.user_id ?? null,
    wallet_address: r.wallet_address,
    rank: r.rank ?? null,
    amount_g: r.amount_g,
    batch_ref: body.batch_ref as string,
    tx_hash: body.tx_hash ?? null,
  }));

  const { error } = await supabaseAdmin.from("contest_payouts").insert(rows);

  if (error) {
    return NextResponse.json(
      { error: error.message, already_paid: error.code === "23505" },
      { status: 409 },
    );
  }

  return NextResponse.json({ ok: true, recorded: rows.length });
}