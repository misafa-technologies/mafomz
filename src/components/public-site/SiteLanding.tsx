import { Button } from "@/components/ui/button";
import { ExternalLink, Bot, TrendingUp, Shield, Zap } from "lucide-react";
import { DerivAuthButton, SiteUser } from "./DerivAuthButton";

interface SiteData {
  id: string;
  name: string;
  description: string | null;
  logo_url: string | null;
  primary_color: string;
  secondary_color: string;
  dark_mode: boolean;
  footer_text: string | null;
  apps: string[];
}

interface SiteLandingProps {
  site: SiteData;
  onAuthSuccess: (user: SiteUser) => void;
}

const derivAppUrls: Record<string, { name: string; url: string; icon: string; description: string }> = {
  dtrader: {
    name: "DTrader",
    url: "https://app.deriv.com/dtrader",
    icon: "📈",
    description: "Trade forex, indices, and commodities with advanced charting",
  },
  dbot: {
    name: "DBot",
    url: "https://app.deriv.com/bot",
    icon: "🤖",
    description: "Automate your trading strategies with drag-and-drop bots",
  },
  smarttrader: {
    name: "SmartTrader",
    url: "https://smarttrader.deriv.com/en/trading.html",
    icon: "💹",
    description: "Classic trading interface with options and multipliers",
  },
  derivgo: {
    name: "Deriv GO",
    url: "https://app.deriv.com/derivgo",
    icon: "📱",
    description: "Trade on-the-go with our mobile-optimized platform",
  },
};

const features = [
  {
    icon: Bot,
    title: "Automated Trading Bots",
    description: "Access pre-built trading bots or create your own automated strategies",
  },
  {
    icon: TrendingUp,
    title: "AI Trading Signals",
    description: "Get real-time AI-powered trading signals with high accuracy",
  },
  {
    icon: Shield,
    title: "Secure & Regulated",
    description: "Trade with confidence on a secure, regulated platform",
  },
  {
    icon: Zap,
    title: "Fast Execution",
    description: "Lightning-fast trade execution with minimal slippage",
  },
];

export function SiteLanding({ site, onAuthSuccess }: SiteLandingProps) {
  const apps = site.apps || [];

  return (
    <div 
      className="min-h-screen"
      style={{
        backgroundColor: site.dark_mode ? '#0a0a0a' : '#ffffff',
        color: site.dark_mode ? '#ffffff' : '#0a0a0a',
      }}
    >
      {/* Header */}
      <header 
        className="border-b py-4 px-6 sticky top-0 z-50 backdrop-blur-lg"
        style={{ 
          borderColor: site.dark_mode ? '#222' : '#eee',
          background: site.dark_mode ? 'rgba(10,10,10,0.9)' : 'rgba(255,255,255,0.9)',
        }}
      >
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            {site.logo_url ? (
              <img src={site.logo_url} alt={site.name} className="h-10 w-10 rounded-lg object-cover" />
            ) : (
              <div 
                className="h-10 w-10 rounded-lg flex items-center justify-center text-white font-bold"
                style={{ backgroundColor: site.primary_color }}
              >
                {site.name.charAt(0).toUpperCase()}
              </div>
            )}
            <h1 className="text-xl font-bold">{site.name}</h1>
          </div>
          <DerivAuthButton
            siteId={site.id}
            siteName={site.name}
            primaryColor={site.primary_color}
            darkMode={site.dark_mode}
            onSuccess={onAuthSuccess}
          />
        </div>
      </header>

      {/* Hero Section */}
      <section className="py-20 px-6">
        <div className="max-w-4xl mx-auto text-center space-y-6">
          <h2 className="text-4xl md:text-5xl font-bold leading-tight">
            Trade Smarter with{" "}
            <span style={{ color: site.primary_color }}>{site.name}</span>
          </h2>
          {site.description && (
            <p className="text-xl opacity-70 max-w-2xl mx-auto">
              {site.description}
            </p>
          )}
          <div className="flex gap-4 justify-center flex-wrap pt-4">
            <DerivAuthButton
              siteId={site.id}
              siteName={site.name}
              primaryColor={site.primary_color}
              darkMode={site.dark_mode}
              onSuccess={onAuthSuccess}
            />
            <Button
              size="lg"
              variant="outline"
              onClick={() => document.getElementById('platforms')?.scrollIntoView({ behavior: 'smooth' })}
              style={{ 
                borderColor: site.primary_color,
                color: site.primary_color,
              }}
            >
              Explore Platforms
            </Button>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16 px-6">
        <div className="max-w-6xl mx-auto">
          <h3 className="text-2xl font-bold text-center mb-10">Why Trade With Us</h3>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {features.map((feature, index) => (
              <div
                key={index}
                className="p-6 rounded-xl border text-center"
                style={{
                  borderColor: site.dark_mode ? '#333' : '#ddd',
                  backgroundColor: site.dark_mode ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.01)',
                }}
              >
                <feature.icon 
                  className="w-10 h-10 mx-auto mb-4" 
                  style={{ color: site.primary_color }}
                />
                <h4 className="font-semibold text-lg mb-2">{feature.title}</h4>
                <p className="text-sm opacity-70">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Trading Platforms Section */}
      {apps.length > 0 && (
        <section id="platforms" className="py-16 px-6">
          <div className="max-w-6xl mx-auto">
            <h3 className="text-2xl font-bold text-center mb-4">Trading Platforms</h3>
            <p className="text-center opacity-70 mb-10 max-w-2xl mx-auto">
              Access world-class trading platforms powered by Deriv
            </p>
            <div className="grid md:grid-cols-2 gap-6">
              {apps.map((appId) => {
                const app = derivAppUrls[appId];
                if (!app) return null;
                return (
                  <a
                    key={appId}
                    href={app.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-6 rounded-xl border transition-all hover:scale-[1.02] hover:shadow-lg flex items-start gap-4"
                    style={{
                      borderColor: site.dark_mode ? '#333' : '#ddd',
                      backgroundColor: site.dark_mode ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.02)',
                    }}
                  >
                    <div className="text-4xl">{app.icon}</div>
                    <div className="flex-1">
                      <h4 className="font-semibold text-lg flex items-center gap-2">
                        {app.name}
                        <ExternalLink className="w-4 h-4 opacity-40" />
                      </h4>
                      <p className="text-sm opacity-70 mt-1">{app.description}</p>
                    </div>
                  </a>
                );
              })}
            </div>
          </div>
        </section>
      )}

      {/* CTA Section */}
      <section 
        className="py-16 px-6"
        style={{ backgroundColor: site.dark_mode ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.02)' }}
      >
        <div className="max-w-4xl mx-auto text-center space-y-6">
          <h3 className="text-3xl font-bold">Ready to Start Trading?</h3>
          <p className="text-lg opacity-70">
            Connect your Deriv account and access all our trading tools instantly
          </p>
          <DerivAuthButton
            siteId={site.id}
            siteName={site.name}
            primaryColor={site.primary_color}
            darkMode={site.dark_mode}
            onSuccess={onAuthSuccess}
          />
        </div>
      </section>

      {/* Footer */}
      <footer 
        className="py-8 px-6 border-t"
        style={{ borderColor: site.dark_mode ? '#222' : '#eee' }}
      >
        <div className="max-w-6xl mx-auto text-center">
          <p className="opacity-60">
            {site.footer_text || `© ${new Date().getFullYear()} ${site.name}. All rights reserved.`}
          </p>
          <p className="text-xs opacity-40 mt-2">
            Powered by Deriv • Trading involves risk
          </p>
        </div>
      </footer>
    </div>
  );
}
