import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  User, 
  Wallet, 
  Bot, 
  BarChart3, 
  TrendingUp, 
  LogOut, 
  Download,
  Play,
  RefreshCw,
  Sparkles,
  Settings,
  Brain,
  Star,
  Clock,
  Zap
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import type { SiteUser } from "./DerivAuthButton";
import { TradingPanel } from "./TradingPanel";
import { AITradingBot } from "./AITradingBot";
import { toast } from "sonner";

interface SiteUserDashboardProps {
  user: SiteUser;
  siteId: string;
  siteName: string;
  primaryColor: string;
  secondaryColor: string;
  darkMode: boolean;
  apps: string[];
  onLogout: () => void;
}

interface StoreBot {
  id: string;
  bot_id: string;
  price: number;
  downloads_count: number;
  bot_configs: {
    name: string;
    description: string;
    asset: string;
    trade_type: string;
    stake_amount: number;
    max_daily_trades: number;
    stop_loss_percentage: number;
    take_profit_percentage: number;
  };
}

interface AISignal {
  id: string;
  asset: string;
  signal_type: string;
  confidence: number;
  entry_price: number;
  target_price: number;
  stop_loss: number;
  timeframe: string;
  expires_at: string;
}

export function SiteUserDashboard({ 
  user, 
  siteId, 
  siteName,
  primaryColor, 
  secondaryColor,
  darkMode, 
  apps,
  onLogout 
}: SiteUserDashboardProps) {
  const [storeBots, setStoreBots] = useState<StoreBot[]>([]);
  const [aiSignals, setAiSignals] = useState<AISignal[]>([]);
  const [isLoadingBots, setIsLoadingBots] = useState(true);
  const [isLoadingSignals, setIsLoadingSignals] = useState(true);
  const [selectedBot, setSelectedBot] = useState<StoreBot | null>(null);
  const [userToken, setUserToken] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState("trade");

  useEffect(() => {
    fetchStoreBots();
    fetchAiSignals();
    loadUserToken();
  }, [siteId]);

  const loadUserToken = () => {
    // Try multiple storage keys for backwards compatibility
    const keys = [`site_user_${siteId}`, `site_user_token_${siteId}`];
    for (const key of keys) {
      try {
        const stored = localStorage.getItem(key);
        if (stored) {
          const parsed = JSON.parse(stored);
          if (parsed.token) {
            setUserToken(parsed.token);
            return;
          }
        }
      } catch (e) {
        console.error("Error parsing stored user:", e);
      }
    }
    // Use the token from user object if available
    if (user.token) {
      setUserToken(user.token);
    }
  };

  const fetchStoreBots = async () => {
    try {
      const { data, error } = await supabase
        .from("site_bot_store")
        .select(`
          id,
          bot_id,
          price,
          downloads_count,
          bot_configs (
            name,
            description,
            asset,
            trade_type,
            stake_amount,
            max_daily_trades,
            stop_loss_percentage,
            take_profit_percentage
          )
        `)
        .eq("site_id", siteId)
        .eq("is_public", true);

      if (error) throw error;
      setStoreBots((data as unknown as StoreBot[]) || []);
    } catch (err) {
      console.error("Error fetching store bots:", err);
    } finally {
      setIsLoadingBots(false);
    }
  };

  const fetchAiSignals = async () => {
    try {
      const { data, error } = await supabase
        .from("ai_signals")
        .select("*")
        .eq("site_id", siteId)
        .eq("is_active", true)
        .order("created_at", { ascending: false })
        .limit(10);

      if (error) throw error;
      setAiSignals(data || []);
    } catch (err) {
      console.error("Error fetching AI signals:", err);
    } finally {
      setIsLoadingSignals(false);
    }
  };

  const handleUseBot = async (storeBot: StoreBot) => {
    setSelectedBot(storeBot);
    setActiveTab("ai-bot");
    
    // Increment download count
    try {
      await supabase
        .from("site_bot_store")
        .update({ downloads_count: (storeBot.downloads_count || 0) + 1 })
        .eq("id", storeBot.id);
    } catch (e) {
      console.error("Error updating download count:", e);
    }
    
    toast.success(`${storeBot.bot_configs?.name} loaded!`);
  };

  const cardStyle = {
    backgroundColor: darkMode ? 'rgba(255,255,255,0.05)' : '#fff',
    borderColor: darkMode ? '#333' : '#eee',
    color: darkMode ? '#fff' : '#000',
  };

  return (
    <div className="min-h-screen p-6" style={{ color: darkMode ? '#fff' : '#000' }}>
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div 
              className="w-12 h-12 rounded-full flex items-center justify-center text-white font-bold text-lg"
              style={{ backgroundColor: primaryColor }}
            >
              {user.fullname?.charAt(0) || user.loginid.charAt(0)}
            </div>
            <div>
              <h2 className="text-xl font-bold">{user.fullname || user.loginid}</h2>
              <p className="text-sm opacity-60">{user.email}</p>
            </div>
          </div>
          <Button variant="outline" onClick={onLogout} className="gap-2">
            <LogOut className="w-4 h-4" />
            Sign Out
          </Button>
        </div>

        {/* Balance Card */}
        <Card style={cardStyle}>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm opacity-60">Deriv Account Balance</p>
                <p className="text-3xl font-bold" style={{ color: primaryColor }}>
                  {user.currency} {user.balance.toLocaleString()}
                </p>
                <p className="text-xs opacity-50 mt-1">
                  Account: {user.loginid}
                </p>
              </div>
              <Wallet className="w-12 h-12 opacity-20" />
            </div>
            {user.accounts.length > 1 && (
              <div className="mt-4 flex gap-2 flex-wrap">
                {user.accounts.map((acc) => (
                  <Badge key={acc.loginid} variant="secondary">
                    {acc.loginid} ({acc.currency})
                  </Badge>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Main Content Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
          <TabsList 
            className="w-full justify-start flex-wrap h-auto gap-1 p-1"
            style={{ 
              backgroundColor: darkMode ? 'rgba(255,255,255,0.1)' : '#f5f5f5',
            }}
          >
            <TabsTrigger value="trade" className="gap-2">
              <BarChart3 className="w-4 h-4" /> Trade
            </TabsTrigger>
            <TabsTrigger value="ai-bot" className="gap-2">
              <Brain className="w-4 h-4" /> AI Bot
            </TabsTrigger>
            <TabsTrigger value="bots" className="gap-2">
              <Bot className="w-4 h-4" /> Bot Store
            </TabsTrigger>
            <TabsTrigger value="signals" className="gap-2">
              <TrendingUp className="w-4 h-4" /> Signals
            </TabsTrigger>
          </TabsList>

          {/* Trading Tab */}
          <TabsContent value="trade">
            <TradingPanel 
              userToken={userToken || ""} 
              primaryColor={primaryColor}
              darkMode={darkMode}
            />
          </TabsContent>

          {/* AI Bot Tab */}
          <TabsContent value="ai-bot">
            {userToken ? (
              <AITradingBot
                userToken={userToken}
                primaryColor={primaryColor}
                darkMode={darkMode}
                strategy={selectedBot?.bot_configs?.trade_type as any || "ai_smart"}
                botConfig={selectedBot ? {
                  name: selectedBot.bot_configs.name,
                  asset: selectedBot.bot_configs.asset || "R_100",
                  stake_amount: selectedBot.bot_configs.stake_amount || 1,
                  max_daily_trades: selectedBot.bot_configs.max_daily_trades || 50,
                  stop_loss_percentage: selectedBot.bot_configs.stop_loss_percentage || 15,
                  take_profit_percentage: selectedBot.bot_configs.take_profit_percentage || 25,
                  trade_type: selectedBot.bot_configs.trade_type,
                } : undefined}
              />
            ) : (
              <Card style={cardStyle}>
                <CardContent className="p-12 text-center">
                  <Brain className="w-16 h-16 mx-auto mb-4 opacity-30" />
                  <h3 className="text-lg font-semibold mb-2">AI Trading Bot</h3>
                  <p className="opacity-60 mb-4">
                    Please reconnect your Deriv account to use the AI trading bot
                  </p>
                  <Button onClick={onLogout} variant="outline">
                    Reconnect Account
                  </Button>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* Bot Store Tab */}
          <TabsContent value="bots">
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-semibold flex items-center gap-2">
                  <Bot className="w-5 h-5" style={{ color: primaryColor }} />
                  Trading Bots Store
                </h3>
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={fetchStoreBots}
                  className="gap-2"
                >
                  <RefreshCw className="w-4 h-4" /> Refresh
                </Button>
              </div>

              {isLoadingBots ? (
                <Card style={cardStyle}>
                  <CardContent className="p-6 text-center">
                    <RefreshCw className="w-8 h-8 animate-spin mx-auto opacity-50" />
                    <p className="mt-2 opacity-60">Loading bots...</p>
                  </CardContent>
                </Card>
              ) : storeBots.length === 0 ? (
                <Card style={cardStyle}>
                  <CardContent className="p-12 text-center">
                    <Bot className="w-16 h-16 mx-auto opacity-30" />
                    <h3 className="text-lg font-semibold mt-4 mb-2">No Bots Available Yet</h3>
                    <p className="opacity-60 max-w-md mx-auto">
                      The site owner hasn't published any trading bots yet. 
                      Check back later or use the AI Bot for automated trading.
                    </p>
                    <Button 
                      onClick={() => setActiveTab("ai-bot")} 
                      className="mt-4 gap-2"
                      style={{ backgroundColor: primaryColor }}
                    >
                      <Brain className="w-4 h-4" />
                      Try AI Bot Instead
                    </Button>
                  </CardContent>
                </Card>
              ) : (
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {storeBots.map((storeBot) => (
                    <Card 
                      key={storeBot.id} 
                      style={cardStyle}
                      className="hover:scale-[1.02] transition-transform cursor-pointer overflow-hidden"
                    >
                      <div 
                        className="h-2" 
                        style={{ backgroundColor: primaryColor }}
                      />
                      <CardHeader className="pb-2">
                        <div className="flex items-start justify-between">
                          <div className="flex items-center gap-2">
                            <div 
                              className="w-10 h-10 rounded-lg flex items-center justify-center"
                              style={{ backgroundColor: `${primaryColor}20` }}
                            >
                              <Bot className="w-5 h-5" style={{ color: primaryColor }} />
                            </div>
                            <div>
                              <CardTitle className="text-base">
                                {storeBot.bot_configs?.name || "Trading Bot"}
                              </CardTitle>
                              <p className="text-xs opacity-60">{storeBot.bot_configs?.asset}</p>
                            </div>
                          </div>
                          <Badge 
                            variant={storeBot.price > 0 ? "default" : "secondary"}
                            style={storeBot.price === 0 ? { backgroundColor: '#22c55e', color: '#fff' } : {}}
                          >
                            {storeBot.price > 0 ? `$${storeBot.price}` : 'Free'}
                          </Badge>
                        </div>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        <p className="text-sm opacity-70 line-clamp-2">
                          {storeBot.bot_configs?.description || "AI-powered trading automation"}
                        </p>
                        
                        <div className="flex items-center gap-4 text-xs opacity-60">
                          <span className="flex items-center gap-1">
                            <Download className="w-3 h-3" />
                            {storeBot.downloads_count} uses
                          </span>
                          <span className="flex items-center gap-1">
                            <Zap className="w-3 h-3" />
                            {storeBot.bot_configs?.trade_type?.replace("_", " ") || "AI Smart"}
                          </span>
                        </div>

                        <div className="grid grid-cols-2 gap-2 text-xs p-2 rounded" style={{ backgroundColor: darkMode ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.02)' }}>
                          <div>
                            <span className="opacity-60">Stake:</span>{" "}
                            <span className="font-medium">${storeBot.bot_configs?.stake_amount}</span>
                          </div>
                          <div>
                            <span className="opacity-60">SL:</span>{" "}
                            <span className="font-medium text-red-500">{storeBot.bot_configs?.stop_loss_percentage}%</span>
                          </div>
                        </div>

                        <Button 
                          className="w-full gap-2"
                          style={{ backgroundColor: primaryColor }}
                          onClick={() => handleUseBot(storeBot)}
                        >
                          <Play className="w-4 h-4" />
                          Use This Bot
                        </Button>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </div>
          </TabsContent>

          {/* AI Signals Tab */}
          <TabsContent value="signals">
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-semibold flex items-center gap-2">
                  <Sparkles className="w-5 h-5" style={{ color: primaryColor }} />
                  Live Trading Signals
                </h3>
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={fetchAiSignals}
                  className="gap-2"
                >
                  <RefreshCw className="w-4 h-4" /> Refresh
                </Button>
              </div>

              {isLoadingSignals ? (
                <Card style={cardStyle}>
                  <CardContent className="p-6 text-center">
                    <RefreshCw className="w-8 h-8 animate-spin mx-auto opacity-50" />
                    <p className="mt-2 opacity-60">Loading signals...</p>
                  </CardContent>
                </Card>
              ) : aiSignals.length === 0 ? (
                <Card style={cardStyle}>
                  <CardContent className="p-12 text-center">
                    <TrendingUp className="w-16 h-16 mx-auto opacity-30" />
                    <h3 className="text-lg font-semibold mt-4 mb-2">No Active Signals</h3>
                    <p className="opacity-60 max-w-md mx-auto">
                      AI trading signals will appear here when market conditions are favorable.
                      Use the AI Bot for automated trading in the meantime.
                    </p>
                  </CardContent>
                </Card>
              ) : (
                <div className="grid md:grid-cols-2 gap-4">
                  {aiSignals.map((signal) => (
                    <Card key={signal.id} style={cardStyle}>
                      <CardContent className="p-4 space-y-3">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <Badge 
                              style={{ 
                                backgroundColor: signal.signal_type === 'BUY' ? '#22c55e' : '#ef4444',
                                color: '#fff'
                              }}
                            >
                              {signal.signal_type}
                            </Badge>
                            <span className="font-semibold">{signal.asset}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Badge variant="outline">{signal.timeframe}</Badge>
                            <Clock className="w-4 h-4 opacity-50" />
                          </div>
                        </div>
                        
                        <div className="grid grid-cols-3 gap-2 text-sm">
                          <div className="text-center p-2 rounded" style={{ backgroundColor: darkMode ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.02)' }}>
                            <p className="opacity-60 text-xs">Entry</p>
                            <p className="font-mono font-medium">{signal.entry_price}</p>
                          </div>
                          <div className="text-center p-2 rounded" style={{ backgroundColor: 'rgba(34,197,94,0.1)' }}>
                            <p className="opacity-60 text-xs">Target</p>
                            <p className="font-mono font-medium text-green-500">{signal.target_price}</p>
                          </div>
                          <div className="text-center p-2 rounded" style={{ backgroundColor: 'rgba(239,68,68,0.1)' }}>
                            <p className="opacity-60 text-xs">Stop Loss</p>
                            <p className="font-mono font-medium text-red-500">{signal.stop_loss}</p>
                          </div>
                        </div>

                        <div className="flex items-center justify-between pt-2">
                          <div className="flex items-center gap-2">
                            <div className="flex items-center">
                              {[...Array(5)].map((_, i) => (
                                <Star 
                                  key={i}
                                  className={`w-3 h-3 ${i < Math.round(signal.confidence / 20) ? 'text-yellow-500 fill-yellow-500' : 'opacity-30'}`}
                                />
                              ))}
                            </div>
                            <span 
                              className="text-sm font-medium"
                              style={{ color: signal.confidence >= 70 ? '#22c55e' : '#f59e0b' }}
                            >
                              {signal.confidence}%
                            </span>
                          </div>
                          <Button 
                            size="sm" 
                            style={{ backgroundColor: primaryColor, color: '#fff' }}
                            className="gap-1"
                            onClick={() => setActiveTab("trade")}
                          >
                            <Play className="w-3 h-3" /> Trade Now
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
