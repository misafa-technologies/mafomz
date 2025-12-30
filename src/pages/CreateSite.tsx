import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  ArrowRight,
  Globe,
  Palette,
  Puzzle,
  Rocket,
  Play,
  ExternalLink,
  Shield,
  Upload,
  Check,
  Loader2,
} from "lucide-react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { StepIndicator } from "@/components/create-site/StepIndicator";
import { DerivAuthModal } from "@/components/create-site/DerivAuthModal";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";

const steps = [
  { id: 1, title: "Basic Info", description: "Name and domain setup" },
  { id: 2, title: "Deriv Auth", description: "Link your Deriv account" },
  { id: 3, title: "Branding", description: "Customize appearance" },
  { id: 4, title: "Apps", description: "Select Deriv integrations" },
  { id: 5, title: "Deploy", description: "Launch your site" },
];

const derivApps = [
  {
    id: "dtrader",
    name: "DTrader",
    description: "Modern trading platform with digital options",
    icon: "📈",
  },
  {
    id: "dbot",
    name: "DBot",
    description: "Automated trading with visual bot builder",
    icon: "🤖",
  },
  {
    id: "smarttrader",
    name: "SmartTrader",
    description: "Classic binary options trading",
    icon: "💹",
  },
  {
    id: "derivgo",
    name: "Deriv GO",
    description: "Mobile-first multiplier trading",
    icon: "📱",
  },
];

const colorPresets = [
  { name: "Ocean", primary: "#22d3ee", secondary: "#0ea5e9" },
  { name: "Emerald", primary: "#34d399", secondary: "#10b981" },
  { name: "Violet", primary: "#a78bfa", secondary: "#8b5cf6" },
  { name: "Rose", primary: "#fb7185", secondary: "#f43f5e" },
  { name: "Amber", primary: "#fbbf24", secondary: "#f59e0b" },
];

export default function CreateSite() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [currentStep, setCurrentStep] = useState(1);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [isDerivLinked, setIsDerivLinked] = useState(false);
  const [isDeploying, setIsDeploying] = useState(false);

  // Form state
  const [siteName, setSiteName] = useState("");
  const [subdomain, setSubdomain] = useState("");
  const [customDomain, setCustomDomain] = useState("");
  const [description, setDescription] = useState("");
  const [language, setLanguage] = useState("en");
  const [region, setRegion] = useState("global");
  const [selectedApps, setSelectedApps] = useState<string[]>(["dtrader"]);
  const [selectedColor, setSelectedColor] = useState(colorPresets[0]);
  const [darkMode, setDarkMode] = useState(true);
  const [footerText, setFooterText] = useState("");

  // Deriv account info
  const [derivAccountId, setDerivAccountId] = useState("");
  const [derivTokenHash, setDerivTokenHash] = useState("");

  const generateSubdomain = (name: string) => {
    return name.toLowerCase().replace(/[^a-z0-9]/g, "").slice(0, 20);
  };

  const handleNameChange = (name: string) => {
    setSiteName(name);
    if (!subdomain || subdomain === generateSubdomain(siteName)) {
      setSubdomain(generateSubdomain(name));
    }
  };

  const toggleApp = (appId: string) => {
    setSelectedApps((prev) =>
      prev.includes(appId)
        ? prev.filter((id) => id !== appId)
        : [...prev, appId]
    );
  };

  const handleDerivSuccess = (accountInfo: { loginid: string; tokenHash: string }) => {
    setDerivAccountId(accountInfo.loginid);
    setDerivTokenHash(accountInfo.tokenHash);
    setIsDerivLinked(true);
    toast.success("Deriv account linked successfully!");
  };

  const handleDeploy = async () => {
    if (!user) {
      toast.error("You must be logged in to create a site");
      return;
    }

    if (!siteName || !subdomain || !derivAccountId) {
      toast.error("Please complete all required fields");
      return;
    }

    setIsDeploying(true);

    try {
      // Check if subdomain is already taken
      const { data: existingSite } = await supabase
        .from("sites")
        .select("id")
        .eq("subdomain", subdomain)
        .single();

      if (existingSite) {
        toast.error("This subdomain is already taken. Please choose another.");
        setIsDeploying(false);
        return;
      }

      // Create the site
      const { data, error } = await supabase.from("sites").insert({
        user_id: user.id,
        name: siteName,
        subdomain: subdomain,
        custom_domain: customDomain || null,
        description: description || null,
        language: language,
        region: region,
        deriv_account_id: derivAccountId,
        deriv_token_hash: derivTokenHash,
        primary_color: selectedColor.primary,
        secondary_color: selectedColor.secondary,
        dark_mode: darkMode,
        footer_text: footerText || null,
        apps: selectedApps,
        status: "live",
      }).select().single();

      if (error) throw error;

      toast.success("Site deployed successfully!");
      navigate("/sites");
    } catch (error) {
      console.error("Deploy error:", error);
      toast.error("Failed to deploy site. Please try again.");
    } finally {
      setIsDeploying(false);
    }
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="space-y-6">
            <div>
              <Label htmlFor="site-name">Website Name *</Label>
              <Input
                id="site-name"
                placeholder="My Trading Platform"
                value={siteName}
                onChange={(e) => handleNameChange(e.target.value)}
                className="mt-2"
              />
            </div>

            <div>
              <Label htmlFor="subdomain">Subdomain *</Label>
              <div className="mt-2 flex">
                <Input
                  id="subdomain"
                  placeholder="mysite"
                  value={subdomain}
                  onChange={(e) => setSubdomain(e.target.value.toLowerCase().replace(/[^a-z0-9]/g, ""))}
                  className="rounded-r-none"
                />
                <span className="flex items-center rounded-r-lg border border-l-0 border-border bg-secondary px-4 text-sm text-muted-foreground">
                  .mafomz.io
                </span>
              </div>
            </div>

            <div>
              <Label htmlFor="custom-domain">Custom Domain (Optional)</Label>
              <Input
                id="custom-domain"
                placeholder="trading.yourdomain.com"
                value={customDomain}
                onChange={(e) => setCustomDomain(e.target.value)}
                className="mt-2"
              />
              <p className="mt-1.5 text-xs text-muted-foreground">
                We'll provide DNS configuration after site creation
              </p>
            </div>

            <div>
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                placeholder="A brief description of your trading platform..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="mt-2"
                rows={3}
              />
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <Label>Platform Language</Label>
                <Select value={language} onValueChange={setLanguage}>
                  <SelectTrigger className="mt-2">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="en">English</SelectItem>
                    <SelectItem value="es">Spanish</SelectItem>
                    <SelectItem value="pt">Portuguese</SelectItem>
                    <SelectItem value="fr">French</SelectItem>
                    <SelectItem value="ar">Arabic</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>Target Region</Label>
                <Select value={region} onValueChange={setRegion}>
                  <SelectTrigger className="mt-2">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="global">Global</SelectItem>
                    <SelectItem value="eu">Europe</SelectItem>
                    <SelectItem value="asia">Asia Pacific</SelectItem>
                    <SelectItem value="latam">Latin America</SelectItem>
                    <SelectItem value="africa">Africa</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* URL Preview */}
            {subdomain && (
              <div className="rounded-lg border border-primary/30 bg-primary/5 p-4">
                <Label className="text-xs text-primary">URL Preview</Label>
                <p className="mt-1 font-mono text-sm text-foreground">
                  https://{subdomain}.mafomz.io
                </p>
              </div>
            )}

            {/* Tutorial */}
            <div className="rounded-xl glass p-6">
              <h3 className="mb-3 font-semibold text-foreground">Need Help?</h3>
              <p className="mb-4 text-sm text-muted-foreground">
                Watch our quick tutorial to learn how to create and customize your trading site.
              </p>
              <div className="flex gap-3">
                <Button variant="outline" size="sm">
                  <Play className="mr-2 h-4 w-4" />
                  Watch Tutorial
                </Button>
                <Button variant="ghost" size="sm">
                  <ExternalLink className="mr-2 h-4 w-4" />
                  Open in YouTube
                </Button>
              </div>
            </div>
          </div>
        );

      case 2:
        return (
          <div className="space-y-6">
            <div className="text-center">
              <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-2xl glass">
                <Shield className={cn("h-10 w-10", isDerivLinked ? "text-success" : "text-primary")} />
              </div>
              <h2 className="mb-2 text-xl font-semibold text-foreground">
                {isDerivLinked ? "Deriv Account Linked" : "Link Your Deriv Account"}
              </h2>
              <p className="text-muted-foreground">
                {isDerivLinked
                  ? "Your Deriv account has been successfully connected."
                  : "Connect your Deriv account to enable trading features and affiliate commissions."}
              </p>
            </div>

            {isDerivLinked ? (
              <div className="mx-auto max-w-sm rounded-xl border border-success/30 bg-success/10 p-6 text-center">
                <Check className="mx-auto mb-3 h-12 w-12 text-success" />
                <p className="font-medium text-success">Account Verified</p>
                <p className="mt-1 text-sm text-success/70">
                  Login ID: {derivAccountId}
                </p>
                <p className="mt-1 text-xs text-success/60">
                  Scopes: read, trading_information
                </p>
              </div>
            ) : (
              <div className="mx-auto max-w-sm">
                <Button
                  variant="gradient"
                  size="lg"
                  className="w-full"
                  onClick={() => setShowAuthModal(true)}
                >
                  <Shield className="mr-2 h-5 w-5" />
                  Link Deriv Account
                </Button>
              </div>
            )}
          </div>
        );

      case 3:
        return (
          <div className="space-y-6">
            {/* Logo Upload */}
            <div>
              <Label>Site Logo</Label>
              <div className="mt-2 flex items-center gap-4">
                <div className="flex h-20 w-20 items-center justify-center rounded-xl border-2 border-dashed border-border bg-secondary/50">
                  <Upload className="h-8 w-8 text-muted-foreground" />
                </div>
                <div>
                  <Button variant="outline" size="sm">
                    Upload Logo
                  </Button>
                  <p className="mt-1.5 text-xs text-muted-foreground">
                    PNG, JPG up to 2MB. 200x200px recommended.
                  </p>
                </div>
              </div>
            </div>

            {/* Color Palette */}
            <div>
              <Label>Color Palette</Label>
              <div className="mt-3 grid grid-cols-5 gap-3">
                {colorPresets.map((preset) => (
                  <button
                    key={preset.name}
                    onClick={() => setSelectedColor(preset)}
                    className={cn(
                      "group relative flex flex-col items-center gap-2 rounded-xl p-3 transition-all",
                      selectedColor.name === preset.name
                        ? "bg-secondary ring-2 ring-primary"
                        : "hover:bg-secondary/50"
                    )}
                  >
                    <div className="flex gap-1">
                      <div
                        className="h-8 w-8 rounded-l-lg"
                        style={{ backgroundColor: preset.primary }}
                      />
                      <div
                        className="h-8 w-8 rounded-r-lg"
                        style={{ backgroundColor: preset.secondary }}
                      />
                    </div>
                    <span className="text-xs font-medium">{preset.name}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Theme Mode */}
            <div className="flex items-center justify-between rounded-lg border border-border p-4">
              <div>
                <Label>Dark Mode Default</Label>
                <p className="text-sm text-muted-foreground">
                  Start with dark theme enabled
                </p>
              </div>
              <Switch checked={darkMode} onCheckedChange={setDarkMode} />
            </div>

            {/* Footer Text */}
            <div>
              <Label htmlFor="footer">Footer Text</Label>
              <Input
                id="footer"
                placeholder="© 2025 Your Company Name"
                value={footerText}
                onChange={(e) => setFooterText(e.target.value)}
                className="mt-2"
              />
            </div>
          </div>
        );

      case 4:
        return (
          <div className="space-y-6">
            <p className="text-muted-foreground">
              Select which Deriv applications to integrate into your platform.
            </p>

            <div className="grid gap-4 sm:grid-cols-2">
              {derivApps.map((app) => {
                const isSelected = selectedApps.includes(app.id);
                return (
                  <button
                    key={app.id}
                    onClick={() => toggleApp(app.id)}
                    className={cn(
                      "group relative flex items-start gap-4 rounded-xl p-5 text-left transition-all",
                      isSelected
                        ? "glass ring-2 ring-primary"
                        : "glass-hover border border-border"
                    )}
                  >
                    <span className="text-3xl">{app.icon}</span>
                    <div className="flex-1">
                      <h3 className="font-semibold text-foreground">{app.name}</h3>
                      <p className="mt-1 text-sm text-muted-foreground">
                        {app.description}
                      </p>
                    </div>
                    <div
                      className={cn(
                        "flex h-6 w-6 shrink-0 items-center justify-center rounded-full border-2 transition-all",
                        isSelected
                          ? "border-primary bg-primary"
                          : "border-border"
                      )}
                    >
                      {isSelected && (
                        <Check className="h-3.5 w-3.5 text-primary-foreground" />
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        );

      case 5:
        return (
          <div className="space-y-6 text-center">
            <div className="mx-auto mb-6 flex h-24 w-24 items-center justify-center rounded-3xl glass animate-glow">
              <Rocket className="h-12 w-12 text-primary" />
            </div>
            <h2 className="text-2xl font-bold text-foreground">Ready to Deploy!</h2>
            <p className="mx-auto max-w-md text-muted-foreground">
              Your trading platform is configured and ready to go live. Click deploy to 
              launch your site with automatic SSL, CDN optimization, and version control.
            </p>

            {/* Summary */}
            <div className="mx-auto max-w-md space-y-3 rounded-xl glass p-6 text-left">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Site Name</span>
                <span className="font-medium">{siteName || "Untitled"}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">URL</span>
                <span className="font-mono text-sm">{subdomain}.mafomz.io</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Deriv Account</span>
                <span className="font-mono text-sm">{derivAccountId}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Apps</span>
                <span className="font-medium">{selectedApps.length} selected</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Theme</span>
                <span className="font-medium">{selectedColor.name}</span>
              </div>
            </div>

            <Button 
              variant="gradient" 
              size="xl" 
              className="mt-6"
              onClick={handleDeploy}
              disabled={isDeploying}
            >
              {isDeploying ? (
                <>
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                  Deploying...
                </>
              ) : (
                <>
                  <Rocket className="mr-2 h-5 w-5" />
                  Deploy Site
                </>
              )}
            </Button>
          </div>
        );

      default:
        return null;
    }
  };

  const stepIcons = [Globe, Shield, Palette, Puzzle, Rocket];
  const StepIcon = stepIcons[currentStep - 1];

  const canProceed = () => {
    switch (currentStep) {
      case 1:
        return siteName.length > 0 && subdomain.length > 0;
      case 2:
        return isDerivLinked;
      default:
        return true;
    }
  };

  return (
    <DashboardLayout>
      {/* Header */}
      <div className="mb-8">
        <Link
          to="/sites"
          className="mb-4 inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Sites
        </Link>
        <h1 className="mb-2 text-3xl font-bold text-foreground">Create New Site</h1>
        <p className="text-muted-foreground">
          Configure your site and deploy it with a few clicks.
        </p>
      </div>

      {/* Main Content */}
      <div className="grid gap-8 lg:grid-cols-[280px_1fr]">
        {/* Step Indicator */}
        <div className="hidden lg:block">
          <div className="sticky top-8 rounded-xl glass p-6">
            <StepIndicator steps={steps} currentStep={currentStep} />
          </div>
        </div>

        {/* Form Content */}
        <div className="min-h-[600px]">
          <div className="rounded-xl glass p-8">
            {/* Mobile Step Header */}
            <div className="mb-6 flex items-center gap-3 lg:hidden">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/20">
                <StepIcon className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">
                  Step {currentStep} of {steps.length}
                </p>
                <h2 className="font-semibold text-foreground">
                  {steps[currentStep - 1].title}
                </h2>
              </div>
            </div>

            {/* Step Content */}
            {renderStepContent()}

            {/* Navigation */}
            {currentStep < 5 && (
              <div className="mt-8 flex justify-between">
                <Button
                  variant="outline"
                  onClick={() => setCurrentStep((prev) => Math.max(1, prev - 1))}
                  disabled={currentStep === 1}
                >
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Previous
                </Button>
                <Button
                  variant="gradient"
                  onClick={() => setCurrentStep((prev) => Math.min(5, prev + 1))}
                  disabled={!canProceed()}
                >
                  {!canProceed() ? (
                    currentStep === 1 ? "Fill Required Fields" : "Link Deriv First"
                  ) : (
                    "Continue"
                  )}
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Deriv Auth Modal */}
      <DerivAuthModal
        open={showAuthModal}
        onOpenChange={setShowAuthModal}
        onSuccess={handleDerivSuccess}
      />
    </DashboardLayout>
  );
}
