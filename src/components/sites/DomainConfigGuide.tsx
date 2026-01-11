import { useState } from "react";
import { Copy, CheckCircle2, Globe, Server, ExternalLink, AlertCircle, Link2, Shield, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { usePlatformDomain } from "@/hooks/usePlatformDomain";
import { toast } from "sonner";

interface DomainConfigGuideProps {
  subdomain: string;
  customDomain?: string | null;
}

export function DomainConfigGuide({ subdomain, customDomain }: DomainConfigGuideProps) {
  const [copied, setCopied] = useState<string | null>(null);
  const { getSiteUrl } = usePlatformDomain();

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopied(id);
    toast.success("Copied to clipboard!");
    setTimeout(() => setCopied(null), 2000);
  };

  const siteUrl = getSiteUrl(subdomain);
  
  // Platform nameservers for full domain delegation
  const nameservers = [
    "ns1.mafomz.com",
    "ns2.mafomz.com",
  ];

  // Alternative: A records for users who prefer DNS configuration
  const serverIP = "185.158.133.1";
  const serverIPv6 = "2a06:98c1:3120::3";

  const dnsRecords = customDomain ? [
    { type: "A", name: "@", value: serverIP, description: "Root domain to server" },
    { type: "AAAA", name: "@", value: serverIPv6, description: "IPv6 (optional)" },
    { type: "CNAME", name: "www", value: customDomain, description: "WWW redirect" },
    { type: "TXT", name: "_mafomz", value: `verify=${subdomain}`, description: "Domain verification" },
  ] : [];

  return (
    <Card className="glass border-border">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Link2 className="w-5 h-5 text-primary" />
          Domain Configuration
        </CardTitle>
        <CardDescription>
          Configure your site's domain for maximum accessibility
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Default Site URL */}
        <div className="rounded-lg border border-primary/30 bg-primary/5 p-4">
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-2">
                <Shield className="w-4 h-4 text-primary" />
                <p className="text-sm font-medium text-primary">Your Site Link (Always Active)</p>
              </div>
              <p className="mt-1 font-mono text-foreground break-all">{siteUrl}</p>
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => copyToClipboard(siteUrl, "siteurl")}
              >
                {copied === "siteurl" ? (
                  <CheckCircle2 className="h-4 w-4 text-success" />
                ) : (
                  <Copy className="h-4 w-4" />
                )}
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => window.open(siteUrl, "_blank")}
              >
                <ExternalLink className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>

        {/* Custom Domain Setup */}
        {customDomain ? (
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-muted-foreground">
              <Globe className="w-4 h-4" />
              <span className="text-sm font-medium">Custom Domain: <strong>{customDomain}</strong></span>
            </div>

            <Tabs defaultValue="nameservers" className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="nameservers">Nameservers (Recommended)</TabsTrigger>
                <TabsTrigger value="dns">DNS Records</TabsTrigger>
              </TabsList>

              {/* Nameserver Method */}
              <TabsContent value="nameservers" className="space-y-4">
                <div className="rounded-lg border border-primary/30 bg-primary/5 p-4">
                  <h4 className="font-semibold mb-3 flex items-center gap-2">
                    <Server className="w-4 h-4 text-primary" />
                    Change Your Nameservers
                  </h4>
                  <p className="text-sm text-muted-foreground mb-4">
                    Point your domain's nameservers to us for automatic SSL, CDN, and updates.
                  </p>

                  <div className="space-y-2 mb-4">
                    {nameservers.map((ns, index) => (
                      <div
                        key={index}
                        className="flex items-center justify-between rounded-lg bg-background/50 p-3"
                      >
                        <div>
                          <span className="text-xs text-muted-foreground">Nameserver {index + 1}</span>
                          <p className="font-mono font-medium">{ns}</p>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => copyToClipboard(ns, `ns-${index}`)}
                        >
                          {copied === `ns-${index}` ? (
                            <CheckCircle2 className="h-4 w-4 text-success" />
                          ) : (
                            <Copy className="h-4 w-4" />
                          )}
                        </Button>
                      </div>
                    ))}
                  </div>

                  <div className="rounded-lg bg-green-500/10 border border-green-500/30 p-3">
                    <p className="text-sm text-green-600 dark:text-green-400 flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4" />
                      <strong>Benefits:</strong> Automatic SSL, CDN caching, DDoS protection, and instant updates
                    </p>
                  </div>
                </div>

                {/* Nameserver Instructions */}
                <div className="rounded-lg bg-secondary/30 p-4">
                  <h4 className="font-semibold mb-3">Setup Instructions</h4>
                  <ol className="list-decimal list-inside space-y-2 text-sm text-muted-foreground">
                    <li>Log in to your domain registrar (GoDaddy, Namecheap, Google Domains, etc.)</li>
                    <li>Find the <strong>Nameservers</strong> or <strong>DNS Settings</strong> section</li>
                    <li>Select <strong>Custom Nameservers</strong> option</li>
                    <li>Remove any existing nameservers</li>
                    <li>Add both nameservers listed above</li>
                    <li>Save changes and wait 24-48 hours for propagation</li>
                  </ol>
                </div>
              </TabsContent>

              {/* DNS Records Method */}
              <TabsContent value="dns" className="space-y-4">
                <div className="rounded-lg border border-border bg-secondary/30 p-4">
                  <h4 className="font-semibold mb-3 flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 text-warning" />
                    Add DNS Records
                  </h4>
                  <p className="text-sm text-muted-foreground mb-4">
                    If you can't change nameservers, add these DNS records instead.
                  </p>

                  <div className="space-y-3">
                    {dnsRecords.map((record, index) => (
                      <div
                        key={index}
                        className="grid grid-cols-4 gap-4 rounded-lg bg-background/50 p-3 text-sm"
                      >
                        <div>
                          <span className="text-xs text-muted-foreground">Type</span>
                          <p className="font-mono font-medium">{record.type}</p>
                        </div>
                        <div>
                          <span className="text-xs text-muted-foreground">Name/Host</span>
                          <p className="font-mono font-medium">{record.name}</p>
                        </div>
                        <div className="col-span-2 flex items-center justify-between">
                          <div className="overflow-hidden">
                            <span className="text-xs text-muted-foreground">Value</span>
                            <p className="font-mono font-medium truncate">{record.value}</p>
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => copyToClipboard(record.value, `record-${index}`)}
                          >
                            {copied === `record-${index}` ? (
                              <CheckCircle2 className="h-3 w-3 text-success" />
                            ) : (
                              <Copy className="h-3 w-3" />
                            )}
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="rounded-lg bg-secondary/30 p-4">
                  <h4 className="font-semibold mb-3">Setup Instructions</h4>
                  <ol className="list-decimal list-inside space-y-2 text-sm text-muted-foreground">
                    <li>Log in to your domain registrar or DNS provider</li>
                    <li>Navigate to <strong>DNS Management</strong> or <strong>DNS Zone Editor</strong></li>
                    <li>Add each record type (A, CNAME, TXT) with the values above</li>
                    <li>Set TTL to <strong>3600</strong> (1 hour) or lower for faster updates</li>
                    <li>Save changes and wait for propagation</li>
                  </ol>
                </div>
              </TabsContent>
            </Tabs>

            {/* Propagation Warning */}
            <div className="rounded-lg bg-warning/10 border border-warning/30 p-4">
              <div className="flex items-start gap-3">
                <Clock className="w-5 h-5 text-warning mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-warning">DNS Propagation Time</p>
                  <p className="text-sm text-muted-foreground mt-1">
                    DNS changes can take <strong>24-72 hours</strong> to propagate globally. 
                    Your default site link will always work as a backup during this time.
                  </p>
                </div>
              </div>
            </div>

            {/* Registrar Guides */}
            <div className="rounded-lg bg-secondary/30 p-4">
              <h4 className="font-semibold mb-3">Popular Registrar Guides</h4>
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
                    className="flex items-center gap-1 text-sm text-primary hover:underline"
                  >
                    {registrar.name}
                    <ExternalLink className="w-3 h-3" />
                  </a>
                ))}
              </div>
            </div>
          </div>
        ) : (
          <div className="rounded-lg border border-dashed border-border p-6 text-center">
            <Globe className="mx-auto h-8 w-8 text-muted-foreground mb-2" />
            <p className="text-sm text-muted-foreground">
              No custom domain configured. Your site is accessible via the link above.
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              Add a custom domain in the settings to use your own URL.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
