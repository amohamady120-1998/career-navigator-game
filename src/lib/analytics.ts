import { supabase } from "@/integrations/supabase/client";

/**
 * Track an analytics event. Fire-and-forget — never blocks UI.
 */
export async function trackEvent(
  eventName: string,
  props: Record<string, unknown> = {}
) {
  try {
    const { data: { session } } = await supabase.auth.getSession();
    const userId = session?.user?.id ?? null;
    if (!userId) return; // only track authenticated users

    await supabase.from("analytics_events").insert({
      user_id: userId,
      event_name: eventName,
      event_props: props,
    } as any);
  } catch {
    // silent — analytics should never break UX
  }
}

/**
 * Log an application error to the database. Fire-and-forget.
 */
export async function logError(
  errorMessage: string,
  opts: { stack?: string; route?: string; meta?: Record<string, unknown> } = {}
) {
  try {
    const { data: { session } } = await supabase.auth.getSession();
    const userId = session?.user?.id ?? null;

    await supabase.from("app_error_logs").insert({
      user_id: userId,
      route: opts.route ?? window.location.pathname,
      error_message: errorMessage,
      stack: opts.stack ?? null,
      meta: opts.meta ?? {},
    } as any);
  } catch {
    // silent
  }
}
