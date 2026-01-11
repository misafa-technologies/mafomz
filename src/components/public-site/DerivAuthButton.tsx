import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Loader2, LogIn } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

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
}

const DERIV_APP_ID = "1089";
const OAUTH_STATE_KEY = "deriv_oauth_state";

export function DerivAuthButton({ siteId, siteName, primaryColor, darkMode, onSuccess }: DerivAuthButtonProps) {
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    // Check for OAuth callback tokens in URL
    handleOAuthCallback();
  }, []);

  const handleOAuthCallback = async () => {
    const urlParams = new URLSearchParams(window.location.search);
    const tokens: string[] = [];
    const accounts: string[] = [];
    
    // Deriv returns tokens as token1, token2, etc. and accounts as acct1, acct2, etc.
    for (let i = 1; i <= 10; i++) {
      const token = urlParams.get(`token${i}`);
      const acct = urlParams.get(`acct${i}`);
      if (token && acct) {
        tokens.push(token);
        accounts.push(acct);
      }
    }

    if (tokens.length === 0) return;

    // Verify state to prevent CSRF
    const savedState = localStorage.getItem(OAUTH_STATE_KEY);
    const returnedState = urlParams.get("state");
    
    if (!savedState || savedState !== returnedState) {
      console.error("OAuth state mismatch");
      // Clear URL params
      window.history.replaceState({}, document.title, window.location.pathname);
      return;
    }

    localStorage.removeItem(OAUTH_STATE_KEY);
    setIsLoading(true);

    try {
      // Use the first token to authenticate
      const { data, error } = await supabase.functions.invoke("deriv-oauth-callback", {
        body: { 
          token: tokens[0], 
          siteId,
          accounts: accounts.map((loginid, i) => ({ loginid, token: tokens[i] }))
        },
      });

      if (error) throw error;

      if (data.error) {
        console.error("Auth error:", data.error);
        return;
      }

      onSuccess(data.user);
    } catch (err) {
      console.error("OAuth callback error:", err);
    } finally {
      setIsLoading(false);
      // Clear URL params
      window.history.replaceState({}, document.title, window.location.pathname);
    }
  };

  const initiateOAuth = () => {
    // Generate state for CSRF protection
    const state = crypto.randomUUID();
    localStorage.setItem(OAUTH_STATE_KEY, state);
    
    // Store site info for callback
    localStorage.setItem("oauth_site_id", siteId);

    // Build OAuth URL
    const currentUrl = window.location.origin + window.location.pathname;
    const oauthUrl = `https://oauth.deriv.com/oauth2/authorize?app_id=${DERIV_APP_ID}&l=EN&brand=deriv&state=${state}`;
    
    // Redirect to Deriv OAuth
    window.location.href = oauthUrl;
  };

  if (isLoading) {
    return (
      <Button
        disabled
        style={{ backgroundColor: primaryColor, color: '#fff' }}
        className="gap-2"
      >
        <Loader2 className="w-4 h-4 animate-spin" />
        Connecting...
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
