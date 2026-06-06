import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { requireAuth } from "@/lib/auth";

const NAME_REGEX = /^[a-zA-Z0-9_-]+$/;

export async function GET(request: Request) {
  const url = new URL(request.url);
  const name = url.searchParams.get("name")?.trim() ?? "";

  if (name.length < 2 || name.length > 20) {
    return NextResponse.json({
      available: false,
      reason: "Must be 2–20 characters",
    });
  }
  if (!NAME_REGEX.test(name)) {
    return NextResponse.json({
      available: false,
      reason: "Letters, numbers, _ or - only",
    });
  }

  const reserved = ["admin", "support", "help", "team", "official", "onward", "anonymous"];
  if (reserved.includes(name.toLowerCase())) {
    return NextResponse.json({
      available: false,
      reason: "This name is reserved",
    });
  }

  const auth = await requireAuth(request);
  if ("error" in auth) return auth.error;

  const normalized = name.toLowerCase();

  const { data: existing } = await supabaseAdmin
    .from("users")
    .select("id, display_name")
    .eq("display_name_normalized", normalized)
    .maybeSingle();

  if (!existing) {
    return NextResponse.json({ available: true });
  }

  if (existing.id === auth.user.id) {
    return NextResponse.json({ available: true, current: true });
  }

  return NextResponse.json({
    available: false,
    reason: "Name is taken",
  });
}