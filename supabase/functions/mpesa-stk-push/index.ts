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
  userId: string;
  transactionId?: string;
}

interface PlatformSetting {
  setting_key: string;
  setting_value: string | null;
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

    const { phone, amount, accountReference, description, userId, transactionId }: STKPushRequest = await req.json();

    console.log("STK Push request:", { phone, amount, accountReference, userId });

    // Fetch global M-Pesa config from platform_settings
    const { data: settings, error: settingsError } = await supabase
      .from("platform_settings")
      .select("setting_key, setting_value")
      .in("setting_key", [
        "mpesa_enabled",
        "mpesa_default_environment",
        "mpesa_shortcode",
        "mpesa_passkey",
        "mpesa_consumer_key",
        "mpesa_consumer_secret",
        "mpesa_callback_url"
      ]);

    if (settingsError) {
      console.error("Settings error:", settingsError);
      return new Response(
        JSON.stringify({ success: false, error: "Failed to fetch payment configuration" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Convert settings array to object
    const config: Record<string, string> = {};
    (settings as PlatformSetting[])?.forEach((s) => {
      if (s.setting_value) {
        config[s.setting_key] = s.setting_value;
      }
    });

    // Check if M-Pesa is enabled
    if (config.mpesa_enabled !== "true") {
      return new Response(
        JSON.stringify({ success: false, error: "M-Pesa payments are not enabled" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Validate required credentials
    if (!config.mpesa_shortcode || !config.mpesa_passkey || !config.mpesa_consumer_key || !config.mpesa_consumer_secret) {
      console.error("Missing M-Pesa credentials");
      return new Response(
        JSON.stringify({ success: false, error: "M-Pesa is not properly configured. Please contact support." }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Get M-Pesa access token
    const baseUrl = config.mpesa_default_environment === "production"
      ? "https://api.safaricom.co.ke"
      : "https://sandbox.safaricom.co.ke";

    const authString = btoa(`${config.mpesa_consumer_key}:${config.mpesa_consumer_secret}`);
    
    console.log("Fetching M-Pesa access token from:", baseUrl);
    
    const tokenResponse = await fetch(`${baseUrl}/oauth/v1/generate?grant_type=client_credentials`, {
      method: "GET",
      headers: {
        "Authorization": `Basic ${authString}`,
      },
    });

    const tokenData = await tokenResponse.json();
    console.log("Token response status:", tokenResponse.status);

    if (!tokenData.access_token) {
      console.error("Token error:", tokenData);
      return new Response(
        JSON.stringify({ success: false, error: "Failed to authenticate with M-Pesa" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Generate timestamp and password
    const timestamp = new Date().toISOString().replace(/[-:T.Z]/g, "").slice(0, 14);
    const password = btoa(`${config.mpesa_shortcode}${config.mpesa_passkey}${timestamp}`);

    // Format phone number (remove leading 0 or +254)
    let formattedPhone = phone.replace(/\s/g, "");
    if (formattedPhone.startsWith("+")) {
      formattedPhone = formattedPhone.slice(1);
    } else if (formattedPhone.startsWith("0")) {
      formattedPhone = "254" + formattedPhone.slice(1);
    }

    // Use custom callback URL or default
    const callbackUrl = config.mpesa_callback_url || `${supabaseUrl}/functions/v1/mpesa-callback`;

    console.log("Initiating STK Push to:", formattedPhone);

    // Initiate STK Push
    const stkResponse = await fetch(`${baseUrl}/mpesa/stkpush/v1/processrequest`, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${tokenData.access_token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        BusinessShortCode: config.mpesa_shortcode,
        Password: password,
        Timestamp: timestamp,
        TransactionType: "CustomerPayBillOnline",
        Amount: Math.round(amount),
        PartyA: formattedPhone,
        PartyB: config.mpesa_shortcode,
        PhoneNumber: formattedPhone,
        CallBackURL: callbackUrl,
        AccountReference: accountReference,
        TransactionDesc: description,
      }),
    });

    const stkData = await stkResponse.json();
    console.log("STK Push response:", stkData);

    if (stkData.ResponseCode === "0") {
      // Update transaction with M-Pesa IDs if transactionId was provided
      if (transactionId) {
        await supabase
          .from("transactions")
          .update({
            checkout_request_id: stkData.CheckoutRequestID,
            merchant_request_id: stkData.MerchantRequestID,
          })
          .eq("id", transactionId);
      }

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
      console.error("STK Push failed:", stkData);
      return new Response(
        JSON.stringify({
          success: false,
          error: stkData.errorMessage || stkData.ResponseDescription || "STK Push failed. Please try again.",
        }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
  } catch (error) {
    console.error("STK Push error:", error);
    return new Response(
      JSON.stringify({ success: false, error: "Internal server error. Please try again." }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
