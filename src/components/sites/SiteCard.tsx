import { Globe, ExternalLink, Settings, MoreVertical, Zap, Trash2 } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";

interface SiteCardProps {
  site: {
    id: string;
    name: string;
    subdomain: string;
    status: "live" | "pending" | "error" | "updating";
    favicon?: string;
    lastUpdated: string;
    visits?: number;
  };
  onDelete?: (id: string) => void;
}

const statusConfig = {
  live: {
    label: "Live",
    className: "bg-success/20 text-success",
    dotClassName: "bg-success animate-pulse",
  },
  pending: {
    label: "Pending",
    className: "bg-warning/20 text-warning",
    dotClassName: "bg-warning",
  },
  error: {
    label: "Error",
    className: "bg-destructive/20 text-destructive",
    dotClassName: "bg-destructive",
  },
  updating: {
    label: "Updating",
    className: "bg-primary/20 text-primary",
    dotClassName: "bg-primary animate-pulse",
  },
};

export function SiteCard({ site, onDelete }: SiteCardProps) {
  const status = statusConfig[site.status];
  const siteUrl = `https://${site.subdomain}.mafomz.io`;

  return (
    <div className="group glass glass-hover rounded-xl p-6 transition-all duration-300">
      {/* Header */}
      <div className="mb-4 flex items-start justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-secondary">
            {site.favicon ? (
              <img src={site.favicon} alt="" className="h-8 w-8 rounded" />
            ) : (
              <Globe className="h-6 w-6 text-muted-foreground" />
            )}
          </div>
          <div>
            <h3 className="font-semibold text-foreground">{site.name}</h3>
            <p className="text-sm text-muted-foreground">
              {site.subdomain}.mafomz.io
            </p>
          </div>
        </div>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="opacity-0 group-hover:opacity-100">
              <MoreVertical className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="glass">
            <DropdownMenuItem asChild>
              <Link to={`/sites/${site.id}/settings`} className="flex items-center">
                <Settings className="mr-2 h-4 w-4" />
                Settings
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <a 
                href={siteUrl} 
                target="_blank" 
                rel="noopener noreferrer"
                className="flex items-center"
              >
                <ExternalLink className="mr-2 h-4 w-4" />
                Visit Site
              </a>
            </DropdownMenuItem>
            {onDelete && (
              <>
                <DropdownMenuSeparator />
                <DropdownMenuItem 
                  className="text-destructive focus:text-destructive"
                  onClick={() => onDelete(site.id)}
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  Delete Site
                </DropdownMenuItem>
              </>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Status */}
      <div className="mb-4 flex items-center gap-2">
        <span
          className={cn(
            "inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium",
            status.className
          )}
        >
          <span className={cn("h-1.5 w-1.5 rounded-full", status.dotClassName)} />
          {status.label}
        </span>
        {site.visits !== undefined && site.visits > 0 && (
          <span className="text-xs text-muted-foreground">
            {site.visits.toLocaleString()} visits
          </span>
        )}
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between border-t border-border pt-4">
        <span className="text-xs text-muted-foreground">
          Updated {site.lastUpdated}
        </span>
        <Link to={`/sites/${site.id}/settings`}>
          <Button variant="ghost" size="sm" className="gap-1.5">
            <Zap className="h-3.5 w-3.5" />
            Manage
          </Button>
        </Link>
      </div>
    </div>
  );
}
