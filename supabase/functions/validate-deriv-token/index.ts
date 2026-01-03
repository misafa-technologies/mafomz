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

async function validateDerivToken(token: string): Promise<DerivAuthResponse> {
  return new Promise((resolve, reject) => {
    const ws = new WebSocket('wss://ws.derivws.com/websockets/v3?app_id=1089');
    
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

function hashToken(token: string): string {
  // Simple hash for token storage (in production use proper crypto)
  let hash = 0;
  for (let i = 0; i < token.length; i++) {
    const char = token.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return hash.toString(16);
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { token, siteId, userId } = await req.json();

    if (!token) {
      return new Response(
        JSON.stringify({ error: 'Token is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Validating Deriv token for site:', siteId);

    // Validate token with Deriv API
    const result = await validateDerivToken(token);

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

    // Check required scopes
    const requiredScopes = ['read', 'trading_information'];
    const hasRequiredScopes = requiredScopes.every(scope => auth.scopes.includes(scope));

    if (!hasRequiredScopes) {
      return new Response(
        JSON.stringify({ 
          error: 'Missing required scopes. Please ensure your token has "read" and "trading_information" scopes.',
          requiredScopes,
          providedScopes: auth.scopes
        }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // If siteId is provided, update the site with Deriv account info
    if (siteId && userId) {
      const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
      const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
      const supabase = createClient(supabaseUrl, supabaseKey);

      const { error: updateError } = await supabase
        .from('sites')
        .update({
          deriv_account_id: auth.loginid,
          deriv_token_hash: hashToken(token),
        })
        .eq('id', siteId)
        .eq('user_id', userId);

      if (updateError) {
        console.error('Error updating site:', updateError);
        return new Response(
          JSON.stringify({ error: 'Failed to save Deriv account to site' }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
    }

    return new Response(
      JSON.stringify({
        valid: true,
        success: true,
        loginid: auth.loginid,
        tokenHash: hashToken(token),
        account: {
          loginid: auth.loginid,
          email: auth.email,
          fullname: auth.fullname,
          balance: auth.balance,
          currency: auth.currency,
          scopes: auth.scopes,
          accounts: auth.account_list.filter(acc => acc.is_virtual === 0).map(acc => ({
            loginid: acc.loginid,
            currency: acc.currency
          }))
        }
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: unknown) {
    console.error('Error validating token:', error);
    const errorMessage = error instanceof Error ? error.message : 'Internal server error';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
