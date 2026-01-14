import { useState, useEffect, useRef, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Progress } from "@/components/ui/progress";
import { 
  Bot, 
  Play, 
  Square, 
  AlertCircle, 
  CheckCircle, 
  Clock,
  TrendingUp,
  TrendingDown,
  Loader2,
  Settings,
  Brain,
  Zap,
  Activity,
  BarChart3
} from "lucide-react";
import { useDerivWebSocket, ProposalData, ContractData, TickData } from "@/hooks/useDerivWebSocket";
import { toast } from "sonner";

interface AITradingBotProps {
  userToken: string;
  primaryColor: string;
  darkMode: boolean;
  strategy?: "martingale" | "anti_martingale" | "fixed" | "compound" | "ai_smart";
  botConfig?: {
    name: string;
    asset: string;
    stake_amount: number;
    max_daily_trades: number;
    stop_loss_percentage: number;
    take_profit_percentage: number;
    trade_type?: string;
  };
}

interface TradeLog {
  id: string;
  time: Date;
  type: "CALL" | "PUT" | "DIGITEVEN" | "DIGITODD";
  asset: string;
  stake: number;
  result?: "win" | "loss" | "pending";
  profit?: number;
  entryPrice?: number;
  exitPrice?: number;
}

interface MarketAnalysis {
  trend: "bullish" | "bearish" | "neutral";
  strength: number;
  recommendation: "CALL" | "PUT" | "WAIT";
  confidence: number;
}

export function AITradingBot({ 
  userToken, 
  primaryColor, 
  darkMode, 
  strategy = "ai_smart",
  botConfig 
}: AITradingBotProps) {
  const [isRunning, setIsRunning] = useState(false);
  const [tradeLogs, setTradeLogs] = useState<TradeLog[]>([]);
  const [stats, setStats] = useState({
    totalTrades: 0,
    wins: 0,
    losses: 0,
    totalProfit: 0,
    currentStreak: 0,
    maxWinStreak: 0,
    maxLossStreak: 0,
  });
  const [currentPrice, setCurrentPrice] = useState<number | null>(null);
  const [priceHistory, setPriceHistory] = useState<number[]>([]);
  const [marketAnalysis, setMarketAnalysis] = useState<MarketAnalysis | null>(null);
  const [currentStake, setCurrentStake] = useState<number>(botConfig?.stake_amount || 1);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const contractsRef = useRef<Map<number, TradeLog>>(new Map());

  const config = botConfig || {
    name: "AI Smart Bot",
    asset: "R_100",
    stake_amount: 1,
    max_daily_trades: 50,
    stop_loss_percentage: 15,
    take_profit_percentage: 25,
    trade_type: "rise_fall",
  };

  const handleTick = useCallback((tick: TickData) => {
    if (tick.symbol === config.asset) {
      setCurrentPrice(tick.quote);
      setPriceHistory(prev => {
        const newHistory = [...prev, tick.quote].slice(-50); // Keep last 50 prices
        analyzeMarket(newHistory);
        return newHistory;
      });
    }
  }, [config.asset]);

  const analyzeMarket = useCallback((prices: number[]) => {
    if (prices.length < 10) return;

    // Calculate moving averages
    const shortMA = prices.slice(-5).reduce((a, b) => a + b, 0) / 5;
    const longMA = prices.slice(-20).reduce((a, b) => a + b, 0) / Math.min(prices.length, 20);
    
    // Calculate momentum
    const recentChange = prices[prices.length - 1] - prices[prices.length - 5];
    const momentum = (recentChange / prices[prices.length - 5]) * 100;

    // Calculate RSI-like indicator
    let gains = 0, losses = 0;
    for (let i = 1; i < prices.length; i++) {
      const change = prices[i] - prices[i - 1];
      if (change > 0) gains += change;
      else losses -= change;
    }
    const rs = gains / (losses || 1);
    const rsi = 100 - (100 / (1 + rs));

    // Determine trend
    let trend: "bullish" | "bearish" | "neutral" = "neutral";
    let strength = 50;
    let recommendation: "CALL" | "PUT" | "WAIT" = "WAIT";
    let confidence = 50;

    if (shortMA > longMA * 1.002) {
      trend = "bullish";
      strength = Math.min(90, 50 + Math.abs(momentum) * 10);
      recommendation = rsi < 70 ? "CALL" : "WAIT";
      confidence = Math.min(85, 50 + Math.abs(momentum) * 8);
    } else if (shortMA < longMA * 0.998) {
      trend = "bearish";
      strength = Math.min(90, 50 + Math.abs(momentum) * 10);
      recommendation = rsi > 30 ? "PUT" : "WAIT";
      confidence = Math.min(85, 50 + Math.abs(momentum) * 8);
    } else {
      // Neutral - use RSI for decision
      if (rsi < 30) {
        recommendation = "CALL";
        confidence = 60;
      } else if (rsi > 70) {
        recommendation = "PUT";
        confidence = 60;
      }
    }

    setMarketAnalysis({ trend, strength, recommendation, confidence });
  }, []);

  const handleContractUpdate = useCallback((contract: ContractData) => {
    const tradeLog = contractsRef.current.get(contract.contract_id);
    
    if (contract.status === "won" || contract.status === "lost") {
      const isWin = contract.status === "won";
      
      setStats(prev => {
        const newStreak = isWin ? 
          (prev.currentStreak >= 0 ? prev.currentStreak + 1 : 1) : 
          (prev.currentStreak <= 0 ? prev.currentStreak - 1 : -1);
        
        return {
          ...prev,
          wins: prev.wins + (isWin ? 1 : 0),
          losses: prev.losses + (isWin ? 0 : 1),
          totalProfit: prev.totalProfit + contract.profit,
          currentStreak: newStreak,
          maxWinStreak: isWin ? Math.max(prev.maxWinStreak, newStreak) : prev.maxWinStreak,
          maxLossStreak: !isWin ? Math.min(prev.maxLossStreak, newStreak) : prev.maxLossStreak,
        };
      });

      setTradeLogs(prev => prev.map(log => {
        if (tradeLog && log.id === tradeLog.id) {
          return {
            ...log,
            result: isWin ? "win" : "loss",
            profit: contract.profit,
            exitPrice: contract.current_spot,
          };
        }
        return log;
      }));

      // Apply strategy for next stake
      applyStrategy(isWin, contract.profit);
      
      contractsRef.current.delete(contract.contract_id);
    }
  }, []);

  const applyStrategy = useCallback((isWin: boolean, profit: number) => {
    switch (strategy) {
      case "martingale":
        setCurrentStake(prev => isWin ? config.stake_amount : Math.min(prev * 2, balance * 0.1));
        break;
      case "anti_martingale":
        setCurrentStake(prev => isWin ? Math.min(prev * 1.5, balance * 0.1) : config.stake_amount);
        break;
      case "compound":
        setCurrentStake(prev => isWin ? prev + (profit * 0.5) : config.stake_amount);
        break;
      case "ai_smart":
        // AI adjusts based on win rate and market conditions
        const winRate = stats.totalTrades > 0 ? (stats.wins / stats.totalTrades) * 100 : 50;
        const marketConfidence = marketAnalysis?.confidence || 50;
        
        if (isWin && winRate > 60 && marketConfidence > 70) {
          setCurrentStake(prev => Math.min(prev * 1.2, balance * 0.05));
        } else if (!isWin && (winRate < 40 || marketConfidence < 40)) {
          setCurrentStake(Math.max(config.stake_amount * 0.5, 0.35));
        } else {
          setCurrentStake(config.stake_amount);
        }
        break;
      default:
        setCurrentStake(config.stake_amount);
    }
  }, [strategy, config.stake_amount, stats, marketAnalysis]);

  const handleError = useCallback((error: string) => {
    toast.error(error);
    console.error("Trading error:", error);
  }, []);

  const {
    isConnected,
    isAuthorized,
    balance,
    currency,
    send,
    subscribeTicks,
    getProposalAsync,
    buyContract,
  } = useDerivWebSocket({
    token: userToken,
    onContractUpdate: handleContractUpdate,
    onError: handleError,
    onTick: handleTick,
  });

  useEffect(() => {
    if (isConnected) {
      subscribeTicks(config.asset);
    }
  }, [isConnected, config.asset, subscribeTicks]);

  const executeTrade = async () => {
    if (!isAuthorized || !marketAnalysis) return;

    // Don't trade if recommendation is WAIT
    if (marketAnalysis.recommendation === "WAIT" && strategy === "ai_smart") {
      console.log("AI recommends waiting...");
      return;
    }

    // Check limits
    if (stats.totalTrades >= config.max_daily_trades) {
      stopBot();
      toast.info("Daily trade limit reached");
      return;
    }

    const stopLossAmount = balance * (config.stop_loss_percentage / 100);
    const takeProfitAmount = balance * (config.take_profit_percentage / 100);

    if (stats.totalProfit <= -stopLossAmount) {
      stopBot();
      toast.warning("Stop loss triggered");
      return;
    }

    if (stats.totalProfit >= takeProfitAmount) {
      stopBot();
      toast.success("Take profit reached! 🎉");
      return;
    }

    // Determine trade direction
    let direction: "CALL" | "PUT";
    if (strategy === "ai_smart") {
      direction = marketAnalysis.recommendation === "CALL" ? "CALL" : "PUT";
    } else {
      direction = marketAnalysis.trend === "bullish" ? "CALL" : "PUT";
    }

    try {
      // Get proposal
      const proposal = await getProposalAsync({
        symbol: config.asset,
        contract_type: direction,
        duration: 5,
        duration_unit: "t",
        amount: currentStake,
        basis: "stake",
      });

      // Create trade log
      const tradeId = crypto.randomUUID();
      const newLog: TradeLog = {
        id: tradeId,
        time: new Date(),
        type: direction,
        asset: config.asset,
        stake: currentStake,
        result: "pending",
        entryPrice: proposal.spot,
      };

      setTradeLogs(prev => [newLog, ...prev.slice(0, 99)]);
      setStats(prev => ({ ...prev, totalTrades: prev.totalTrades + 1 }));

      // Execute trade
      buyContract(proposal.id, proposal.ask_price);

      toast.success(`${direction} trade placed at ${currentStake} ${currency}`);
    } catch (error) {
      console.error("Trade execution error:", error);
      toast.error("Failed to execute trade");
    }
  };

  const startBot = () => {
    if (!isAuthorized) {
      toast.error("Not authorized. Please reconnect.");
      return;
    }

    setIsRunning(true);
    toast.success(`${config.name} started with ${strategy} strategy!`);

    // Execute trades based on market conditions
    intervalRef.current = setInterval(() => {
      if (marketAnalysis && marketAnalysis.confidence >= 60) {
        executeTrade();
      }
    }, 15000); // Check every 15 seconds
  };

  const stopBot = () => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    setIsRunning(false);
    toast.info(`${config.name} stopped`);
  };

  useEffect(() => {
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, []);

  const cardStyle = {
    backgroundColor: darkMode ? 'rgba(255,255,255,0.05)' : '#fff',
    borderColor: darkMode ? '#333' : '#eee',
    color: darkMode ? '#fff' : '#000',
  };

  const winRate = stats.totalTrades > 0 
    ? ((stats.wins / stats.totalTrades) * 100).toFixed(1) 
    : "0.0";

  return (
    <Card style={cardStyle} className="overflow-hidden">
      <CardHeader className="pb-4 border-b" style={{ borderColor: darkMode ? '#333' : '#eee' }}>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Brain className="w-5 h-5" style={{ color: primaryColor }} />
            {config.name}
          </CardTitle>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="font-mono text-xs">
              {strategy.replace("_", " ").toUpperCase()}
            </Badge>
            <Badge variant={isRunning ? "default" : "secondary"}>
              {isRunning ? (
                <>
                  <Zap className="w-3 h-3 mr-1 animate-pulse" />
                  Active
                </>
              ) : (
                "Idle"
              )}
            </Badge>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-6 pt-6">
        {/* Market Analysis */}
        {marketAnalysis && (
          <div 
            className="p-4 rounded-lg space-y-3"
            style={{ backgroundColor: darkMode ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.02)' }}
          >
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium flex items-center gap-2">
                <Activity className="w-4 h-4" />
                Market Analysis
              </span>
              <Badge 
                variant="outline" 
                className={
                  marketAnalysis.trend === "bullish" ? "text-green-500 border-green-500/30" :
                  marketAnalysis.trend === "bearish" ? "text-red-500 border-red-500/30" :
                  "text-yellow-500 border-yellow-500/30"
                }
              >
                {marketAnalysis.trend.toUpperCase()}
              </Badge>
            </div>
            
            <div className="grid grid-cols-3 gap-4 text-center">
              <div>
                <p className="text-2xl font-bold" style={{ color: primaryColor }}>
                  {currentPrice?.toFixed(4) || "---"}
                </p>
                <p className="text-xs opacity-60">Current Price</p>
              </div>
              <div>
                <p className="text-2xl font-bold">
                  {marketAnalysis.confidence}%
                </p>
                <p className="text-xs opacity-60">Confidence</p>
              </div>
              <div>
                <p className={`text-2xl font-bold ${
                  marketAnalysis.recommendation === "CALL" ? "text-green-500" :
                  marketAnalysis.recommendation === "PUT" ? "text-red-500" :
                  "text-yellow-500"
                }`}>
                  {marketAnalysis.recommendation}
                </p>
                <p className="text-xs opacity-60">Signal</p>
              </div>
            </div>
          </div>
        )}

        {/* Stats Grid */}
        <div className="grid grid-cols-4 gap-4">
          <div className="text-center p-3 rounded-lg" style={{ backgroundColor: darkMode ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.02)' }}>
            <p className="text-2xl font-bold">{stats.totalTrades}</p>
            <p className="text-xs opacity-60">Trades</p>
          </div>
          <div className="text-center p-3 rounded-lg" style={{ backgroundColor: 'rgba(34,197,94,0.1)' }}>
            <p className="text-2xl font-bold text-green-500">{stats.wins}</p>
            <p className="text-xs opacity-60">Wins</p>
          </div>
          <div className="text-center p-3 rounded-lg" style={{ backgroundColor: 'rgba(239,68,68,0.1)' }}>
            <p className="text-2xl font-bold text-red-500">{stats.losses}</p>
            <p className="text-xs opacity-60">Losses</p>
          </div>
          <div className="text-center p-3 rounded-lg" style={{ backgroundColor: darkMode ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.02)' }}>
            <p className={`text-2xl font-bold ${stats.totalProfit >= 0 ? 'text-green-500' : 'text-red-500'}`}>
              {stats.totalProfit >= 0 ? '+' : ''}{stats.totalProfit.toFixed(2)}
            </p>
            <p className="text-xs opacity-60">Profit ({currency})</p>
          </div>
        </div>

        {/* Win Rate Progress */}
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="flex items-center gap-1">
              <BarChart3 className="w-4 h-4" />
              Win Rate
            </span>
            <span className="font-bold" style={{ color: parseFloat(winRate) >= 50 ? '#22c55e' : '#ef4444' }}>
              {winRate}%
            </span>
          </div>
          <Progress value={parseFloat(winRate)} className="h-2" />
        </div>

        {/* Current Configuration */}
        <div 
          className="p-4 rounded-lg text-sm grid grid-cols-2 gap-3"
          style={{ backgroundColor: darkMode ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.02)' }}
        >
          <div className="flex justify-between">
            <span className="opacity-60">Asset:</span>
            <span className="font-medium">{config.asset}</span>
          </div>
          <div className="flex justify-between">
            <span className="opacity-60">Next Stake:</span>
            <span className="font-medium">{currency} {currentStake.toFixed(2)}</span>
          </div>
          <div className="flex justify-between">
            <span className="opacity-60">Max Trades:</span>
            <span className="font-medium">{config.max_daily_trades}</span>
          </div>
          <div className="flex justify-between">
            <span className="opacity-60">Streak:</span>
            <span className={`font-medium ${stats.currentStreak >= 0 ? 'text-green-500' : 'text-red-500'}`}>
              {stats.currentStreak >= 0 ? '+' : ''}{stats.currentStreak}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="opacity-60">Stop Loss:</span>
            <span className="font-medium text-red-500">{config.stop_loss_percentage}%</span>
          </div>
          <div className="flex justify-between">
            <span className="opacity-60">Take Profit:</span>
            <span className="font-medium text-green-500">{config.take_profit_percentage}%</span>
          </div>
        </div>

        {/* Control Buttons */}
        <div className="flex gap-3">
          {!isRunning ? (
            <Button
              className="flex-1 gap-2"
              style={{ backgroundColor: primaryColor, color: '#fff' }}
              onClick={startBot}
              disabled={!isAuthorized}
            >
              <Play className="w-4 h-4" />
              Start AI Bot
            </Button>
          ) : (
            <Button
              className="flex-1 gap-2"
              variant="destructive"
              onClick={stopBot}
            >
              <Square className="w-4 h-4" />
              Stop Bot
            </Button>
          )}
          <Button variant="outline" size="icon">
            <Settings className="w-4 h-4" />
          </Button>
        </div>

        {/* Trade Logs */}
        <div className="space-y-2">
          <p className="text-sm font-medium flex items-center gap-2">
            <Clock className="w-4 h-4" />
            Recent Trades
          </p>
          <ScrollArea className="h-48 rounded-lg border" style={{ borderColor: darkMode ? '#333' : '#eee' }}>
            {tradeLogs.length === 0 ? (
              <div className="p-4 text-center opacity-50">
                <Bot className="w-8 h-8 mx-auto mb-2" />
                <p className="text-sm">No trades yet</p>
                <p className="text-xs mt-1">Start the bot to begin trading</p>
              </div>
            ) : (
              <div className="p-2 space-y-2">
                {tradeLogs.map(log => (
                  <div 
                    key={log.id}
                    className="flex items-center justify-between p-2 rounded text-sm"
                    style={{ backgroundColor: darkMode ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.02)' }}
                  >
                    <div className="flex items-center gap-2">
                      {log.type === "CALL" ? (
                        <TrendingUp className="w-4 h-4 text-green-500" />
                      ) : (
                        <TrendingDown className="w-4 h-4 text-red-500" />
                      )}
                      <span className="font-mono text-xs">{log.asset}</span>
                      <span className="opacity-60 text-xs">{currency} {log.stake.toFixed(2)}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      {log.result === "pending" && (
                        <Badge variant="secondary" className="text-xs">
                          <Loader2 className="w-3 h-3 animate-spin mr-1" />
                          Open
                        </Badge>
                      )}
                      {log.result === "win" && (
                        <Badge className="bg-green-500/20 text-green-500 text-xs">
                          <CheckCircle className="w-3 h-3 mr-1" />
                          +{log.profit?.toFixed(2)}
                        </Badge>
                      )}
                      {log.result === "loss" && (
                        <Badge className="bg-red-500/20 text-red-500 text-xs">
                          <AlertCircle className="w-3 h-3 mr-1" />
                          {log.profit?.toFixed(2)}
                        </Badge>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </ScrollArea>
        </div>
      </CardContent>
    </Card>
  );
}
