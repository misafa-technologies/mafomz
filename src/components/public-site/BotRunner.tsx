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
  Settings
} from "lucide-react";
import { useDerivWebSocket, ContractData } from "@/hooks/useDerivWebSocket";
import { toast } from "sonner";

interface BotRunnerProps {
  userToken: string;
  primaryColor: string;
  darkMode: boolean;
  botConfig?: {
    name: string;
    asset: string;
    stake_amount: number;
    max_daily_trades: number;
    stop_loss_percentage: number;
    take_profit_percentage: number;
  };
}

interface TradeLog {
  id: string;
  time: Date;
  type: "CALL" | "PUT";
  asset: string;
  stake: number;
  result?: "win" | "loss" | "pending";
  profit?: number;
}

export function BotRunner({ userToken, primaryColor, darkMode, botConfig }: BotRunnerProps) {
  const [isRunning, setIsRunning] = useState(false);
  const [tradeLogs, setTradeLogs] = useState<TradeLog[]>([]);
  const [stats, setStats] = useState({
    totalTrades: 0,
    wins: 0,
    losses: 0,
    totalProfit: 0,
  });
  const [currentPrice, setCurrentPrice] = useState<number | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const config = botConfig || {
    name: "Demo Bot",
    asset: "R_100",
    stake_amount: 1,
    max_daily_trades: 50,
    stop_loss_percentage: 10,
    take_profit_percentage: 20,
  };

  const handleContractUpdate = useCallback((contract: ContractData) => {
    setTradeLogs(prev => prev.map(log => {
      if (log.result === "pending") {
        const result = contract.profit >= 0 ? "win" : "loss";
        return {
          ...log,
          result,
          profit: contract.profit,
        };
      }
      return log;
    }));

    // Update stats
    if (contract.status === "won" || contract.status === "lost") {
      setStats(prev => ({
        ...prev,
        wins: prev.wins + (contract.profit >= 0 ? 1 : 0),
        losses: prev.losses + (contract.profit < 0 ? 1 : 0),
        totalProfit: prev.totalProfit + contract.profit,
      }));
    }
  }, []);

  const handleError = useCallback((error: string) => {
    toast.error(error);
  }, []);

  const {
    isConnected,
    isAuthorized,
    balance,
    currency,
    send,
    subscribeTicks,
  } = useDerivWebSocket({
    token: userToken,
    onContractUpdate: handleContractUpdate,
    onError: handleError,
    onTick: (tick) => {
      if (tick.symbol === config.asset) {
        setCurrentPrice(tick.quote);
      }
    },
  });

  useEffect(() => {
    if (isConnected) {
      subscribeTicks(config.asset);
    }
  }, [isConnected, config.asset]);

  const startBot = () => {
    if (!isAuthorized) {
      toast.error("Not authorized. Please reconnect.");
      return;
    }

    setIsRunning(true);
    toast.success(`${config.name} started!`);

    // Simple martingale strategy simulation
    let currentStake = config.stake_amount;
    let consecutiveLosses = 0;

    intervalRef.current = setInterval(() => {
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
        toast.success("Take profit reached!");
        return;
      }

      // Determine trade direction (simple random for demo)
      const direction = Math.random() > 0.5 ? "CALL" : "PUT";

      // Place trade
      const tradeId = crypto.randomUUID();
      const newLog: TradeLog = {
        id: tradeId,
        time: new Date(),
        type: direction,
        asset: config.asset,
        stake: currentStake,
        result: "pending",
      };

      setTradeLogs(prev => [newLog, ...prev.slice(0, 99)]);
      setStats(prev => ({ ...prev, totalTrades: prev.totalTrades + 1 }));

      // Send trade request
      send({
        proposal: 1,
        amount: currentStake,
        basis: "stake",
        contract_type: direction,
        currency: currency,
        duration: 1,
        duration_unit: "m",
        symbol: config.asset,
        subscribe: 1,
      });

    }, 60000); // Trade every minute
  };

  const stopBot = () => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    setIsRunning(false);
    toast.info(`${config.name} stopped`);
  };

  const cardStyle = {
    backgroundColor: darkMode ? 'rgba(255,255,255,0.05)' : '#fff',
    borderColor: darkMode ? '#333' : '#eee',
    color: darkMode ? '#fff' : '#000',
  };

  const winRate = stats.totalTrades > 0 
    ? ((stats.wins / stats.totalTrades) * 100).toFixed(1) 
    : "0.0";

  return (
    <Card style={cardStyle}>
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Bot className="w-5 h-5" style={{ color: primaryColor }} />
            {config.name}
          </CardTitle>
          <Badge variant={isRunning ? "default" : "secondary"}>
            {isRunning ? (
              <>
                <Loader2 className="w-3 h-3 mr-1 animate-spin" />
                Running
              </>
            ) : (
              "Stopped"
            )}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Bot Stats */}
        <div className="grid grid-cols-4 gap-4">
          <div className="text-center">
            <p className="text-2xl font-bold">{stats.totalTrades}</p>
            <p className="text-xs opacity-60">Trades</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-green-500">{stats.wins}</p>
            <p className="text-xs opacity-60">Wins</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-red-500">{stats.losses}</p>
            <p className="text-xs opacity-60">Losses</p>
          </div>
          <div className="text-center">
            <p className={`text-2xl font-bold ${stats.totalProfit >= 0 ? 'text-green-500' : 'text-red-500'}`}>
              {stats.totalProfit >= 0 ? '+' : ''}{stats.totalProfit.toFixed(2)}
            </p>
            <p className="text-xs opacity-60">Profit</p>
          </div>
        </div>

        {/* Win Rate Progress */}
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span>Win Rate</span>
            <span className="font-bold">{winRate}%</span>
          </div>
          <Progress value={parseFloat(winRate)} className="h-2" />
        </div>

        {/* Bot Configuration */}
        <div 
          className="p-3 rounded-lg text-sm grid grid-cols-2 gap-2"
          style={{ backgroundColor: darkMode ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.02)' }}
        >
          <div>
            <span className="opacity-60">Asset:</span>{" "}
            <span className="font-medium">{config.asset}</span>
          </div>
          <div>
            <span className="opacity-60">Stake:</span>{" "}
            <span className="font-medium">{currency} {config.stake_amount}</span>
          </div>
          <div>
            <span className="opacity-60">Max Trades:</span>{" "}
            <span className="font-medium">{config.max_daily_trades}</span>
          </div>
          <div>
            <span className="opacity-60">Stop Loss:</span>{" "}
            <span className="font-medium">{config.stop_loss_percentage}%</span>
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
              Start Bot
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
          <p className="text-sm font-medium">Recent Trades</p>
          <ScrollArea className="h-48 rounded-lg border" style={{ borderColor: darkMode ? '#333' : '#eee' }}>
            {tradeLogs.length === 0 ? (
              <div className="p-4 text-center opacity-50">
                <Clock className="w-8 h-8 mx-auto mb-2" />
                <p className="text-sm">No trades yet</p>
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
                      <span className="font-mono">{log.asset}</span>
                      <span className="opacity-60">{currency} {log.stake}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      {log.result === "pending" && (
                        <Badge variant="secondary">
                          <Loader2 className="w-3 h-3 animate-spin mr-1" />
                          Pending
                        </Badge>
                      )}
                      {log.result === "win" && (
                        <Badge className="bg-green-500/20 text-green-500">
                          <CheckCircle className="w-3 h-3 mr-1" />
                          +{log.profit?.toFixed(2)}
                        </Badge>
                      )}
                      {log.result === "loss" && (
                        <Badge className="bg-red-500/20 text-red-500">
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
