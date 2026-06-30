import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabase/admin";

export async function GET(request: Request) {
  const auth = await requireAuth(request);
  if ("error" in auth) return auth.error;
  const { user } = auth;

  const { data, error } = await supabaseAdmin
    .from("point_transactions")
    .select("delta")
    .eq("user_id", user.id)
    .eq("source", "module_complete");

  if (error) {
    return NextResponse.json(
      { error: "Failed to fetch module points" },
      { status: 500 },
    );
  }

  const pointsFromModules = (data ?? []).reduce(
    (sum, r) => sum + (r.delta ?? 0),
    0,
  );

  return NextResponse.json({ points_from_modules: pointsFromModules });
}