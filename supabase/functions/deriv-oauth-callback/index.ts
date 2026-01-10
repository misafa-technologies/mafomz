import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface DerivAuthResponse {
  authorize?: {
    loginid: string;
    email: string;
    fullname: string;
    balance: number;
    currency: string;
    account_list: Array<{
      loginid: string;
      currency: string;
      is_virtual: number;
    }>;
    scopes: string[];
    user_id: number;
  };
  error?: {
    code: string;
    message: string;
  };
  msg_type: string;
}

async function validateDerivToken(token: string, appId: string): Promise<DerivAuthResponse> {
  return new Promise((resolve, reject) => {
    const ws = new WebSocket(`wss://ws.derivws.com/websockets/v3?app_id=${appId}`);
    
    const timeout = setTimeout(() => {
      ws.close();
      reject(new Error('Connection timeout'));
    }, 10000);

    ws.onopen = () => {
      console.log('WebSocket connected, sending authorize request');
      ws.send(JSON.stringify({ authorize: token }));
    };

    ws.onmessage = (event) => {
      clearTimeout(timeout);
      const data = JSON.parse(event.data) as DerivAuthResponse;
      console.log('Received response:', data.msg_type);
      ws.close();
      resolve(data);
    };

    ws.onerror = (error) => {
      clearTimeout(timeout);
      console.error('WebSocket error:', error);
      reject(new Error('WebSocket connection failed'));
    };
  });
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { token, siteId, appId } = await req.json();

    if (!token || !siteId) {
      return new Response(
        JSON.stringify({ error: 'Token and siteId are required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Get platform app_id if not provided
    let derivAppId = appId || '1089';
    if (!appId) {
      const { data: appIdSetting } = await supabase
        .from('platform_settings')
        .select('setting_value')
        .eq('setting_key', 'deriv_app_id')
        .single();
      
      if (appIdSetting?.setting_value) {
        derivAppId = appIdSetting.setting_value;
      }
    }

    console.log('Validating Deriv token for site:', siteId, 'with app_id:', derivAppId);

    // Validate token with Deriv API
    const result = await validateDerivToken(token, derivAppId);

    if (result.error) {
      console.error('Deriv API error:', result.error);
      return new Response(
        JSON.stringify({ 
          error: result.error.message,
          code: result.error.code 
        }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!result.authorize) {
      return new Response(
        JSON.stringify({ error: 'Invalid token response' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const auth = result.authorize;

    // Check if site exists and is live
    const { data: site, error: siteError } = await supabase
      .from('sites')
      .select('id, user_id, name')
      .eq('id', siteId)
      .eq('status', 'live')
      .single();

    if (siteError || !site) {
      return new Response(
        JSON.stringify({ error: 'Site not found or not active' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Upsert site user
    const { data: siteUser, error: upsertError } = await supabase
      .from('site_users')
      .upsert({
        site_id: siteId,
        deriv_loginid: auth.loginid,
        deriv_email: auth.email,
        deriv_fullname: auth.fullname,
        deriv_balance: auth.balance,
        deriv_currency: auth.currency,
        deriv_accounts: auth.account_list.filter(acc => acc.is_virtual === 0),
        last_login_at: new Date().toISOString(),
        is_active: true,
      }, {
        onConflict: 'site_id,deriv_loginid'
      })
      .select()
      .single();

    if (upsertError) {
      console.error('Error upserting site user:', upsertError);
      return new Response(
        JSON.stringify({ error: 'Failed to register user' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({
        success: true,
        user: {
          id: siteUser.id,
          loginid: auth.loginid,
          email: auth.email,
          fullname: auth.fullname,
          balance: auth.balance,
          currency: auth.currency,
          accounts: auth.account_list.filter(acc => acc.is_virtual === 0).map(acc => ({
            loginid: acc.loginid,
            currency: acc.currency
          }))
        },
        site: {
          id: site.id,
          name: site.name
        }
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: unknown) {
    console.error('Error in OAuth callback:', error);
    const errorMessage = error instanceof Error ? error.message : 'Internal server error';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
