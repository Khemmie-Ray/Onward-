import { supabaseAdmin } from "@/lib/supabase/admin";
import type { DbUser } from "@/lib/supabase/types";
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-option";

export async function getAuthedUser(): Promise<DbUser | null> {
  const session = await getServerSession(authOptions);
  console.log("[getAuthedUser] session:", session);
  
  if (!session?.address) {
    console.log("[getAuthedUser] no session.address");
    return null;
  }

  const normalized = session.address.toLowerCase();
  console.log("[getAuthedUser] looking up wallet:", normalized);

  const { data: existing } = await supabaseAdmin
    .from("users")
    .select("*")
    .eq("wallet_address", normalized)
    .maybeSingle();

  console.log("[getAuthedUser] DB result:", existing ? "found" : "not found");

  if (!existing) return null;

  void supabaseAdmin
    .from("users")
    .update({ last_active_at: new Date().toISOString() })
    .eq("id", existing.id);

  return existing;
}

/**
 * Returns the SIWE-verified wallet address if one is present in the session,
 * without doing a DB lookup. Used by the onboarding endpoint which needs to
 * create the user row.
 */
export async function getAuthedAddress(): Promise<string | null> {
  const session = await getServerSession(authOptions);
  return session?.address ? session.address.toLowerCase() : null;
}

export async function requireAuth(
  _request: Request
): Promise<{ user: DbUser } | { error: Response }> {
  const user = await getAuthedUser();
  if (!user) {
    return {
      error: NextResponse.json({ error: "Unauthorized" }, { status: 401 }),
    };
  }
  return { user };
}

export async function requireCompletedProfile(request: Request) {
  const auth = await requireAuth(request);
  if ("error" in auth) return auth;

  const { user } = auth;
  const hasName = Boolean(
    user.display_name && user.display_name.trim().length > 0
  );
  const hasAvatar = Boolean(user.avatar_id);

  if (!hasName || !hasAvatar) {
    return {
      error: NextResponse.json(
        { error: "Complete onboarding first" },
        { status: 403 }
      ),
    };
  }

  return auth;
}