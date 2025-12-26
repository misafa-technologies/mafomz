import { Globe, Plus, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";

export function EmptySitesState() {
  return (
    <div className="flex flex-col items-center justify-center py-20">
      {/* Animated Icon */}
      <div className="relative mb-8">
        <div className="absolute inset-0 animate-pulse-slow rounded-full bg-primary/20 blur-2xl" />
        <div className="relative flex h-24 w-24 items-center justify-center rounded-2xl glass animate-float">
          <Globe className="h-12 w-12 text-primary" />
        </div>
        <div className="absolute -right-2 -top-2 flex h-8 w-8 items-center justify-center rounded-full bg-accent animate-glow">
          <Sparkles className="h-4 w-4 text-accent-foreground" />
        </div>
      </div>

      {/* Content */}
      <h2 className="mb-3 text-2xl font-bold text-foreground">No sites yet</h2>
      <p className="mb-8 max-w-md text-center text-muted-foreground">
        Get started by creating your first site. Customize branding, select Deriv apps, 
        and deploy with just a few clicks.
      </p>

      {/* CTA */}
      <Link to="/sites/create">
        <Button size="lg" variant="gradient" className="gap-2">
          <Plus className="h-5 w-5" />
          Create Site
        </Button>
      </Link>

      {/* Features Preview */}
      <div className="mt-16 grid max-w-3xl grid-cols-1 gap-6 md:grid-cols-3">
        {[
          {
            title: "Custom Branding",
            description: "Upload logos, choose colors, and customize themes",
          },
          {
            title: "Deriv Integration",
            description: "Embed DTrader, DBot, SmartTrader, and more",
          },
          {
            title: "One-Click Deploy",
            description: "Auto-build, SSL, CDN optimization included",
          },
        ].map((feature, index) => (
          <div
            key={feature.title}
            className="glass rounded-xl p-6 text-center opacity-0 animate-fade-in"
            style={{ animationDelay: `${index * 150}ms` }}
          >
            <h3 className="mb-2 font-semibold text-foreground">{feature.title}</h3>
            <p className="text-sm text-muted-foreground">{feature.description}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
