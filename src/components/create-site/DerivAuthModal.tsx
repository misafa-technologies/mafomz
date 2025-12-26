import { useState } from "react";
import { AlertTriangle, Shield, Key, CheckCircle2, Loader2 } from "lucide-react";
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

interface DerivAuthModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

const requiredScopes = [
  { name: "read", description: "Read account information" },
  { name: "trading_information", description: "Access trading data" },
];

export function DerivAuthModal({ open, onOpenChange, onSuccess }: DerivAuthModalProps) {
  const [token, setToken] = useState("");
  const [isValidating, setIsValidating] = useState(false);
  const [isValid, setIsValid] = useState<boolean | null>(null);
  const [agreed, setAgreed] = useState(false);

  const handleValidate = async () => {
    if (!token || !agreed) return;

    setIsValidating(true);
    // Simulate API validation
    await new Promise((resolve) => setTimeout(resolve, 2000));
    setIsValid(true);
    setIsValidating(false);

    // Auto-proceed after successful validation
    setTimeout(() => {
      onSuccess();
      onOpenChange(false);
    }, 1000);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
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
              onChange={(e) => setToken(e.target.value)}
              className={cn(
                "font-mono",
                isValid === true && "border-success focus-visible:ring-success",
                isValid === false && "border-destructive focus-visible:ring-destructive"
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
            onClick={() => onOpenChange(false)}
          >
            Cancel
          </Button>
          <Button
            variant="gradient"
            className="flex-1"
            disabled={!token || !agreed || isValidating}
            onClick={handleValidate}
          >
            {isValidating ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Validating...
              </>
            ) : isValid ? (
              <>
                <CheckCircle2 className="mr-2 h-4 w-4" />
                Linked Successfully
              </>
            ) : (
              "Link Deriv Account"
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
