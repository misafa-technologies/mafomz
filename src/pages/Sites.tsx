import { useState } from "react";
import { Plus, Search, Filter } from "lucide-react";
import { Link } from "react-router-dom";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { EmptySitesState } from "@/components/sites/EmptySitesState";
import { SiteCard } from "@/components/sites/SiteCard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

// Mock data for demonstration
const mockSites = [
  {
    id: "1",
    name: "TradePro Elite",
    subdomain: "tradepro",
    status: "live" as const,
    lastUpdated: "2 hours ago",
    visits: 12450,
  },
  {
    id: "2",
    name: "Binary Options Hub",
    subdomain: "binaryhub",
    status: "updating" as const,
    lastUpdated: "5 mins ago",
    visits: 8320,
  },
  {
    id: "3",
    name: "Forex Master",
    subdomain: "fxmaster",
    status: "pending" as const,
    lastUpdated: "1 day ago",
    visits: 0,
  },
];

export default function Sites() {
  const [sites] = useState(mockSites);
  const [searchQuery, setSearchQuery] = useState("");

  const hasSites = sites.length > 0;

  const filteredSites = sites.filter((site) =>
    site.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

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
                <SiteCard site={site} />
              </div>
            ))}
          </div>
        </>
      ) : (
        <EmptySitesState />
      )}
    </DashboardLayout>
  );
}
