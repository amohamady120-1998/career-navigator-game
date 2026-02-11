import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;

    // Verify caller is admin
    const authHeader = req.headers.get("Authorization") ?? "";
    const callerClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: { user: caller } } = await callerClient.auth.getUser();
    if (!caller) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { data: roleCheck } = await callerClient
      .from("user_roles").select("role")
      .eq("user_id", caller.id).eq("role", "admin").maybeSingle();

    if (!roleCheck) {
      return new Response(JSON.stringify({ error: "Forbidden" }), {
        status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const body = await req.json();
    const { action } = body;
    const adminClient = createClient(supabaseUrl, serviceRoleKey);

    // ACTION: search users
    if (action === "search") {
      const { query, page = 1 } = body;
      const perPage = 50;

      // Get users from auth
      const { data: { users }, error } = await adminClient.auth.admin.listUsers({
        page, perPage,
      });
      if (error) throw error;

      // Filter by query if provided
      let filtered = users;
      if (query && query.trim()) {
        const q = query.trim().toLowerCase();
        filtered = users.filter((u: any) =>
          u.email?.toLowerCase().includes(q) || u.id.includes(q)
        );
      }

      const userIds = filtered.map((u: any) => u.id);

      // Get profiles
      const { data: profiles } = await adminClient
        .from("profiles")
        .select("user_id, full_name, user_type, school_name, has_paid, created_at")
        .in("user_id", userIds.length ? userIds : ["__none__"]);

      // Get roles
      const { data: roles } = await adminClient
        .from("user_roles")
        .select("user_id, role")
        .in("user_id", userIds.length ? userIds : ["__none__"]);

      const results = filtered.map((u: any) => {
        const profile = profiles?.find((p: any) => p.user_id === u.id);
        const userRoles = roles?.filter((r: any) => r.user_id === u.id).map((r: any) => r.role) || [];
        return {
          user_id: u.id,
          email: u.email,
          full_name: profile?.full_name ?? null,
          user_type: profile?.user_type ?? null,
          school_name: profile?.school_name ?? null,
          has_paid: profile?.has_paid ?? false,
          roles: userRoles,
          created_at: profile?.created_at ?? u.created_at,
        };
      });

      return new Response(JSON.stringify({ results, total: users.length }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // ACTION: add role
    if (action === "add_role") {
      const { user_id, role } = body;
      if (!user_id || !role) throw new Error("user_id and role required");

      const { error } = await adminClient
        .from("user_roles")
        .upsert({ user_id, role }, { onConflict: "user_id,role" });
      if (error) throw error;

      return new Response(JSON.stringify({ success: true }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // ACTION: remove role
    if (action === "remove_role") {
      const { user_id, role } = body;
      if (!user_id || !role) throw new Error("user_id and role required");

      const { error } = await adminClient
        .from("user_roles")
        .delete()
        .eq("user_id", user_id)
        .eq("role", role);
      if (error) throw error;

      return new Response(JSON.stringify({ success: true }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ error: "Unknown action" }), {
      status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: (err as Error).message }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
