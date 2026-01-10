import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Settings, Save, Loader2, Globe, FileText, Image, Mail, Phone, DollarSign } from "lucide-react";
import { RoleManagement } from "@/components/admin/RoleManagement";
import { MpesaGlobalConfig } from "@/components/admin/MpesaGlobalConfig";
import { CommissionSplitConfig } from "@/components/admin/CommissionSplitConfig";

interface PlatformSettings {
  platform_name: string;
  platform_description: string;
  platform_domain: string;
  favicon_url: string;
  contact_email: string;
  contact_phone: string;
}

const AdminSettings = () => {
  const { user, isAdmin } = useAuth();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [settings, setSettings] = useState<PlatformSettings>({
    platform_name: "",
    platform_description: "",
    platform_domain: "",
    favicon_url: "",
    contact_email: "",
    contact_phone: "",
  });

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const { data, error } = await supabase
        .from("platform_settings")
        .select("setting_key, setting_value");

      if (error) throw error;

      const settingsMap: PlatformSettings = {
        platform_name: "",
        platform_description: "",
        platform_domain: "",
        favicon_url: "",
        contact_email: "",
        contact_phone: "",
      };

      data?.forEach((item) => {
        if (item.setting_key in settingsMap) {
          settingsMap[item.setting_key as keyof PlatformSettings] = item.setting_value || "";
        }
      });

      setSettings(settingsMap);
    } catch (error) {
      console.error("Error fetching settings:", error);
      toast({
        title: "Error",
        description: "Failed to load platform settings",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = async () => {
    if (!isAdmin) {
      toast({
        title: "Access Denied",
        description: "You don't have permission to update settings",
        variant: "destructive",
      });
      return;
    }

    setIsSaving(true);
    try {
      const updates = Object.entries(settings).map(([key, value]) => ({
        setting_key: key,
        setting_value: value,
        updated_by: user?.id,
      }));

      for (const update of updates) {
        const { error } = await supabase
          .from("platform_settings")
          .upsert(
            { 
              setting_key: update.setting_key,
              setting_value: update.setting_value,
              updated_by: update.updated_by 
            },
            { onConflict: "setting_key" }
          );

        if (error) throw error;
      }

      toast({
        title: "Settings saved",
        description: "Platform settings have been updated successfully",
      });
    } catch (error: any) {
      console.error("Error saving settings:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to save settings",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
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

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <Settings className="w-6 h-6" />
            Admin Settings
          </h1>
          <p className="text-muted-foreground mt-1">
            Configure platform-wide settings, payments, and user roles
          </p>
        </div>

        <Tabs defaultValue="branding" className="space-y-6">
          <TabsList className="glass">
            <TabsTrigger value="branding">Branding</TabsTrigger>
            <TabsTrigger value="commissions">Commissions</TabsTrigger>
            <TabsTrigger value="payments">Payments</TabsTrigger>
            <TabsTrigger value="roles">User Roles</TabsTrigger>
          </TabsList>

          {/* Branding Tab */}
          <TabsContent value="branding">
            <Card className="glass border-border">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Globe className="w-5 h-5 text-primary" />
                  Platform Branding & Contact
                </CardTitle>
                <CardDescription>
                  Update the platform name, domain, and contact information
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="platform_name" className="flex items-center gap-2">
                      <FileText className="w-4 h-4" />
                      Platform Name
                    </Label>
                    <Input
                      id="platform_name"
                      value={settings.platform_name}
                      onChange={(e) => setSettings({ ...settings, platform_name: e.target.value })}
                      placeholder="Enter platform name"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="platform_domain" className="flex items-center gap-2">
                      <Globe className="w-4 h-4" />
                      Platform Domain
                    </Label>
                    <Input
                      id="platform_domain"
                      value={settings.platform_domain}
                      onChange={(e) => setSettings({ ...settings, platform_domain: e.target.value })}
                      placeholder="e.g., mafomz.io"
                    />
                    <p className="text-xs text-muted-foreground">
                      User site subdomains will be: sitename.{settings.platform_domain || "yourdomain.com"}
                    </p>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="platform_description">Platform Description</Label>
                  <Textarea
                    id="platform_description"
                    value={settings.platform_description}
                    onChange={(e) => setSettings({ ...settings, platform_description: e.target.value })}
                    placeholder="Enter platform description"
                    rows={3}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="favicon_url" className="flex items-center gap-2">
                    <Image className="w-4 h-4" />
                    Favicon URL
                  </Label>
                  <Input
                    id="favicon_url"
                    value={settings.favicon_url}
                    onChange={(e) => setSettings({ ...settings, favicon_url: e.target.value })}
                    placeholder="https://example.com/favicon.ico"
                  />
                  {settings.favicon_url && (
                    <div className="flex items-center gap-2 mt-2">
                      <span className="text-sm text-muted-foreground">Preview:</span>
                      <img 
                        src={settings.favicon_url} 
                        alt="Favicon preview" 
                        className="w-6 h-6 rounded"
                        onError={(e) => {
                          (e.target as HTMLImageElement).style.display = 'none';
                        }}
                      />
                    </div>
                  )}
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="contact_email" className="flex items-center gap-2">
                      <Mail className="w-4 h-4" />
                      Contact Email
                    </Label>
                    <Input
                      id="contact_email"
                      type="email"
                      value={settings.contact_email}
                      onChange={(e) => setSettings({ ...settings, contact_email: e.target.value })}
                      placeholder="support@yourplatform.com"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="contact_phone" className="flex items-center gap-2">
                      <Phone className="w-4 h-4" />
                      Contact Phone
                    </Label>
                    <Input
                      id="contact_phone"
                      value={settings.contact_phone}
                      onChange={(e) => setSettings({ ...settings, contact_phone: e.target.value })}
                      placeholder="+254 700 000 000"
                    />
                  </div>
                </div>

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
                      Save Branding Settings
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Commissions Tab */}
          <TabsContent value="commissions">
            <CommissionSplitConfig />
          </TabsContent>

          {/* Payments Tab */}
          <TabsContent value="payments">
            <MpesaGlobalConfig />
          </TabsContent>

          {/* Roles Tab */}
          <TabsContent value="roles">
            <RoleManagement />
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
};

export default AdminSettings;
