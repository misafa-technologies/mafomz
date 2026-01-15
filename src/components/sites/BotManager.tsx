import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
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
  DialogFooter,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { 
  Bot, 
  Edit, 
  Trash2, 
  Download, 
  MoreVertical, 
  DollarSign,
  TrendingUp,
  Shield,
  Loader2,
  Eye,
  EyeOff,
  Play,
  Square,
  BarChart3,
  Settings
} from "lucide-react";
import { toast } from "sonner";
import { BotStoreUploader } from "@/components/bots/BotStoreUploader";

interface BotConfig {
  id: string;
  name: string;
  description: string | null;
  asset: string | null;
  trade_type: string | null;
  stake_amount: number | null;
  stop_loss_percentage: number | null;
  take_profit_percentage: number | null;
  max_daily_trades: number | null;
  is_active: boolean | null;
  xml_content: string;
  created_at: string;
}

interface StoreEntry {
  id: string;
  price: number | null;
  is_public: boolean | null;
  downloads_count: number | null;
}

interface BotWithStore extends BotConfig {
  store?: StoreEntry;
}

interface BotManagerProps {
  siteId: string;
}

const assetLabels: Record<string, string> = {
  R_10: "Volatility 10",
  R_25: "Volatility 25",
  R_50: "Volatility 50",
  R_75: "Volatility 75",
  R_100: "Volatility 100",
  "1HZ10V": "V10 (1s)",
  "1HZ25V": "V25 (1s)",
  "1HZ50V": "V50 (1s)",
  "1HZ75V": "V75 (1s)",
  "1HZ100V": "V100 (1s)",
  BOOM1000: "Boom 1000",
  BOOM500: "Boom 500",
  CRASH1000: "Crash 1000",
  CRASH500: "Crash 500",
};

const strategyLabels: Record<string, string> = {
  martingale: "Martingale",
  anti_martingale: "Anti-Martingale",
  fixed: "Fixed Stake",
  compound: "Compound",
  ai_smart: "AI Smart",
};

export function BotManager({ siteId }: BotManagerProps) {
  const [bots, setBots] = useState<BotWithStore[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [editingBot, setEditingBot] = useState<BotWithStore | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const fetchBots = async () => {
    try {
      // Fetch bot configs for this site
      const { data: botConfigs, error: botsError } = await supabase
        .from("bot_configs")
        .select("*")
        .eq("site_id", siteId)
        .order("created_at", { ascending: false });

      if (botsError) throw botsError;

      // Fetch store entries
      const { data: storeEntries, error: storeError } = await supabase
        .from("site_bot_store")
        .select("*")
        .eq("site_id", siteId);

      if (storeError) throw storeError;

      // Combine bot configs with store data
      const botsWithStore: BotWithStore[] = (botConfigs || []).map(bot => {
        const store = storeEntries?.find(s => s.bot_id === bot.id);
        return { ...bot, store };
      });

      setBots(botsWithStore);
    } catch (error) {
      console.error("Error fetching bots:", error);
      toast.error("Failed to load bots");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchBots();
  }, [siteId]);

  const handleUpdateBot = async () => {
    if (!editingBot) return;

    setIsSaving(true);
    try {
      // Update bot config
      const { error: botError } = await supabase
        .from("bot_configs")
        .update({
          name: editingBot.name,
          description: editingBot.description,
          asset: editingBot.asset,
          trade_type: editingBot.trade_type,
          stake_amount: editingBot.stake_amount,
          stop_loss_percentage: editingBot.stop_loss_percentage,
          take_profit_percentage: editingBot.take_profit_percentage,
          max_daily_trades: editingBot.max_daily_trades,
          is_active: editingBot.is_active,
        })
        .eq("id", editingBot.id);

      if (botError) throw botError;

      // Update store entry if exists
      if (editingBot.store) {
        const { error: storeError } = await supabase
          .from("site_bot_store")
          .update({
            price: editingBot.store.price,
            is_public: editingBot.store.is_public,
          })
          .eq("id", editingBot.store.id);

        if (storeError) throw storeError;
      }

      toast.success("Bot updated successfully");
      setEditingBot(null);
      fetchBots();
    } catch (error) {
      console.error("Error updating bot:", error);
      toast.error("Failed to update bot");
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteBot = async (botId: string) => {
    try {
      // Delete store entry first
      await supabase
        .from("site_bot_store")
        .delete()
        .eq("bot_id", botId);

      // Delete bot config
      const { error } = await supabase
        .from("bot_configs")
        .delete()
        .eq("id", botId);

      if (error) throw error;

      toast.success("Bot deleted");
      fetchBots();
    } catch (error) {
      console.error("Error deleting bot:", error);
      toast.error("Failed to delete bot");
    }
  };

  const handleToggleVisibility = async (bot: BotWithStore) => {
    if (!bot.store) return;

    try {
      const { error } = await supabase
        .from("site_bot_store")
        .update({ is_public: !bot.store.is_public })
        .eq("id", bot.store.id);

      if (error) throw error;
      toast.success(bot.store.is_public ? "Bot hidden from store" : "Bot visible in store");
      fetchBots();
    } catch (error) {
      toast.error("Failed to update visibility");
    }
  };

  if (isLoading) {
    return (
      <Card className="glass border-border">
        <CardContent className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card className="glass border-border">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Bot className="w-5 h-5 text-primary" />
                Bot Store Management
                <Badge variant="outline" className="ml-2">{bots.length} bots</Badge>
              </CardTitle>
              <CardDescription>
                Create, manage, and publish trading bots for your site visitors
              </CardDescription>
            </div>
            <BotStoreUploader siteId={siteId} onSuccess={fetchBots} />
          </div>
        </CardHeader>
      </Card>

      {/* Bot List */}
      {bots.length === 0 ? (
        <Card className="glass border-border">
          <CardContent className="py-12 text-center">
            <Bot className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium mb-2">No bots yet</h3>
            <p className="text-muted-foreground mb-4">
              Publish your first trading bot to the store
            </p>
            <BotStoreUploader siteId={siteId} onSuccess={fetchBots} />
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {bots.map((bot) => (
            <Card key={bot.id} className="glass border-border">
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-4">
                    <div className="p-3 rounded-lg bg-primary/10">
                      <Bot className="w-6 h-6 text-primary" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold">{bot.name}</h3>
                        {bot.is_active && (
                          <Badge variant="default" className="gap-1">
                            <Play className="w-3 h-3" />
                            Active
                          </Badge>
                        )}
                        {bot.store?.is_public ? (
                          <Badge variant="outline" className="gap-1">
                            <Eye className="w-3 h-3" />
                            Public
                          </Badge>
                        ) : bot.store && (
                          <Badge variant="secondary" className="gap-1">
                            <EyeOff className="w-3 h-3" />
                            Hidden
                          </Badge>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground mt-1">
                        {bot.description || "No description"}
                      </p>
                      
                      <div className="flex flex-wrap gap-4 mt-3 text-sm">
                        <div className="flex items-center gap-1">
                          <TrendingUp className="w-4 h-4 text-muted-foreground" />
                          <span>{assetLabels[bot.asset || ""] || bot.asset || "N/A"}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Settings className="w-4 h-4 text-muted-foreground" />
                          <span>{strategyLabels[bot.trade_type || ""] || bot.trade_type || "N/A"}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <DollarSign className="w-4 h-4 text-muted-foreground" />
                          <span>${bot.stake_amount?.toFixed(2) || "1.00"} stake</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Shield className="w-4 h-4 text-muted-foreground" />
                          <span>{bot.stop_loss_percentage || 15}% SL / {bot.take_profit_percentage || 25}% TP</span>
                        </div>
                      </div>

                      {bot.store && (
                        <div className="flex items-center gap-4 mt-3 pt-3 border-t">
                          <div className="flex items-center gap-1">
                            <DollarSign className="w-4 h-4 text-green-500" />
                            <span className="font-medium">
                              {bot.store.price ? `$${bot.store.price.toFixed(2)}` : "Free"}
                            </span>
                          </div>
                          <div className="flex items-center gap-1">
                            <Download className="w-4 h-4 text-muted-foreground" />
                            <span>{bot.store.downloads_count || 0} downloads</span>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    {bot.store && (
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleToggleVisibility(bot)}
                        title={bot.store.is_public ? "Hide from store" : "Show in store"}
                      >
                        {bot.store.is_public ? (
                          <EyeOff className="w-4 h-4" />
                        ) : (
                          <Eye className="w-4 h-4" />
                        )}
                      </Button>
                    )}
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => setEditingBot(bot)}
                    >
                      <Edit className="w-4 h-4" />
                    </Button>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="ghost" size="icon" className="text-destructive">
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Delete Bot?</AlertDialogTitle>
                          <AlertDialogDescription>
                            This will permanently delete "{bot.name}" from your store.
                            This action cannot be undone.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction
                            onClick={() => handleDeleteBot(bot.id)}
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                          >
                            Delete
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Edit Dialog */}
      <Dialog open={!!editingBot} onOpenChange={(open) => !open && setEditingBot(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Edit className="w-5 h-5" />
              Edit Bot
            </DialogTitle>
            <DialogDescription>
              Update your bot's configuration and store settings
            </DialogDescription>
          </DialogHeader>

          {editingBot && (
            <ScrollArea className="max-h-[60vh]">
              <div className="space-y-6 p-1">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Bot Name</Label>
                    <Input
                      value={editingBot.name}
                      onChange={(e) => setEditingBot({ ...editingBot, name: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Asset</Label>
                    <Select
                      value={editingBot.asset || "R_100"}
                      onValueChange={(v) => setEditingBot({ ...editingBot, asset: v })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {Object.entries(assetLabels).map(([value, label]) => (
                          <SelectItem key={value} value={value}>{label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Description</Label>
                  <Textarea
                    value={editingBot.description || ""}
                    onChange={(e) => setEditingBot({ ...editingBot, description: e.target.value })}
                    rows={2}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Strategy</Label>
                    <Select
                      value={editingBot.trade_type || "ai_smart"}
                      onValueChange={(v) => setEditingBot({ ...editingBot, trade_type: v })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {Object.entries(strategyLabels).map(([value, label]) => (
                          <SelectItem key={value} value={value}>{label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Stake Amount ($)</Label>
                    <Input
                      type="number"
                      min={0.35}
                      step={0.01}
                      value={editingBot.stake_amount || 1}
                      onChange={(e) => setEditingBot({ 
                        ...editingBot, 
                        stake_amount: parseFloat(e.target.value) || 1 
                      })}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label>Stop Loss (%)</Label>
                    <Input
                      type="number"
                      min={1}
                      max={100}
                      value={editingBot.stop_loss_percentage || 15}
                      onChange={(e) => setEditingBot({ 
                        ...editingBot, 
                        stop_loss_percentage: parseFloat(e.target.value) || 15 
                      })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Take Profit (%)</Label>
                    <Input
                      type="number"
                      min={1}
                      max={1000}
                      value={editingBot.take_profit_percentage || 25}
                      onChange={(e) => setEditingBot({ 
                        ...editingBot, 
                        take_profit_percentage: parseFloat(e.target.value) || 25 
                      })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Max Daily Trades</Label>
                    <Input
                      type="number"
                      min={1}
                      max={1000}
                      value={editingBot.max_daily_trades || 50}
                      onChange={(e) => setEditingBot({ 
                        ...editingBot, 
                        max_daily_trades: parseInt(e.target.value) || 50 
                      })}
                    />
                  </div>
                </div>

                {editingBot.store && (
                  <div className="pt-4 border-t space-y-4">
                    <h4 className="font-medium">Store Settings</h4>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Price ($)</Label>
                        <Input
                          type="number"
                          min={0}
                          step={0.01}
                          value={editingBot.store.price || 0}
                          onChange={(e) => setEditingBot({ 
                            ...editingBot, 
                            store: { ...editingBot.store!, price: parseFloat(e.target.value) || 0 }
                          })}
                        />
                      </div>
                      <div className="flex items-center justify-between p-3 rounded-lg border">
                        <div>
                          <Label>Public in Store</Label>
                          <p className="text-xs text-muted-foreground">Visible to all visitors</p>
                        </div>
                        <Switch
                          checked={editingBot.store.is_public || false}
                          onCheckedChange={(checked) => setEditingBot({
                            ...editingBot,
                            store: { ...editingBot.store!, is_public: checked }
                          })}
                        />
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </ScrollArea>
          )}

          <DialogFooter>
            <Button variant="ghost" onClick={() => setEditingBot(null)}>
              Cancel
            </Button>
            <Button onClick={handleUpdateBot} disabled={isSaving}>
              {isSaving ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                "Save Changes"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
