import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { TrendingUp, TrendingDown, Loader2, RefreshCw, Wifi, WifiOff } from "lucide-react";
import { useDerivWebSocket, TickData, ProposalData } from "@/hooks/useDerivWebSocket";
import { toast } from "sonner";

interface TradingPanelProps {
  userToken: string;
  primaryColor: string;
  darkMode: boolean;
}

const ASSETS = [
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
];

const DURATIONS = [
  { value: "1", unit: "m", label: "1 Minute" },
  { value: "2", unit: "m", label: "2 Minutes" },
  { value: "5", unit: "m", label: "5 Minutes" },
  { value: "15", unit: "m", label: "15 Minutes" },
  { value: "30", unit: "m", label: "30 Minutes" },
  { value: "1", unit: "h", label: "1 Hour" },
];

export function TradingPanel({ userToken, primaryColor, darkMode }: TradingPanelProps) {
  const [selectedAsset, setSelectedAsset] = useState("R_100");
  const [stake, setStake] = useState("1");
  const [duration, setDuration] = useState("5-m");
  const [currentPrice, setCurrentPrice] = useState<number | null>(null);
  const [priceHistory, setPriceHistory] = useState<number[]>([]);
  const [callProposal, setCallProposal] = useState<ProposalData | null>(null);
  const [putProposal, setPutProposal] = useState<ProposalData | null>(null);
  const [isPlacingTrade, setIsPlacingTrade] = useState(false);

  const handleTick = useCallback((tick: TickData) => {
    if (tick.symbol === selectedAsset) {
      setCurrentPrice(tick.quote);
      setPriceHistory(prev => [...prev.slice(-50), tick.quote]);
    }
  }, [selectedAsset]);

  const handleProposal = useCallback((proposal: ProposalData) => {
    // We'll manage proposals through request IDs
    if (proposal.id.includes("call")) {
      setCallProposal(proposal);
    } else {
      setPutProposal(proposal);
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
    subscribeTicks,
    unsubscribeTicks,
    send,
    buyContract,
  } = useDerivWebSocket({
    token: userToken,
    onTick: handleTick,
    onError: handleError,
  });

  // Subscribe to ticks when asset changes
  useEffect(() => {
    if (isConnected) {
      subscribeTicks(selectedAsset);
      return () => unsubscribeTicks(selectedAsset);
    }
  }, [selectedAsset, isConnected]);

  // Get proposals when parameters change
  useEffect(() => {
    if (!isAuthorized || !stake || parseFloat(stake) <= 0) return;

    const [dur, unit] = duration.split("-");
    
    // Request CALL proposal
    send({
      proposal: 1,
      amount: parseFloat(stake),
      basis: "stake",
      contract_type: "CALL",
      currency: currency,
      duration: parseInt(dur),
      duration_unit: unit,
      symbol: selectedAsset,
      req_id: "call_proposal",
    });

    // Request PUT proposal
    send({
      proposal: 1,
      amount: parseFloat(stake),
      basis: "stake",
      contract_type: "PUT",
      currency: currency,
      duration: parseInt(dur),
      duration_unit: unit,
      symbol: selectedAsset,
      req_id: "put_proposal",
    });
  }, [isAuthorized, stake, duration, selectedAsset, currency]);

  const handleTrade = async (type: "CALL" | "PUT") => {
    const proposal = type === "CALL" ? callProposal : putProposal;
    if (!proposal) return;

    setIsPlacingTrade(true);
    try {
      buyContract(proposal.id, proposal.ask_price);
      toast.success(`${type} trade placed successfully!`);
    } catch (err) {
      toast.error("Failed to place trade");
    } finally {
      setIsPlacingTrade(false);
    }
  };

  const cardStyle = {
    backgroundColor: darkMode ? 'rgba(255,255,255,0.05)' : '#fff',
    borderColor: darkMode ? '#333' : '#eee',
    color: darkMode ? '#fff' : '#000',
  };

  const priceChange = priceHistory.length >= 2 
    ? priceHistory[priceHistory.length - 1] - priceHistory[priceHistory.length - 2]
    : 0;

  return (
    <Card style={cardStyle}>
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="w-5 h-5" style={{ color: primaryColor }} />
            Trade Now
          </CardTitle>
          <div className="flex items-center gap-2">
            <Badge variant={isConnected ? "default" : "destructive"} className="gap-1">
              {isConnected ? <Wifi className="w-3 h-3" /> : <WifiOff className="w-3 h-3" />}
              {isConnected ? "Live" : "Offline"}
            </Badge>
            {isAuthorized && (
              <Badge variant="outline">
                {currency} {balance.toFixed(2)}
              </Badge>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Asset Selection */}
        <div className="space-y-2">
          <Label>Select Asset</Label>
          <Select value={selectedAsset} onValueChange={setSelectedAsset}>
            <SelectTrigger style={{ backgroundColor: darkMode ? '#1a1a1a' : '#fff' }}>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {ASSETS.map(asset => (
                <SelectItem key={asset.value} value={asset.value}>
                  {asset.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Current Price */}
        <div 
          className="p-4 rounded-lg text-center"
          style={{ backgroundColor: darkMode ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.02)' }}
        >
          <p className="text-sm opacity-60 mb-1">Current Price</p>
          <div className="flex items-center justify-center gap-2">
            <span className="text-3xl font-mono font-bold">
              {currentPrice?.toFixed(4) || "---"}
            </span>
            {priceChange !== 0 && (
              <Badge 
                variant="outline" 
                className={priceChange > 0 ? "text-green-500 border-green-500" : "text-red-500 border-red-500"}
              >
                {priceChange > 0 ? "↑" : "↓"} {Math.abs(priceChange).toFixed(4)}
              </Badge>
            )}
          </div>
        </div>

        {/* Trade Parameters */}
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>Stake ({currency})</Label>
            <Input
              type="number"
              min="0.35"
              step="0.01"
              value={stake}
              onChange={(e) => setStake(e.target.value)}
              style={{ backgroundColor: darkMode ? '#1a1a1a' : '#fff' }}
            />
          </div>
          <div className="space-y-2">
            <Label>Duration</Label>
            <Select value={duration} onValueChange={setDuration}>
              <SelectTrigger style={{ backgroundColor: darkMode ? '#1a1a1a' : '#fff' }}>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {DURATIONS.map(d => (
                  <SelectItem key={`${d.value}-${d.unit}`} value={`${d.value}-${d.unit}`}>
                    {d.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Trade Buttons */}
        <div className="grid grid-cols-2 gap-4">
          <Button
            size="lg"
            className="h-20 text-lg flex flex-col gap-1"
            style={{ backgroundColor: "#22c55e", color: "#fff" }}
            onClick={() => handleTrade("CALL")}
            disabled={!isAuthorized || isPlacingTrade || !callProposal}
          >
            {isPlacingTrade ? (
              <Loader2 className="w-6 h-6 animate-spin" />
            ) : (
              <>
                <TrendingUp className="w-6 h-6" />
                <span>RISE</span>
                {callProposal && (
                  <span className="text-xs opacity-80">
                    Payout: {callProposal.payout.toFixed(2)}
                  </span>
                )}
              </>
            )}
          </Button>
          <Button
            size="lg"
            className="h-20 text-lg flex flex-col gap-1"
            style={{ backgroundColor: "#ef4444", color: "#fff" }}
            onClick={() => handleTrade("PUT")}
            disabled={!isAuthorized || isPlacingTrade || !putProposal}
          >
            {isPlacingTrade ? (
              <Loader2 className="w-6 h-6 animate-spin" />
            ) : (
              <>
                <TrendingDown className="w-6 h-6" />
                <span>FALL</span>
                {putProposal && (
                  <span className="text-xs opacity-80">
                    Payout: {putProposal.payout.toFixed(2)}
                  </span>
                )}
              </>
            )}
          </Button>
        </div>

        {!isAuthorized && isConnected && (
          <p className="text-center text-sm text-yellow-500">
            Authorizing your account...
          </p>
        )}

        {!isConnected && (
          <p className="text-center text-sm text-red-500">
            Connecting to trading server...
          </p>
        )}
      </CardContent>
    </Card>
  );
}
