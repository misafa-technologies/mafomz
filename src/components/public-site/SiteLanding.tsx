import { Button } from "@/components/ui/button";
import { Bot, TrendingUp, Shield, Zap, BarChart3, Users } from "lucide-react";
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

const features = [
  {
    icon: BarChart3,
    title: "Direct Trading",
    description: "Trade directly on this platform with real-time charts and instant execution",
  },
  {
    icon: Bot,
    title: "Automated Trading Bots",
    description: "Run pre-built trading bots or create your own automated strategies",
  },
  {
    icon: TrendingUp,
    title: "AI Trading Signals",
    description: "Get real-time AI-powered trading signals with high accuracy",
  },
  {
    icon: Shield,
    title: "Secure & Regulated",
    description: "Trade with confidence on a secure, Deriv-powered platform",
  },
  {
    icon: Zap,
    title: "Fast Execution",
    description: "Lightning-fast trade execution with minimal slippage",
  },
  {
    icon: Users,
    title: "Community Bots",
    description: "Access and share trading bots with the community",
  },
];

export function SiteLanding({ site, onAuthSuccess }: SiteLandingProps) {
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
          <div 
            className="inline-block px-4 py-2 rounded-full text-sm font-medium mb-4"
            style={{ 
              backgroundColor: site.dark_mode ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)',
            }}
          >
            🚀 Powered by Deriv
          </div>
          <h2 className="text-4xl md:text-6xl font-bold leading-tight">
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
              onClick={() => document.getElementById('features')?.scrollIntoView({ behavior: 'smooth' })}
              style={{ 
                borderColor: site.primary_color,
                color: site.primary_color,
              }}
            >
              Learn More
            </Button>
          </div>

          {/* Stats */}
          <div 
            className="grid grid-cols-3 gap-8 max-w-xl mx-auto mt-12 pt-8 border-t"
            style={{ borderColor: site.dark_mode ? '#333' : '#eee' }}
          >
            <div>
              <p className="text-3xl font-bold" style={{ color: site.primary_color }}>24/7</p>
              <p className="text-sm opacity-60">Trading</p>
            </div>
            <div>
              <p className="text-3xl font-bold" style={{ color: site.primary_color }}>100+</p>
              <p className="text-sm opacity-60">Assets</p>
            </div>
            <div>
              <p className="text-3xl font-bold" style={{ color: site.primary_color }}>Fast</p>
              <p className="text-sm opacity-60">Execution</p>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-16 px-6">
        <div className="max-w-6xl mx-auto">
          <h3 className="text-3xl font-bold text-center mb-4">Everything You Need</h3>
          <p className="text-center opacity-70 mb-12 max-w-2xl mx-auto">
            Access professional trading tools, automated bots, and AI-powered signals all in one place
          </p>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((feature, index) => (
              <div
                key={index}
                className="p-6 rounded-xl border transition-all hover:scale-[1.02]"
                style={{
                  borderColor: site.dark_mode ? '#333' : '#ddd',
                  backgroundColor: site.dark_mode ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.01)',
                }}
              >
                <feature.icon 
                  className="w-10 h-10 mb-4" 
                  style={{ color: site.primary_color }}
                />
                <h4 className="font-semibold text-lg mb-2">{feature.title}</h4>
                <p className="text-sm opacity-70">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section 
        className="py-16 px-6"
        style={{ backgroundColor: site.dark_mode ? 'rgba(255,255,255,0.02)' : 'rgba(0,0,0,0.02)' }}
      >
        <div className="max-w-4xl mx-auto">
          <h3 className="text-3xl font-bold text-center mb-12">Get Started in 3 Steps</h3>
          <div className="grid md:grid-cols-3 gap-8">
            {[
              { step: "1", title: "Sign Up", desc: "Connect your existing Deriv account or create a new one" },
              { step: "2", title: "Choose Tools", desc: "Select from trading, bots, or AI signals" },
              { step: "3", title: "Start Trading", desc: "Execute trades directly on this platform" },
            ].map((item) => (
              <div key={item.step} className="text-center">
                <div 
                  className="w-12 h-12 rounded-full flex items-center justify-center text-white font-bold text-xl mx-auto mb-4"
                  style={{ backgroundColor: site.primary_color }}
                >
                  {item.step}
                </div>
                <h4 className="font-semibold text-lg mb-2">{item.title}</h4>
                <p className="text-sm opacity-70">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 px-6">
        <div className="max-w-4xl mx-auto text-center space-y-6">
          <h3 className="text-3xl font-bold">Ready to Start Trading?</h3>
          <p className="text-lg opacity-70">
            Connect your Deriv account and access all trading tools instantly
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
