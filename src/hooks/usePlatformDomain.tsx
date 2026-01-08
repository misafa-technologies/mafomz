import { useMemo } from "react";

interface PlatformDomain {
  baseUrl: string;
  getSiteUrl: (slug: string) => string;
  getSitePreviewUrl: (slug: string) => string;
}

/**
 * Generates a unique site slug (like payment link IDs)
 * Format: 8 character alphanumeric string
 */
export function generateSiteSlug(): string {
  const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
  let slug = '';
  for (let i = 0; i < 8; i++) {
    slug += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return slug;
}

/**
 * Hook that provides URL generation for sites using path-based routing.
 * Sites are accessible via /s/[slug] paths instead of subdomains.
 * This works on any domain (Lovable, Vercel, custom domains, etc.)
 */
export function usePlatformDomain(): PlatformDomain {
  const baseUrl = useMemo(() => {
    const protocol = window.location.protocol;
    const host = window.location.host; // includes port if present
    return `${protocol}//${host}`;
  }, []);

  const getSiteUrl = (slug: string): string => {
    if (!slug) return "";
    return `${baseUrl}/s/${slug}`;
  };

  const getSitePreviewUrl = (slug: string): string => {
    if (!slug) return "";
    return `${baseUrl}/s/${slug}`;
  };

  return {
    baseUrl,
    getSiteUrl,
    getSitePreviewUrl,
  };
}

/**
 * Get site URL synchronously without a hook.
 */
export function getSiteUrl(slug: string): string {
  const protocol = window.location.protocol;
  const host = window.location.host;
  return `${protocol}//${host}/s/${slug}`;
}

/**
 * Get the current base URL synchronously.
 */
export function getCurrentBaseUrl(): string {
  const protocol = window.location.protocol;
  const host = window.location.host;
  return `${protocol}//${host}`;
}
