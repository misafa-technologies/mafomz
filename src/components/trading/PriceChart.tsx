import { useEffect, useRef, useState } from "react";
import { createChart, IChartApi, ISeriesApi, Time } from "lightweight-charts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  TrendingUp, 
  BarChart3, 
  LineChart as LineChartIcon,
  CandlestickChart,
  RefreshCw,
  Maximize2
} from "lucide-react";

interface PriceChartProps {
  asset: string;
  assetLabel: string;
  prices: number[];
  currentPrice: number | null;
  darkMode: boolean;
  primaryColor: string;
}

type ChartType = "line" | "candle" | "area";

export function PriceChart({ 
  asset, 
  assetLabel, 
  prices, 
  currentPrice, 
  darkMode, 
  primaryColor 
}: PriceChartProps) {
  const chartContainerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<IChartApi | null>(null);
  const seriesRef = useRef<ISeriesApi<"Line"> | ISeriesApi<"Candlestick"> | ISeriesApi<"Area"> | null>(null);
  const [chartType, setChartType] = useState<ChartType>("area");
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Initialize chart
  useEffect(() => {
    if (!chartContainerRef.current) return;

    // Clear previous chart
    if (chartRef.current) {
      chartRef.current.remove();
    }

    const chart = createChart(chartContainerRef.current, {
      layout: {
        background: { color: darkMode ? 'rgba(0,0,0,0)' : 'rgba(255,255,255,0)' },
        textColor: darkMode ? '#d1d5db' : '#374151',
      },
      grid: {
        vertLines: { color: darkMode ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)' },
        horzLines: { color: darkMode ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)' },
      },
      width: chartContainerRef.current.clientWidth,
      height: isFullscreen ? 500 : 280,
      rightPriceScale: {
        borderColor: darkMode ? '#333' : '#e5e7eb',
      },
      timeScale: {
        borderColor: darkMode ? '#333' : '#e5e7eb',
        timeVisible: true,
        secondsVisible: true,
      },
      crosshair: {
        mode: 1,
        vertLine: {
          color: primaryColor,
          width: 1,
          style: 2,
        },
        horzLine: {
          color: primaryColor,
          width: 1,
          style: 2,
        },
      },
    });

    chartRef.current = chart;

    // Create series based on chart type - using line series for all types in v5
    const series = chart.addSeries({
      type: chartType === "candle" ? 'Candlestick' : chartType === "area" ? 'Area' : 'Line',
      color: primaryColor,
      lineWidth: 2,
      ...(chartType === "candle" && {
        upColor: '#22c55e',
        downColor: '#ef4444',
        borderUpColor: '#22c55e',
        borderDownColor: '#ef4444',
        wickUpColor: '#22c55e',
        wickDownColor: '#ef4444',
      }),
      ...(chartType === "area" && {
        lineColor: primaryColor,
        topColor: `${primaryColor}60`,
        bottomColor: `${primaryColor}10`,
      }),
    });

    seriesRef.current = series as ISeriesApi<"Line">;

    // Handle resize
    const handleResize = () => {
      if (chartContainerRef.current && chartRef.current) {
        chartRef.current.applyOptions({
          width: chartContainerRef.current.clientWidth,
        });
      }
    };

    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      if (chartRef.current) {
        chartRef.current.remove();
        chartRef.current = null;
      }
    };
  }, [darkMode, primaryColor, chartType, isFullscreen]);

  // Update chart data
  useEffect(() => {
    if (!seriesRef.current || prices.length === 0) return;

    const now = Date.now();
    const interval = 1000; // 1 second between points

    if (chartType === "candle") {
      // Generate OHLC data from prices
      const candleData: CandlestickData[] = [];
      const groupSize = 5; // Group 5 ticks into one candle
      
      for (let i = 0; i < prices.length; i += groupSize) {
        const group = prices.slice(i, i + groupSize);
        if (group.length > 0) {
          candleData.push({
            time: ((now - (prices.length - i) * interval) / 1000) as Time,
            open: group[0],
            high: Math.max(...group),
            low: Math.min(...group),
            close: group[group.length - 1],
          });
        }
      }
      
      (seriesRef.current as ISeriesApi<"Candlestick">).setData(candleData);
    } else {
      // Line or Area data
      const lineData: LineData[] = prices.map((price, index) => ({
        time: ((now - (prices.length - index) * interval) / 1000) as Time,
        value: price,
      }));
      
      (seriesRef.current as ISeriesApi<"Line"> | ISeriesApi<"Area">).setData(lineData);
    }

    // Fit content
    if (chartRef.current) {
      chartRef.current.timeScale().fitContent();
    }
  }, [prices, chartType]);

  // Calculate price change
  const priceChange = prices.length >= 2 
    ? prices[prices.length - 1] - prices[prices.length - 2]
    : 0;
  const priceChangePercent = prices.length >= 2 && prices[prices.length - 2] !== 0
    ? ((priceChange / prices[prices.length - 2]) * 100).toFixed(3)
    : "0.000";

  const cardStyle = {
    backgroundColor: darkMode ? 'rgba(255,255,255,0.05)' : '#fff',
    borderColor: darkMode ? '#333' : '#eee',
  };

  return (
    <Card style={cardStyle} className={isFullscreen ? "fixed inset-4 z-50" : ""}>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <CardTitle className="flex items-center gap-2 text-lg">
              <BarChart3 className="w-5 h-5" style={{ color: primaryColor }} />
              {assetLabel}
            </CardTitle>
            {currentPrice && (
              <div className="flex items-center gap-2">
                <span className="text-xl font-mono font-bold" style={{ color: darkMode ? '#fff' : '#000' }}>
                  {currentPrice.toFixed(4)}
                </span>
                <Badge 
                  variant="outline" 
                  className={priceChange >= 0 ? "text-green-500 border-green-500/30" : "text-red-500 border-red-500/30"}
                >
                  {priceChange >= 0 ? "+" : ""}{priceChangePercent}%
                </Badge>
              </div>
            )}
          </div>
          
          <div className="flex items-center gap-2">
            <Tabs value={chartType} onValueChange={(v) => setChartType(v as ChartType)}>
              <TabsList className="h-8">
                <TabsTrigger value="area" className="px-2 h-6">
                  <TrendingUp className="w-4 h-4" />
                </TabsTrigger>
                <TabsTrigger value="line" className="px-2 h-6">
                  <LineChartIcon className="w-4 h-4" />
                </TabsTrigger>
                <TabsTrigger value="candle" className="px-2 h-6">
                  <CandlestickChart className="w-4 h-4" />
                </TabsTrigger>
              </TabsList>
            </Tabs>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={() => setIsFullscreen(!isFullscreen)}
            >
              <Maximize2 className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-0 pb-4 px-4">
        <div 
          ref={chartContainerRef} 
          className="w-full rounded-lg overflow-hidden"
          style={{ height: isFullscreen ? '500px' : '280px' }}
        />
        
        {/* Price Stats */}
        <div className="grid grid-cols-4 gap-4 mt-4 text-center text-sm">
          <div className="p-2 rounded-lg" style={{ backgroundColor: darkMode ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.02)' }}>
            <p className="text-xs text-muted-foreground">High</p>
            <p className="font-mono font-medium" style={{ color: '#22c55e' }}>
              {prices.length > 0 ? Math.max(...prices).toFixed(4) : "---"}
            </p>
          </div>
          <div className="p-2 rounded-lg" style={{ backgroundColor: darkMode ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.02)' }}>
            <p className="text-xs text-muted-foreground">Low</p>
            <p className="font-mono font-medium" style={{ color: '#ef4444' }}>
              {prices.length > 0 ? Math.min(...prices).toFixed(4) : "---"}
            </p>
          </div>
          <div className="p-2 rounded-lg" style={{ backgroundColor: darkMode ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.02)' }}>
            <p className="text-xs text-muted-foreground">Open</p>
            <p className="font-mono font-medium">
              {prices.length > 0 ? prices[0].toFixed(4) : "---"}
            </p>
          </div>
          <div className="p-2 rounded-lg" style={{ backgroundColor: darkMode ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.02)' }}>
            <p className="text-xs text-muted-foreground">Change</p>
            <p className={`font-mono font-medium ${priceChange >= 0 ? 'text-green-500' : 'text-red-500'}`}>
              {priceChange >= 0 ? "+" : ""}{priceChange.toFixed(4)}
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
