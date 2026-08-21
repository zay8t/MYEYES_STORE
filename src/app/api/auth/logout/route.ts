import { NextResponse } from "next/server";
import { clearSessionCookie } from "@/lib/auth/jwt";

export async function POST() {
  const response = NextResponse.json({ success: true, message: "Signed out successfully." });
  clearSessionCookie(response);
  return response;
}
