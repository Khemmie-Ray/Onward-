import { supabaseAdmin } from "@/lib/supabase/admin";
import type { DbUser } from "@/lib/supabase/types";


export async function getAuthedUser(request: Request): Promise<DbUser | null> {
  const walletAddress = request.headers.get("x-wallet-address");
  if (!walletAddress) return null;

  const normalized = walletAddress.toLowerCase();

  const { data: existing } = await supabaseAdmin
    .from("users")
    .select("*")
    .eq("wallet_address", normalized)
    .maybeSingle();

  if (existing) {
    await supabaseAdmin
      .from("users")
      .update({ last_active_at: new Date().toISOString() })
      .eq("id", existing.id);
    return existing;
  }

  const { data: created, error } = await supabaseAdmin
    .from("users")
    .insert({
      wallet_address: normalized,
    })
    .select("*")
    .single();

  if (error || !created) {
    console.error("[getAuthedUser] failed to create user:", error);
    return null;
  }

  return created;
}

export async function requireAuth(
  request: Request
): Promise<{ user: DbUser } | { error: Response }> {
  const user = await getAuthedUser(request);
  if (!user) {
    return {
      error: new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { "Content-Type": "application/json" },
      }),
    };
  }
  return { user };
}