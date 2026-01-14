import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import { 
  Upload, 
  Bot, 
  DollarSign, 
  Store, 
  Check, 
  Loader2,
  FileCode,
  Settings
} from "lucide-react";
import { toast } from "sonner";

interface BotStoreUploaderProps {
  siteId: string;
  onSuccess?: () => void;
}

const assetOptions = [
  { value: "R_10", label: "Volatility 10 Index" },
  { value: "R_25", label: "Volatility 25 Index" },
  { value: "R_50", label: "Volatility 50 Index" },
  { value: "R_75", label: "Volatility 75 Index" },
  { value: "R_100", label: "Volatility 100 Index" },
  { value: "1HZ10V", label: "Volatility 10 (1s)" },
  { value: "1HZ25V", label: "Volatility 25 (1s)" },
  { value: "1HZ50V", label: "Volatility 50 (1s)" },
  { value: "1HZ75V", label: "Volatility 75 (1s)" },
  { value: "1HZ100V", label: "Volatility 100 (1s)" },
  { value: "BOOM1000", label: "Boom 1000 Index" },
  { value: "BOOM500", label: "Boom 500 Index" },
  { value: "CRASH1000", label: "Crash 1000 Index" },
  { value: "CRASH500", label: "Crash 500 Index" },
];

const strategyOptions = [
  { value: "martingale", label: "Martingale", description: "Double stake on loss" },
  { value: "anti_martingale", label: "Anti-Martingale", description: "Increase on wins" },
  { value: "fixed", label: "Fixed Stake", description: "Same stake every trade" },
  { value: "compound", label: "Compound", description: "Reinvest profits" },
  { value: "ai_smart", label: "AI Smart", description: "AI-driven decisions" },
];

export function BotStoreUploader({ siteId, onSuccess }: BotStoreUploaderProps) {
  const { user } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [step, setStep] = useState(1);
  
  const [botData, setBotData] = useState({
    name: "",
    description: "",
    asset: "R_100",
    strategy: "ai_smart",
    stake_amount: 1,
    stop_loss_percentage: 15,
    take_profit_percentage: 25,
    max_daily_trades: 50,
    price: 0,
    is_public: true,
    xml_content: "",
  });

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.name.endsWith('.xml')) {
      toast.error("Please upload an XML file");
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const content = e.target?.result as string;
      setBotData(prev => ({ 
        ...prev, 
        xml_content: content,
        name: prev.name || file.name.replace('.xml', '').replace(/_/g, ' ')
      }));
      toast.success("File uploaded successfully");
    };
    reader.readAsText(file);
  };

  const handleSubmit = async () => {
    if (!user) {
      toast.error("Please login first");
      return;
    }

    if (!botData.name) {
      toast.error("Bot name is required");
      return;
    }

    setIsUploading(true);
    try {
      // First create the bot config
      const { data: botConfig, error: botError } = await supabase
        .from("bot_configs")
        .insert({
          user_id: user.id,
          site_id: siteId,
          name: botData.name,
          description: botData.description,
          asset: botData.asset,
          trade_type: botData.strategy,
          stake_amount: botData.stake_amount,
          stop_loss_percentage: botData.stop_loss_percentage,
          take_profit_percentage: botData.take_profit_percentage,
          max_daily_trades: botData.max_daily_trades,
          xml_content: botData.xml_content || `<bot name="${botData.name}" strategy="${botData.strategy}" />`,
          is_active: false,
        })
        .select()
        .single();

      if (botError) throw botError;

      // Then add to store
      const { error: storeError } = await supabase
        .from("site_bot_store")
        .insert({
          site_id: siteId,
          bot_id: botConfig.id,
          price: botData.price,
          is_public: botData.is_public,
          downloads_count: 0,
        });

      if (storeError) throw storeError;

      toast.success("Bot published to store!");
      setIsOpen(false);
      setBotData({
        name: "",
        description: "",
        asset: "R_100",
        strategy: "ai_smart",
        stake_amount: 1,
        stop_loss_percentage: 15,
        take_profit_percentage: 25,
        max_daily_trades: 50,
        price: 0,
        is_public: true,
        xml_content: "",
      });
      setStep(1);
      onSuccess?.();
    } catch (error) {
      console.error("Error publishing bot:", error);
      toast.error("Failed to publish bot");
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button className="gap-2">
          <Upload className="w-4 h-4" />
          Publish Bot to Store
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Store className="w-5 h-5" />
            Publish Bot to Store
          </DialogTitle>
          <DialogDescription>
            Share your trading bot with your site visitors
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Progress Indicator */}
          <div className="flex items-center justify-center gap-2">
            {[1, 2, 3].map((s) => (
              <div
                key={s}
                className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium transition-colors ${
                  step >= s 
                    ? 'bg-primary text-primary-foreground' 
                    : 'bg-muted text-muted-foreground'
                }`}
              >
                {step > s ? <Check className="w-4 h-4" /> : s}
              </div>
            ))}
          </div>

          {/* Step 1: Basic Info */}
          {step === 1 && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Bot Name</Label>
                <Input
                  placeholder="e.g., Volatility Crusher Pro"
                  value={botData.name}
                  onChange={(e) => setBotData(prev => ({ ...prev, name: e.target.value }))}
                />
              </div>

              <div className="space-y-2">
                <Label>Description</Label>
                <Textarea
                  placeholder="Describe what your bot does and its strategy..."
                  value={botData.description}
                  onChange={(e) => setBotData(prev => ({ ...prev, description: e.target.value }))}
                  rows={3}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Trading Asset</Label>
                  <Select 
                    value={botData.asset} 
                    onValueChange={(v) => setBotData(prev => ({ ...prev, asset: v }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {assetOptions.map(opt => (
                        <SelectItem key={opt.value} value={opt.value}>
                          {opt.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Strategy Type</Label>
                  <Select 
                    value={botData.strategy} 
                    onValueChange={(v) => setBotData(prev => ({ ...prev, strategy: v }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {strategyOptions.map(opt => (
                        <SelectItem key={opt.value} value={opt.value}>
                          <div className="flex flex-col">
                            <span>{opt.label}</span>
                            <span className="text-xs text-muted-foreground">{opt.description}</span>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label>XML Configuration (Optional)</Label>
                <div className="border-2 border-dashed rounded-lg p-4 text-center">
                  <input
                    type="file"
                    accept=".xml"
                    onChange={handleFileUpload}
                    className="hidden"
                    id="bot-xml-upload"
                  />
                  <label htmlFor="bot-xml-upload" className="cursor-pointer">
                    <FileCode className="w-8 h-8 mx-auto mb-2 text-muted-foreground" />
                    <p className="text-sm text-muted-foreground">
                      {botData.xml_content ? "XML file loaded ✓" : "Upload DBot XML file (optional)"}
                    </p>
                  </label>
                </div>
              </div>
            </div>
          )}

          {/* Step 2: Trading Parameters */}
          {step === 2 && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Default Stake Amount (USD)</Label>
                  <Input
                    type="number"
                    min={0.35}
                    step={0.01}
                    value={botData.stake_amount}
                    onChange={(e) => setBotData(prev => ({ ...prev, stake_amount: parseFloat(e.target.value) || 1 }))}
                  />
                </div>

                <div className="space-y-2">
                  <Label>Max Daily Trades</Label>
                  <Input
                    type="number"
                    min={1}
                    max={1000}
                    value={botData.max_daily_trades}
                    onChange={(e) => setBotData(prev => ({ ...prev, max_daily_trades: parseInt(e.target.value) || 50 }))}
                  />
                </div>

                <div className="space-y-2">
                  <Label>Stop Loss (%)</Label>
                  <Input
                    type="number"
                    min={1}
                    max={100}
                    value={botData.stop_loss_percentage}
                    onChange={(e) => setBotData(prev => ({ ...prev, stop_loss_percentage: parseFloat(e.target.value) || 15 }))}
                  />
                </div>

                <div className="space-y-2">
                  <Label>Take Profit (%)</Label>
                  <Input
                    type="number"
                    min={1}
                    max={1000}
                    value={botData.take_profit_percentage}
                    onChange={(e) => setBotData(prev => ({ ...prev, take_profit_percentage: parseFloat(e.target.value) || 25 }))}
                  />
                </div>
              </div>

              <Card className="bg-muted/50">
                <CardContent className="p-4">
                  <h4 className="font-medium mb-2 flex items-center gap-2">
                    <Settings className="w-4 h-4" />
                    Risk Summary
                  </h4>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div>Max loss per day: <span className="font-medium text-red-500">{botData.stop_loss_percentage}%</span></div>
                    <div>Target profit: <span className="font-medium text-green-500">{botData.take_profit_percentage}%</span></div>
                    <div>Trade limit: <span className="font-medium">{botData.max_daily_trades}</span></div>
                    <div>Starting stake: <span className="font-medium">${botData.stake_amount}</span></div>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Step 3: Pricing & Publish */}
          {step === 3 && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Price (USD) - Set to 0 for free</Label>
                <div className="relative">
                  <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    type="number"
                    min={0}
                    step={0.01}
                    value={botData.price}
                    onChange={(e) => setBotData(prev => ({ ...prev, price: parseFloat(e.target.value) || 0 }))}
                    className="pl-9"
                    placeholder="0.00"
                  />
                </div>
              </div>

              <div className="flex items-center justify-between p-4 rounded-lg border">
                <div className="space-y-0.5">
                  <Label>Make Public</Label>
                  <p className="text-sm text-muted-foreground">
                    Allow all site visitors to see this bot
                  </p>
                </div>
                <Switch
                  checked={botData.is_public}
                  onCheckedChange={(checked) => setBotData(prev => ({ ...prev, is_public: checked }))}
                />
              </div>

              <Card className="bg-primary/5 border-primary/20">
                <CardContent className="p-4">
                  <h4 className="font-medium mb-3 flex items-center gap-2">
                    <Bot className="w-4 h-4" />
                    Bot Preview
                  </h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Name:</span>
                      <span className="font-medium">{botData.name || "Unnamed Bot"}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Asset:</span>
                      <span>{assetOptions.find(a => a.value === botData.asset)?.label}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Strategy:</span>
                      <Badge variant="outline">{strategyOptions.find(s => s.value === botData.strategy)?.label}</Badge>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Price:</span>
                      <span className="font-medium text-green-500">
                        {botData.price > 0 ? `$${botData.price.toFixed(2)}` : 'Free'}
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </div>

        <DialogFooter className="flex justify-between">
          {step > 1 && (
            <Button variant="outline" onClick={() => setStep(s => s - 1)}>
              Back
            </Button>
          )}
          <div className="flex gap-2 ml-auto">
            <Button variant="ghost" onClick={() => setIsOpen(false)}>
              Cancel
            </Button>
            {step < 3 ? (
              <Button onClick={() => setStep(s => s + 1)} disabled={!botData.name}>
                Continue
              </Button>
            ) : (
              <Button onClick={handleSubmit} disabled={isUploading}>
                {isUploading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Publishing...
                  </>
                ) : (
                  <>
                    <Store className="w-4 h-4 mr-2" />
                    Publish Bot
                  </>
                )}
              </Button>
            )}
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
