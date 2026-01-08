import { useState, useEffect, useMemo } from "react";

interface PlatformDomain {
  domain: string;
  isLoading: boolean;
  fullSubdomainUrl: (subdomain: string) => string;
}

/**
 * Extracts the base domain from the current hostname.
 * Examples:
 * - "mysite.lovable.app" → "lovable.app"
 * - "preview--myproject.lovable.app" → "lovable.app"
 * - "myapp.vercel.app" → "vercel.app"
 * - "subdomain.mycustomdomain.com" → "mycustomdomain.com"
 * - "localhost:5173" → "localhost:5173"
 */
function extractBaseDomain(hostname: string): string {
  // Handle localhost
  if (hostname === "localhost" || hostname.startsWith("localhost:")) {
    return hostname.includes(":") ? hostname : `${hostname}:${window.location.port || "5173"}`;
  }

  // Remove port if present
  const hostWithoutPort = hostname.split(":")[0];
  const parts = hostWithoutPort.split(".");

  // Single part (localhost without port, rare)
  if (parts.length === 1) {
    return hostname;
  }

  // Two parts (e.g., "example.com")
  if (parts.length === 2) {
    return hostWithoutPort;
  }

  // Three or more parts - extract base domain (last 2 parts)
  // This handles: subdomain.domain.com, preview--project.lovable.app, etc.
  return parts.slice(-2).join(".");
}

/**
 * Hook that dynamically detects the current platform domain.
 * Always uses the actual domain the site is running on - no hardcoded fallbacks.
 */
export function usePlatformDomain(): PlatformDomain {
  const baseDomain = useMemo(() => {
    return extractBaseDomain(window.location.hostname);
  }, []);

  const fullSubdomainUrl = (subdomain: string): string => {
    if (!subdomain) return "";
    
    // For localhost, use the same protocol and port
    if (baseDomain.startsWith("localhost")) {
      return `http://${subdomain}.${baseDomain}`;
    }
    
    return `https://${subdomain}.${baseDomain}`;
  };

  return {
    domain: baseDomain,
    isLoading: false, // No async loading needed - it's instant
    fullSubdomainUrl,
  };
}

/**
 * Get the current platform domain synchronously.
 * Use this when you need the domain immediately without a hook.
 */
export function getCurrentDomain(): string {
  return extractBaseDomain(window.location.hostname);
}
