import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const anonKey = Deno.env.get('SUPABASE_ANON_KEY')!;

    // Verify caller is authenticated admin
    const authHeader = req.headers.get('Authorization') ?? '';
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const userClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: { user }, error: authError } = await userClient.auth.getUser();
    if (authError || !user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const { data: roleData } = await userClient
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id)
      .eq('role', 'admin')
      .maybeSingle();

    if (!roleData) {
      return new Response(JSON.stringify({ error: 'Forbidden' }), {
        status: 403,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const supabase = createClient(supabaseUrl, serviceRoleKey);

    const { action, data } = await req.json();

    if (action === 'seed_holland_codes') {
      // Delete existing and insert new
      await supabase.from('holland_codes').delete().neq('code', '');
      
      const { error } = await supabase.from('holland_codes').insert(data);
      if (error) throw error;
      
      return new Response(JSON.stringify({ success: true, count: data.length }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (action === 'seed_questions') {
      // Delete existing and insert new
      await supabase.from('questions').delete().neq('id', '00000000-0000-0000-0000-000000000000');
      
      const { error } = await supabase.from('questions').insert(data);
      if (error) throw error;
      
      return new Response(JSON.stringify({ success: true, count: data.length }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (action === 'seed_scenarios') {
      await supabase.from('simulation_scenarios').delete().neq('id', '00000000-0000-0000-0000-000000000000');
      
      const { error } = await supabase.from('simulation_scenarios').insert(data);
      if (error) throw error;
      
      return new Response(JSON.stringify({ success: true, count: data.length }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (action === 'create_test_account') {
      const { email, password, fullName } = data;
      
      // Create auth user
      const { data: userData, error: userError } = await supabase.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
      });
      if (userError) throw userError;
      const userId = userData.user.id;

      // Create profile
      await supabase.from('profiles').insert({
        user_id: userId,
        full_name: fullName || 'حساب اختبار',
        user_type: 'student',
      });

      // Grant admin role
      await supabase.from('user_roles').insert({
        user_id: userId,
        role: 'admin',
      });

      return new Response(JSON.stringify({ success: true, userId }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify({ error: 'Unknown action' }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
