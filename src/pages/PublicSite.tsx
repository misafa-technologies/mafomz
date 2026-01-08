import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, AlertCircle, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";

interface SiteData {
  id: string;
  name: string;
  description: string | null;
  logo_url: string | null;
  primary_color: string;
  secondary_color: string;
  dark_mode: boolean;
  footer_text: string | null;
  apps: string[] | null;
  deriv_account_id: string | null;
  status: string | null;
}

const derivAppUrls: Record<string, { name: string; url: string; icon: string }> = {
  dtrader: {
    name: "DTrader",
    url: "https://app.deriv.com/dtrader",
    icon: "📈",
  },
  dbot: {
    name: "DBot",
    url: "https://app.deriv.com/bot",
    icon: "🤖",
  },
  smarttrader: {
    name: "SmartTrader",
    url: "https://smarttrader.deriv.com/en/trading.html",
    icon: "💹",
  },
  derivgo: {
    name: "Deriv GO",
    url: "https://app.deriv.com/derivgo",
    icon: "📱",
  },
};

export default function PublicSite() {
  const { slug } = useParams<{ slug: string }>();
  const [site, setSite] = useState<SiteData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (slug) {
      fetchSite();
    }
  }, [slug]);

  const fetchSite = async () => {
    try {
      const { data, error } = await supabase
        .from("sites")
        .select("id, name, description, logo_url, primary_color, secondary_color, dark_mode, footer_text, apps, deriv_account_id, status")
        .eq("subdomain", slug)
        .eq("status", "live")
        .maybeSingle();

      if (error) throw error;

      if (!data) {
        setError("Site not found or not published");
        return;
      }

      // Parse apps - handle JSON type safely
      const apps = Array.isArray(data.apps) 
        ? data.apps.filter((app): app is string => typeof app === 'string')
        : [];

      setSite({
        ...data,
        apps,
      });
    } catch (err) {
      console.error("Error fetching site:", err);
      setError("Failed to load site");
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (error || !site) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center space-y-4">
          <AlertCircle className="w-16 h-16 text-destructive mx-auto" />
          <h1 className="text-2xl font-bold text-foreground">Site Not Found</h1>
          <p className="text-muted-foreground">{error || "This site doesn't exist or is not published."}</p>
          <Button variant="outline" onClick={() => window.location.href = "/"}>
            Go Home
          </Button>
        </div>
      </div>
    );
  }

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
        className="border-b py-4 px-6"
        style={{ 
          borderColor: site.dark_mode ? '#222' : '#eee',
          background: site.dark_mode ? 'rgba(0,0,0,0.5)' : 'rgba(255,255,255,0.9)',
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
          <Button
            style={{ 
              backgroundColor: site.primary_color,
              color: '#fff',
            }}
          >
            Get Started
          </Button>
        </div>
      </header>

      {/* Hero Section */}
      <section className="py-20 px-6">
        <div className="max-w-4xl mx-auto text-center space-y-6">
          <h2 className="text-4xl md:text-5xl font-bold">
            Welcome to {site.name}
          </h2>
          {site.description && (
            <p className="text-xl opacity-70 max-w-2xl mx-auto">
              {site.description}
            </p>
          )}
          <div className="flex gap-4 justify-center flex-wrap">
            <Button
              size="lg"
              style={{ 
                backgroundColor: site.primary_color,
                color: '#fff',
              }}
            >
              Start Trading
            </Button>
            <Button
              size="lg"
              variant="outline"
              style={{ 
                borderColor: site.primary_color,
                color: site.primary_color,
              }}
            >
              Learn More
            </Button>
          </div>
        </div>
      </section>

      {/* Apps Section */}
      {apps.length > 0 && (
        <section className="py-16 px-6">
          <div className="max-w-6xl mx-auto">
            <h3 className="text-2xl font-bold text-center mb-10">Trading Platforms</h3>
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
              {apps.map((appId) => {
                const app = derivAppUrls[appId];
                if (!app) return null;
                return (
                  <a
                    key={appId}
                    href={app.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-6 rounded-xl border transition-all hover:scale-105"
                    style={{
                      borderColor: site.dark_mode ? '#333' : '#ddd',
                      backgroundColor: site.dark_mode ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.02)',
                    }}
                  >
                    <div className="text-4xl mb-3">{app.icon}</div>
                    <h4 className="font-semibold text-lg">{app.name}</h4>
                    <div className="flex items-center gap-1 mt-2 text-sm opacity-60">
                      <span>Open Platform</span>
                      <ExternalLink className="w-3 h-3" />
                    </div>
                  </a>
                );
              })}
            </div>
          </div>
        </section>
      )}

      {/* Footer */}
      <footer 
        className="py-8 px-6 border-t mt-auto"
        style={{ borderColor: site.dark_mode ? '#222' : '#eee' }}
      >
        <div className="max-w-6xl mx-auto text-center">
          <p className="opacity-60">
            {site.footer_text || `© ${new Date().getFullYear()} ${site.name}. All rights reserved.`}
          </p>
        </div>
      </footer>
    </div>
  );
}
