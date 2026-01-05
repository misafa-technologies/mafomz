import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { DomainConfigGuide } from "@/components/sites/DomainConfigGuide";
import { 
  Settings, 
  Save, 
  Loader2, 
  Globe, 
  Palette, 
  Image,
  ArrowLeft,
  Trash2,
  Server
} from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

interface Site {
  id: string;
  name: string;
  subdomain: string;
  custom_domain: string | null;
  description: string | null;
  logo_url: string | null;
  favicon_url: string | null;
  primary_color: string;
  secondary_color: string;
  dark_mode: boolean;
  footer_text: string | null;
}

const SiteSettings = () => {
  const { siteId } = useParams<{ siteId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [site, setSite] = useState<Site | null>(null);

  useEffect(() => {
    if (siteId) {
      fetchSite();
    }
  }, [siteId]);

  const fetchSite = async () => {
    try {
      const { data, error } = await supabase
        .from("sites")
        .select("*")
        .eq("id", siteId)
        .maybeSingle();

      if (error) throw error;
      
      if (!data) {
        toast({
          title: "Site not found",
          description: "The site you're looking for doesn't exist",
          variant: "destructive",
        });
        navigate("/sites");
        return;
      }

      setSite(data);
    } catch (error) {
      console.error("Error fetching site:", error);
      toast({
        title: "Error",
        description: "Failed to load site settings",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = async () => {
    if (!site) return;

    setIsSaving(true);
    try {
      const { error } = await supabase
        .from("sites")
        .update({
          name: site.name,
          subdomain: site.subdomain,
          custom_domain: site.custom_domain,
          description: site.description,
          logo_url: site.logo_url,
          favicon_url: site.favicon_url,
          primary_color: site.primary_color,
          secondary_color: site.secondary_color,
          dark_mode: site.dark_mode,
          footer_text: site.footer_text,
        })
        .eq("id", site.id);

      if (error) throw error;

      toast({
        title: "Settings saved",
        description: "Your site settings have been updated",
      });
    } catch (error: any) {
      console.error("Error saving site:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to save settings",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!site) return;

    setIsDeleting(true);
    try {
      const { error } = await supabase
        .from("sites")
        .delete()
        .eq("id", site.id);

      if (error) throw error;

      toast({
        title: "Site deleted",
        description: "Your site has been permanently deleted",
      });
      navigate("/sites");
    } catch (error: any) {
      console.error("Error deleting site:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to delete site",
        variant: "destructive",
      });
    } finally {
      setIsDeleting(false);
    }
  };

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </DashboardLayout>
    );
  }

  if (!site) {
    return null;
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate("/sites")}
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
              <Settings className="w-6 h-6" />
              Site Settings
            </h1>
            <p className="text-muted-foreground mt-1">
              Configure settings for {site.name}
            </p>
          </div>
        </div>

        <Tabs defaultValue="basic" className="space-y-6">
          <TabsList className="glass">
            <TabsTrigger value="basic">Basic Info</TabsTrigger>
            <TabsTrigger value="domain">Domain</TabsTrigger>
            <TabsTrigger value="branding">Branding</TabsTrigger>
          </TabsList>

          {/* Basic Info Tab */}
          <TabsContent value="basic">
            <Card className="glass border-border">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Globe className="w-5 h-5 text-primary" />
                  Basic Information
                </CardTitle>
                <CardDescription>
                  Update your site name and description
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Site Name</Label>
                    <Input
                      id="name"
                      value={site.name}
                      onChange={(e) => setSite({ ...site, name: e.target.value })}
                      placeholder="My Trading Site"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="subdomain">Subdomain</Label>
                    <div className="flex">
                      <Input
                        id="subdomain"
                        value={site.subdomain}
                        onChange={(e) => setSite({ ...site, subdomain: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '') })}
                        className="rounded-r-none"
                      />
                      <div className="flex items-center px-3 bg-muted border border-l-0 border-input rounded-r-md text-sm text-muted-foreground">
                        .mafomz.io
                      </div>
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="custom_domain" className="flex items-center gap-2">
                    <Server className="w-4 h-4" />
                    Custom Domain (Optional)
                  </Label>
                  <Input
                    id="custom_domain"
                    value={site.custom_domain || ""}
                    onChange={(e) => setSite({ ...site, custom_domain: e.target.value || null })}
                    placeholder="www.yourdomain.com"
                  />
                  <p className="text-xs text-muted-foreground">
                    Add your own domain. See the Domain tab for configuration instructions.
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    value={site.description || ""}
                    onChange={(e) => setSite({ ...site, description: e.target.value || null })}
                    placeholder="Describe your trading site..."
                    rows={3}
                  />
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Domain Tab */}
          <TabsContent value="domain">
            <DomainConfigGuide 
              subdomain={site.subdomain} 
              customDomain={site.custom_domain} 
            />
          </TabsContent>

          {/* Branding Tab */}
          <TabsContent value="branding">
            <Card className="glass border-border">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Palette className="w-5 h-5 text-primary" />
                  Branding & Theme
                </CardTitle>
                <CardDescription>
                  Customize your site's appearance
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="logo_url" className="flex items-center gap-2">
                      <Image className="w-4 h-4" />
                      Logo URL
                    </Label>
                    <Input
                      id="logo_url"
                      value={site.logo_url || ""}
                      onChange={(e) => setSite({ ...site, logo_url: e.target.value || null })}
                      placeholder="https://example.com/logo.png"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="favicon_url">Favicon URL</Label>
                    <Input
                      id="favicon_url"
                      value={site.favicon_url || ""}
                      onChange={(e) => setSite({ ...site, favicon_url: e.target.value || null })}
                      placeholder="https://example.com/favicon.ico"
                    />
                  </div>
                </div>

                <div className="grid md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="primary_color">Primary Color</Label>
                    <div className="flex gap-2">
                      <Input
                        id="primary_color"
                        type="color"
                        value={site.primary_color}
                        onChange={(e) => setSite({ ...site, primary_color: e.target.value })}
                        className="w-12 h-10 p-1 cursor-pointer"
                      />
                      <Input
                        value={site.primary_color}
                        onChange={(e) => setSite({ ...site, primary_color: e.target.value })}
                        className="flex-1"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="secondary_color">Secondary Color</Label>
                    <div className="flex gap-2">
                      <Input
                        id="secondary_color"
                        type="color"
                        value={site.secondary_color}
                        onChange={(e) => setSite({ ...site, secondary_color: e.target.value })}
                        className="w-12 h-10 p-1 cursor-pointer"
                      />
                      <Input
                        value={site.secondary_color}
                        onChange={(e) => setSite({ ...site, secondary_color: e.target.value })}
                        className="flex-1"
                      />
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between rounded-lg border border-border p-4">
                  <div>
                    <Label htmlFor="dark_mode" className="text-base">Dark Mode</Label>
                    <p className="text-sm text-muted-foreground">Enable dark theme for your site</p>
                  </div>
                  <Switch
                    id="dark_mode"
                    checked={site.dark_mode}
                    onCheckedChange={(checked) => setSite({ ...site, dark_mode: checked })}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="footer_text">Footer Text</Label>
                  <Input
                    id="footer_text"
                    value={site.footer_text || ""}
                    onChange={(e) => setSite({ ...site, footer_text: e.target.value || null })}
                    placeholder="© 2025 Your Company"
                  />
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Actions */}
        <div className="flex items-center justify-between">
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="destructive" className="gap-2">
                <Trash2 className="w-4 h-4" />
                Delete Site
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Delete this site?</AlertDialogTitle>
                <AlertDialogDescription>
                  This action cannot be undone. This will permanently delete your site
                  "{site.name}" and remove all associated data.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction
                  onClick={handleDelete}
                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                >
                  {isDeleting ? "Deleting..." : "Delete Site"}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>

          <Button 
            onClick={handleSave} 
            disabled={isSaving}
            variant="gradient"
            className="gap-2"
          >
            {isSaving ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save className="w-4 h-4" />
                Save Settings
              </>
            )}
          </Button>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default SiteSettings;
