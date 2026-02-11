import { supabase } from "@/integrations/supabase/client";

const LIMITS: Record<string, { max: number; windowMinutes: number }> = {
  consultation_submit: { max: 3, windowMinutes: 10 },
  share_generate: { max: 5, windowMinutes: 10 },
};

/**
 * Check and increment rate limit. Returns { allowed, remaining }.
 */
export async function checkRateLimit(
  key: string
): Promise<{ allowed: boolean; remaining: number }> {
  const limit = LIMITS[key];
  if (!limit) return { allowed: true, remaining: 999 };

  const { data: { session } } = await supabase.auth.getSession();
  if (!session) return { allowed: true, remaining: 999 };

  const userId = session.user.id;
  const now = new Date();
  const windowMs = limit.windowMinutes * 60 * 1000;
  const windowStart = new Date(Math.floor(now.getTime() / windowMs) * windowMs);

  // Try to get existing entry
  const { data: existing } = await supabase
    .from("rate_limit_entries")
    .select("id, count")
    .eq("user_id", userId)
    .eq("key", key)
    .eq("window_start", windowStart.toISOString())
    .maybeSingle();

  if (existing) {
    if ((existing as any).count >= limit.max) {
      return { allowed: false, remaining: 0 };
    }
    // Increment
    await supabase
      .from("rate_limit_entries")
      .update({ count: (existing as any).count + 1 } as any)
      .eq("id", (existing as any).id);
    return { allowed: true, remaining: limit.max - (existing as any).count - 1 };
  }

  // Insert new entry
  await supabase.from("rate_limit_entries").insert({
    user_id: userId,
    key,
    window_start: windowStart.toISOString(),
    count: 1,
  } as any);

  return { allowed: true, remaining: limit.max - 1 };
}
