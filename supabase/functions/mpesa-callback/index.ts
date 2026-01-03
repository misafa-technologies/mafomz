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

        const mpesaReceiptNumber = metadata.MpesaReceiptNumber as string;
        const amount = metadata.Amount as number;
        const phoneNumber = String(metadata.PhoneNumber);

        console.log("Payment successful:", {
          checkoutRequestId: CheckoutRequestID,
          amount,
          mpesaReceiptNumber,
          phoneNumber,
        });

        // Find the pending transaction
        const { data: transaction, error: txFindError } = await supabase
          .from("transactions")
          .select("*")
          .eq("checkout_request_id", CheckoutRequestID)
          .single();

        if (txFindError || !transaction) {
          console.error("Transaction not found:", txFindError);
          // Try to find by phone number as fallback
          const { data: txByPhone } = await supabase
            .from("transactions")
            .select("*")
            .eq("phone_number", phoneNumber)
            .eq("status", "pending")
            .order("created_at", { ascending: false })
            .limit(1)
            .single();

          if (!txByPhone) {
            console.error("No matching transaction found for callback");
            return new Response(
              JSON.stringify({ success: true, message: "No matching transaction" }),
              { headers: { ...corsHeaders, "Content-Type": "application/json" } }
            );
          }
        }

        const tx = transaction;

        // Update transaction to completed
        const { error: updateError } = await supabase
          .from("transactions")
          .update({
            status: "completed",
            mpesa_receipt: mpesaReceiptNumber,
            approved_at: new Date().toISOString(),
            notes: `Auto-approved via M-Pesa callback. Receipt: ${mpesaReceiptNumber}`,
          })
          .eq("id", tx.id);

        if (updateError) {
          console.error("Error updating transaction:", updateError);
        } else {
          console.log("Transaction updated to completed:", tx.id);

          // Update user balance
          const { data: balanceData } = await supabase
            .from("user_balances")
            .select("*")
            .eq("user_id", tx.user_id)
            .single();

          if (balanceData) {
            await supabase
              .from("user_balances")
              .update({
                balance: balanceData.balance + tx.amount,
                total_deposits: (balanceData.total_deposits || 0) + tx.amount,
              })
              .eq("user_id", tx.user_id);
            console.log("Balance updated for user:", tx.user_id);
          } else {
            await supabase
              .from("user_balances")
              .insert({
                user_id: tx.user_id,
                balance: tx.amount,
                total_deposits: tx.amount,
                currency: "KES",
              });
            console.log("New balance record created for user:", tx.user_id);
          }
        }
      } else {
        console.log("Payment failed:", { ResultCode, ResultDesc, CheckoutRequestID });
        
        // Update transaction to failed
        await supabase
          .from("transactions")
          .update({
            status: "failed",
            notes: `Payment failed: ${ResultDesc}`,
          })
          .eq("checkout_request_id", CheckoutRequestID);
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
