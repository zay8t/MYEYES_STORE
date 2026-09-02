"use client";

/**
 * Universal client-side signIn method compatible with standard NextAuth syntax
 * Example: signIn("google", { callbackUrl: window.location.pathname })
 */
export async function signIn(
  provider?: string,
  options?: { callbackUrl?: string; redirect?: boolean }
) {
  if (provider === "google") {
    let callback = options?.callbackUrl;
    if (!callback && typeof window !== "undefined") {
      callback = window.location.pathname + window.location.search;
    }
    const target = `/api/auth/google?callbackUrl=${encodeURIComponent(callback || "/")}`;
    if (typeof window !== "undefined") {
      window.location.href = target;
    }
    return { ok: true, url: target };
  }

  // Fallback to regular login page
  if (typeof window !== "undefined") {
    const callback = options?.callbackUrl ? `?redirect=${encodeURIComponent(options.callbackUrl)}` : "";
    window.location.href = `/login${callback}`;
  }
  return { ok: true };
}

export async function signOut(options?: { callbackUrl?: string }) {
  try {
    await fetch("/api/auth/logout", { method: "POST" });
  } catch {}
  if (typeof window !== "undefined") {
    window.location.href = options?.callbackUrl || "/";
  }
}
