import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface STKPushRequest {
  phone: string;
  amount: number;
  accountReference: string;
  description: string;
  configId: string;
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { phone, amount, accountReference, description, configId }: STKPushRequest = await req.json();

    console.log("STK Push request:", { phone, amount, accountReference, configId });

    // Fetch M-Pesa config
    const { data: config, error: configError } = await supabase
      .from("payment_configs")
      .select("*")
      .eq("id", configId)
      .single();

    if (configError || !config) {
      console.error("Config error:", configError);
      return new Response(
        JSON.stringify({ success: false, error: "Payment configuration not found" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (!config.is_active) {
      return new Response(
        JSON.stringify({ success: false, error: "Payment configuration is not active" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Get M-Pesa access token
    const baseUrl = config.environment === "production"
      ? "https://api.safaricom.co.ke"
      : "https://sandbox.safaricom.co.ke";

    const authString = btoa(`${config.consumer_key}:${config.consumer_secret}`);
    
    const tokenResponse = await fetch(`${baseUrl}/oauth/v1/generate?grant_type=client_credentials`, {
      method: "GET",
      headers: {
        "Authorization": `Basic ${authString}`,
      },
    });

    const tokenData = await tokenResponse.json();
    console.log("Token response:", tokenData);

    if (!tokenData.access_token) {
      return new Response(
        JSON.stringify({ success: false, error: "Failed to get M-Pesa access token" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Generate timestamp and password
    const timestamp = new Date().toISOString().replace(/[-:T.Z]/g, "").slice(0, 14);
    const password = btoa(`${config.shortcode}${config.passkey}${timestamp}`);

    // Format phone number (remove leading 0 or +254)
    let formattedPhone = phone.replace(/\s/g, "");
    if (formattedPhone.startsWith("+")) {
      formattedPhone = formattedPhone.slice(1);
    } else if (formattedPhone.startsWith("0")) {
      formattedPhone = "254" + formattedPhone.slice(1);
    }

    // Initiate STK Push
    const stkResponse = await fetch(`${baseUrl}/mpesa/stkpush/v1/processrequest`, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${tokenData.access_token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        BusinessShortCode: config.shortcode,
        Password: password,
        Timestamp: timestamp,
        TransactionType: "CustomerPayBillOnline",
        Amount: Math.round(amount),
        PartyA: formattedPhone,
        PartyB: config.shortcode,
        PhoneNumber: formattedPhone,
        CallBackURL: config.callback_url || `${supabaseUrl}/functions/v1/mpesa-callback`,
        AccountReference: accountReference,
        TransactionDesc: description,
      }),
    });

    const stkData = await stkResponse.json();
    console.log("STK Push response:", stkData);

    if (stkData.ResponseCode === "0") {
      return new Response(
        JSON.stringify({
          success: true,
          checkoutRequestId: stkData.CheckoutRequestID,
          merchantRequestId: stkData.MerchantRequestID,
          message: "STK Push sent successfully. Please check your phone.",
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    } else {
      return new Response(
        JSON.stringify({
          success: false,
          error: stkData.errorMessage || stkData.ResponseDescription || "STK Push failed",
        }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
  } catch (error) {
    console.error("STK Push error:", error);
    return new Response(
      JSON.stringify({ success: false, error: "Internal server error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
