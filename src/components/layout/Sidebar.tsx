import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/useAuth";
import {
  LayoutGrid,
  Globe,
  DollarSign,
  Bell,
  Code2,
  Bot,
  Sparkles,
  HelpCircle,
  Settings,
  LogOut,
  Shield,
  Zap,
  Users,
} from "lucide-react";

interface NavItem {
  label: string;
  icon: React.ElementType;
  href: string;
  badge?: string;
  adminOnly?: boolean;
  moderatorOnly?: boolean;
}

const tradingPlatformItems: NavItem[] = [
  { label: "Dashboard", icon: LayoutGrid, href: "/dashboard" },
  { label: "Sites", icon: LayoutGrid, href: "/sites" },
  { label: "Domains", icon: Globe, href: "/domains" },
  { label: "Commissions", icon: DollarSign, href: "/commissions" },
  { label: "Announcements", icon: Bell, href: "/announcements" },
];

const toolsItems: NavItem[] = [
  { label: "Website Editor", icon: Code2, href: "/editor" },
  { label: "XML Bots", icon: Bot, href: "/bots" },
  { label: "AI Signals", icon: Sparkles, href: "/signals" },
];

const bottomItems: NavItem[] = [
  { label: "Support", icon: HelpCircle, href: "/support" },
  { label: "Settings", icon: Settings, href: "/settings" },
  { label: "Moderator Panel", icon: Users, href: "/moderator", moderatorOnly: true },
  { label: "Admin Panel", icon: Shield, href: "/admin", adminOnly: true },
];

const NavSection = ({
  title,
  items,
  currentPath,
  isAdmin = false,
  isModerator = false,
}: {
  title?: string;
  items: NavItem[];
  currentPath: string;
  isAdmin?: boolean;
  isModerator?: boolean;
}) => {
  const filteredItems = items.filter(item => {
    if (item.adminOnly && !isAdmin) return false;
    if (item.moderatorOnly && !isModerator && !isAdmin) return false;
    return true;
  });
  
  if (filteredItems.length === 0) return null;
  
  return (
    <div className="space-y-1">
      {title && (
        <p className="px-3 py-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground/60">
          {title}
        </p>
      )}
      {filteredItems.map((item) => {
        const isActive = currentPath === item.href || currentPath.startsWith(item.href + '/');
        const Icon = item.icon;

        return (
          <Link
            key={item.href}
            to={item.href}
            className={cn(
              "group flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-200",
              isActive
                ? "bg-primary/10 text-primary"
                : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-foreground"
            )}
          >
            <Icon
              className={cn(
                "h-4 w-4 transition-colors",
                isActive ? "text-primary" : "text-muted-foreground group-hover:text-foreground"
              )}
            />
            <span className="flex-1">{item.label}</span>
            {item.badge && (
              <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-primary/20 px-1.5 text-xs font-semibold text-primary">
                {item.badge}
              </span>
            )}
          </Link>
        );
      })}
    </div>
  );
};

export function Sidebar() {
  const location = useLocation();
  const navigate = useNavigate();
  const { signOut, isAdmin, isModerator, user } = useAuth();
  const [isCollapsed, setIsCollapsed] = useState(false);

  const handleSignOut = async () => {
    await signOut();
    navigate("/");
  };

  return (
    <aside
      className={cn(
        "fixed left-0 top-0 z-40 flex h-screen flex-col border-r border-sidebar-border bg-sidebar transition-all duration-300",
        isCollapsed ? "w-16" : "w-64"
      )}
    >
      {/* Logo */}
      <div className="flex h-16 items-center gap-3 border-b border-sidebar-border px-4">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br from-primary to-accent">
          <Zap className="h-5 w-5 text-primary-foreground" />
        </div>
        {!isCollapsed && (
          <div className="flex flex-col">
            <span className="text-lg font-bold text-foreground">Mafomz</span>
            <span className="text-[10px] uppercase tracking-widest text-muted-foreground">
              Trading Platform Builder
            </span>
          </div>
        )}
      </div>

      {/* User Info */}
      {!isCollapsed && user && (
        <div className="border-b border-sidebar-border px-4 py-3">
          <p className="text-sm font-medium text-foreground truncate">{user.email}</p>
          <p className="text-xs text-muted-foreground">
            {isAdmin ? "Administrator" : isModerator ? "Moderator" : "Member"}
          </p>
        </div>
      )}

      {/* Navigation */}
      <nav className="flex-1 space-y-6 overflow-y-auto p-3">
        <NavSection
          title="Trading Platform"
          items={tradingPlatformItems}
          currentPath={location.pathname}
          isAdmin={isAdmin}
          isModerator={isModerator}
        />
        <NavSection 
          title="Tools" 
          items={toolsItems} 
          currentPath={location.pathname}
          isAdmin={isAdmin}
          isModerator={isModerator}
        />
      </nav>

      {/* Bottom Section */}
      <div className="border-t border-sidebar-border p-3">
        <NavSection 
          items={bottomItems} 
          currentPath={location.pathname}
          isAdmin={isAdmin}
          isModerator={isModerator}
        />
        <button 
          onClick={handleSignOut}
          className="mt-2 flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-destructive/80 transition-all duration-200 hover:bg-destructive/10 hover:text-destructive"
        >
          <LogOut className="h-4 w-4" />
          {!isCollapsed && <span>Sign Out</span>}
        </button>
      </div>

      {/* Footer */}
      {!isCollapsed && (
        <div className="border-t border-sidebar-border p-4">
          <p className="text-center text-[10px] text-muted-foreground/50">
            © 2025 Mafomz
          </p>
        </div>
      )}
    </aside>
  );
}
