import { NextResponse } from "next/server";
import { requireCompletedProfile } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabase/admin";

type BeginBody = {
  preview_id?: string;
};

export async function POST(request: Request) {
  const auth = await requireCompletedProfile(request);
  if ("error" in auth) return auth.error;
  const { user } = auth;

  const body = (await request.json().catch(() => null)) as BeginBody | null;
  if (!body?.preview_id) {
    return NextResponse.json({ error: "Missing preview_id" }, { status: 400 });
  }

  const { data: session, error } = await supabaseAdmin
    .from("game_sessions")
    .update({ status: "active" })
    .eq("id", body.preview_id)
    .eq("user_id", user.id)
    .eq("status", "pending")
    .select("id")
    .single();

  if (error || !session) {
    return NextResponse.json(
      { error: "Round not found or already started" },
      { status: 404 }
    );
  }

  return NextResponse.json({ round_id: session.id });
}