import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/useAuth";
import {
  LayoutGrid,
  Globe,
  Rocket,
  DollarSign,
  Bell,
  Code2,
  Bot,
  Sparkles,
  HelpCircle,
  Settings,
  Palette,
  LogOut,
  ChevronDown,
  Zap,
} from "lucide-react";

interface NavItem {
  label: string;
  icon: React.ElementType;
  href: string;
  badge?: string;
  children?: NavItem[];
}

const tradingPlatformItems: NavItem[] = [
  { label: "Sites", icon: LayoutGrid, href: "/sites" },
  { label: "Domains", icon: Globe, href: "/domains" },
  { label: "Platform Updates", icon: Rocket, href: "/updates" },
  { label: "Deployments", icon: Zap, href: "/deployments" },
  { label: "Commissions", icon: DollarSign, href: "/commissions" },
  { label: "Announcements", icon: Bell, href: "/announcements", badge: "2" },
];

const toolsItems: NavItem[] = [
  { label: "Website Editor", icon: Code2, href: "/editor" },
  { label: "XML Bots", icon: Bot, href: "/bots" },
  { label: "AI Signals", icon: Sparkles, href: "/signals" },
];

const bottomItems: NavItem[] = [
  { label: "Support", icon: HelpCircle, href: "/support" },
  { label: "Settings", icon: Settings, href: "/settings" },
  { label: "Theme", icon: Palette, href: "/theme" },
];

const NavSection = ({
  title,
  items,
  currentPath,
}: {
  title?: string;
  items: NavItem[];
  currentPath: string;
}) => {
  return (
    <div className="space-y-1">
      {title && (
        <p className="px-3 py-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground/60">
          {title}
        </p>
      )}
      {items.map((item) => {
        const isActive = currentPath === item.href;
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
  const { signOut } = useAuth();
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
            <span className="text-lg font-bold text-foreground">DerivForge</span>
            <span className="text-[10px] uppercase tracking-widest text-muted-foreground">
              by Mafomz
            </span>
          </div>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 space-y-6 overflow-y-auto p-3">
        <NavSection
          title="Trading Platform"
          items={tradingPlatformItems}
          currentPath={location.pathname}
        />
        <NavSection items={toolsItems} currentPath={location.pathname} />
      </nav>

      {/* Bottom Section */}
      <div className="border-t border-sidebar-border p-3">
        <NavSection items={bottomItems} currentPath={location.pathname} />
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
            © 2025 DerivForge
          </p>
        </div>
      )}
    </aside>
  );
}
