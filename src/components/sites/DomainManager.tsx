import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { 
  Copy, 
  CheckCircle2, 
  Globe, 
  Server, 
  ExternalLink, 
  AlertCircle, 
  Link2, 
  Shield, 
  Clock,
  Plus,
  Trash2,
  RefreshCw,
  FileText,
  HelpCircle,
  Loader2
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { usePlatformDomain } from "@/hooks/usePlatformDomain";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

interface Domain {
  id: string;
  domain: string;
  status: "pending" | "verifying" | "active" | "failed" | "offline";
  is_primary: boolean;
  verified_at?: string;
}

interface DomainManagerProps {
  siteId: string;
  subdomain: string;
  customDomain?: string | null;
  onDomainChange?: (domain: string | null) => void;
}

export function DomainManager({ siteId, subdomain, customDomain, onDomainChange }: DomainManagerProps) {
  const [copied, setCopied] = useState<string | null>(null);
  const [domains, setDomains] = useState<Domain[]>([]);
  const [newDomain, setNewDomain] = useState("");
  const [isAddingDomain, setIsAddingDomain] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isVerifying, setIsVerifying] = useState<string | null>(null);
  const { getSiteUrl } = usePlatformDomain();

  const siteUrl = getSiteUrl(subdomain);
  
  // Get the current platform domain for DNS configuration
  const platformHost = window.location.hostname;
  const baseDomain = platformHost.split('.').slice(-2).join('.');
  
  // Platform configuration
  const serverIP = "76.76.21.21"; // Vercel's IP
  const serverIPv6 = "2606:4700:3030::6815:0";
  const nameservers = [`ns1.${baseDomain}`, `ns2.${baseDomain}`];

  useEffect(() => {
    // Initialize with custom domain if exists
    if (customDomain) {
      setDomains([{
        id: "custom",
        domain: customDomain,
        status: "active",
        is_primary: true,
      }]);
    }
  }, [customDomain]);

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopied(id);
    toast.success("Copied to clipboard!");
    setTimeout(() => setCopied(null), 2000);
  };

  const getDNSRecords = (domain: string) => [
    { type: "A", name: "@", value: serverIP, description: "Root domain to server", ttl: "3600" },
    { type: "AAAA", name: "@", value: serverIPv6, description: "IPv6 (optional)", ttl: "3600" },
    { type: "CNAME", name: "www", value: platformHost, description: "WWW redirect to platform", ttl: "3600" },
    { type: "TXT", name: "_verify", value: `site-verify=${subdomain}-${siteId.slice(0, 8)}`, description: "Domain verification", ttl: "3600" },
  ];

  const handleAddDomain = async () => {
    if (!newDomain.trim()) {
      toast.error("Please enter a domain");
      return;
    }

    // Basic domain validation
    const domainRegex = /^(?:[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?\.)+[a-zA-Z]{2,}$/;
    if (!domainRegex.test(newDomain.trim())) {
      toast.error("Please enter a valid domain name");
      return;
    }

    setIsAddingDomain(true);
    try {
      // Update site with custom domain
      const { error } = await supabase
        .from("sites")
        .update({ custom_domain: newDomain.trim() })
        .eq("id", siteId);

      if (error) throw error;

      const newDomainEntry: Domain = {
        id: crypto.randomUUID(),
        domain: newDomain.trim(),
        status: "pending",
        is_primary: domains.length === 0,
      };

      setDomains(prev => [...prev, newDomainEntry]);
      onDomainChange?.(newDomain.trim());
      setNewDomain("");
      setIsDialogOpen(false);
      toast.success("Domain added! Configure your DNS settings to complete setup.");
    } catch (error: any) {
      console.error("Error adding domain:", error);
      toast.error(error.message || "Failed to add domain");
    } finally {
      setIsAddingDomain(false);
    }
  };

  const handleRemoveDomain = async (domainId: string) => {
    try {
      const { error } = await supabase
        .from("sites")
        .update({ custom_domain: null })
        .eq("id", siteId);

      if (error) throw error;

      setDomains(prev => prev.filter(d => d.id !== domainId));
      onDomainChange?.(null);
      toast.success("Domain removed");
    } catch (error) {
      console.error("Error removing domain:", error);
      toast.error("Failed to remove domain");
    }
  };

  const handleVerifyDomain = async (domain: Domain) => {
    setIsVerifying(domain.id);
    try {
      // Simulate DNS verification check
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // In production, this would call an API to verify DNS records
      setDomains(prev => prev.map(d => 
        d.id === domain.id ? { ...d, status: "active" as const, verified_at: new Date().toISOString() } : d
      ));
      toast.success("Domain verified successfully!");
    } catch (error) {
      toast.error("DNS verification failed. Please check your records.");
    } finally {
      setIsVerifying(null);
    }
  };

  const getStatusBadge = (status: Domain["status"]) => {
    const configs = {
      pending: { variant: "secondary" as const, icon: Clock, label: "Pending Setup" },
      verifying: { variant: "outline" as const, icon: RefreshCw, label: "Verifying" },
      active: { variant: "default" as const, icon: CheckCircle2, label: "Active" },
      failed: { variant: "destructive" as const, icon: AlertCircle, label: "Failed" },
      offline: { variant: "destructive" as const, icon: AlertCircle, label: "Offline" },
    };
    const config = configs[status];
    return (
      <Badge variant={config.variant} className="gap-1">
        <config.icon className="w-3 h-3" />
        {config.label}
      </Badge>
    );
  };

  return (
    <div className="space-y-6">
      {/* Default Site URL */}
      <Card className="glass border-border">
        <CardHeader className="pb-4">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Shield className="w-5 h-5 text-primary" />
            Default Site Link
          </CardTitle>
          <CardDescription>
            This link is always active and serves as your fallback
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between p-3 rounded-lg bg-primary/5 border border-primary/20">
            <div className="flex-1">
              <p className="font-mono text-sm break-all">{siteUrl}</p>
            </div>
            <div className="flex gap-2 ml-4">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => copyToClipboard(siteUrl, "siteurl")}
              >
                {copied === "siteurl" ? (
                  <CheckCircle2 className="h-4 w-4 text-green-500" />
                ) : (
                  <Copy className="h-4 w-4" />
                )}
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => window.open(siteUrl, "_blank")}
              >
                <ExternalLink className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Custom Domains */}
      <Card className="glass border-border">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Globe className="w-5 h-5 text-primary" />
                Custom Domains
                <Badge variant="outline" className="ml-2">{domains.length}</Badge>
              </CardTitle>
              <CardDescription>
                Connect your own domain for a professional appearance
              </CardDescription>
            </div>
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button variant="gradient" size="sm" className="gap-1">
                  <Plus className="w-4 h-4" />
                  Add Domain
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Add Custom Domain</DialogTitle>
                  <DialogDescription>
                    Enter your domain name to get started. You'll need to configure DNS after adding.
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <Label>Domain Name</Label>
                    <Input
                      placeholder="yourdomain.com"
                      value={newDomain}
                      onChange={(e) => setNewDomain(e.target.value.toLowerCase())}
                    />
                    <p className="text-xs text-muted-foreground">
                      Enter without http:// or https://
                    </p>
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="ghost" onClick={() => setIsDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button onClick={handleAddDomain} disabled={isAddingDomain}>
                    {isAddingDomain ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Adding...
                      </>
                    ) : (
                      "Add Domain"
                    )}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {domains.length === 0 ? (
            <div className="text-center py-8 border border-dashed rounded-lg">
              <Globe className="w-10 h-10 mx-auto text-muted-foreground mb-3" />
              <p className="text-sm text-muted-foreground mb-2">
                No custom domains configured
              </p>
              <Button variant="outline" size="sm" onClick={() => setIsDialogOpen(true)}>
                Add Your First Domain
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              {domains.map((domain) => (
                <div
                  key={domain.id}
                  className="p-4 rounded-lg border bg-card"
                >
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <Link2 className="w-5 h-5 text-muted-foreground" />
                      <span className="font-medium">{domain.domain}</span>
                      {domain.is_primary && (
                        <Badge variant="secondary" className="text-xs">Primary</Badge>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      {getStatusBadge(domain.status)}
                      {domain.status === "pending" && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleVerifyDomain(domain)}
                          disabled={isVerifying === domain.id}
                        >
                          {isVerifying === domain.id ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : (
                            <>
                              <RefreshCw className="w-4 h-4 mr-1" />
                              Verify
                            </>
                          )}
                        </Button>
                      )}
                      <Button
                        variant="ghost"
                        size="icon"
                        className="text-destructive hover:text-destructive"
                        onClick={() => handleRemoveDomain(domain.id)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>

                  {/* DNS Configuration */}
                  {(domain.status === "pending" || domain.status === "failed") && (
                    <div className="mt-4 pt-4 border-t">
                      <Tabs defaultValue="nameservers" className="w-full">
                        <TabsList className="grid w-full grid-cols-2 mb-4">
                          <TabsTrigger value="nameservers">Nameservers</TabsTrigger>
                          <TabsTrigger value="dns">DNS Records</TabsTrigger>
                        </TabsList>

                        <TabsContent value="nameservers" className="space-y-4">
                          <div className="p-4 rounded-lg bg-primary/5 border border-primary/20">
                            <h4 className="font-semibold mb-3 flex items-center gap-2">
                              <Server className="w-4 h-4" />
                              Change Your Nameservers
                            </h4>
                            <p className="text-sm text-muted-foreground mb-4">
                              Update your domain's nameservers at your registrar for automatic SSL and updates.
                            </p>
                            <div className="space-y-2">
                              {nameservers.map((ns, i) => (
                                <div key={i} className="flex items-center justify-between p-3 rounded bg-background/50">
                                  <div>
                                    <span className="text-xs text-muted-foreground">Nameserver {i + 1}</span>
                                    <p className="font-mono">{ns}</p>
                                  </div>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => copyToClipboard(ns, `ns-${i}`)}
                                  >
                                    {copied === `ns-${i}` ? (
                                      <CheckCircle2 className="w-4 h-4 text-green-500" />
                                    ) : (
                                      <Copy className="w-4 h-4" />
                                    )}
                                  </Button>
                                </div>
                              ))}
                            </div>
                          </div>
                        </TabsContent>

                        <TabsContent value="dns" className="space-y-4">
                          <div className="p-4 rounded-lg bg-secondary/30 border">
                            <h4 className="font-semibold mb-3 flex items-center gap-2">
                              <FileText className="w-4 h-4" />
                              Add DNS Records
                            </h4>
                            <p className="text-sm text-muted-foreground mb-4">
                              Add these records to your DNS provider if you can't change nameservers.
                            </p>
                            <div className="space-y-2">
                              {getDNSRecords(domain.domain).map((record, i) => (
                                <div key={i} className="grid grid-cols-5 gap-2 p-3 rounded bg-background/50 text-sm">
                                  <div>
                                    <span className="text-xs text-muted-foreground">Type</span>
                                    <p className="font-mono font-medium">{record.type}</p>
                                  </div>
                                  <div>
                                    <span className="text-xs text-muted-foreground">Name</span>
                                    <p className="font-mono">{record.name}</p>
                                  </div>
                                  <div className="col-span-2">
                                    <span className="text-xs text-muted-foreground">Value</span>
                                    <p className="font-mono truncate">{record.value}</p>
                                  </div>
                                  <div className="flex items-center justify-end">
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      onClick={() => copyToClipboard(record.value, `record-${i}`)}
                                    >
                                      {copied === `record-${i}` ? (
                                        <CheckCircle2 className="w-3 h-3 text-green-500" />
                                      ) : (
                                        <Copy className="w-3 h-3" />
                                      )}
                                    </Button>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        </TabsContent>
                      </Tabs>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Documentation */}
      <Card className="glass border-border">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <HelpCircle className="w-5 h-5 text-primary" />
            Documentation
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Accordion type="single" collapsible className="w-full">
            <AccordionItem value="propagation">
              <AccordionTrigger>How long does DNS propagation take?</AccordionTrigger>
              <AccordionContent>
                <p className="text-muted-foreground">
                  DNS changes typically take 24-72 hours to propagate globally. During this time, 
                  your default site link will continue to work. You can use tools like 
                  <a href="https://dnschecker.org" target="_blank" rel="noopener noreferrer" 
                     className="text-primary ml-1 hover:underline">
                    dnschecker.org
                  </a> to check propagation status.
                </p>
              </AccordionContent>
            </AccordionItem>
            <AccordionItem value="ssl">
              <AccordionTrigger>Is SSL/HTTPS included?</AccordionTrigger>
              <AccordionContent>
                <p className="text-muted-foreground">
                  Yes! SSL certificates are automatically provisioned for all verified domains. 
                  Once your domain is verified, HTTPS will be enabled within minutes.
                </p>
              </AccordionContent>
            </AccordionItem>
            <AccordionItem value="www">
              <AccordionTrigger>Do I need to add www separately?</AccordionTrigger>
              <AccordionContent>
                <p className="text-muted-foreground">
                  If you're using nameservers, www is handled automatically. For DNS records, 
                  add a CNAME record for "www" pointing to your root domain.
                </p>
              </AccordionContent>
            </AccordionItem>
          </Accordion>

          <div className="mt-4 pt-4 border-t">
            <h4 className="font-medium mb-3">Popular Registrar Guides</h4>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {[
                { name: "GoDaddy", url: "https://www.godaddy.com/help/change-nameservers-for-my-domains-664" },
                { name: "Namecheap", url: "https://www.namecheap.com/support/knowledgebase/article.aspx/767/10/how-to-change-dns-for-a-domain/" },
                { name: "Cloudflare", url: "https://developers.cloudflare.com/dns/zone-setups/full-setup/setup/" },
                { name: "Google Domains", url: "https://support.google.com/domains/answer/3290309" },
              ].map((registrar) => (
                <a
                  key={registrar.name}
                  href={registrar.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1 text-sm text-primary hover:underline p-2 rounded-lg hover:bg-primary/5"
                >
                  {registrar.name}
                  <ExternalLink className="w-3 h-3" />
                </a>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
