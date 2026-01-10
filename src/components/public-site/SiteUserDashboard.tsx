import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { 
  User, 
  Wallet, 
  Bot, 
  BarChart3, 
  TrendingUp, 
  LogOut, 
  Download,
  Play,
  ExternalLink,
  RefreshCw,
  Sparkles
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import type { SiteUser } from "./DerivAuthButton";

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

const derivAppUrls: Record<string, { name: string; url: string; icon: string }> = {
  dtrader: { name: "DTrader", url: "https://app.deriv.com/dtrader", icon: "📈" },
  dbot: { name: "DBot", url: "https://app.deriv.com/bot", icon: "🤖" },
  smarttrader: { name: "SmartTrader", url: "https://smarttrader.deriv.com/en/trading.html", icon: "💹" },
  derivgo: { name: "Deriv GO", url: "https://app.deriv.com/derivgo", icon: "📱" },
};

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

  useEffect(() => {
    fetchStoreBots();
    fetchAiSignals();
  }, [siteId]);

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
            trade_type
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
                <p className="text-sm opacity-60">Account Balance</p>
                <p className="text-3xl font-bold" style={{ color: primaryColor }}>
                  {user.currency} {user.balance.toLocaleString()}
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
        <Tabs defaultValue="platforms" className="space-y-4">
          <TabsList 
            className="w-full justify-start"
            style={{ 
              backgroundColor: darkMode ? 'rgba(255,255,255,0.1)' : '#f5f5f5',
            }}
          >
            <TabsTrigger value="platforms" className="gap-2">
              <BarChart3 className="w-4 h-4" /> Platforms
            </TabsTrigger>
            <TabsTrigger value="bots" className="gap-2">
              <Bot className="w-4 h-4" /> Bot Store
            </TabsTrigger>
            <TabsTrigger value="signals" className="gap-2">
              <TrendingUp className="w-4 h-4" /> AI Signals
            </TabsTrigger>
          </TabsList>

          {/* Trading Platforms Tab */}
          <TabsContent value="platforms">
            <div className="grid md:grid-cols-2 gap-4">
              {apps.map((appId) => {
                const app = derivAppUrls[appId];
                if (!app) return null;
                return (
                  <a
                    key={appId}
                    href={app.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block"
                  >
                    <Card style={cardStyle} className="hover:scale-[1.02] transition-transform cursor-pointer">
                      <CardContent className="p-6 flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <span className="text-4xl">{app.icon}</span>
                          <div>
                            <h3 className="font-semibold text-lg">{app.name}</h3>
                            <p className="text-sm opacity-60">Open trading platform</p>
                          </div>
                        </div>
                        <ExternalLink className="w-5 h-5 opacity-40" />
                      </CardContent>
                    </Card>
                  </a>
                );
              })}
            </div>
          </TabsContent>

          {/* Bot Store Tab */}
          <TabsContent value="bots">
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              {isLoadingBots ? (
                <Card style={cardStyle}>
                  <CardContent className="p-6 text-center">
                    <RefreshCw className="w-8 h-8 animate-spin mx-auto opacity-50" />
                    <p className="mt-2 opacity-60">Loading bots...</p>
                  </CardContent>
                </Card>
              ) : storeBots.length === 0 ? (
                <Card style={cardStyle}>
                  <CardContent className="p-6 text-center">
                    <Bot className="w-12 h-12 mx-auto opacity-30" />
                    <p className="mt-2 opacity-60">No bots available yet</p>
                  </CardContent>
                </Card>
              ) : (
                storeBots.map((storeBot) => (
                  <Card key={storeBot.id} style={cardStyle}>
                    <CardHeader className="pb-2">
                      <CardTitle className="flex items-center gap-2 text-lg">
                        <Bot className="w-5 h-5" style={{ color: primaryColor }} />
                        {storeBot.bot_configs?.name}
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <p className="text-sm opacity-70">{storeBot.bot_configs?.description}</p>
                      <div className="flex gap-2">
                        <Badge variant="outline">{storeBot.bot_configs?.asset}</Badge>
                        <Badge variant="outline">{storeBot.bot_configs?.trade_type}</Badge>
                      </div>
                      <div className="flex items-center justify-between pt-2">
                        <span className="text-sm opacity-60">
                          {storeBot.downloads_count} downloads
                        </span>
                        <Button size="sm" style={{ backgroundColor: primaryColor, color: '#fff' }}>
                          <Download className="w-4 h-4 mr-1" />
                          {storeBot.price > 0 ? `$${storeBot.price}` : 'Free'}
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))
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
                  <CardContent className="p-6 text-center">
                    <TrendingUp className="w-12 h-12 mx-auto opacity-30" />
                    <p className="mt-2 opacity-60">No active signals at the moment</p>
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
                          <Badge variant="outline">{signal.timeframe}</Badge>
                        </div>
                        
                        <div className="grid grid-cols-3 gap-2 text-sm">
                          <div>
                            <p className="opacity-60">Entry</p>
                            <p className="font-mono">{signal.entry_price}</p>
                          </div>
                          <div>
                            <p className="opacity-60">Target</p>
                            <p className="font-mono text-green-500">{signal.target_price}</p>
                          </div>
                          <div>
                            <p className="opacity-60">Stop Loss</p>
                            <p className="font-mono text-red-500">{signal.stop_loss}</p>
                          </div>
                        </div>

                        <div className="flex items-center justify-between pt-2">
                          <div className="flex items-center gap-1">
                            <span className="text-sm opacity-60">Confidence:</span>
                            <span 
                              className="font-medium"
                              style={{ color: signal.confidence >= 70 ? '#22c55e' : '#f59e0b' }}
                            >
                              {signal.confidence}%
                            </span>
                          </div>
                          <Button 
                            size="sm" 
                            style={{ backgroundColor: primaryColor, color: '#fff' }}
                            className="gap-1"
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
