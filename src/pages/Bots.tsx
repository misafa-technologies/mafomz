import { useState, useEffect } from "react";
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
  TrendingUp
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
}

const sampleBots = [
  {
    name: "Digits Even/Odd",
    description: "A simple bot that trades on even/odd digit outcomes",
    trade_type: "digits",
    asset: "R_100",
    xml_content: `<?xml version="1.0" encoding="UTF-8"?>
<xml xmlns="https://developers.google.com/blockly/xml">
  <block type="trade" id="root">
    <field name="TRADETYPE">digiteven</field>
    <field name="SYMBOL">R_100</field>
    <field name="DURATION">5</field>
    <field name="DURTYPE">tick</field>
    <field name="STAKE">1</field>
  </block>
</xml>`
  },
  {
    name: "Martingale Strategy",
    description: "Doubles stake after each loss to recover previous losses",
    trade_type: "higher_lower",
    asset: "R_50",
    xml_content: `<?xml version="1.0" encoding="UTF-8"?>
<xml xmlns="https://developers.google.com/blockly/xml">
  <block type="trade" id="root">
    <field name="TRADETYPE">call</field>
    <field name="SYMBOL">R_50</field>
    <field name="DURATION">5</field>
    <field name="DURTYPE">tick</field>
    <statement name="MARTINGALE">true</statement>
  </block>
</xml>`
  },
  {
    name: "Rise/Fall Trend",
    description: "Follows market trends for rise/fall contracts",
    trade_type: "higher_lower",
    asset: "R_75",
    xml_content: `<?xml version="1.0" encoding="UTF-8"?>
<xml xmlns="https://developers.google.com/blockly/xml">
  <block type="trade" id="root">
    <field name="TRADETYPE">rise_fall</field>
    <field name="SYMBOL">R_75</field>
    <field name="DURATION">15</field>
    <field name="DURTYPE">minutes</field>
  </block>
</xml>`
  }
];

const Bots = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [bots, setBots] = useState<BotConfig[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);
  const [showDialog, setShowDialog] = useState(false);
  const [newBot, setNewBot] = useState({
    name: "",
    description: "",
    xml_content: "",
    trade_type: "digits",
    asset: "R_100"
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
          is_active: false
        });

      if (error) throw error;

      toast({
        title: "Bot created",
        description: "Your trading bot has been saved successfully.",
      });

      setShowDialog(false);
      setNewBot({ name: "", description: "", xml_content: "", trade_type: "digits", asset: "R_100" });
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

      setBots(bots.map(bot => 
        bot.id === botId ? { ...bot, is_active: !isActive } : bot
      ));

      toast({
        title: isActive ? "Bot paused" : "Bot activated",
        description: isActive ? "Trading bot has been paused." : "Trading bot is now active.",
      });
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
      name: sample.name,
      description: sample.description,
      xml_content: sample.xml_content,
      trade_type: sample.trade_type,
      asset: sample.asset
    });
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
              <Bot className="w-6 h-6 text-primary" />
              XML Trading Bots
            </h1>
            <p className="text-muted-foreground mt-1">
              Create and manage automated trading bots for your sites
            </p>
          </div>
          <Dialog open={showDialog} onOpenChange={setShowDialog}>
            <DialogTrigger asChild>
              <Button variant="gradient" className="gap-2">
                <Plus className="w-4 h-4" />
                Create Bot
              </Button>
            </DialogTrigger>
            <DialogContent className="glass border-border max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Create Trading Bot</DialogTitle>
                <DialogDescription>
                  Configure your XML trading bot settings
                </DialogDescription>
              </DialogHeader>
              
              <div className="space-y-4 py-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Bot Name</Label>
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
                      <SelectContent>
                        <SelectItem value="R_10">Volatility 10 Index</SelectItem>
                        <SelectItem value="R_25">Volatility 25 Index</SelectItem>
                        <SelectItem value="R_50">Volatility 50 Index</SelectItem>
                        <SelectItem value="R_75">Volatility 75 Index</SelectItem>
                        <SelectItem value="R_100">Volatility 100 Index</SelectItem>
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
                    <SelectContent>
                      <SelectItem value="digits">Digits (Even/Odd, Over/Under)</SelectItem>
                      <SelectItem value="higher_lower">Higher/Lower (Rise/Fall)</SelectItem>
                      <SelectItem value="touch">Touch/No Touch</SelectItem>
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

                <div className="space-y-2">
                  <Label>XML Configuration</Label>
                  <Textarea
                    value={newBot.xml_content}
                    onChange={(e) => setNewBot({ ...newBot, xml_content: e.target.value })}
                    placeholder="Paste your DBot XML here..."
                    rows={8}
                    className="font-mono text-sm"
                  />
                </div>

                <div className="space-y-2">
                  <Label>Quick Templates</Label>
                  <div className="grid gap-2">
                    {sampleBots.map((sample, index) => (
                      <button
                        key={index}
                        onClick={() => useSampleBot(sample)}
                        className="flex items-center gap-3 p-3 rounded-lg border border-border hover:border-primary/30 hover:bg-secondary/50 transition-colors text-left"
                      >
                        <Copy className="w-4 h-4 text-primary" />
                        <div>
                          <p className="font-medium text-sm">{sample.name}</p>
                          <p className="text-xs text-muted-foreground">{sample.description}</p>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-3">
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
                    "Create Bot"
                  )}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {/* Stats */}
        <div className="grid gap-4 sm:grid-cols-3">
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
                  <p className="text-2xl font-bold">{bots.filter(b => b.is_active).length}</p>
                  <p className="text-sm text-muted-foreground">Active</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="glass border-border">
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="h-12 w-12 rounded-xl bg-accent/10 flex items-center justify-center">
                  <TrendingUp className="h-6 w-6 text-accent" />
                </div>
                <div>
                  <p className="text-2xl font-bold">0</p>
                  <p className="text-sm text-muted-foreground">Trades Today</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Bots List */}
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
                  Create your first XML trading bot to automate trading on your sites.
                </p>
                <Button variant="gradient" onClick={() => setShowDialog(true)} className="gap-2">
                  <Plus className="w-4 h-4" />
                  Create Your First Bot
                </Button>
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {bots.map((bot) => (
              <Card key={bot.id} className="glass border-border">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className={`h-10 w-10 rounded-lg flex items-center justify-center ${
                        bot.is_active ? 'bg-success/20' : 'bg-secondary'
                      }`}>
                        <FileCode className={`h-5 w-5 ${bot.is_active ? 'text-success' : 'text-muted-foreground'}`} />
                      </div>
                      <div>
                        <CardTitle className="text-base">{bot.name}</CardTitle>
                        <div className="flex gap-2 mt-1">
                          <Badge variant="secondary" className="text-xs">
                            {bot.asset || "N/A"}
                          </Badge>
                          <Badge variant={bot.is_active ? "default" : "outline"} className="text-xs">
                            {bot.is_active ? "Active" : "Paused"}
                          </Badge>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  {bot.description && (
                    <p className="text-sm text-muted-foreground mb-4">
                      {bot.description}
                    </p>
                  )}
                  <div className="flex items-center justify-between pt-2 border-t border-border">
                    <div className="flex items-center gap-2">
                      <Button 
                        size="sm" 
                        variant={bot.is_active ? "outline" : "default"}
                        onClick={() => toggleBot(bot.id, bot.is_active)}
                      >
                        {bot.is_active ? (
                          <>
                            <Pause className="w-3 h-3 mr-1" />
                            Pause
                          </>
                        ) : (
                          <>
                            <Play className="w-3 h-3 mr-1" />
                            Start
                          </>
                        )}
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
      </div>
    </DashboardLayout>
  );
};

export default Bots;