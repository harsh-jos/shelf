import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { getStorageUsage } from "@/lib/data";

export async function GET() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  const usage = await getStorageUsage(user.id);
  return NextResponse.json(usage);
}
