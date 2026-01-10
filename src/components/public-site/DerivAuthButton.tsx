import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, LogIn, ExternalLink, CheckCircle, AlertCircle } from "lucide-react";
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

export function DerivAuthButton({ siteId, siteName, primaryColor, darkMode, onSuccess }: DerivAuthButtonProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [token, setToken] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleAuth = async () => {
    if (!token.trim()) {
      setError("Please enter your Deriv API token");
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const { data, error: fnError } = await supabase.functions.invoke("deriv-oauth-callback", {
        body: { token, siteId },
      });

      if (fnError) throw fnError;

      if (data.error) {
        setError(data.error);
        return;
      }

      setSuccess(true);
      setTimeout(() => {
        onSuccess(data.user);
        setIsOpen(false);
        setToken("");
        setSuccess(false);
      }, 1500);
    } catch (err) {
      console.error("Auth error:", err);
      setError("Failed to authenticate. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <Button
        onClick={() => setIsOpen(true)}
        style={{ backgroundColor: primaryColor, color: '#fff' }}
        className="gap-2"
      >
        <LogIn className="w-4 h-4" />
        Sign In with Deriv
      </Button>

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent 
          className="sm:max-w-md"
          style={{
            backgroundColor: darkMode ? '#1a1a1a' : '#fff',
            color: darkMode ? '#fff' : '#000',
            borderColor: darkMode ? '#333' : '#ddd',
          }}
        >
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <LogIn className="w-5 h-5" style={{ color: primaryColor }} />
              Sign In to {siteName}
            </DialogTitle>
            <DialogDescription style={{ color: darkMode ? '#aaa' : '#666' }}>
              Connect your Deriv account to access trading features
            </DialogDescription>
          </DialogHeader>

          {success ? (
            <div className="flex flex-col items-center justify-center py-8 gap-4">
              <CheckCircle className="w-16 h-16 text-green-500" />
              <p className="text-lg font-medium">Successfully authenticated!</p>
            </div>
          ) : (
            <div className="space-y-6 py-4">
              <div className="space-y-2">
                <Label>Deriv API Token</Label>
                <Input
                  type="password"
                  placeholder="Enter your API token"
                  value={token}
                  onChange={(e) => setToken(e.target.value)}
                  className="font-mono"
                  style={{
                    backgroundColor: darkMode ? '#0a0a0a' : '#fff',
                    borderColor: darkMode ? '#333' : '#ddd',
                    color: darkMode ? '#fff' : '#000',
                  }}
                />
              </div>

              <div 
                className="p-4 rounded-lg text-sm space-y-2"
                style={{ 
                  backgroundColor: darkMode ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.03)',
                }}
              >
                <p className="font-medium">How to get your API token:</p>
                <ol className="list-decimal list-inside space-y-1 opacity-80">
                  <li>Go to Deriv API Token Manager</li>
                  <li>Create a new token with "Read" and "Trade" scopes</li>
                  <li>Copy and paste the token above</li>
                </ol>
                <a
                  href="https://app.deriv.com/account/api-token"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 mt-2"
                  style={{ color: primaryColor }}
                >
                  Get API Token <ExternalLink className="w-3 h-3" />
                </a>
              </div>

              {error && (
                <div className="flex items-center gap-2 text-red-500 text-sm">
                  <AlertCircle className="w-4 h-4" />
                  {error}
                </div>
              )}

              <div className="flex gap-3 justify-end">
                <Button
                  variant="outline"
                  onClick={() => setIsOpen(false)}
                  style={{
                    borderColor: darkMode ? '#333' : '#ddd',
                    color: darkMode ? '#fff' : '#000',
                  }}
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleAuth}
                  disabled={isLoading || !token.trim()}
                  style={{ backgroundColor: primaryColor, color: '#fff' }}
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin mr-2" />
                      Connecting...
                    </>
                  ) : (
                    "Connect Account"
                  )}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
