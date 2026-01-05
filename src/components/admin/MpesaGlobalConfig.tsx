import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { Loader2, Save, CreditCard, AlertTriangle, CheckCircle2, Eye, EyeOff } from "lucide-react";

interface MpesaConfig {
  mpesa_enabled: boolean;
  mpesa_default_environment: string;
  mpesa_shortcode: string;
  mpesa_passkey: string;
  mpesa_consumer_key: string;
  mpesa_consumer_secret: string;
  mpesa_callback_url: string;
}

export function MpesaGlobalConfig() {
  const [config, setConfig] = useState<MpesaConfig>({
    mpesa_enabled: false,
    mpesa_default_environment: "sandbox",
    mpesa_shortcode: "",
    mpesa_passkey: "",
    mpesa_consumer_key: "",
    mpesa_consumer_secret: "",
    mpesa_callback_url: "",
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [showSecrets, setShowSecrets] = useState(false);

  useEffect(() => {
    fetchConfig();
  }, []);

  const fetchConfig = async () => {
    try {
      const { data, error } = await supabase
        .from("platform_settings")
        .select("setting_key, setting_value");

      if (error) throw error;

      const configMap: Partial<MpesaConfig> = {};
      data?.forEach((item) => {
        const key = item.setting_key as keyof MpesaConfig;
        if (key in config) {
          if (key === "mpesa_enabled") {
            configMap[key] = item.setting_value === "true";
          } else {
            configMap[key] = item.setting_value || "";
          }
        }
      });

      setConfig((prev) => ({ ...prev, ...configMap }));
    } catch (error) {
      console.error("Error fetching config:", error);
      toast.error("Failed to load M-Pesa configuration");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const updates = Object.entries(config).map(([key, value]) => ({
        setting_key: key,
        setting_value: typeof value === "boolean" ? value.toString() : value,
      }));

      for (const update of updates) {
        const { error } = await supabase
          .from("platform_settings")
          .upsert(
            { setting_key: update.setting_key, setting_value: update.setting_value },
            { onConflict: "setting_key" }
          );

        if (error) throw error;
      }

      toast.success("M-Pesa configuration saved successfully");
    } catch (error) {
      console.error("Error saving config:", error);
      toast.error("Failed to save configuration");
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-32">
        <Loader2 className="w-6 h-6 animate-spin text-primary" />
      </div>
    );
  }

  const isConfigured = config.mpesa_shortcode && config.mpesa_passkey && config.mpesa_consumer_key;

  return (
    <Card className="glass border-border">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <CreditCard className="w-5 h-5 text-primary" />
          M-Pesa Global Configuration
        </CardTitle>
        <CardDescription>
          Configure M-Pesa STK Push for platform-wide deposits. All user sites will use these credentials.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Status Banner */}
        <div
          className={`rounded-lg border p-4 ${
            isConfigured && config.mpesa_enabled
              ? "border-success/30 bg-success/10"
              : "border-warning/30 bg-warning/10"
          }`}
        >
          <div className="flex items-center gap-3">
            {isConfigured && config.mpesa_enabled ? (
              <CheckCircle2 className="w-5 h-5 text-success" />
            ) : (
              <AlertTriangle className="w-5 h-5 text-warning" />
            )}
            <div>
              <p className={`font-medium ${isConfigured && config.mpesa_enabled ? "text-success" : "text-warning"}`}>
                {isConfigured && config.mpesa_enabled ? "M-Pesa is Active" : "M-Pesa Not Configured"}
              </p>
              <p className={`text-sm ${isConfigured && config.mpesa_enabled ? "text-success/80" : "text-warning/80"}`}>
                {isConfigured && config.mpesa_enabled
                  ? "Users can make deposits via M-Pesa STK Push"
                  : "Complete the configuration below to enable M-Pesa deposits"}
              </p>
            </div>
          </div>
        </div>

        {/* Enable Toggle */}
        <div className="flex items-center justify-between rounded-lg border border-border p-4">
          <div>
            <Label className="text-base">Enable M-Pesa Deposits</Label>
            <p className="text-sm text-muted-foreground">
              Allow users to deposit funds via M-Pesa
            </p>
          </div>
          <Switch
            checked={config.mpesa_enabled}
            onCheckedChange={(checked) => setConfig({ ...config, mpesa_enabled: checked })}
          />
        </div>

        {/* Environment */}
        <div className="space-y-2">
          <Label>Environment</Label>
          <Select
            value={config.mpesa_default_environment}
            onValueChange={(value) => setConfig({ ...config, mpesa_default_environment: value })}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="sandbox">Sandbox (Testing)</SelectItem>
              <SelectItem value="production">Production (Live)</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Credentials */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <Label className="text-base">API Credentials</Label>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowSecrets(!showSecrets)}
              className="gap-2"
            >
              {showSecrets ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              {showSecrets ? "Hide" : "Show"}
            </Button>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="shortcode">Shortcode (Paybill/Till)</Label>
              <Input
                id="shortcode"
                value={config.mpesa_shortcode}
                onChange={(e) => setConfig({ ...config, mpesa_shortcode: e.target.value })}
                placeholder="e.g., 174379"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="passkey">Passkey</Label>
              <Input
                id="passkey"
                type={showSecrets ? "text" : "password"}
                value={config.mpesa_passkey}
                onChange={(e) => setConfig({ ...config, mpesa_passkey: e.target.value })}
                placeholder="Your Lipa Na M-Pesa passkey"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="consumer_key">Consumer Key</Label>
              <Input
                id="consumer_key"
                type={showSecrets ? "text" : "password"}
                value={config.mpesa_consumer_key}
                onChange={(e) => setConfig({ ...config, mpesa_consumer_key: e.target.value })}
                placeholder="Daraja API consumer key"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="consumer_secret">Consumer Secret</Label>
              <Input
                id="consumer_secret"
                type={showSecrets ? "text" : "password"}
                value={config.mpesa_consumer_secret}
                onChange={(e) => setConfig({ ...config, mpesa_consumer_secret: e.target.value })}
                placeholder="Daraja API consumer secret"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="callback_url">Callback URL</Label>
            <Input
              id="callback_url"
              value={config.mpesa_callback_url}
              onChange={(e) => setConfig({ ...config, mpesa_callback_url: e.target.value })}
              placeholder="https://your-domain.com/api/mpesa/callback"
            />
            <p className="text-xs text-muted-foreground">
              This is automatically set when using our platform. Leave empty for default.
            </p>
          </div>
        </div>

        {/* Info Box */}
        <div className="rounded-lg bg-secondary/30 p-4">
          <h4 className="font-semibold mb-2">How M-Pesa Integration Works</h4>
          <ol className="list-decimal list-inside space-y-2 text-sm text-muted-foreground">
            <li>User initiates deposit from their dashboard</li>
            <li>STK Push is sent to their phone number</li>
            <li>User enters M-Pesa PIN on their phone</li>
            <li>Upon successful payment, balance is automatically credited</li>
            <li>Transaction appears in Moderator Panel for records</li>
          </ol>
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
              Save M-Pesa Configuration
            </>
          )}
        </Button>
      </CardContent>
    </Card>
  );
}