import { NextResponse } from "next/server";
import { requireCompletedProfile } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { getTrackModulesWithLock } from "@/lib/learn/lock";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ slug: string }> },
) {
  const auth = await requireCompletedProfile(request);
  if ("error" in auth) return auth.error;
  const { user } = auth;

  const { slug } = await params;

  const { data: track } = await supabaseAdmin
    .from("learn_tracks")
    .select("slug, title, description, status")
    .eq("slug", slug)
    .maybeSingle();

  if (!track) {
    return NextResponse.json({ error: "Track not found" }, { status: 404 });
  }

  const modules = await getTrackModulesWithLock(slug, user.id);

  return NextResponse.json({
    track: {
      slug: track.slug,
      title: track.title,
      description: track.description,
      status: track.status,
    },
    modules: modules ?? [],
  });
}
