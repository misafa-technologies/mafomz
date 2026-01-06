import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

interface PlatformDomain {
  domain: string;
  isLoading: boolean;
  fullSubdomainUrl: (subdomain: string) => string;
}

/**
 * Hook that detects the current platform domain dynamically.
 * Priority:
 * 1. Platform settings from database (platform_domain)
 * 2. Current window hostname
 * 3. Fallback to configured domain
 */
export function usePlatformDomain(): PlatformDomain {
  const [domain, setDomain] = useState<string>("");
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const detectDomain = async () => {
      try {
        // First, try to get from platform_settings
        const { data } = await supabase
          .from("platform_settings")
          .select("setting_value")
          .eq("setting_key", "platform_domain")
          .single();

        if (data?.setting_value) {
          setDomain(data.setting_value);
        } else {
          // Fallback: Extract from current hostname
          const hostname = window.location.hostname;
          
          // If we're on localhost or a preview domain, use a sensible default
          if (hostname === "localhost" || hostname.includes("lovable.app") || hostname.includes("preview")) {
            // Check if there's a custom domain in window
            const parts = hostname.split(".");
            if (parts.length >= 2) {
              // Get the main domain (last 2 parts)
              const mainDomain = parts.slice(-2).join(".");
              if (mainDomain !== "localhost" && !mainDomain.includes("lovable")) {
                setDomain(mainDomain);
              } else {
                // Use hostname as-is for development
                setDomain(hostname);
              }
            } else {
              setDomain(hostname);
            }
          } else {
            // Production: extract main domain from hostname
            const parts = hostname.split(".");
            if (parts.length >= 2) {
              // If subdomain exists (3+ parts), take last 2 as main domain
              if (parts.length >= 3) {
                setDomain(parts.slice(-2).join("."));
              } else {
                setDomain(hostname);
              }
            } else {
              setDomain(hostname);
            }
          }
        }
      } catch (error) {
        // Fallback to current hostname
        const hostname = window.location.hostname;
        setDomain(hostname);
      } finally {
        setIsLoading(false);
      }
    };

    detectDomain();
  }, []);

  /**
   * Generate the full subdomain URL
   */
  const fullSubdomainUrl = (subdomain: string): string => {
    if (!domain || !subdomain) return "";
    
    // If domain includes protocol, parse it
    if (domain.includes("://")) {
      const url = new URL(domain);
      return `https://${subdomain}.${url.hostname}`;
    }
    
    return `https://${subdomain}.${domain}`;
  };

  return {
    domain,
    isLoading,
    fullSubdomainUrl,
  };
}

/**
 * Get the current platform domain synchronously (for initial render)
 * This is useful when you need a domain immediately without waiting for DB
 */
export function getCurrentDomain(): string {
  const hostname = window.location.hostname;
  
  // Development/preview domains
  if (hostname === "localhost") {
    return "localhost:5173";
  }
  
  if (hostname.includes("lovable.app")) {
    return hostname;
  }
  
  // Production: extract main domain
  const parts = hostname.split(".");
  if (parts.length >= 3) {
    return parts.slice(-2).join(".");
  }
  
  return hostname;
}
