import { useState } from "react";
import { AlertTriangle, Shield, Key, CheckCircle2, Loader2, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";

interface DerivAuthModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: (accountInfo: { loginid: string; tokenHash: string }) => void;
}

const requiredScopes = [
  { name: "read", description: "Read account information" },
  { name: "trading_information", description: "Access trading data" },
];

export function DerivAuthModal({ open, onOpenChange, onSuccess }: DerivAuthModalProps) {
  const [token, setToken] = useState("");
  const [isValidating, setIsValidating] = useState(false);
  const [validationResult, setValidationResult] = useState<{
    valid: boolean;
    message?: string;
    loginid?: string;
    tokenHash?: string;
  } | null>(null);
  const [agreed, setAgreed] = useState(false);

  const handleValidate = async () => {
    if (!token || !agreed) return;

    setIsValidating(true);
    setValidationResult(null);

    try {
      const { data, error } = await supabase.functions.invoke("validate-deriv-token", {
        body: { token },
      });

      if (error) throw error;

      if (data.valid) {
        setValidationResult({
          valid: true,
          loginid: data.loginid,
          tokenHash: data.tokenHash,
          message: `Account ${data.loginid} verified successfully!`,
        });

        // Auto-proceed after successful validation
        setTimeout(() => {
          onSuccess({ loginid: data.loginid, tokenHash: data.tokenHash });
          onOpenChange(false);
          resetState();
        }, 1500);
      } else {
        setValidationResult({
          valid: false,
          message: data.error || "Token validation failed",
        });
      }
    } catch (error) {
      console.error("Validation error:", error);
      setValidationResult({
        valid: false,
        message: "Failed to validate token. Please try again.",
      });
    } finally {
      setIsValidating(false);
    }
  };

  const resetState = () => {
    setToken("");
    setValidationResult(null);
    setAgreed(false);
  };

  const handleOpenChange = (isOpen: boolean) => {
    if (!isOpen) {
      resetState();
    }
    onOpenChange(isOpen);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="glass max-w-lg border-border sm:rounded-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl">
            <Shield className="h-5 w-5 text-primary" />
            Link Deriv Account
          </DialogTitle>
          <DialogDescription>
            Connect your Deriv account to enable trading features on your site.
          </DialogDescription>
        </DialogHeader>

        {/* Warning Banner */}
        <div className="rounded-lg border border-warning/30 bg-warning/10 p-4">
          <div className="flex gap-3">
            <AlertTriangle className="h-5 w-5 shrink-0 text-warning" />
            <div>
              <h4 className="font-semibold text-warning">Permanent Account Binding</h4>
              <p className="mt-1 text-sm text-warning/80">
                Once linked, this Deriv account cannot be changed or unlinked. 
                Please ensure you're using the correct account.
              </p>
            </div>
          </div>
        </div>

        {/* Validation Result */}
        {validationResult && (
          <div
            className={cn(
              "rounded-lg p-4",
              validationResult.valid
                ? "border border-success/30 bg-success/10"
                : "border border-destructive/30 bg-destructive/10"
            )}
          >
            <div className="flex gap-3">
              {validationResult.valid ? (
                <CheckCircle2 className="h-5 w-5 shrink-0 text-success" />
              ) : (
                <XCircle className="h-5 w-5 shrink-0 text-destructive" />
              )}
              <div>
                <p
                  className={cn(
                    "font-medium",
                    validationResult.valid ? "text-success" : "text-destructive"
                  )}
                >
                  {validationResult.valid ? "Verification Successful" : "Verification Failed"}
                </p>
                <p
                  className={cn(
                    "mt-1 text-sm",
                    validationResult.valid ? "text-success/80" : "text-destructive/80"
                  )}
                >
                  {validationResult.message}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Token Input */}
        <div className="space-y-4">
          <div>
            <Label htmlFor="deriv-token" className="mb-2 flex items-center gap-2">
              <Key className="h-4 w-4 text-muted-foreground" />
              Deriv API Token
            </Label>
            <Input
              id="deriv-token"
              type="password"
              placeholder="Enter your Deriv API token"
              value={token}
              onChange={(e) => {
                setToken(e.target.value);
                setValidationResult(null);
              }}
              disabled={isValidating || validationResult?.valid}
              className={cn(
                "font-mono",
                validationResult?.valid && "border-success focus-visible:ring-success",
                validationResult?.valid === false && "border-destructive focus-visible:ring-destructive"
              )}
            />
            <p className="mt-2 text-xs text-muted-foreground">
              Generate a token at{" "}
              <a
                href="https://app.deriv.com/account/api-token"
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary hover:underline"
              >
                app.deriv.com/account/api-token
              </a>
            </p>
          </div>

          {/* Required Scopes */}
          <div>
            <Label className="mb-2">Required Scopes</Label>
            <div className="grid gap-2">
              {requiredScopes.map((scope) => (
                <div
                  key={scope.name}
                  className="flex items-center justify-between rounded-lg bg-secondary/50 px-3 py-2"
                >
                  <span className="text-sm font-medium">{scope.name}</span>
                  <span className="text-xs text-muted-foreground">{scope.description}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Agreement Checkbox */}
          <label className="flex cursor-pointer items-start gap-3 rounded-lg border border-border p-4 transition-colors hover:border-primary/50">
            <input
              type="checkbox"
              checked={agreed}
              onChange={(e) => setAgreed(e.target.checked)}
              disabled={isValidating || validationResult?.valid}
              className="mt-0.5 h-4 w-4 rounded border-border text-primary focus:ring-primary"
            />
            <span className="text-sm text-muted-foreground">
              I understand that this action is permanent and I agree to the{" "}
              <a href="#" className="text-primary hover:underline">
                Terms of Service
              </a>{" "}
              and{" "}
              <a href="#" className="text-primary hover:underline">
                Affiliate Agreement
              </a>
              .
            </span>
          </label>
        </div>

        {/* Actions */}
        <div className="flex gap-3">
          <Button
            variant="outline"
            className="flex-1"
            onClick={() => handleOpenChange(false)}
            disabled={isValidating}
          >
            Cancel
          </Button>
          <Button
            variant="gradient"
            className="flex-1"
            disabled={!token || !agreed || isValidating || validationResult?.valid}
            onClick={handleValidate}
          >
            {isValidating ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Validating...
              </>
            ) : validationResult?.valid ? (
              <>
                <CheckCircle2 className="mr-2 h-4 w-4" />
                Linked Successfully
              </>
            ) : (
              "Validate & Link"
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
