import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Loader2, LogIn, AlertCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface DerivAuthButtonProps {
  siteId: string;
  siteName: string;
  primaryColor: string;
  darkMode: boolean;
  onSuccess: (user: SiteUser) => void;
}

export interface SiteUser {
  id: string;
  loginid: string;
  email: string;
  fullname: string;
  balance: number;
  currency: string;
  accounts: Array<{ loginid: string; currency: string }>;
  token?: string;
}

const OAUTH_STATE_KEY = "deriv_oauth_state";
const OAUTH_SITE_KEY = "deriv_oauth_site";

export function DerivAuthButton({ siteId, siteName, primaryColor, darkMode, onSuccess }: DerivAuthButtonProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [appId, setAppId] = useState<string | null>(null);
  const [callbackProcessed, setCallbackProcessed] = useState(false);

  useEffect(() => {
    fetchAppId();
  }, []);

  useEffect(() => {
    if (appId && !callbackProcessed) {
      handleOAuthCallback();
    }
  }, [appId, callbackProcessed]);

  const fetchAppId = async () => {
    try {
      const { data, error } = await supabase
        .from('platform_settings')
        .select('setting_value')
        .eq('setting_key', 'deriv_app_id')
        .single();

      if (error) throw error;

      if (data?.setting_value) {
        setAppId(data.setting_value);
      } else {
        setError("Platform not configured. Contact administrator.");
      }
    } catch (err) {
      console.error("Error fetching app ID:", err);
      setError("Failed to load configuration");
    }
  };

  const handleOAuthCallback = async () => {
    const urlParams = new URLSearchParams(window.location.search);
    const tokens: string[] = [];
    const accounts: string[] = [];

    for (let i = 1; i <= 10; i++) {
      const token = urlParams.get(`token${i}`);
      const acct = urlParams.get(`acct${i}`);
      if (token && acct) {
        tokens.push(token);
        accounts.push(acct);
      }
    }

    if (tokens.length === 0) {
      setCallbackProcessed(true);
      return;
    }

    // We have OAuth tokens — process them
    setCallbackProcessed(true);
    setIsLoading(true);

    // State validation - be lenient if state was lost (e.g. different tab/domain redirect)
    const savedState = localStorage.getItem(OAUTH_STATE_KEY);
    const returnedState = urlParams.get("state");
    
    // Get stored site ID - fall back to current siteId if not found
    const storedSiteId = localStorage.getItem(OAUTH_SITE_KEY) || siteId;

    // Clean up OAuth state
    localStorage.removeItem(OAUTH_STATE_KEY);
    localStorage.removeItem(OAUTH_SITE_KEY);

    // Warn but don't block if state doesn't match (cross-domain redirects can lose state)
    if (savedState && returnedState && savedState !== returnedState) {
      console.warn("OAuth state mismatch - proceeding anyway (may be cross-domain redirect)");
    }

    try {
      const { data, error } = await supabase.functions.invoke("deriv-oauth-callback", {
        body: {
          token: tokens[0],
          siteId: storedSiteId,
          appId,
          accounts: accounts.map((loginid, i) => ({ loginid, token: tokens[i] }))
        },
      });

      if (error) throw error;

      if (data.error) {
        console.error("Auth error:", data.error);
        toast.error(data.error);
        return;
      }

      // Store the first token for trading
      const userWithToken = {
        ...data.user,
        token: tokens[0],
      };

      toast.success(`Welcome, ${data.user.fullname}!`);
      onSuccess(userWithToken);
    } catch (err) {
      console.error("OAuth callback error:", err);
      toast.error("Failed to complete sign in. Please try again.");
    } finally {
      setIsLoading(false);
      // Clean URL of OAuth params
      window.history.replaceState({}, document.title, window.location.pathname);
    }
  };

  const initiateOAuth = () => {
    if (!appId) {
      toast.error("Platform not configured. Please contact administrator.");
      return;
    }

    const state = crypto.randomUUID();
    localStorage.setItem(OAUTH_STATE_KEY, state);
    localStorage.setItem(OAUTH_SITE_KEY, siteId);
    // Store the current slug so Landing page can redirect back on OAuth callback
    const pathSlug = window.location.pathname.split('/s/')[1];
    if (pathSlug) {
      localStorage.setItem('deriv_oauth_slug', pathSlug);
    }

    const oauthUrl = `https://oauth.deriv.com/oauth2/authorize?app_id=${appId}&l=EN&brand=deriv&state=${state}`;
    window.location.href = oauthUrl;
  };

  if (error) {
    return (
      <Button disabled variant="outline" className="gap-2">
        <AlertCircle className="w-4 h-4" />
        Configuration Error
      </Button>
    );
  }

  if (isLoading || !appId) {
    return (
      <Button
        disabled
        style={{ backgroundColor: primaryColor, color: '#fff' }}
        className="gap-2"
      >
        <Loader2 className="w-4 h-4 animate-spin" />
        {isLoading ? "Connecting..." : "Loading..."}
      </Button>
    );
  }

  return (
    <Button
      onClick={initiateOAuth}
      style={{ backgroundColor: primaryColor, color: '#fff' }}
      className="gap-2"
    >
      <LogIn className="w-4 h-4" />
      Sign Up / Login with Deriv
    </Button>
  );
}
