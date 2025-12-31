import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const callback = await req.json();
    console.log("M-Pesa Callback received:", JSON.stringify(callback, null, 2));

    const { Body } = callback;
    
    if (Body?.stkCallback) {
      const { ResultCode, ResultDesc, CheckoutRequestID, CallbackMetadata } = Body.stkCallback;
      
      if (ResultCode === 0) {
        // Payment successful
        const metadata = CallbackMetadata?.Item?.reduce((acc: Record<string, unknown>, item: { Name: string; Value: unknown }) => {
          acc[item.Name] = item.Value;
          return acc;
        }, {}) || {};

        console.log("Payment successful:", {
          checkoutRequestId: CheckoutRequestID,
          amount: metadata.Amount,
          mpesaReceiptNumber: metadata.MpesaReceiptNumber,
          phoneNumber: metadata.PhoneNumber,
        });

        // Store successful transaction in commissions or a dedicated transactions table
        // This can be customized based on your needs
      } else {
        console.log("Payment failed:", { ResultCode, ResultDesc, CheckoutRequestID });
      }
    }

    return new Response(
      JSON.stringify({ success: true }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Callback error:", error);
    return new Response(
      JSON.stringify({ success: false, error: "Internal server error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
