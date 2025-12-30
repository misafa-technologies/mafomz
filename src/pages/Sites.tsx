import { useState, useEffect } from "react";
import { Plus, Search, Filter, RefreshCw } from "lucide-react";
import { Link } from "react-router-dom";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { EmptySitesState } from "@/components/sites/EmptySitesState";
import { SiteCard } from "@/components/sites/SiteCard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";

interface Site {
  id: string;
  name: string;
  subdomain: string;
  status: "live" | "pending" | "error" | "updating";
  favicon_url?: string;
  updated_at: string;
  custom_domain?: string;
}

export default function Sites() {
  const { user } = useAuth();
  const [sites, setSites] = useState<Site[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const fetchSites = async () => {
    if (!user) return;
    
    try {
      const { data, error } = await supabase
        .from("sites")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (error) throw error;

      const formattedSites: Site[] = (data || []).map((site) => ({
        id: site.id,
        name: site.name,
        subdomain: site.subdomain,
        status: (site.status as Site["status"]) || "pending",
        favicon_url: site.favicon_url || undefined,
        updated_at: site.updated_at,
        custom_domain: site.custom_domain || undefined,
      }));

      setSites(formattedSites);
    } catch (error) {
      console.error("Error fetching sites:", error);
      toast.error("Failed to load sites");
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    fetchSites();
  }, [user]);

  const handleRefresh = () => {
    setIsRefreshing(true);
    fetchSites();
  };

  const getTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);
    
    if (diffInSeconds < 60) return "just now";
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)} mins ago`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)} hours ago`;
    return `${Math.floor(diffInSeconds / 86400)} days ago`;
  };

  const hasSites = sites.length > 0;

  const filteredSites = sites.filter((site) =>
    site.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    site.subdomain.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center py-20">
          <div className="flex flex-col items-center gap-4">
            <div className="h-12 w-12 animate-spin rounded-full border-4 border-primary border-t-transparent" />
            <p className="text-muted-foreground">Loading your sites...</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      {/* Header */}
      <div className="mb-8">
        <h1 className="mb-2 text-3xl font-bold text-foreground">Your Sites</h1>
        <p className="text-muted-foreground">
          Manage and deploy your Deriv-powered trading websites
        </p>
      </div>

      {hasSites ? (
        <>
          {/* Toolbar */}
          <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="relative max-w-sm flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search sites..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <div className="flex gap-3">
              <Button 
                variant="outline" 
                size="sm" 
                onClick={handleRefresh}
                disabled={isRefreshing}
              >
                <RefreshCw className={`mr-2 h-4 w-4 ${isRefreshing ? "animate-spin" : ""}`} />
                Refresh
              </Button>
              <Button variant="outline" size="sm">
                <Filter className="mr-2 h-4 w-4" />
                Filter
              </Button>
              <Link to="/sites/create">
                <Button size="sm" variant="gradient">
                  <Plus className="mr-2 h-4 w-4" />
                  Create Site
                </Button>
              </Link>
            </div>
          </div>

          {/* Sites Grid */}
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {filteredSites.map((site, index) => (
              <div
                key={site.id}
                className="opacity-0 animate-fade-in"
                style={{ animationDelay: `${index * 100}ms` }}
              >
                <SiteCard 
                  site={{
                    id: site.id,
                    name: site.name,
                    subdomain: site.subdomain,
                    status: site.status,
                    favicon: site.favicon_url,
                    lastUpdated: getTimeAgo(site.updated_at),
                  }} 
                />
              </div>
            ))}
          </div>

          {filteredSites.length === 0 && searchQuery && (
            <div className="py-12 text-center">
              <p className="text-muted-foreground">No sites match "{searchQuery}"</p>
            </div>
          )}
        </>
      ) : (
        <EmptySitesState />
      )}
    </DashboardLayout>
  );
}
