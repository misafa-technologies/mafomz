import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SiteLanding } from "@/components/public-site/SiteLanding";
import { SiteUserDashboard } from "@/components/public-site/SiteUserDashboard";
import type { SiteUser } from "@/components/public-site/DerivAuthButton";

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
  deriv_account_id: string | null;
  status: string | null;
}

const SITE_USER_KEY = 'site_user';

export default function PublicSite() {
  const { slug } = useParams<{ slug: string }>();
  const [site, setSite] = useState<SiteData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentUser, setCurrentUser] = useState<SiteUser | null>(null);

  useEffect(() => {
    if (slug) {
      fetchSite();
      loadStoredUser();
    }
  }, [slug]);

  const loadStoredUser = () => {
    try {
      const stored = localStorage.getItem(`${SITE_USER_KEY}_${slug}`);
      if (stored) {
        setCurrentUser(JSON.parse(stored));
      }
    } catch (err) {
      console.error("Error loading stored user:", err);
    }
  };

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

  const handleAuthSuccess = (user: SiteUser) => {
    setCurrentUser(user);
    localStorage.setItem(`${SITE_USER_KEY}_${slug}`, JSON.stringify(user));
  };

  const handleLogout = () => {
    setCurrentUser(null);
    localStorage.removeItem(`${SITE_USER_KEY}_${slug}`);
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

  // Show dashboard if user is logged in
  if (currentUser) {
    return (
      <div
        style={{
          backgroundColor: site.dark_mode ? '#0a0a0a' : '#ffffff',
          minHeight: '100vh',
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
              <h1 className="text-xl font-bold" style={{ color: site.dark_mode ? '#fff' : '#000' }}>
                {site.name}
              </h1>
            </div>
          </div>
        </header>

        <SiteUserDashboard
          user={currentUser}
          siteId={site.id}
          siteName={site.name}
          primaryColor={site.primary_color}
          secondaryColor={site.secondary_color}
          darkMode={site.dark_mode}
          apps={site.apps}
          onLogout={handleLogout}
        />

        {/* Footer */}
        <footer 
          className="py-8 px-6 border-t"
          style={{ 
            borderColor: site.dark_mode ? '#222' : '#eee',
            color: site.dark_mode ? '#fff' : '#000',
          }}
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

  // Show landing page for non-logged in users
  return <SiteLanding site={site} onAuthSuccess={handleAuthSuccess} />;
}
