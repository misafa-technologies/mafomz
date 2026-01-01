import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { Loader2, Smartphone, AlertCircle, CheckCircle2 } from "lucide-react";

interface DepositModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

export function DepositModal({ open, onOpenChange, onSuccess }: DepositModalProps) {
  const { user } = useAuth();
  const [phoneNumber, setPhoneNumber] = useState("");
  const [amount, setAmount] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [step, setStep] = useState<"input" | "pending" | "success">("input");

  const formatPhoneNumber = (phone: string) => {
    // Remove spaces and special characters
    let cleaned = phone.replace(/\D/g, "");
    
    // Handle different formats
    if (cleaned.startsWith("0")) {
      cleaned = "254" + cleaned.slice(1);
    } else if (cleaned.startsWith("+")) {
      cleaned = cleaned.slice(1);
    } else if (!cleaned.startsWith("254")) {
      cleaned = "254" + cleaned;
    }
    
    return cleaned;
  };

  const handleDeposit = async () => {
    if (!user || !phoneNumber || !amount) return;
    
    const numAmount = parseFloat(amount);
    if (isNaN(numAmount) || numAmount < 10) {
      toast.error("Minimum deposit is KES 10");
      return;
    }

    if (numAmount > 150000) {
      toast.error("Maximum deposit is KES 150,000");
      return;
    }

    const formattedPhone = formatPhoneNumber(phoneNumber);
    if (formattedPhone.length !== 12) {
      toast.error("Please enter a valid M-Pesa phone number");
      return;
    }

    setIsProcessing(true);

    try {
      // Create pending transaction
      const { data: transaction, error: txError } = await supabase
        .from("transactions")
        .insert({
          user_id: user.id,
          type: "deposit",
          amount: numAmount,
          currency: "KES",
          status: "processing",
          payment_method: "mpesa",
          phone_number: formattedPhone,
        })
        .select()
        .single();

      if (txError) throw txError;

      // Get M-Pesa config
      const { data: configs, error: configError } = await supabase
        .from("payment_configs")
        .select("*")
        .eq("provider", "mpesa")
        .eq("is_active", true)
        .limit(1);

      if (configError) throw configError;

      if (!configs || configs.length === 0) {
        // No M-Pesa config - set to pending for manual processing
        await supabase
          .from("transactions")
          .update({ status: "pending" })
          .eq("id", transaction.id);

        setStep("pending");
        toast.info("Deposit request submitted. Please wait for approval.");
        return;
      }

      // Initiate STK Push
      const { data: stkResult, error: stkError } = await supabase.functions.invoke(
        "mpesa-stk-push",
        {
          body: {
            phone: formattedPhone,
            amount: numAmount,
            accountReference: `DEP-${transaction.id.slice(0, 8).toUpperCase()}`,
            description: "Account Deposit",
            configId: configs[0].id,
          },
        }
      );

      if (stkError) throw stkError;

      if (stkResult?.success) {
        // Update transaction with checkout request ID
        await supabase
          .from("transactions")
          .update({
            checkout_request_id: stkResult.checkoutRequestId,
            merchant_request_id: stkResult.merchantRequestId,
            status: "pending",
          })
          .eq("id", transaction.id);

        setStep("pending");
        toast.success("STK Push sent! Check your phone to complete payment.");
      } else {
        // STK Push failed - set to pending for manual processing
        await supabase
          .from("transactions")
          .update({ 
            status: "pending",
            notes: stkResult?.error || "STK Push failed - pending manual approval"
          })
          .eq("id", transaction.id);

        setStep("pending");
        toast.info("Please complete your M-Pesa payment manually and wait for approval.");
      }
    } catch (error) {
      console.error("Deposit error:", error);
      toast.error("Failed to process deposit. Please try again.");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleClose = () => {
    setStep("input");
    setPhoneNumber("");
    setAmount("");
    onOpenChange(false);
    if (step === "pending" || step === "success") {
      onSuccess?.();
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Smartphone className="h-5 w-5 text-green-500" />
            Deposit via M-Pesa
          </DialogTitle>
          <DialogDescription>
            {step === "input" && "Enter your M-Pesa number and amount to deposit"}
            {step === "pending" && "Your deposit is being processed"}
            {step === "success" && "Deposit successful!"}
          </DialogDescription>
        </DialogHeader>

        {step === "input" && (
          <>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="phone">M-Pesa Phone Number</Label>
                <Input
                  id="phone"
                  type="tel"
                  placeholder="0712345678 or 254712345678"
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                />
                <p className="text-xs text-muted-foreground">
                  Enter the phone number registered with M-Pesa
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="amount">Amount (KES)</Label>
                <Input
                  id="amount"
                  type="number"
                  placeholder="1000"
                  min={10}
                  max={150000}
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                />
                <p className="text-xs text-muted-foreground">
                  Min: KES 10 | Max: KES 150,000
                </p>
              </div>

              <div className="bg-muted/50 rounded-lg p-3 text-sm">
                <p className="font-medium mb-1">How it works:</p>
                <ol className="list-decimal list-inside space-y-1 text-muted-foreground">
                  <li>Enter your M-Pesa number and amount</li>
                  <li>You'll receive an STK push on your phone</li>
                  <li>Enter your M-Pesa PIN to confirm</li>
                  <li>Your account will be credited upon confirmation</li>
                </ol>
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={handleClose}>
                Cancel
              </Button>
              <Button
                onClick={handleDeposit}
                disabled={isProcessing || !phoneNumber || !amount}
                className="bg-green-600 hover:bg-green-700"
              >
                {isProcessing ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Processing...
                  </>
                ) : (
                  <>
                    <Smartphone className="mr-2 h-4 w-4" />
                    Deposit KES {amount || "0"}
                  </>
                )}
              </Button>
            </DialogFooter>
          </>
        )}

        {step === "pending" && (
          <div className="py-8 text-center space-y-4">
            <div className="w-16 h-16 mx-auto bg-amber-500/10 rounded-full flex items-center justify-center">
              <AlertCircle className="h-8 w-8 text-amber-500" />
            </div>
            <div>
              <h3 className="font-semibold text-lg">Payment Pending</h3>
              <p className="text-muted-foreground mt-2">
                Check your phone for the M-Pesa prompt and enter your PIN to complete the payment.
              </p>
              <p className="text-sm text-muted-foreground mt-4">
                Your balance will be updated once the payment is confirmed by our team.
              </p>
            </div>
            <Button onClick={handleClose} className="mt-4">
              Close
            </Button>
          </div>
        )}

        {step === "success" && (
          <div className="py-8 text-center space-y-4">
            <div className="w-16 h-16 mx-auto bg-green-500/10 rounded-full flex items-center justify-center">
              <CheckCircle2 className="h-8 w-8 text-green-500" />
            </div>
            <div>
              <h3 className="font-semibold text-lg">Deposit Successful!</h3>
              <p className="text-muted-foreground mt-2">
                Your account has been credited with KES {amount}
              </p>
            </div>
            <Button onClick={handleClose} className="mt-4">
              Done
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}