import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { loadDashboardData } from "@/lib/data/dashboard";

export async function GET(request: Request) {
  const auth = await requireAuth(request);
  if ("error" in auth) return auth.error;

  const data = await loadDashboardData(auth.user);
  return NextResponse.json(data);
}