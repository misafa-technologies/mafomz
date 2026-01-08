import { useState } from "react";
import { Copy, CheckCircle2, Globe, Server, ExternalLink, AlertCircle, Link2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
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
  const serverIP = "185.158.133.1";

  const dnsRecords = customDomain ? [
    { type: "A", name: "@", value: serverIP, description: "Root domain" },
    { type: "A", name: "www", value: serverIP, description: "WWW subdomain" },
    { type: "TXT", name: "_verify", value: `site=${subdomain}`, description: "Verification" },
  ] : [];

  return (
    <Card className="glass border-border">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Link2 className="w-5 h-5 text-primary" />
          Site URL & Domain
        </CardTitle>
        <CardDescription>
          Your site is accessible via a unique link and optionally your custom domain
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Default Site URL - Path Based */}
        <div className="rounded-lg border border-primary/30 bg-primary/5 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-primary">Your Site Link (Always Active)</p>
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
              <Server className="w-4 h-4" />
              <span className="text-sm font-medium">Custom Domain: {customDomain}</span>
            </div>

            <div className="rounded-lg border border-border bg-secondary/30 p-4">
              <h4 className="font-semibold mb-3 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-warning" />
                DNS Configuration Required
              </h4>
              <p className="text-sm text-muted-foreground mb-4">
                Add these DNS records at your domain registrar (GoDaddy, Namecheap, Cloudflare, etc.)
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
                      <div>
                        <span className="text-xs text-muted-foreground">Value</span>
                        <p className="font-mono font-medium">{record.value}</p>
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

              <div className="mt-4 rounded-lg bg-warning/10 border border-warning/30 p-3">
                <p className="text-sm text-warning">
                  <strong>Note:</strong> DNS changes can take 24-72 hours to propagate globally. 
                  Your site link above will always work as a backup.
                </p>
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
              Add a custom domain in the basic settings to use your own URL.
            </p>
          </div>
        )}

        {/* Quick Guide */}
        {customDomain && (
          <div className="rounded-lg bg-secondary/30 p-4">
            <h4 className="font-semibold mb-2">Quick Domain Setup Guide</h4>
            <ol className="list-decimal list-inside space-y-2 text-sm text-muted-foreground">
              <li>Login to your domain registrar (GoDaddy, Namecheap, etc.)</li>
              <li>Navigate to DNS Management / DNS Settings</li>
              <li>Add the A records pointing to <code className="bg-background px-1 rounded">{serverIP}</code></li>
              <li>Add the TXT record for verification</li>
              <li>Wait 24-72 hours for DNS propagation</li>
              <li>Your custom domain will automatically start working</li>
            </ol>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
