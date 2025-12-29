import { useState, useEffect } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { 
  Sparkles, 
  TrendingUp, 
  TrendingDown,
  Minus,
  ArrowUpRight,
  ArrowDownRight,
  Clock,
  Target,
  Shield,
  Zap,
  RefreshCw
} from "lucide-react";

interface Signal {
  id: string;
  asset: string;
  assetName: string;
  signalType: 'buy' | 'sell' | 'hold';
  confidence: number;
  entryPrice: number;
  targetPrice: number;
  stopLoss: number;
  timeframe: string;
  expiresAt: Date;
}

const mockSignals: Signal[] = [
  {
    id: "1",
    asset: "R_100",
    assetName: "Volatility 100 Index",
    signalType: "buy",
    confidence: 0.85,
    entryPrice: 10250.50,
    targetPrice: 10380.00,
    stopLoss: 10180.00,
    timeframe: "15m",
    expiresAt: new Date(Date.now() + 15 * 60 * 1000)
  },
  {
    id: "2",
    asset: "R_75",
    assetName: "Volatility 75 Index",
    signalType: "sell",
    confidence: 0.72,
    entryPrice: 8540.25,
    targetPrice: 8420.00,
    stopLoss: 8600.00,
    timeframe: "5m",
    expiresAt: new Date(Date.now() + 5 * 60 * 1000)
  },
  {
    id: "3",
    asset: "R_50",
    assetName: "Volatility 50 Index",
    signalType: "hold",
    confidence: 0.55,
    entryPrice: 6320.80,
    targetPrice: 6320.80,
    stopLoss: 6280.00,
    timeframe: "1h",
    expiresAt: new Date(Date.now() + 60 * 60 * 1000)
  },
  {
    id: "4",
    asset: "R_25",
    assetName: "Volatility 25 Index",
    signalType: "buy",
    confidence: 0.91,
    entryPrice: 4125.30,
    targetPrice: 4200.00,
    stopLoss: 4085.00,
    timeframe: "30m",
    expiresAt: new Date(Date.now() + 30 * 60 * 1000)
  }
];

const Signals = () => {
  const [signals, setSignals] = useState<Signal[]>(mockSignals);
  const [autoTrade, setAutoTrade] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const refreshSignals = async () => {
    setIsRefreshing(true);
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1500));
    setSignals([...mockSignals].map(s => ({
      ...s,
      expiresAt: new Date(Date.now() + parseInt(s.timeframe) * 60 * 1000)
    })));
    setIsRefreshing(false);
  };

  const getSignalIcon = (type: Signal['signalType']) => {
    switch (type) {
      case 'buy':
        return <TrendingUp className="w-5 h-5 text-success" />;
      case 'sell':
        return <TrendingDown className="w-5 h-5 text-destructive" />;
      default:
        return <Minus className="w-5 h-5 text-warning" />;
    }
  };

  const getSignalBadge = (type: Signal['signalType']) => {
    const variants: Record<string, "default" | "destructive" | "secondary"> = {
      buy: "default",
      sell: "destructive",
      hold: "secondary"
    };
    return (
      <Badge variant={variants[type]} className="uppercase font-semibold">
        {type}
      </Badge>
    );
  };

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 0.8) return 'text-success';
    if (confidence >= 0.6) return 'text-warning';
    return 'text-muted-foreground';
  };

  const formatTimeRemaining = (expiresAt: Date) => {
    const now = new Date();
    const diff = expiresAt.getTime() - now.getTime();
    if (diff <= 0) return 'Expired';
    
    const minutes = Math.floor(diff / 60000);
    const seconds = Math.floor((diff % 60000) / 1000);
    return `${minutes}m ${seconds}s`;
  };

  const [, setTick] = useState(0);
  useEffect(() => {
    const interval = setInterval(() => setTick(t => t + 1), 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
              <Sparkles className="w-6 h-6 text-primary" />
              AI Trading Signals
            </h1>
            <p className="text-muted-foreground mt-1">
              AI-powered market analysis and trading recommendations
            </p>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 px-4 py-2 rounded-lg bg-secondary">
              <span className="text-sm text-muted-foreground">Auto-Trade</span>
              <Switch checked={autoTrade} onCheckedChange={setAutoTrade} />
            </div>
            <Button 
              variant="outline" 
              onClick={refreshSignals}
              disabled={isRefreshing}
              className="gap-2"
            >
              <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid gap-4 sm:grid-cols-4">
          <Card className="glass border-border">
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="h-10 w-10 rounded-lg bg-success/10 flex items-center justify-center">
                  <TrendingUp className="h-5 w-5 text-success" />
                </div>
                <div>
                  <p className="text-xl font-bold">78%</p>
                  <p className="text-xs text-muted-foreground">Win Rate</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="glass border-border">
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                  <Target className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="text-xl font-bold">{signals.length}</p>
                  <p className="text-xs text-muted-foreground">Active Signals</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="glass border-border">
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="h-10 w-10 rounded-lg bg-accent/10 flex items-center justify-center">
                  <Zap className="h-5 w-5 text-accent" />
                </div>
                <div>
                  <p className="text-xl font-bold">124</p>
                  <p className="text-xs text-muted-foreground">Signals Today</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="glass border-border">
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="h-10 w-10 rounded-lg bg-warning/10 flex items-center justify-center">
                  <Shield className="h-5 w-5 text-warning" />
                </div>
                <div>
                  <p className="text-xl font-bold">92%</p>
                  <p className="text-xs text-muted-foreground">AI Accuracy</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Active Signals */}
        <Card className="glass border-border">
          <CardHeader>
            <CardTitle>Active Signals</CardTitle>
            <CardDescription>
              Real-time AI-generated trading recommendations
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {signals.map((signal) => (
                <div 
                  key={signal.id}
                  className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-4 rounded-xl border border-border bg-secondary/30 hover:bg-secondary/50 transition-colors"
                >
                  <div className="flex items-center gap-4">
                    <div className={`h-12 w-12 rounded-xl flex items-center justify-center ${
                      signal.signalType === 'buy' ? 'bg-success/20' :
                      signal.signalType === 'sell' ? 'bg-destructive/20' :
                      'bg-warning/20'
                    }`}>
                      {getSignalIcon(signal.signalType)}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="font-semibold">{signal.assetName}</h4>
                        {getSignalBadge(signal.signalType)}
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {signal.asset} · {signal.timeframe}
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-6 md:flex md:items-center md:gap-8">
                    <div>
                      <p className="text-xs text-muted-foreground">Confidence</p>
                      <p className={`font-semibold ${getConfidenceColor(signal.confidence)}`}>
                        {(signal.confidence * 100).toFixed(0)}%
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Entry</p>
                      <p className="font-mono text-sm">{signal.entryPrice.toFixed(2)}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Target</p>
                      <p className="font-mono text-sm flex items-center gap-1">
                        {signal.targetPrice.toFixed(2)}
                        {signal.signalType === 'buy' ? (
                          <ArrowUpRight className="w-3 h-3 text-success" />
                        ) : signal.signalType === 'sell' ? (
                          <ArrowDownRight className="w-3 h-3 text-destructive" />
                        ) : null}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Stop Loss</p>
                      <p className="font-mono text-sm text-destructive">{signal.stopLoss.toFixed(2)}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Clock className="w-4 h-4 text-muted-foreground" />
                      <span className="text-sm font-medium">
                        {formatTimeRemaining(signal.expiresAt)}
                      </span>
                    </div>
                  </div>

                  <Button 
                    size="sm" 
                    variant={signal.signalType === 'buy' ? 'default' : signal.signalType === 'sell' ? 'destructive' : 'secondary'}
                    className="md:w-auto w-full"
                    disabled={signal.signalType === 'hold'}
                  >
                    {signal.signalType === 'buy' ? 'Buy Now' : 
                     signal.signalType === 'sell' ? 'Sell Now' : 
                     'Wait'}
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* How It Works */}
        <Card className="glass border-border">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-primary" />
              How AI Signals Work
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-3 gap-6">
              <div className="space-y-2">
                <h4 className="font-medium text-foreground">1. Market Analysis</h4>
                <p className="text-sm text-muted-foreground">
                  Our AI continuously analyzes market data, patterns, and indicators across multiple timeframes.
                </p>
              </div>
              <div className="space-y-2">
                <h4 className="font-medium text-foreground">2. Signal Generation</h4>
                <p className="text-sm text-muted-foreground">
                  When high-probability setups are detected, signals are generated with entry, target, and stop loss levels.
                </p>
              </div>
              <div className="space-y-2">
                <h4 className="font-medium text-foreground">3. Auto-Execute</h4>
                <p className="text-sm text-muted-foreground">
                  Enable auto-trade to automatically execute signals on your connected Deriv account.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default Signals;