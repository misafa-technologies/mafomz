import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { 
  Zap, 
  Shield, 
  Globe, 
  TrendingUp, 
  Bot, 
  BarChart3,
  ChevronRight,
  Sparkles,
  ArrowRight
} from "lucide-react";

interface PlatformSettings {
  platform_name: string;
  platform_description: string;
  contact_email: string;
  contact_phone: string;
}

const Landing = () => {
  const [settings, setSettings] = useState<PlatformSettings>({
    platform_name: "Mafomz",
    platform_description: "",
    contact_email: "",
    contact_phone: "",
  });

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    const { data } = await supabase
      .from("platform_settings")
      .select("setting_key, setting_value");

    if (data) {
      const settingsMap: PlatformSettings = {
        platform_name: "Mafomz",
        platform_description: "",
        contact_email: "",
        contact_phone: "",
      };
      data.forEach((item) => {
        if (item.setting_key in settingsMap) {
          settingsMap[item.setting_key as keyof PlatformSettings] = item.setting_value || "";
        }
      });
      setSettings(settingsMap);
    }
  };

  const platformName = settings.platform_name || "Mafomz";
  const features = [
    {
      icon: Globe,
      title: "One-Click Deploy",
      description: "Launch your Deriv trading website in minutes with automated hosting, SSL, and CDN."
    },
    {
      icon: Shield,
      title: "Secure Integration",
      description: "Permanent Deriv account binding with encrypted token storage and scope validation."
    },
    {
      icon: Bot,
      title: "XML Bots & AI Signals",
      description: "Embed automated trading bots and AI-powered signals directly into your site."
    },
    {
      icon: TrendingUp,
      title: "Affiliate Commissions",
      description: "Monetize your trading platform with built-in Deriv affiliate tracking and payouts."
    },
    {
      icon: Sparkles,
      title: "No-Code Customization",
      description: "Customize branding, themes, colors, and layouts without writing any code."
    },
    {
      icon: BarChart3,
      title: "Analytics Dashboard",
      description: "Track visits, conversions, and commissions with real-time analytics."
    }
  ];

  return (
    <div className="min-h-screen bg-background relative overflow-hidden">
      {/* Background Effects */}
      <div 
        className="fixed inset-0 opacity-40 pointer-events-none"
        style={{ background: 'var(--gradient-mesh)' }}
      />
      <div className="fixed inset-0 bg-[radial-gradient(ellipse_at_top,hsl(187_85%_53%/0.08),transparent_50%)] pointer-events-none" />
      
      {/* Navigation */}
      <nav className="relative z-10 flex items-center justify-between p-6 max-w-7xl mx-auto">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-accent flex items-center justify-center">
            <Zap className="w-5 h-5 text-primary-foreground" />
          </div>
          <span className="text-xl font-bold text-foreground">{platformName}</span>
        </div>
        
        <div className="flex items-center gap-4">
          <Link to="/auth">
            <Button variant="ghost" className="text-muted-foreground hover:text-foreground">
              Sign In
            </Button>
          </Link>
          <Link to="/auth?mode=signup">
            <Button variant="gradient" className="gap-2">
              Get Started <ChevronRight className="w-4 h-4" />
            </Button>
          </Link>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative z-10 max-w-7xl mx-auto px-6 pt-20 pb-32">
        <div className="text-center max-w-4xl mx-auto">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full glass mb-8 animate-fade-in">
            <Sparkles className="w-4 h-4 text-primary" />
            <span className="text-sm text-muted-foreground">Powered by Deriv API</span>
          </div>
          
          <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight mb-6">
            Build Your{" "}
            <span className="gradient-text">Trading Empire</span>
          </h1>
          
          <p className="text-xl text-muted-foreground mb-10 max-w-2xl mx-auto leading-relaxed">
            {settings.platform_description || "Create, customize, and deploy Deriv-integrated trading websites in minutes. No coding required. Full automation. Maximum profit."}
          </p>
          
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link to="/auth?mode=signup">
              <Button size="xl" variant="gradient" className="gap-2 animate-glow">
                Start Building Free <ArrowRight className="w-5 h-5" />
              </Button>
            </Link>
            <Button size="xl" variant="outline" className="gap-2">
              Watch Demo
            </Button>
          </div>
          
          {/* Stats */}
          <div className="flex flex-wrap items-center justify-center gap-12 mt-16 pt-16 border-t border-border/50">
            <div className="text-center">
              <div className="text-3xl font-bold gradient-text">10K+</div>
              <div className="text-sm text-muted-foreground mt-1">Sites Deployed</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold gradient-text">$2M+</div>
              <div className="text-sm text-muted-foreground mt-1">Commissions Earned</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold gradient-text">99.9%</div>
              <div className="text-sm text-muted-foreground mt-1">Uptime</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold gradient-text">24/7</div>
              <div className="text-sm text-muted-foreground mt-1">Support</div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="relative z-10 max-w-7xl mx-auto px-6 py-24">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            Everything You Need to <span className="gradient-text">Succeed</span>
          </h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            A complete platform for building, deploying, and monetizing Deriv trading websites.
          </p>
        </div>
        
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((feature, index) => (
            <div 
              key={index}
              className="group p-6 rounded-2xl glass glass-hover cursor-default"
              style={{ animationDelay: `${index * 100}ms` }}
            >
              <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mb-4 group-hover:bg-primary/20 transition-colors">
                <feature.icon className="w-6 h-6 text-primary" />
              </div>
              <h3 className="text-lg font-semibold text-foreground mb-2">{feature.title}</h3>
              <p className="text-muted-foreground text-sm leading-relaxed">{feature.description}</p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA Section */}
      <section className="relative z-10 max-w-7xl mx-auto px-6 py-24">
        <div className="relative rounded-3xl overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-primary/20 to-accent/20" />
          <div className="absolute inset-0 glass" />
          <div className="relative p-12 md:p-16 text-center">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Ready to Launch Your Trading Platform?
            </h2>
            <p className="text-muted-foreground mb-8 max-w-xl mx-auto">
              Join thousands of traders who have built successful Deriv-integrated websites with {platformName}.
            </p>
            <Link to="/auth?mode=signup">
              <Button size="xl" variant="gradient" className="gap-2">
                Create Your Free Account <ArrowRight className="w-5 h-5" />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="relative z-10 border-t border-border/50 py-8">
        <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary to-accent flex items-center justify-center">
              <Zap className="w-4 h-4 text-primary-foreground" />
            </div>
            <span className="text-sm text-muted-foreground">© 2025 {platformName}. All rights reserved.</span>
          </div>
          <div className="flex items-center gap-6 text-sm text-muted-foreground">
            <a href="#" className="hover:text-foreground transition-colors">Privacy</a>
            <a href="#" className="hover:text-foreground transition-colors">Terms</a>
            {settings.contact_email && (
              <a href={`mailto:${settings.contact_email}`} className="hover:text-foreground transition-colors">Contact</a>
            )}
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Landing;
