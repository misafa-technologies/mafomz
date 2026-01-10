import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Badge } from "@/components/ui/badge";
import { Loader2, Save, DollarSign, Users, Building, TrendingUp } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface CommissionSettings {
  platform_commission_percentage: number;
  site_creator_commission_percentage: number;
  trader_commission_percentage: number;
  deriv_app_id: string;
}

export function CommissionSplitConfig() {
  const [settings, setSettings] = useState<CommissionSettings>({
    platform_commission_percentage: 30,
    site_creator_commission_percentage: 50,
    trader_commission_percentage: 20,
    deriv_app_id: '1089',
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const { data, error } = await supabase
        .from("platform_settings")
        .select("setting_key, setting_value")
        .in("setting_key", [
          "platform_commission_percentage",
          "site_creator_commission_percentage",
          "trader_commission_percentage",
          "deriv_app_id",
        ]);

      if (error) throw error;

      const settingsMap: Record<string, string> = {};
      data?.forEach((item) => {
        settingsMap[item.setting_key] = item.setting_value || '';
      });

      setSettings({
        platform_commission_percentage: parseFloat(settingsMap.platform_commission_percentage) || 30,
        site_creator_commission_percentage: parseFloat(settingsMap.site_creator_commission_percentage) || 50,
        trader_commission_percentage: parseFloat(settingsMap.trader_commission_percentage) || 20,
        deriv_app_id: settingsMap.deriv_app_id || '1089',
      });
    } catch (err) {
      console.error("Error fetching commission settings:", err);
      toast.error("Failed to load commission settings");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSliderChange = (key: keyof CommissionSettings, value: number[]) => {
    const newValue = value[0];
    const otherKeys = Object.keys(settings).filter(
      k => k !== key && k !== 'deriv_app_id'
    ) as (keyof CommissionSettings)[];

    // Redistribute remaining percentage proportionally
    const remaining = 100 - newValue;
    const currentOtherTotal = otherKeys.reduce((sum, k) => sum + (settings[k] as number), 0);

    if (currentOtherTotal > 0) {
      const newSettings = { ...settings, [key]: newValue };
      otherKeys.forEach((k) => {
        const proportion = (settings[k] as number) / currentOtherTotal;
        newSettings[k] = Math.round(remaining * proportion) as never;
      });

      // Adjust for rounding errors
      const total = newValue + otherKeys.reduce((sum, k) => sum + (newSettings[k] as number), 0);
      if (total !== 100) {
        newSettings[otherKeys[0]] = ((newSettings[otherKeys[0]] as number) + (100 - total)) as never;
      }

      setSettings(newSettings);
    }
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const updates = [
        { setting_key: 'platform_commission_percentage', setting_value: settings.platform_commission_percentage.toString() },
        { setting_key: 'site_creator_commission_percentage', setting_value: settings.site_creator_commission_percentage.toString() },
        { setting_key: 'trader_commission_percentage', setting_value: settings.trader_commission_percentage.toString() },
        { setting_key: 'deriv_app_id', setting_value: settings.deriv_app_id },
      ];

      for (const update of updates) {
        const { error } = await supabase
          .from("platform_settings")
          .upsert(update, { onConflict: 'setting_key' });

        if (error) throw error;
      }

      toast.success("Commission settings saved successfully");
    } catch (err) {
      console.error("Error saving commission settings:", err);
      toast.error("Failed to save commission settings");
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-6 flex items-center justify-center">
          <Loader2 className="w-6 h-6 animate-spin" />
        </CardContent>
      </Card>
    );
  }

  const total = settings.platform_commission_percentage + 
    settings.site_creator_commission_percentage + 
    settings.trader_commission_percentage;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <DollarSign className="w-5 h-5" />
          Commission Split Configuration
        </CardTitle>
        <CardDescription>
          Configure how Deriv affiliate commissions are distributed between the platform, site creators, and traders
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Visual Split Indicator */}
        <div className="h-8 rounded-lg overflow-hidden flex">
          <div 
            className="flex items-center justify-center text-xs font-medium text-white"
            style={{ 
              width: `${settings.platform_commission_percentage}%`,
              backgroundColor: 'hsl(var(--primary))',
            }}
          >
            {settings.platform_commission_percentage}%
          </div>
          <div 
            className="flex items-center justify-center text-xs font-medium text-white"
            style={{ 
              width: `${settings.site_creator_commission_percentage}%`,
              backgroundColor: '#22c55e',
            }}
          >
            {settings.site_creator_commission_percentage}%
          </div>
          <div 
            className="flex items-center justify-center text-xs font-medium text-white"
            style={{ 
              width: `${settings.trader_commission_percentage}%`,
              backgroundColor: '#f59e0b',
            }}
          >
            {settings.trader_commission_percentage}%
          </div>
        </div>

        {/* Platform Commission */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <Label className="flex items-center gap-2">
              <Building className="w-4 h-4" />
              Platform Commission
            </Label>
            <Badge variant="outline">{settings.platform_commission_percentage}%</Badge>
          </div>
          <Slider
            value={[settings.platform_commission_percentage]}
            onValueChange={(value) => handleSliderChange('platform_commission_percentage', value)}
            max={80}
            min={5}
            step={1}
          />
          <p className="text-xs text-muted-foreground">
            Revenue retained by the platform owner (you)
          </p>
        </div>

        {/* Site Creator Commission */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <Label className="flex items-center gap-2">
              <Users className="w-4 h-4" />
              Site Creator Commission
            </Label>
            <Badge variant="outline" className="bg-green-500/10 text-green-500 border-green-500/30">
              {settings.site_creator_commission_percentage}%
            </Badge>
          </div>
          <Slider
            value={[settings.site_creator_commission_percentage]}
            onValueChange={(value) => handleSliderChange('site_creator_commission_percentage', value)}
            max={80}
            min={5}
            step={1}
            className="[&_[role=slider]]:bg-green-500"
          />
          <p className="text-xs text-muted-foreground">
            Share given to users who create trading sites
          </p>
        </div>

        {/* Trader Commission */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <Label className="flex items-center gap-2">
              <TrendingUp className="w-4 h-4" />
              Trader Referral Bonus
            </Label>
            <Badge variant="outline" className="bg-amber-500/10 text-amber-500 border-amber-500/30">
              {settings.trader_commission_percentage}%
            </Badge>
          </div>
          <Slider
            value={[settings.trader_commission_percentage]}
            onValueChange={(value) => handleSliderChange('trader_commission_percentage', value)}
            max={50}
            min={0}
            step={1}
            className="[&_[role=slider]]:bg-amber-500"
          />
          <p className="text-xs text-muted-foreground">
            Bonus given to active traders as cashback
          </p>
        </div>

        {/* Deriv App ID */}
        <div className="space-y-2 pt-4 border-t">
          <Label>Deriv App ID</Label>
          <Input
            value={settings.deriv_app_id}
            onChange={(e) => setSettings({ ...settings, deriv_app_id: e.target.value })}
            placeholder="Enter your Deriv App ID"
          />
          <p className="text-xs text-muted-foreground">
            Your registered Deriv application ID for affiliate tracking
          </p>
        </div>

        {/* Total Check */}
        {total !== 100 && (
          <div className="p-3 rounded-lg bg-destructive/10 text-destructive text-sm">
            Warning: Total commission split is {total}%. It should equal 100%.
          </div>
        )}

        <Button 
          onClick={handleSave} 
          disabled={isSaving || total !== 100}
          className="w-full"
        >
          {isSaving ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin mr-2" />
              Saving...
            </>
          ) : (
            <>
              <Save className="w-4 h-4 mr-2" />
              Save Commission Settings
            </>
          )}
        </Button>
      </CardContent>
    </Card>
  );
}
