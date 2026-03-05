import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Slider } from "@/components/ui/slider";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import {
  Loader2,
  Save,
  Key,
  CheckCircle2,
  AlertTriangle,
  ExternalLink,
  Info,
  DollarSign,
  Copy,
  Globe,
} from "lucide-react";

interface CreatorDerivConfigProps {
  siteId: string;
  subdomain: string;
  customDomain: string | null;
}

export function CreatorDerivConfig({ siteId, subdomain, customDomain }: CreatorDerivConfigProps) {
  const [appId, setAppId] = useState("");
  const [commissionPct, setCommissionPct] = useState(20);
  const [platformPct, setPlatformPct] = useState(30);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isValidating, setIsValidating] = useState(false);
  const [validationStatus, setValidationStatus] = useState<"idle" | "valid" | "invalid">("idle");

  useEffect(() => {
    fetchConfig();
  }, [siteId]);

  const fetchConfig = async () => {
    try {
      // Fetch site's deriv config
      const { data: site, error: siteErr } = await supabase
        .from("sites")
        .select("deriv_app_id, creator_commission_percentage")
        .eq("id", siteId)
        .single();

      if (siteErr) throw siteErr;

      setAppId(site?.deriv_app_id || "");
      setCommissionPct(Number(site?.creator_commission_percentage) || 20);

      // Fetch platform commission to show context
      const { data: platformData } = await supabase
        .from("platform_settings")
        .select("setting_value")
        .eq("setting_key", "platform_commission_percentage")
        .single();

      setPlatformPct(parseFloat(platformData?.setting_value || "30"));
    } catch (err) {
      console.error("Error fetching config:", err);
    } finally {
      setIsLoading(false);
    }
  };

  const validateAppId = async () => {
    if (!appId) {
      toast.error("Please enter an App ID first");
      return;
    }
    setIsValidating(true);
    setValidationStatus("idle");

    try {
      const ws = new WebSocket(`wss://ws.derivws.com/websockets/v3?app_id=${appId}`);
      ws.onopen = () => ws.send(JSON.stringify({ ping: 1 }));
      ws.onmessage = (event) => {
        const data = JSON.parse(event.data);
        if (data.pong || data.ping === "pong") {
          setValidationStatus("valid");
          toast.success("App ID is valid!");
        } else if (data.error) {
          setValidationStatus("invalid");
          toast.error(`Invalid: ${data.error.message}`);
        }
        ws.close();
        setIsValidating(false);
      };
      ws.onerror = () => {
        setValidationStatus("invalid");
        toast.error("Could not validate App ID");
        setIsValidating(false);
      };
      setTimeout(() => {
        if (ws.readyState <= 1) {
          ws.close();
          setValidationStatus("invalid");
          toast.error("Validation timed out");
          setIsValidating(false);
        }
      }, 10000);
    } catch {
      setValidationStatus("invalid");
      toast.error("Failed to validate");
      setIsValidating(false);
    }
  };

  const handleSave = async () => {
    if (commissionPct < 0 || commissionPct > (100 - platformPct)) {
      toast.error(`Your commission must be between 0% and ${100 - platformPct}%`);
      return;
    }

    setIsSaving(true);
    try {
      const { error } = await supabase
        .from("sites")
        .update({
          deriv_app_id: appId || null,
          creator_commission_percentage: commissionPct,
        })
        .eq("id", siteId);

      if (error) throw error;
      toast.success("Deriv configuration saved!");
    } catch (err: any) {
      console.error("Error saving:", err);
      toast.error(err.message || "Failed to save");
    } finally {
      setIsSaving(false);
    }
  };

  const siteUrl = customDomain
    ? `https://${customDomain}`
    : `${window.location.origin}/s/${subdomain}`;

  const traderPct = Math.max(0, 100 - platformPct - commissionPct);

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success("Copied to clipboard!");
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-32">
        <Loader2 className="w-6 h-6 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Deriv App ID */}
      <Card className="glass border-border">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Key className="w-5 h-5 text-primary" />
            Your Deriv App ID
          </CardTitle>
          <CardDescription>
            Register your own Deriv application to receive affiliate commissions from your site's traders.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Alert>
            <Info className="w-4 h-4" />
            <AlertTitle>How to get your App ID</AlertTitle>
            <AlertDescription className="text-sm space-y-2">
              <ol className="list-decimal list-inside space-y-1 mt-1">
                <li>
                  Go to{" "}
                  <a
                    href="https://app.deriv.com/account/api-token"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary hover:underline inline-flex items-center gap-1"
                  >
                    Deriv API Management <ExternalLink className="w-3 h-3" />
                  </a>
                </li>
                <li>Click "Register Application"</li>
                <li>Set the <strong>OAuth Redirect URL</strong> to your site URL (shown below)</li>
                <li>Enable <strong>Read</strong> and <strong>Trade</strong> scopes</li>
                <li>Copy the App ID and paste it below</li>
              </ol>
            </AlertDescription>
          </Alert>

          {/* OAuth Redirect URL */}
          <div className="space-y-2">
            <Label className="flex items-center gap-2">
              <Globe className="w-4 h-4" />
              Your OAuth Redirect URL
            </Label>
            <div className="flex gap-2">
              <code className="flex-1 p-3 bg-muted rounded-md text-sm font-mono break-all">
                {siteUrl}
              </code>
              <Button variant="outline" size="icon" onClick={() => copyToClipboard(siteUrl)}>
                <Copy className="w-4 h-4" />
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">
              Use this exact URL when registering your Deriv application. Traders will be redirected here after authenticating.
            </p>
          </div>

          {/* App ID Input */}
          <div className="space-y-2">
            <Label>Deriv App ID</Label>
            <div className="flex gap-2">
              <Input
                value={appId}
                onChange={(e) => {
                  setAppId(e.target.value);
                  setValidationStatus("idle");
                }}
                placeholder="e.g., 12345"
                className="font-mono"
              />
              <Button
                variant="outline"
                onClick={validateAppId}
                disabled={isValidating || !appId}
              >
                {isValidating ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : validationStatus === "valid" ? (
                  <CheckCircle2 className="w-4 h-4 text-green-500" />
                ) : (
                  "Validate"
                )}
              </Button>
            </div>
            {!appId && (
              <p className="text-xs text-amber-500">
                ⚠️ Without your own App ID, the platform's default App ID will be used and commissions go to the platform owner.
              </p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Commission Configuration */}
      <Card className="glass border-border">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <DollarSign className="w-5 h-5 text-primary" />
            Commission Split
          </CardTitle>
          <CardDescription>
            Set how commissions from your site's trading volume are distributed.
            The platform takes {platformPct}% — you configure the rest.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Visual Split */}
          <div className="h-10 rounded-lg overflow-hidden flex">
            <div
              className="flex items-center justify-center text-xs font-medium text-white"
              style={{ width: `${platformPct}%`, backgroundColor: "hsl(var(--primary))" }}
            >
              Platform {platformPct}%
            </div>
            <div
              className="flex items-center justify-center text-xs font-medium text-white"
              style={{ width: `${commissionPct}%`, backgroundColor: "#22c55e" }}
            >
              You {commissionPct}%
            </div>
            <div
              className="flex items-center justify-center text-xs font-medium text-white"
              style={{ width: `${traderPct}%`, backgroundColor: "#f59e0b" }}
            >
              Traders {traderPct}%
            </div>
          </div>

          {/* Your Commission */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label>Your Commission (Creator)</Label>
              <Badge variant="outline" className="bg-green-500/10 text-green-500 border-green-500/30">
                {commissionPct}%
              </Badge>
            </div>
            <Slider
              value={[commissionPct]}
              onValueChange={(v) => setCommissionPct(v[0])}
              max={100 - platformPct}
              min={0}
              step={1}
              className="[&_[role=slider]]:bg-green-500"
            />
          </div>

          {/* Trader Cashback (calculated) */}
          <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
            <span className="text-sm text-muted-foreground">Trader Cashback (auto-calculated)</span>
            <Badge variant="outline" className="bg-amber-500/10 text-amber-500 border-amber-500/30">
              {traderPct}%
            </Badge>
          </div>

          {/* Example */}
          <div className="p-4 rounded-lg bg-secondary/30 space-y-2">
            <h4 className="font-medium text-sm">Example: $100 affiliate commission earned</h4>
            <div className="grid gap-1 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Platform:</span>
                <span className="font-medium">${platformPct.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">You (Creator):</span>
                <span className="font-medium text-green-500">${commissionPct.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Trader Cashback:</span>
                <span className="font-medium text-amber-500">${traderPct.toFixed(2)}</span>
              </div>
            </div>
          </div>

          <Button onClick={handleSave} disabled={isSaving} variant="gradient" className="w-full gap-2">
            {isSaving ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save className="w-4 h-4" />
                Save Deriv Settings
              </>
            )}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
