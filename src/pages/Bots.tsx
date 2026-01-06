import { useState, useEffect, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { 
  Bot, 
  Plus, 
  Play, 
  Pause,
  Trash2,
  Copy,
  FileCode,
  Loader2,
  Cpu,
  Activity,
  TrendingUp,
  Settings,
  Clock,
  Target,
  Shield,
  Zap,
  BarChart3,
  History,
  RefreshCw,
  Eye,
  Upload,
  FileText,
  Check
} from "lucide-react";

interface BotConfig {
  id: string;
  name: string;
  description: string | null;
  xml_content: string;
  is_active: boolean;
  trade_type: string | null;
  asset: string | null;
  created_at: string;
  schedule_enabled?: boolean;
  schedule_cron?: string | null;
  max_daily_trades?: number;
  stop_loss_percentage?: number;
  take_profit_percentage?: number;
  stake_amount?: number;
}

interface BotExecution {
  id: string;
  bot_id: string;
  status: string;
  profit_loss: number;
  trades_count: number;
  win_count: number;
  loss_count: number;
  started_at: string;
  ended_at: string | null;
}

const assetOptions = [
  { value: "R_10", label: "Volatility 10 Index", category: "Synthetic" },
  { value: "R_25", label: "Volatility 25 Index", category: "Synthetic" },
  { value: "R_50", label: "Volatility 50 Index", category: "Synthetic" },
  { value: "R_75", label: "Volatility 75 Index", category: "Synthetic" },
  { value: "R_100", label: "Volatility 100 Index", category: "Synthetic" },
  { value: "1HZ10V", label: "Volatility 10 (1s)", category: "Synthetic" },
  { value: "1HZ25V", label: "Volatility 25 (1s)", category: "Synthetic" },
  { value: "1HZ50V", label: "Volatility 50 (1s)", category: "Synthetic" },
  { value: "1HZ75V", label: "Volatility 75 (1s)", category: "Synthetic" },
  { value: "1HZ100V", label: "Volatility 100 (1s)", category: "Synthetic" },
  { value: "BOOM1000", label: "Boom 1000 Index", category: "Crash/Boom" },
  { value: "BOOM500", label: "Boom 500 Index", category: "Crash/Boom" },
  { value: "CRASH1000", label: "Crash 1000 Index", category: "Crash/Boom" },
  { value: "CRASH500", label: "Crash 500 Index", category: "Crash/Boom" },
  { value: "JD10", label: "Jump 10 Index", category: "Jump" },
  { value: "JD25", label: "Jump 25 Index", category: "Jump" },
  { value: "JD50", label: "Jump 50 Index", category: "Jump" },
  { value: "JD75", label: "Jump 75 Index", category: "Jump" },
  { value: "JD100", label: "Jump 100 Index", category: "Jump" },
];

const tradeTypeOptions = [
  { value: "digits_even", label: "Digits - Even", category: "Digits" },
  { value: "digits_odd", label: "Digits - Odd", category: "Digits" },
  { value: "digits_over", label: "Digits - Over", category: "Digits" },
  { value: "digits_under", label: "Digits - Under", category: "Digits" },
  { value: "digits_match", label: "Digits - Match", category: "Digits" },
  { value: "digits_differ", label: "Digits - Differ", category: "Digits" },
  { value: "rise_fall", label: "Rise/Fall", category: "Up/Down" },
  { value: "higher_lower", label: "Higher/Lower", category: "Up/Down" },
  { value: "touch", label: "Touch", category: "Touch" },
  { value: "no_touch", label: "No Touch", category: "Touch" },
  { value: "ends_between", label: "Ends Between", category: "Range" },
  { value: "ends_outside", label: "Ends Outside", category: "Range" },
  { value: "stays_between", label: "Stays Between", category: "Range" },
  { value: "goes_outside", label: "Goes Outside", category: "Range" },
];

const sampleBots = [
  {
    name: "Martingale Even/Odd",
    description: "Uses martingale strategy doubling stake on loss for even/odd digits",
    trade_type: "digits_even",
    asset: "R_100",
    stake_amount: 0.35,
    stop_loss_percentage: 15,
    take_profit_percentage: 25,
    xml_content: `<?xml version="1.0" encoding="UTF-8"?>
<xml xmlns="https://developers.google.com/blockly/xml">
  <block type="trade_definition" id="root">
    <field name="TRADETYPE">digiteven</field>
    <field name="SYMBOL">R_100</field>
    <field name="DURATION">5</field>
    <field name="DURTYPE">tick</field>
    <field name="STAKE">0.35</field>
    <statement name="MARTINGALE">
      <block type="martingale">
        <field name="MULTIPLIER">2</field>
        <field name="MAX_STAKE">50</field>
      </block>
    </statement>
  </block>
</xml>`
  },
  {
    name: "Rise/Fall Trend Follower",
    description: "Follows market momentum for rise/fall contracts with trailing stop",
    trade_type: "rise_fall",
    asset: "R_75",
    stake_amount: 1,
    stop_loss_percentage: 10,
    take_profit_percentage: 30,
    xml_content: `<?xml version="1.0" encoding="UTF-8"?>
<xml xmlns="https://developers.google.com/blockly/xml">
  <block type="trade_definition" id="root">
    <field name="TRADETYPE">call</field>
    <field name="SYMBOL">R_75</field>
    <field name="DURATION">15</field>
    <field name="DURTYPE">minutes</field>
    <field name="STAKE">1</field>
    <statement name="TREND_ANALYSIS">
      <block type="sma_crossover">
        <field name="FAST_PERIOD">5</field>
        <field name="SLOW_PERIOD">20</field>
      </block>
    </statement>
  </block>
</xml>`
  },
  {
    name: "Crash 500 Spike Catcher",
    description: "Catches spikes on Crash 500 with quick entries and exits",
    trade_type: "rise_fall",
    asset: "CRASH500",
    stake_amount: 2,
    stop_loss_percentage: 5,
    take_profit_percentage: 15,
    xml_content: `<?xml version="1.0" encoding="UTF-8"?>
<xml xmlns="https://developers.google.com/blockly/xml">
  <block type="trade_definition" id="root">
    <field name="TRADETYPE">put</field>
    <field name="SYMBOL">CRASH500</field>
    <field name="DURATION">3</field>
    <field name="DURTYPE">tick</field>
    <field name="STAKE">2</field>
    <statement name="SPIKE_DETECTION">
      <block type="spike_detector">
        <field name="SENSITIVITY">high</field>
        <field name="MIN_SPIKE">0.5</field>
      </block>
    </statement>
  </block>
</xml>`
  },
  {
    name: "Boom 1000 Recovery",
    description: "Anti-martingale strategy for Boom 1000 with compounding wins",
    trade_type: "rise_fall",
    asset: "BOOM1000",
    stake_amount: 0.5,
    stop_loss_percentage: 20,
    take_profit_percentage: 50,
    xml_content: `<?xml version="1.0" encoding="UTF-8"?>
<xml xmlns="https://developers.google.com/blockly/xml">
  <block type="trade_definition" id="root">
    <field name="TRADETYPE">call</field>
    <field name="SYMBOL">BOOM1000</field>
    <field name="DURATION">5</field>
    <field name="DURTYPE">tick</field>
    <field name="STAKE">0.5</field>
    <statement name="ANTI_MARTINGALE">
      <block type="anti_martingale">
        <field name="WIN_MULTIPLIER">1.5</field>
        <field name="LOSS_DIVISOR">2</field>
      </block>
    </statement>
  </block>
</xml>`
  },
  {
    name: "Digits Under 5 Sniper",
    description: "High probability digits under 5 trades with fixed stake",
    trade_type: "digits_under",
    asset: "R_50",
    stake_amount: 1,
    stop_loss_percentage: 10,
    take_profit_percentage: 20,
    xml_content: `<?xml version="1.0" encoding="UTF-8"?>
<xml xmlns="https://developers.google.com/blockly/xml">
  <block type="trade_definition" id="root">
    <field name="TRADETYPE">digitunder</field>
    <field name="SYMBOL">R_50</field>
    <field name="DURATION">5</field>
    <field name="DURTYPE">tick</field>
    <field name="STAKE">1</field>
    <field name="PREDICTION">5</field>
  </block>
</xml>`
  }
];

const Bots = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [bots, setBots] = useState<BotConfig[]>([]);
  const [executions, setExecutions] = useState<BotExecution[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);
  const [showDialog, setShowDialog] = useState(false);
  const [showDetailsDialog, setShowDetailsDialog] = useState(false);
  const [selectedBot, setSelectedBot] = useState<BotConfig | null>(null);
  const [activeTab, setActiveTab] = useState("my-bots");
  const [isUploading, setIsUploading] = useState(false);
  const [uploadedFileName, setUploadedFileName] = useState<string | null>(null);
  const [newBot, setNewBot] = useState({
    name: "",
    description: "",
    xml_content: "",
    trade_type: "digits_even",
    asset: "R_100",
    stake_amount: 1,
    stop_loss_percentage: 10,
    take_profit_percentage: 20,
    max_daily_trades: 100,
    schedule_enabled: false,
    schedule_cron: ""
  });

  useEffect(() => {
    fetchBots();
  }, [user]);

  const fetchBots = async () => {
    if (!user) return;
    
    try {
      const { data, error } = await supabase
        .from("bot_configs")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setBots(data || []);

      // Fetch executions
      const { data: execData } = await supabase
        .from("bot_executions")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(50);

      setExecutions(execData || []);
    } catch (error) {
      console.error("Error fetching bots:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const createBot = async () => {
    if (!user || !newBot.name || !newBot.xml_content) return;

    setIsCreating(true);
    try {
      const { error } = await supabase
        .from("bot_configs")
        .insert({
          user_id: user.id,
          name: newBot.name,
          description: newBot.description || null,
          xml_content: newBot.xml_content,
          trade_type: newBot.trade_type,
          asset: newBot.asset,
          stake_amount: newBot.stake_amount,
          stop_loss_percentage: newBot.stop_loss_percentage,
          take_profit_percentage: newBot.take_profit_percentage,
          max_daily_trades: newBot.max_daily_trades,
          schedule_enabled: newBot.schedule_enabled,
          schedule_cron: newBot.schedule_cron || null,
          is_active: false
        });

      if (error) throw error;

      toast({
        title: "Bot created",
        description: "Your trading bot has been saved successfully.",
      });

      setShowDialog(false);
      setNewBot({
        name: "",
        description: "",
        xml_content: "",
        trade_type: "digits_even",
        asset: "R_100",
        stake_amount: 1,
        stop_loss_percentage: 10,
        take_profit_percentage: 20,
        max_daily_trades: 100,
        schedule_enabled: false,
        schedule_cron: ""
      });
      fetchBots();
    } catch (error: unknown) {
      console.error("Error creating bot:", error);
      toast({
        title: "Error",
        description: "Failed to create bot. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsCreating(false);
    }
  };

  const toggleBot = async (botId: string, isActive: boolean) => {
    try {
      const { error } = await supabase
        .from("bot_configs")
        .update({ is_active: !isActive })
        .eq("id", botId);

      if (error) throw error;

      // Create execution record when starting
      if (!isActive) {
        await supabase.from("bot_executions").insert({
          bot_id: botId,
          user_id: user?.id,
          status: "running",
          started_at: new Date().toISOString()
        });
      }

      setBots(bots.map(bot => 
        bot.id === botId ? { ...bot, is_active: !isActive } : bot
      ));

      toast({
        title: isActive ? "Bot paused" : "Bot activated",
        description: isActive ? "Trading bot has been paused." : "Trading bot is now active and running.",
      });
      
      fetchBots();
    } catch (error) {
      console.error("Error toggling bot:", error);
    }
  };

  const deleteBot = async (botId: string) => {
    try {
      const { error } = await supabase
        .from("bot_configs")
        .delete()
        .eq("id", botId);

      if (error) throw error;

      setBots(bots.filter(bot => bot.id !== botId));
      toast({
        title: "Bot deleted",
        description: "Trading bot has been removed.",
      });
    } catch (error) {
      console.error("Error deleting bot:", error);
    }
  };

  const useSampleBot = (sample: typeof sampleBots[0]) => {
    setNewBot({
      ...newBot,
      name: sample.name,
      description: sample.description,
      xml_content: sample.xml_content,
      trade_type: sample.trade_type,
      asset: sample.asset,
      stake_amount: sample.stake_amount,
      stop_loss_percentage: sample.stop_loss_percentage,
      take_profit_percentage: sample.take_profit_percentage
    });
  };

  const viewBotDetails = (bot: BotConfig) => {
    setSelectedBot(bot);
    setShowDetailsDialog(true);
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.name.endsWith('.xml')) {
      toast({
        title: "Invalid file type",
        description: "Please upload an XML file exported from DBot",
        variant: "destructive",
      });
      return;
    }

    // Validate file size (max 1MB)
    if (file.size > 1024 * 1024) {
      toast({
        title: "File too large",
        description: "Maximum file size is 1MB",
        variant: "destructive",
      });
      return;
    }

    setIsUploading(true);
    const reader = new FileReader();
    
    reader.onload = (e) => {
      const content = e.target?.result as string;
      
      // Basic XML validation
      if (!content.includes('<?xml') && !content.includes('<xml')) {
        toast({
          title: "Invalid XML",
          description: "The file doesn't appear to be valid DBot XML",
          variant: "destructive",
        });
        setIsUploading(false);
        return;
      }

      setNewBot(prev => ({ ...prev, xml_content: content }));
      setUploadedFileName(file.name);
      
      // Try to extract bot name from file name
      const baseName = file.name.replace('.xml', '').replace(/_/g, ' ').replace(/-/g, ' ');
      if (!newBot.name) {
        setNewBot(prev => ({ ...prev, name: baseName }));
      }

      toast({
        title: "File uploaded",
        description: `${file.name} has been loaded successfully`,
      });
      setIsUploading(false);
    };

    reader.onerror = () => {
      toast({
        title: "Upload failed",
        description: "Failed to read the file",
        variant: "destructive",
      });
      setIsUploading(false);
    };

    reader.readAsText(file);
  };

  const triggerFileUpload = () => {
    fileInputRef.current?.click();
  };

  const activeBots = bots.filter(b => b.is_active);
  const totalPnL = executions.reduce((sum, e) => sum + Number(e.profit_loss), 0);
  const totalTrades = executions.reduce((sum, e) => sum + e.trades_count, 0);
  const winRate = totalTrades > 0 
    ? ((executions.reduce((sum, e) => sum + e.win_count, 0) / totalTrades) * 100).toFixed(1)
    : "0";

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
              <Bot className="w-6 h-6 text-primary" />
              Advanced Trading Bots
            </h1>
            <p className="text-muted-foreground mt-1">
              Create, configure, and manage automated trading strategies
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={fetchBots} className="gap-2">
              <RefreshCw className="w-4 h-4" />
              Refresh
            </Button>
            <Dialog open={showDialog} onOpenChange={setShowDialog}>
              <DialogTrigger asChild>
                <Button variant="gradient" className="gap-2">
                  <Plus className="w-4 h-4" />
                  Create Bot
                </Button>
              </DialogTrigger>
              <DialogContent className="glass border-border max-w-3xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle className="flex items-center gap-2">
                    <Cpu className="w-5 h-5 text-primary" />
                    Create Trading Bot
                  </DialogTitle>
                  <DialogDescription>
                    Configure your automated trading strategy with advanced settings
                  </DialogDescription>
                </DialogHeader>
                
                <Tabs defaultValue="basic" className="mt-4">
                  <TabsList className="bg-secondary">
                    <TabsTrigger value="basic">Basic Info</TabsTrigger>
                    <TabsTrigger value="strategy">Strategy</TabsTrigger>
                    <TabsTrigger value="risk">Risk Management</TabsTrigger>
                    <TabsTrigger value="templates">Templates</TabsTrigger>
                  </TabsList>

                  <TabsContent value="basic" className="space-y-4 py-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Bot Name *</Label>
                        <Input
                          value={newBot.name}
                          onChange={(e) => setNewBot({ ...newBot, name: e.target.value })}
                          placeholder="My Trading Bot"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Asset</Label>
                        <Select value={newBot.asset} onValueChange={(v) => setNewBot({ ...newBot, asset: v })}>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent className="max-h-60">
                            {assetOptions.map((asset) => (
                              <SelectItem key={asset.value} value={asset.value}>
                                <span className="flex items-center gap-2">
                                  <span>{asset.label}</span>
                                  <Badge variant="outline" className="text-xs">{asset.category}</Badge>
                                </span>
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label>Trade Type</Label>
                      <Select value={newBot.trade_type} onValueChange={(v) => setNewBot({ ...newBot, trade_type: v })}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="max-h-60">
                          {tradeTypeOptions.map((type) => (
                            <SelectItem key={type.value} value={type.value}>
                              <span className="flex items-center gap-2">
                                <span>{type.label}</span>
                                <Badge variant="outline" className="text-xs">{type.category}</Badge>
                              </span>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label>Description</Label>
                      <Input
                        value={newBot.description}
                        onChange={(e) => setNewBot({ ...newBot, description: e.target.value })}
                        placeholder="Brief description of your bot strategy"
                      />
                    </div>
                  </TabsContent>

                  <TabsContent value="strategy" className="space-y-4 py-4">
                    {/* File Upload Section */}
                    <div className="rounded-xl border-2 border-dashed border-border p-6 text-center hover:border-primary/50 transition-colors">
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept=".xml"
                        onChange={handleFileUpload}
                        className="hidden"
                      />
                      <div className="space-y-4">
                        <div className="mx-auto w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
                          {isUploading ? (
                            <Loader2 className="w-8 h-8 text-primary animate-spin" />
                          ) : uploadedFileName ? (
                            <Check className="w-8 h-8 text-success" />
                          ) : (
                            <Upload className="w-8 h-8 text-primary" />
                          )}
                        </div>
                        <div>
                          <h4 className="font-semibold text-foreground">
                            {uploadedFileName ? uploadedFileName : "Upload DBot XML File"}
                          </h4>
                          <p className="text-sm text-muted-foreground mt-1">
                            {uploadedFileName 
                              ? "File loaded successfully. You can upload a different file or paste XML below."
                              : "Export your strategy from Deriv DBot and upload the XML file"}
                          </p>
                        </div>
                        <Button
                          type="button"
                          variant="outline"
                          onClick={triggerFileUpload}
                          disabled={isUploading}
                          className="gap-2"
                        >
                          <FileText className="w-4 h-4" />
                          {uploadedFileName ? "Upload Different File" : "Choose XML File"}
                        </Button>
                      </div>
                    </div>

                    <div className="relative">
                      <div className="absolute inset-0 flex items-center">
                        <span className="w-full border-t border-border" />
                      </div>
                      <div className="relative flex justify-center text-xs uppercase">
                        <span className="bg-background px-2 text-muted-foreground">Or paste XML directly</span>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label>XML Configuration *</Label>
                      <Textarea
                        value={newBot.xml_content}
                        onChange={(e) => {
                          setNewBot({ ...newBot, xml_content: e.target.value });
                          setUploadedFileName(null);
                        }}
                        placeholder="Paste your DBot XML configuration here..."
                        rows={10}
                        className="font-mono text-sm"
                      />
                    </div>

                    <div className="flex items-center justify-between rounded-lg border border-border p-4">
                      <div>
                        <Label>Enable Scheduling</Label>
                        <p className="text-xs text-muted-foreground">Run bot at specific times</p>
                      </div>
                      <Switch
                        checked={newBot.schedule_enabled}
                        onCheckedChange={(checked) => setNewBot({ ...newBot, schedule_enabled: checked })}
                      />
                    </div>

                    {newBot.schedule_enabled && (
                      <div className="space-y-2">
                        <Label>Schedule (Cron Expression)</Label>
                        <Input
                          value={newBot.schedule_cron}
                          onChange={(e) => setNewBot({ ...newBot, schedule_cron: e.target.value })}
                          placeholder="0 9 * * 1-5 (Mon-Fri at 9 AM)"
                        />
                        <p className="text-xs text-muted-foreground">
                          Use cron syntax: minute hour day month weekday
                        </p>
                      </div>
                    )}
                  </TabsContent>

                  <TabsContent value="risk" className="space-y-6 py-4">
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <Label>Stake Amount ($)</Label>
                          <span className="text-sm font-medium text-primary">${newBot.stake_amount}</span>
                        </div>
                        <Slider
                          value={[newBot.stake_amount]}
                          onValueChange={([v]) => setNewBot({ ...newBot, stake_amount: v })}
                          max={100}
                          min={0.1}
                          step={0.1}
                          className="py-2"
                        />
                      </div>

                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <Label className="flex items-center gap-2">
                            <Shield className="w-4 h-4 text-destructive" />
                            Stop Loss (%)
                          </Label>
                          <span className="text-sm font-medium text-destructive">{newBot.stop_loss_percentage}%</span>
                        </div>
                        <Slider
                          value={[newBot.stop_loss_percentage]}
                          onValueChange={([v]) => setNewBot({ ...newBot, stop_loss_percentage: v })}
                          max={50}
                          min={1}
                          step={1}
                          className="py-2"
                        />
                        <p className="text-xs text-muted-foreground">Stop trading when losses reach this % of balance</p>
                      </div>

                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <Label className="flex items-center gap-2">
                            <Target className="w-4 h-4 text-success" />
                            Take Profit (%)
                          </Label>
                          <span className="text-sm font-medium text-success">{newBot.take_profit_percentage}%</span>
                        </div>
                        <Slider
                          value={[newBot.take_profit_percentage]}
                          onValueChange={([v]) => setNewBot({ ...newBot, take_profit_percentage: v })}
                          max={100}
                          min={5}
                          step={5}
                          className="py-2"
                        />
                        <p className="text-xs text-muted-foreground">Stop trading when profits reach this % of balance</p>
                      </div>

                      <div className="space-y-2">
                        <Label>Max Daily Trades</Label>
                        <Input
                          type="number"
                          value={newBot.max_daily_trades}
                          onChange={(e) => setNewBot({ ...newBot, max_daily_trades: parseInt(e.target.value) || 100 })}
                          placeholder="100"
                        />
                        <p className="text-xs text-muted-foreground">Maximum trades per day before auto-stop</p>
                      </div>
                    </div>
                  </TabsContent>

                  <TabsContent value="templates" className="space-y-4 py-4">
                    <p className="text-sm text-muted-foreground">
                      Quick start with pre-configured trading strategies
                    </p>
                    <div className="grid gap-3">
                      {sampleBots.map((sample, index) => (
                        <button
                          key={index}
                          onClick={() => useSampleBot(sample)}
                          className="flex items-center gap-4 p-4 rounded-xl border border-border hover:border-primary/50 hover:bg-secondary/50 transition-all text-left group"
                        >
                          <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                            <Zap className="w-6 h-6 text-primary" />
                          </div>
                          <div className="flex-1">
                            <p className="font-semibold">{sample.name}</p>
                            <p className="text-sm text-muted-foreground">{sample.description}</p>
                            <div className="flex gap-2 mt-2">
                              <Badge variant="outline" className="text-xs">{sample.asset}</Badge>
                              <Badge variant="secondary" className="text-xs">{sample.trade_type}</Badge>
                              <Badge variant="outline" className="text-xs">SL: {sample.stop_loss_percentage}%</Badge>
                              <Badge variant="outline" className="text-xs">TP: {sample.take_profit_percentage}%</Badge>
                            </div>
                          </div>
                          <Copy className="w-5 h-5 text-muted-foreground group-hover:text-primary" />
                        </button>
                      ))}
                    </div>
                  </TabsContent>
                </Tabs>

                <div className="flex justify-end gap-3 pt-4 border-t border-border">
                  <Button variant="outline" onClick={() => setShowDialog(false)}>
                    Cancel
                  </Button>
                  <Button 
                    variant="gradient" 
                    onClick={createBot}
                    disabled={!newBot.name || !newBot.xml_content || isCreating}
                  >
                    {isCreating ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Creating...
                      </>
                    ) : (
                      <>
                        <Cpu className="w-4 h-4 mr-2" />
                        Create Bot
                      </>
                    )}
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {/* Stats */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
          <Card className="glass border-border">
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center">
                  <Cpu className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{bots.length}</p>
                  <p className="text-sm text-muted-foreground">Total Bots</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="glass border-border">
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="h-12 w-12 rounded-xl bg-success/10 flex items-center justify-center">
                  <Activity className="h-6 w-6 text-success" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{activeBots.length}</p>
                  <p className="text-sm text-muted-foreground">Active Now</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="glass border-border">
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="h-12 w-12 rounded-xl bg-accent/10 flex items-center justify-center">
                  <BarChart3 className="h-6 w-6 text-accent" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{totalTrades}</p>
                  <p className="text-sm text-muted-foreground">Total Trades</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="glass border-border">
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="h-12 w-12 rounded-xl bg-warning/10 flex items-center justify-center">
                  <Target className="h-6 w-6 text-warning" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{winRate}%</p>
                  <p className="text-sm text-muted-foreground">Win Rate</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className={`glass border-border ${totalPnL >= 0 ? 'bg-success/5' : 'bg-destructive/5'}`}>
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className={`h-12 w-12 rounded-xl flex items-center justify-center ${totalPnL >= 0 ? 'bg-success/10' : 'bg-destructive/10'}`}>
                  <TrendingUp className={`h-6 w-6 ${totalPnL >= 0 ? 'text-success' : 'text-destructive'}`} />
                </div>
                <div>
                  <p className={`text-2xl font-bold ${totalPnL >= 0 ? 'text-success' : 'text-destructive'}`}>
                    {totalPnL >= 0 ? '+' : ''}{totalPnL.toFixed(2)}
                  </p>
                  <p className="text-sm text-muted-foreground">Total P&L</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="bg-secondary">
            <TabsTrigger value="my-bots" className="gap-2">
              <Bot className="w-4 h-4" />
              My Bots
            </TabsTrigger>
            <TabsTrigger value="history" className="gap-2">
              <History className="w-4 h-4" />
              Execution History
            </TabsTrigger>
          </TabsList>

          <TabsContent value="my-bots">
            {isLoading ? (
              <div className="flex items-center justify-center h-64">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
              </div>
            ) : bots.length === 0 ? (
              <Card className="glass border-border">
                <CardContent className="py-12">
                  <div className="text-center">
                    <div className="mx-auto mb-4 h-16 w-16 rounded-2xl glass flex items-center justify-center">
                      <Bot className="h-8 w-8 text-muted-foreground" />
                    </div>
                    <h3 className="text-lg font-semibold text-foreground mb-2">No trading bots yet</h3>
                    <p className="text-muted-foreground max-w-sm mx-auto mb-6">
                      Create your first automated trading bot with advanced risk management
                    </p>
                    <Button variant="gradient" onClick={() => setShowDialog(true)} className="gap-2">
                      <Plus className="w-4 h-4" />
                      Create Your First Bot
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                {bots.map((bot) => (
                  <Card key={bot.id} className="glass border-border hover:border-primary/30 transition-colors">
                    <CardHeader className="pb-3">
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-3">
                          <div className={`h-12 w-12 rounded-xl flex items-center justify-center ${
                            bot.is_active ? 'bg-success/20 animate-pulse' : 'bg-secondary'
                          }`}>
                            <FileCode className={`h-6 w-6 ${bot.is_active ? 'text-success' : 'text-muted-foreground'}`} />
                          </div>
                          <div>
                            <CardTitle className="text-base">{bot.name}</CardTitle>
                            <div className="flex gap-2 mt-1">
                              <Badge variant="secondary" className="text-xs">
                                {bot.asset || "N/A"}
                              </Badge>
                              <Badge variant={bot.is_active ? "default" : "outline"} className="text-xs">
                                {bot.is_active ? "Running" : "Stopped"}
                              </Badge>
                            </div>
                          </div>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      {bot.description && (
                        <p className="text-sm text-muted-foreground mb-4 line-clamp-2">
                          {bot.description}
                        </p>
                      )}
                      
                      <div className="grid grid-cols-3 gap-2 mb-4">
                        <div className="text-center p-2 rounded-lg bg-secondary/50">
                          <p className="text-xs text-muted-foreground">Stake</p>
                          <p className="font-semibold">${bot.stake_amount || 1}</p>
                        </div>
                        <div className="text-center p-2 rounded-lg bg-destructive/10">
                          <p className="text-xs text-muted-foreground">SL</p>
                          <p className="font-semibold text-destructive">{bot.stop_loss_percentage || 10}%</p>
                        </div>
                        <div className="text-center p-2 rounded-lg bg-success/10">
                          <p className="text-xs text-muted-foreground">TP</p>
                          <p className="font-semibold text-success">{bot.take_profit_percentage || 20}%</p>
                        </div>
                      </div>

                      <div className="flex items-center justify-between pt-3 border-t border-border">
                        <div className="flex items-center gap-2">
                          <Button 
                            size="sm" 
                            variant={bot.is_active ? "outline" : "default"}
                            onClick={() => toggleBot(bot.id, bot.is_active)}
                            className="gap-1"
                          >
                            {bot.is_active ? (
                              <>
                                <Pause className="w-3 h-3" />
                                Stop
                              </>
                            ) : (
                              <>
                                <Play className="w-3 h-3" />
                                Start
                              </>
                            )}
                          </Button>
                          <Button 
                            size="sm" 
                            variant="ghost"
                            onClick={() => viewBotDetails(bot)}
                          >
                            <Eye className="w-4 h-4" />
                          </Button>
                        </div>
                        <Button 
                          size="sm" 
                          variant="ghost" 
                          className="text-destructive hover:text-destructive"
                          onClick={() => deleteBot(bot.id)}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="history">
            <Card className="glass border-border">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <History className="w-5 h-5 text-primary" />
                  Execution History
                </CardTitle>
                <CardDescription>View past bot execution logs and performance</CardDescription>
              </CardHeader>
              <CardContent>
                {executions.length === 0 ? (
                  <div className="text-center py-8">
                    <Clock className="w-12 h-12 mx-auto text-muted-foreground mb-3" />
                    <p className="text-muted-foreground">No execution history yet</p>
                    <p className="text-sm text-muted-foreground">Start a bot to see execution logs here</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {executions.map((exec) => {
                      const bot = bots.find(b => b.id === exec.bot_id);
                      return (
                        <div key={exec.id} className="flex items-center justify-between p-4 rounded-lg bg-secondary/50 border border-border">
                          <div className="flex items-center gap-3">
                            <div className={`h-10 w-10 rounded-lg flex items-center justify-center ${
                              exec.status === 'running' ? 'bg-success/20' : 
                              exec.status === 'completed' ? 'bg-primary/20' : 'bg-destructive/20'
                            }`}>
                              <Activity className={`w-5 h-5 ${
                                exec.status === 'running' ? 'text-success' : 
                                exec.status === 'completed' ? 'text-primary' : 'text-destructive'
                              }`} />
                            </div>
                            <div>
                              <p className="font-medium">{bot?.name || 'Unknown Bot'}</p>
                              <div className="flex gap-2 mt-1">
                                <Badge variant={
                                  exec.status === 'running' ? 'default' : 
                                  exec.status === 'completed' ? 'secondary' : 'destructive'
                                } className="text-xs">
                                  {exec.status}
                                </Badge>
                                <span className="text-xs text-muted-foreground">
                                  {new Date(exec.started_at).toLocaleString()}
                                </span>
                              </div>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className={`font-semibold ${Number(exec.profit_loss) >= 0 ? 'text-success' : 'text-destructive'}`}>
                              {Number(exec.profit_loss) >= 0 ? '+' : ''}{Number(exec.profit_loss).toFixed(2)}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {exec.win_count}W / {exec.loss_count}L
                            </p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Bot Details Dialog */}
        <Dialog open={showDetailsDialog} onOpenChange={setShowDetailsDialog}>
          <DialogContent className="glass border-border max-w-2xl">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Settings className="w-5 h-5 text-primary" />
                {selectedBot?.name}
              </DialogTitle>
              <DialogDescription>
                Bot configuration and XML details
              </DialogDescription>
            </DialogHeader>
            {selectedBot && (
              <div className="space-y-4 py-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <Label className="text-muted-foreground">Asset</Label>
                    <p className="font-medium">{selectedBot.asset}</p>
                  </div>
                  <div className="space-y-1">
                    <Label className="text-muted-foreground">Trade Type</Label>
                    <p className="font-medium">{selectedBot.trade_type}</p>
                  </div>
                  <div className="space-y-1">
                    <Label className="text-muted-foreground">Stake Amount</Label>
                    <p className="font-medium">${selectedBot.stake_amount}</p>
                  </div>
                  <div className="space-y-1">
                    <Label className="text-muted-foreground">Max Daily Trades</Label>
                    <p className="font-medium">{selectedBot.max_daily_trades}</p>
                  </div>
                  <div className="space-y-1">
                    <Label className="text-muted-foreground">Stop Loss</Label>
                    <p className="font-medium text-destructive">{selectedBot.stop_loss_percentage}%</p>
                  </div>
                  <div className="space-y-1">
                    <Label className="text-muted-foreground">Take Profit</Label>
                    <p className="font-medium text-success">{selectedBot.take_profit_percentage}%</p>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>XML Configuration</Label>
                  <pre className="p-4 rounded-lg bg-secondary/50 border border-border overflow-x-auto text-xs font-mono max-h-64">
                    {selectedBot.xml_content}
                  </pre>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
};

export default Bots;
