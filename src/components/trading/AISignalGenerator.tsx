import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Switch } from "@/components/ui/switch";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { 
  Brain, 
  TrendingUp, 
  TrendingDown, 
  AlertCircle,
  Clock,
  Target,
  Shield,
  Zap,
  RefreshCw,
  Loader2,
  Signal,
  ChevronRight,
  Activity,
  BarChart3
} from "lucide-react";
import { toast } from "sonner";

interface AISignal {
  id: string;
  asset: string;
  signal_type: "CALL" | "PUT";
  confidence: number;
  entry_price: number;
  target_price: number;
  stop_loss: number;
  timeframe: string;
  expires_at: string;
  created_at: string;
  is_active: boolean;
}

interface MarketData {
  prices: number[];
  currentPrice: number;
}

interface AISignalGeneratorProps {
  siteId?: string;
  darkMode: boolean;
  primaryColor: string;
  marketData: MarketData;
  onSignalGenerated?: (signal: AISignal) => void;
  onAutoTradeSignal?: (signal: AISignal) => void;
}

const ASSETS = [
  { value: "R_10", label: "Volatility 10" },
  { value: "R_25", label: "Volatility 25" },
  { value: "R_50", label: "Volatility 50" },
  { value: "R_75", label: "Volatility 75" },
  { value: "R_100", label: "Volatility 100" },
  { value: "1HZ10V", label: "V10 (1s)" },
  { value: "1HZ25V", label: "V25 (1s)" },
  { value: "1HZ50V", label: "V50 (1s)" },
  { value: "1HZ75V", label: "V75 (1s)" },
  { value: "1HZ100V", label: "V100 (1s)" },
];

const TIMEFRAMES = [
  { value: "1m", label: "1 Minute" },
  { value: "5m", label: "5 Minutes" },
  { value: "15m", label: "15 Minutes" },
  { value: "30m", label: "30 Minutes" },
  { value: "1h", label: "1 Hour" },
];

export function AISignalGenerator({
  siteId,
  darkMode,
  primaryColor,
  marketData,
  onSignalGenerated,
  onAutoTradeSignal,
}: AISignalGeneratorProps) {
  const [signals, setSignals] = useState<AISignal[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [autoTrade, setAutoTrade] = useState(false);
  const [selectedAsset, setSelectedAsset] = useState("R_100");
  const [selectedTimeframe, setSelectedTimeframe] = useState("5m");
  const [isAutoRefresh, setIsAutoRefresh] = useState(false);

  // Fetch existing signals
  useEffect(() => {
    if (siteId) {
      fetchSignals();
    }
  }, [siteId]);

  const fetchSignals = async () => {
    if (!siteId) return;
    
    try {
      const { data, error } = await supabase
        .from("ai_signals")
        .select("*")
        .eq("site_id", siteId)
        .eq("is_active", true)
        .order("created_at", { ascending: false })
        .limit(10);

      if (error) throw error;
      
      setSignals((data || []).map(s => ({
        ...s,
        signal_type: s.signal_type as "CALL" | "PUT"
      })));
    } catch (error) {
      console.error("Error fetching signals:", error);
    }
  };

  // AI Market Analysis Engine
  const analyzeMarket = useCallback((prices: number[]): {
    trend: "bullish" | "bearish" | "neutral";
    strength: number;
    signal: "CALL" | "PUT" | null;
    confidence: number;
    support: number;
    resistance: number;
  } => {
    if (prices.length < 20) {
      return { trend: "neutral", strength: 0, signal: null, confidence: 0, support: 0, resistance: 0 };
    }

    // Calculate indicators
    const currentPrice = prices[prices.length - 1];
    
    // Simple Moving Averages
    const sma5 = prices.slice(-5).reduce((a, b) => a + b, 0) / 5;
    const sma20 = prices.slice(-20).reduce((a, b) => a + b, 0) / 20;
    
    // Exponential Moving Average (approximation)
    const emaMultiplier = 2 / (10 + 1);
    let ema = prices[0];
    for (const price of prices) {
      ema = (price - ema) * emaMultiplier + ema;
    }

    // Bollinger Bands
    const stdDev = Math.sqrt(
      prices.slice(-20).reduce((sum, p) => sum + Math.pow(p - sma20, 2), 0) / 20
    );
    const upperBand = sma20 + 2 * stdDev;
    const lowerBand = sma20 - 2 * stdDev;

    // RSI Calculation
    let gains = 0, losses = 0;
    for (let i = 1; i < prices.length; i++) {
      const change = prices[i] - prices[i - 1];
      if (change > 0) gains += change;
      else losses -= change;
    }
    const avgGain = gains / prices.length;
    const avgLoss = losses / prices.length;
    const rs = avgGain / (avgLoss || 0.0001);
    const rsi = 100 - (100 / (1 + rs));

    // MACD approximation
    const ema12 = prices.slice(-12).reduce((a, b) => a + b, 0) / 12;
    const ema26 = prices.slice(-26).reduce((a, b) => a + b, 0) / Math.min(prices.length, 26);
    const macd = ema12 - ema26;

    // Momentum
    const momentum = (currentPrice - prices[prices.length - 10]) / prices[prices.length - 10] * 100;

    // Trend Analysis
    let trend: "bullish" | "bearish" | "neutral" = "neutral";
    let strength = 50;
    let signal: "CALL" | "PUT" | null = null;
    let confidence = 0;

    // Bullish conditions
    const bullishSignals = [
      sma5 > sma20,
      currentPrice > ema,
      rsi < 70 && rsi > 30,
      macd > 0,
      currentPrice > lowerBand,
      momentum > 0,
    ].filter(Boolean).length;

    // Bearish conditions
    const bearishSignals = [
      sma5 < sma20,
      currentPrice < ema,
      rsi > 30 && rsi < 70,
      macd < 0,
      currentPrice < upperBand,
      momentum < 0,
    ].filter(Boolean).length;

    if (bullishSignals >= 4) {
      trend = "bullish";
      strength = Math.min(90, 50 + bullishSignals * 8);
      
      // Strong CALL signal conditions
      if (rsi < 40 && macd > 0 && currentPrice < sma20) {
        signal = "CALL";
        confidence = Math.min(85, 50 + bullishSignals * 6);
      } else if (bullishSignals >= 5) {
        signal = "CALL";
        confidence = Math.min(75, 45 + bullishSignals * 5);
      }
    } else if (bearishSignals >= 4) {
      trend = "bearish";
      strength = Math.min(90, 50 + bearishSignals * 8);
      
      // Strong PUT signal conditions
      if (rsi > 60 && macd < 0 && currentPrice > sma20) {
        signal = "PUT";
        confidence = Math.min(85, 50 + bearishSignals * 6);
      } else if (bearishSignals >= 5) {
        signal = "PUT";
        confidence = Math.min(75, 45 + bearishSignals * 5);
      }
    }

    // Calculate support/resistance
    const sortedPrices = [...prices].sort((a, b) => a - b);
    const support = sortedPrices[Math.floor(sortedPrices.length * 0.1)];
    const resistance = sortedPrices[Math.floor(sortedPrices.length * 0.9)];

    return { trend, strength, signal, confidence, support, resistance };
  }, []);

  const generateSignal = async () => {
    if (marketData.prices.length < 20) {
      toast.error("Not enough price data. Please wait for market data.");
      return;
    }

    setIsGenerating(true);

    try {
      const analysis = analyzeMarket(marketData.prices);

      if (!analysis.signal || analysis.confidence < 60) {
        toast.info("No strong signal detected. Market conditions unclear.");
        setIsGenerating(false);
        return;
      }

      const currentPrice = marketData.currentPrice;
      const priceRange = analysis.resistance - analysis.support;
      
      // Calculate target and stop loss based on signal type
      const targetMultiplier = analysis.signal === "CALL" ? 1 : -1;
      const targetPrice = currentPrice + (priceRange * 0.3 * targetMultiplier);
      const stopLoss = currentPrice - (priceRange * 0.15 * targetMultiplier);

      // Calculate expiry based on timeframe
      const timeframeMinutes = {
        "1m": 1,
        "5m": 5,
        "15m": 15,
        "30m": 30,
        "1h": 60,
      }[selectedTimeframe] || 5;

      const expiresAt = new Date(Date.now() + timeframeMinutes * 60 * 1000).toISOString();

      const newSignal: AISignal = {
        id: crypto.randomUUID(),
        asset: selectedAsset,
        signal_type: analysis.signal,
        confidence: Math.round(analysis.confidence),
        entry_price: currentPrice,
        target_price: targetPrice,
        stop_loss: stopLoss,
        timeframe: selectedTimeframe,
        expires_at: expiresAt,
        created_at: new Date().toISOString(),
        is_active: true,
      };

      // Save to database if siteId provided
      if (siteId) {
        const { error } = await supabase
          .from("ai_signals")
          .insert({
            site_id: siteId,
            asset: newSignal.asset,
            signal_type: newSignal.signal_type,
            confidence: newSignal.confidence,
            entry_price: newSignal.entry_price,
            target_price: newSignal.target_price,
            stop_loss: newSignal.stop_loss,
            timeframe: newSignal.timeframe,
            expires_at: newSignal.expires_at,
            is_active: true,
          });

        if (error) throw error;
      }

      setSignals(prev => [newSignal, ...prev.slice(0, 9)]);
      onSignalGenerated?.(newSignal);

      if (autoTrade) {
        onAutoTradeSignal?.(newSignal);
        toast.success(`Auto-trading ${analysis.signal} signal!`);
      } else {
        toast.success(`${analysis.signal} signal generated with ${analysis.confidence.toFixed(0)}% confidence`);
      }
    } catch (error) {
      console.error("Error generating signal:", error);
      toast.error("Failed to generate signal");
    } finally {
      setIsGenerating(false);
    }
  };

  // Auto-refresh signals
  useEffect(() => {
    let interval: ReturnType<typeof setInterval>;
    
    if (isAutoRefresh && marketData.prices.length >= 20) {
      interval = setInterval(() => {
        generateSignal();
      }, 30000); // Every 30 seconds
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isAutoRefresh, marketData.prices]);

  const cardStyle = {
    backgroundColor: darkMode ? 'rgba(255,255,255,0.05)' : '#fff',
    borderColor: darkMode ? '#333' : '#eee',
  };

  // Current market analysis
  const currentAnalysis = marketData.prices.length >= 20 
    ? analyzeMarket(marketData.prices)
    : null;

  return (
    <Card style={cardStyle}>
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Brain className="w-5 h-5" style={{ color: primaryColor }} />
            AI Signal Generator
          </CardTitle>
          <div className="flex items-center gap-2">
            <Badge variant={isAutoRefresh ? "default" : "outline"} className="gap-1">
              <Activity className="w-3 h-3" />
              {isAutoRefresh ? "Auto" : "Manual"}
            </Badge>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-6">
        {/* Current Market Analysis */}
        {currentAnalysis && (
          <div 
            className="p-4 rounded-lg space-y-3"
            style={{ backgroundColor: darkMode ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.02)' }}
          >
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium flex items-center gap-2">
                <BarChart3 className="w-4 h-4" />
                Market Analysis
              </span>
              <Badge 
                variant="outline" 
                className={
                  currentAnalysis.trend === "bullish" ? "text-green-500 border-green-500/30" :
                  currentAnalysis.trend === "bearish" ? "text-red-500 border-red-500/30" :
                  "text-yellow-500 border-yellow-500/30"
                }
              >
                {currentAnalysis.trend.toUpperCase()}
              </Badge>
            </div>
            
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Trend Strength</span>
                <span className="font-medium">{currentAnalysis.strength.toFixed(0)}%</span>
              </div>
              <Progress value={currentAnalysis.strength} className="h-2" />
            </div>

            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-muted-foreground">Support:</span>
                <span className="ml-2 font-mono text-green-500">
                  {currentAnalysis.support.toFixed(4)}
                </span>
              </div>
              <div>
                <span className="text-muted-foreground">Resistance:</span>
                <span className="ml-2 font-mono text-red-500">
                  {currentAnalysis.resistance.toFixed(4)}
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Controls */}
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Asset</label>
              <Select value={selectedAsset} onValueChange={setSelectedAsset}>
                <SelectTrigger style={{ backgroundColor: darkMode ? '#1a1a1a' : '#fff' }}>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {ASSETS.map(a => (
                    <SelectItem key={a.value} value={a.value}>{a.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Timeframe</label>
              <Select value={selectedTimeframe} onValueChange={setSelectedTimeframe}>
                <SelectTrigger style={{ backgroundColor: darkMode ? '#1a1a1a' : '#fff' }}>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {TIMEFRAMES.map(t => (
                    <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="flex items-center justify-between p-3 rounded-lg border">
            <div className="flex items-center gap-2">
              <Zap className="w-4 h-4 text-yellow-500" />
              <div>
                <p className="text-sm font-medium">Auto-Trade Signals</p>
                <p className="text-xs text-muted-foreground">Execute trades automatically</p>
              </div>
            </div>
            <Switch checked={autoTrade} onCheckedChange={setAutoTrade} />
          </div>

          <div className="flex items-center justify-between p-3 rounded-lg border">
            <div className="flex items-center gap-2">
              <RefreshCw className="w-4 h-4 text-blue-500" />
              <div>
                <p className="text-sm font-medium">Auto-Refresh Signals</p>
                <p className="text-xs text-muted-foreground">Generate every 30 seconds</p>
              </div>
            </div>
            <Switch checked={isAutoRefresh} onCheckedChange={setIsAutoRefresh} />
          </div>

          <Button 
            onClick={generateSignal} 
            disabled={isGenerating || marketData.prices.length < 20}
            className="w-full"
            style={{ backgroundColor: primaryColor }}
          >
            {isGenerating ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Analyzing Market...
              </>
            ) : (
              <>
                <Brain className="w-4 h-4 mr-2" />
                Generate Signal
              </>
            )}
          </Button>
        </div>

        {/* Active Signals */}
        {signals.length > 0 && (
          <div className="space-y-3">
            <h4 className="font-medium flex items-center gap-2">
              <Signal className="w-4 h-4" />
              Active Signals
            </h4>
            <ScrollArea className="h-48">
              <div className="space-y-2">
                {signals.map((signal) => (
                  <div
                    key={signal.id}
                    className="p-3 rounded-lg border"
                    style={{ 
                      backgroundColor: darkMode ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.02)',
                      borderColor: signal.signal_type === "CALL" ? 'rgba(34,197,94,0.3)' : 'rgba(239,68,68,0.3)'
                    }}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        {signal.signal_type === "CALL" ? (
                          <TrendingUp className="w-4 h-4 text-green-500" />
                        ) : (
                          <TrendingDown className="w-4 h-4 text-red-500" />
                        )}
                        <span className="font-medium">{signal.signal_type}</span>
                        <Badge variant="outline" className="text-xs">
                          {ASSETS.find(a => a.value === signal.asset)?.label || signal.asset}
                        </Badge>
                      </div>
                      <Badge 
                        variant={signal.confidence >= 70 ? "default" : "secondary"}
                      >
                        {signal.confidence}%
                      </Badge>
                    </div>
                    <div className="grid grid-cols-3 gap-2 text-xs">
                      <div>
                        <span className="text-muted-foreground">Entry:</span>
                        <span className="ml-1 font-mono">{signal.entry_price.toFixed(4)}</span>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Target:</span>
                        <span className="ml-1 font-mono text-green-500">{signal.target_price.toFixed(4)}</span>
                      </div>
                      <div>
                        <span className="text-muted-foreground">SL:</span>
                        <span className="ml-1 font-mono text-red-500">{signal.stop_loss.toFixed(4)}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 mt-2 text-xs text-muted-foreground">
                      <Clock className="w-3 h-3" />
                      <span>Expires: {new Date(signal.expires_at).toLocaleTimeString()}</span>
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
