import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { 
  Loader2, 
  Save, 
  Key, 
  AlertTriangle, 
  CheckCircle2, 
  Eye, 
  EyeOff,
  TrendingUp,
  DollarSign,
  Percent,
  Info,
  ExternalLink
} from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

interface DerivConfig {
  deriv_app_id: string;
  deriv_api_token: string;
  auto_commission_enabled: boolean;
  platform_commission_percentage: number;
  site_creator_commission_percentage: number;
  trader_commission_percentage: number;
}

export function DerivApiConfig() {
  const [config, setConfig] = useState<DerivConfig>({
    deriv_app_id: "",
    deriv_api_token: "",
    auto_commission_enabled: true,
    platform_commission_percentage: 30,
    site_creator_commission_percentage: 50,
    trader_commission_percentage: 20,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [showToken, setShowToken] = useState(false);
  const [isValidating, setIsValidating] = useState(false);
  const [validationStatus, setValidationStatus] = useState<'idle' | 'valid' | 'invalid'>('idle');

  useEffect(() => {
    fetchConfig();
  }, []);

  const fetchConfig = async () => {
    try {
      const { data, error } = await supabase
        .from("platform_settings")
        .select("setting_key, setting_value");

      if (error) throw error;

      const configMap: Partial<DerivConfig> = {};
      data?.forEach((item) => {
        const key = item.setting_key as keyof DerivConfig;
        if (key === 'auto_commission_enabled') {
          configMap[key] = item.setting_value === 'true';
        } else if (key.includes('percentage')) {
          configMap[key] = parseFloat(item.setting_value || '0') as never;
        } else {
          configMap[key] = (item.setting_value || '') as never;
        }
      });

      setConfig((prev) => ({ ...prev, ...configMap }));
    } catch (error) {
      console.error("Error fetching config:", error);
      toast.error("Failed to load Deriv configuration");
    } finally {
      setIsLoading(false);
    }
  };

  const validateAppId = async () => {
    if (!config.deriv_app_id) {
      toast.error("Please enter an App ID first");
      return;
    }

    setIsValidating(true);
    setValidationStatus('idle');

    try {
      const ws = new WebSocket(`wss://ws.derivws.com/websockets/v3?app_id=${config.deriv_app_id}`);
      
      ws.onopen = () => {
        ws.send(JSON.stringify({ ping: 1 }));
      };

      ws.onmessage = (event) => {
        const data = JSON.parse(event.data);
        if (data.ping === 'pong' || data.pong) {
          setValidationStatus('valid');
          toast.success("App ID is valid!");
        } else if (data.error) {
          setValidationStatus('invalid');
          toast.error(`Invalid App ID: ${data.error.message}`);
        }
        ws.close();
        setIsValidating(false);
      };

      ws.onerror = () => {
        setValidationStatus('invalid');
        toast.error("Could not validate App ID");
        setIsValidating(false);
      };

      // Timeout after 10 seconds
      setTimeout(() => {
        if (ws.readyState === WebSocket.OPEN || ws.readyState === WebSocket.CONNECTING) {
          ws.close();
          setValidationStatus('invalid');
          toast.error("Validation timed out");
          setIsValidating(false);
        }
      }, 10000);
    } catch (error) {
      setValidationStatus('invalid');
      toast.error("Failed to validate App ID");
      setIsValidating(false);
    }
  };

  const handleSave = async () => {
    // Validate commission split
    const totalCommission = 
      config.platform_commission_percentage + 
      config.site_creator_commission_percentage + 
      config.trader_commission_percentage;

    if (totalCommission !== 100) {
      toast.error(`Commission split must equal 100% (currently ${totalCommission}%)`);
      return;
    }

    setIsSaving(true);
    try {
      const updates = [
        { setting_key: 'deriv_app_id', setting_value: config.deriv_app_id },
        { setting_key: 'deriv_api_token', setting_value: config.deriv_api_token },
        { setting_key: 'auto_commission_enabled', setting_value: config.auto_commission_enabled.toString() },
        { setting_key: 'platform_commission_percentage', setting_value: config.platform_commission_percentage.toString() },
        { setting_key: 'site_creator_commission_percentage', setting_value: config.site_creator_commission_percentage.toString() },
        { setting_key: 'trader_commission_percentage', setting_value: config.trader_commission_percentage.toString() },
      ];

      for (const update of updates) {
        const { error } = await supabase
          .from("platform_settings")
          .upsert(update, { onConflict: "setting_key" });

        if (error) throw error;
      }

      toast.success("Deriv API configuration saved successfully");
    } catch (error) {
      console.error("Error saving config:", error);
      toast.error("Failed to save configuration");
    } finally {
      setIsSaving(false);
    }
  };

  const handleCommissionChange = (key: keyof DerivConfig, value: number) => {
    const otherKeys = ['platform_commission_percentage', 'site_creator_commission_percentage', 'trader_commission_percentage']
      .filter(k => k !== key) as (keyof DerivConfig)[];

    const remaining = 100 - value;
    const currentOtherTotal = otherKeys.reduce((sum, k) => sum + (config[k] as number), 0);

    if (currentOtherTotal > 0) {
      const newConfig = { ...config, [key]: value };
      otherKeys.forEach((k) => {
        const proportion = (config[k] as number) / currentOtherTotal;
        (newConfig as Record<keyof DerivConfig, string | number | boolean>)[k] = Math.round(remaining * proportion);
      });

      // Adjust for rounding errors
      const total = value + otherKeys.reduce((sum, k) => sum + (newConfig[k] as number), 0);
      if (total !== 100) {
        (newConfig as Record<keyof DerivConfig, string | number | boolean>)[otherKeys[0]] = 
          ((newConfig[otherKeys[0]] as number) + (100 - total));
      }

      setConfig(newConfig);
    } else {
      setConfig({ ...config, [key]: value });
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-32">
        <Loader2 className="w-6 h-6 animate-spin text-primary" />
      </div>
    );
  }

  const totalCommission = 
    config.platform_commission_percentage + 
    config.site_creator_commission_percentage + 
    config.trader_commission_percentage;

  const isConfigured = config.deriv_app_id;

  return (
    <div className="space-y-6">
      {/* Deriv API Credentials Card */}
      <Card className="glass border-border">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Key className="w-5 h-5 text-primary" />
            Deriv API Configuration
          </CardTitle>
          <CardDescription>
            Configure your Deriv App ID to receive affiliate commissions from all site users' trades.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Status Banner */}
          <div
            className={`rounded-lg border p-4 ${
              isConfigured
                ? "border-green-500/30 bg-green-500/10"
                : "border-amber-500/30 bg-amber-500/10"
            }`}
          >
            <div className="flex items-center gap-3">
              {isConfigured ? (
                <CheckCircle2 className="w-5 h-5 text-green-500" />
              ) : (
                <AlertTriangle className="w-5 h-5 text-amber-500" />
              )}
              <div>
                <p className={`font-medium ${isConfigured ? "text-green-500" : "text-amber-500"}`}>
                  {isConfigured ? "Deriv API Configured" : "Configuration Required"}
                </p>
                <p className={`text-sm ${isConfigured ? "text-green-500/80" : "text-amber-500/80"}`}>
                  {isConfigured
                    ? "All site trades will generate affiliate commissions for you"
                    : "Add your Deriv App ID to start earning commissions"}
                </p>
              </div>
            </div>
          </div>

          {/* App ID Input */}
          <div className="space-y-2">
            <Label htmlFor="app_id">Deriv App ID</Label>
            <div className="flex gap-2">
              <Input
                id="app_id"
                value={config.deriv_app_id}
                onChange={(e) => setConfig({ ...config, deriv_app_id: e.target.value })}
                placeholder="e.g., 1089"
                className="font-mono"
              />
              <Button 
                variant="outline" 
                onClick={validateAppId}
                disabled={isValidating || !config.deriv_app_id}
              >
                {isValidating ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : validationStatus === 'valid' ? (
                  <CheckCircle2 className="w-4 h-4 text-green-500" />
                ) : (
                  "Validate"
                )}
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">
              Get your App ID from{" "}
              <a 
                href="https://app.deriv.com/account/api-token" 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-primary hover:underline"
              >
                Deriv API Token page
                <ExternalLink className="w-3 h-3 inline ml-1" />
              </a>
            </p>
          </div>

          {/* API Token Input (Optional) */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="api_token">API Token (Optional)</Label>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowToken(!showToken)}
                className="gap-2"
              >
                {showToken ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                {showToken ? "Hide" : "Show"}
              </Button>
            </div>
            <Input
              id="api_token"
              type={showToken ? "text" : "password"}
              value={config.deriv_api_token}
              onChange={(e) => setConfig({ ...config, deriv_api_token: e.target.value })}
              placeholder="Your Deriv API token (for advanced features)"
            />
            <p className="text-xs text-muted-foreground">
              Required for fetching affiliate statistics and automated commission tracking
            </p>
          </div>

          {/* Info Box */}
          <Alert>
            <Info className="w-4 h-4" />
            <AlertTitle>How Affiliate Commissions Work</AlertTitle>
            <AlertDescription className="text-sm">
              <ol className="list-decimal list-inside space-y-1 mt-2">
                <li>Users sign up to trade on sites created with your platform</li>
                <li>Every trade they make uses your App ID for tracking</li>
                <li>Deriv calculates affiliate commissions from trading volume</li>
                <li>Commissions are split according to your configured percentages</li>
              </ol>
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>

      {/* Commission Split Card */}
      <Card className="glass border-border">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <DollarSign className="w-5 h-5 text-primary" />
            Commission Split Configuration
          </CardTitle>
          <CardDescription>
            Configure how Deriv affiliate commissions are distributed between stakeholders
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Auto Commission Toggle */}
          <div className="flex items-center justify-between rounded-lg border border-border p-4">
            <div>
              <Label className="text-base">Automatic Commission Distribution</Label>
              <p className="text-sm text-muted-foreground">
                Automatically calculate and assign commission splits on each trade
              </p>
            </div>
            <Switch
              checked={config.auto_commission_enabled}
              onCheckedChange={(checked) => setConfig({ ...config, auto_commission_enabled: checked })}
            />
          </div>

          {/* Visual Split Indicator */}
          <div className="h-10 rounded-lg overflow-hidden flex">
            <div 
              className="flex items-center justify-center text-xs font-medium text-white transition-all"
              style={{ 
                width: `${config.platform_commission_percentage}%`,
                backgroundColor: 'hsl(var(--primary))',
              }}
            >
              {config.platform_commission_percentage}%
            </div>
            <div 
              className="flex items-center justify-center text-xs font-medium text-white transition-all"
              style={{ 
                width: `${config.site_creator_commission_percentage}%`,
                backgroundColor: '#22c55e',
              }}
            >
              {config.site_creator_commission_percentage}%
            </div>
            <div 
              className="flex items-center justify-center text-xs font-medium text-white transition-all"
              style={{ 
                width: `${config.trader_commission_percentage}%`,
                backgroundColor: '#f59e0b',
              }}
            >
              {config.trader_commission_percentage}%
            </div>
          </div>

          {/* Commission Inputs */}
          <div className="grid gap-4 md:grid-cols-3">
            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <Percent className="w-4 h-4 text-primary" />
                Platform (You)
              </Label>
              <Input
                type="number"
                min="0"
                max="100"
                value={config.platform_commission_percentage}
                onChange={(e) => handleCommissionChange('platform_commission_percentage', parseInt(e.target.value) || 0)}
              />
              <p className="text-xs text-muted-foreground">Your revenue as platform owner</p>
            </div>

            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-green-500" />
                Site Creators
              </Label>
              <Input
                type="number"
                min="0"
                max="100"
                value={config.site_creator_commission_percentage}
                onChange={(e) => handleCommissionChange('site_creator_commission_percentage', parseInt(e.target.value) || 0)}
              />
              <p className="text-xs text-muted-foreground">Share for users who create sites</p>
            </div>

            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <DollarSign className="w-4 h-4 text-amber-500" />
                Traders (Cashback)
              </Label>
              <Input
                type="number"
                min="0"
                max="100"
                value={config.trader_commission_percentage}
                onChange={(e) => handleCommissionChange('trader_commission_percentage', parseInt(e.target.value) || 0)}
              />
              <p className="text-xs text-muted-foreground">Cashback for active traders</p>
            </div>
          </div>

          {/* Total Check */}
          {totalCommission !== 100 && (
            <Alert variant="destructive">
              <AlertTriangle className="w-4 h-4" />
              <AlertTitle>Invalid Split</AlertTitle>
              <AlertDescription>
                Total commission split is {totalCommission}%. It must equal 100%.
              </AlertDescription>
            </Alert>
          )}

          {/* Example Calculation */}
          <div className="p-4 rounded-lg bg-secondary/30">
            <h4 className="font-medium mb-3 flex items-center gap-2">
              <DollarSign className="w-4 h-4" />
              Example: $100 Commission Earned
            </h4>
            <div className="grid gap-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Platform (You):</span>
                <span className="font-medium">${config.platform_commission_percentage.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Site Creator:</span>
                <span className="font-medium text-green-500">${config.site_creator_commission_percentage.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Trader Cashback:</span>
                <span className="font-medium text-amber-500">${config.trader_commission_percentage.toFixed(2)}</span>
              </div>
              <div className="border-t border-border pt-2 flex justify-between">
                <span className="font-medium">Total:</span>
                <span className="font-bold">${totalCommission.toFixed(2)}</span>
              </div>
            </div>
          </div>

          {/* Save Button */}
          <Button 
            onClick={handleSave} 
            disabled={isSaving || totalCommission !== 100}
            className="w-full gap-2"
          >
            {isSaving ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save className="w-4 h-4" />
                Save Configuration
              </>
            )}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
