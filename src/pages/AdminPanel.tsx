import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { 
  Settings, 
  Users, 
  Globe,
  Shield,
  BarChart3,
  Bell,
  Save,
  Loader2,
  Plus,
  Trash2,
  UserCog,
  FileText,
  Image as ImageIcon,
  TrendingUp,
  DollarSign,
  Activity
} from "lucide-react";

interface User {
  id: string;
  email: string;
  full_name: string | null;
  created_at: string;
  roles: string[];
}

interface PlatformSettings {
  platform_name: string;
  platform_description: string;
  favicon_url: string;
}

interface Announcement {
  id: string;
  title: string;
  content: string;
  type: string;
  is_active: boolean;
  created_at: string;
}

const AdminPanel = () => {
  const { user, isAdmin } = useAuth();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [users, setUsers] = useState<User[]>([]);
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [settings, setSettings] = useState<PlatformSettings>({
    platform_name: "",
    platform_description: "",
    favicon_url: "",
  });
  const [showAnnouncementDialog, setShowAnnouncementDialog] = useState(false);
  const [newAnnouncement, setNewAnnouncement] = useState({
    title: "",
    content: "",
    type: "info"
  });
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalSites: 0,
    totalCommissions: 0,
    activeSites: 0
  });

  useEffect(() => {
    if (isAdmin) {
      fetchData();
    }
  }, [isAdmin]);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      // Fetch settings
      const { data: settingsData } = await supabase
        .from("platform_settings")
        .select("setting_key, setting_value");

      const settingsMap: PlatformSettings = {
        platform_name: "",
        platform_description: "",
        favicon_url: "",
      };
      settingsData?.forEach((item) => {
        if (item.setting_key in settingsMap) {
          settingsMap[item.setting_key as keyof PlatformSettings] = item.setting_value || "";
        }
      });
      setSettings(settingsMap);

      // Fetch users with their roles
      const { data: profilesData } = await supabase
        .from("profiles")
        .select("id, email, full_name, created_at");

      const { data: rolesData } = await supabase
        .from("user_roles")
        .select("user_id, role");

      const usersWithRoles = profilesData?.map(profile => ({
        ...profile,
        roles: rolesData?.filter(r => r.user_id === profile.id).map(r => r.role) || []
      })) || [];
      setUsers(usersWithRoles);

      // Fetch announcements (admins can see all)
      const { data: announcementsData } = await supabase
        .from("announcements")
        .select("*")
        .order("created_at", { ascending: false });
      setAnnouncements(announcementsData || []);

      // Fetch stats
      const { count: sitesCount } = await supabase
        .from("sites")
        .select("*", { count: "exact", head: true });

      const { count: activeSitesCount } = await supabase
        .from("sites")
        .select("*", { count: "exact", head: true })
        .eq("status", "live");

      setStats({
        totalUsers: profilesData?.length || 0,
        totalSites: sitesCount || 0,
        totalCommissions: 12450, // Mock data
        activeSites: activeSitesCount || 0
      });

    } catch (error) {
      console.error("Error fetching data:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSaveSettings = async () => {
    setIsSaving(true);
    try {
      for (const [key, value] of Object.entries(settings)) {
        const { error } = await supabase
          .from("platform_settings")
          .update({ 
            setting_value: value,
            updated_by: user?.id 
          })
          .eq("setting_key", key);

        if (error) throw error;
      }

      toast({
        title: "Settings saved",
        description: "Platform settings have been updated successfully",
      });
    } catch (error: unknown) {
      console.error("Error saving settings:", error);
      toast({
        title: "Error",
        description: "Failed to save settings",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleUpdateRole = async (userId: string, newRole: string) => {
    try {
      // Remove existing roles
      await supabase
        .from("user_roles")
        .delete()
        .eq("user_id", userId);

      // Add new role
      const { error } = await supabase
        .from("user_roles")
        .insert({ user_id: userId, role: newRole as "admin" | "moderator" | "user" });

      if (error) throw error;

      setUsers(users.map(u => 
        u.id === userId ? { ...u, roles: [newRole] } : u
      ));

      toast({
        title: "Role updated",
        description: "User role has been updated successfully",
      });
    } catch (error) {
      console.error("Error updating role:", error);
      toast({
        title: "Error",
        description: "Failed to update role",
        variant: "destructive",
      });
    }
  };

  const handleCreateAnnouncement = async () => {
    if (!newAnnouncement.title || !newAnnouncement.content) return;

    try {
      const { error } = await supabase
        .from("announcements")
        .insert({
          title: newAnnouncement.title,
          content: newAnnouncement.content,
          type: newAnnouncement.type,
          created_by: user?.id,
          is_active: true
        });

      if (error) throw error;

      toast({
        title: "Announcement created",
        description: "New announcement has been published",
      });

      setShowAnnouncementDialog(false);
      setNewAnnouncement({ title: "", content: "", type: "info" });
      fetchData();
    } catch (error) {
      console.error("Error creating announcement:", error);
      toast({
        title: "Error",
        description: "Failed to create announcement",
        variant: "destructive",
      });
    }
  };

  const handleDeleteAnnouncement = async (id: string) => {
    try {
      const { error } = await supabase
        .from("announcements")
        .delete()
        .eq("id", id);

      if (error) throw error;

      setAnnouncements(announcements.filter(a => a.id !== id));
      toast({
        title: "Announcement deleted",
        description: "Announcement has been removed",
      });
    } catch (error) {
      console.error("Error deleting announcement:", error);
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
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <Shield className="w-6 h-6 text-primary" />
            Admin Panel
          </h1>
          <p className="text-muted-foreground mt-1">
            Manage users, settings, and platform configuration
          </p>
        </div>

        {/* Stats */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Card className="glass border-border">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Total Users</p>
                  <p className="text-2xl font-bold">{stats.totalUsers}</p>
                </div>
                <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center">
                  <Users className="h-6 w-6 text-primary" />
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="glass border-border">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Total Sites</p>
                  <p className="text-2xl font-bold">{stats.totalSites}</p>
                </div>
                <div className="h-12 w-12 rounded-xl bg-accent/10 flex items-center justify-center">
                  <Globe className="h-6 w-6 text-accent" />
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="glass border-border">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Active Sites</p>
                  <p className="text-2xl font-bold">{stats.activeSites}</p>
                </div>
                <div className="h-12 w-12 rounded-xl bg-success/10 flex items-center justify-center">
                  <Activity className="h-6 w-6 text-success" />
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="glass border-border">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Total Commissions</p>
                  <p className="text-2xl font-bold">${stats.totalCommissions.toLocaleString()}</p>
                </div>
                <div className="h-12 w-12 rounded-xl bg-warning/10 flex items-center justify-center">
                  <DollarSign className="h-6 w-6 text-warning" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="settings" className="space-y-6">
          <TabsList className="bg-secondary">
            <TabsTrigger value="settings" className="gap-2">
              <Settings className="w-4 h-4" />
              Settings
            </TabsTrigger>
            <TabsTrigger value="users" className="gap-2">
              <Users className="w-4 h-4" />
              Users
            </TabsTrigger>
            <TabsTrigger value="announcements" className="gap-2">
              <Bell className="w-4 h-4" />
              Announcements
            </TabsTrigger>
          </TabsList>

          {/* Settings Tab */}
          <TabsContent value="settings">
            <Card className="glass border-border">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Globe className="w-5 h-5 text-primary" />
                  Platform Settings
                </CardTitle>
                <CardDescription>
                  Configure global platform settings and branding
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="platform_name" className="flex items-center gap-2">
                      <FileText className="w-4 h-4" />
                      Platform Name
                    </Label>
                    <Input
                      id="platform_name"
                      value={settings.platform_name}
                      onChange={(e) => setSettings({ ...settings, platform_name: e.target.value })}
                      placeholder="DerivForge"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="favicon_url" className="flex items-center gap-2">
                      <ImageIcon className="w-4 h-4" />
                      Favicon URL
                    </Label>
                    <Input
                      id="favicon_url"
                      value={settings.favicon_url}
                      onChange={(e) => setSettings({ ...settings, favicon_url: e.target.value })}
                      placeholder="https://example.com/favicon.ico"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="platform_description">Platform Description</Label>
                  <Textarea
                    id="platform_description"
                    value={settings.platform_description}
                    onChange={(e) => setSettings({ ...settings, platform_description: e.target.value })}
                    placeholder="A platform for building trading websites..."
                    rows={3}
                  />
                </div>
                <Button 
                  onClick={handleSaveSettings} 
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
              </CardContent>
            </Card>
          </TabsContent>

          {/* Users Tab */}
          <TabsContent value="users">
            <Card className="glass border-border">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <UserCog className="w-5 h-5 text-primary" />
                  User Management
                </CardTitle>
                <CardDescription>
                  View and manage user accounts and roles
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>User</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Role</TableHead>
                      <TableHead>Joined</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {users.map((u) => (
                      <TableRow key={u.id}>
                        <TableCell>
                          <div className="font-medium">{u.full_name || "No name"}</div>
                        </TableCell>
                        <TableCell>{u.email}</TableCell>
                        <TableCell>
                          <Badge variant={u.roles.includes("admin") ? "default" : "secondary"}>
                            {u.roles[0] || "user"}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {new Date(u.created_at).toLocaleDateString()}
                        </TableCell>
                        <TableCell>
                          <Select
                            defaultValue={u.roles[0] || "user"}
                            onValueChange={(v) => handleUpdateRole(u.id, v)}
                          >
                            <SelectTrigger className="w-32">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="user">User</SelectItem>
                              <SelectItem value="moderator">Moderator</SelectItem>
                              <SelectItem value="admin">Admin</SelectItem>
                            </SelectContent>
                          </Select>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Announcements Tab */}
          <TabsContent value="announcements">
            <Card className="glass border-border">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <Bell className="w-5 h-5 text-primary" />
                      Announcements
                    </CardTitle>
                    <CardDescription>
                      Create and manage platform announcements
                    </CardDescription>
                  </div>
                  <Dialog open={showAnnouncementDialog} onOpenChange={setShowAnnouncementDialog}>
                    <DialogTrigger asChild>
                      <Button variant="gradient" className="gap-2">
                        <Plus className="w-4 h-4" />
                        New Announcement
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="glass border-border">
                      <DialogHeader>
                        <DialogTitle>Create Announcement</DialogTitle>
                        <DialogDescription>
                          Create a new platform-wide announcement
                        </DialogDescription>
                      </DialogHeader>
                      <div className="space-y-4 py-4">
                        <div className="space-y-2">
                          <Label>Title</Label>
                          <Input
                            value={newAnnouncement.title}
                            onChange={(e) => setNewAnnouncement({ ...newAnnouncement, title: e.target.value })}
                            placeholder="Announcement title"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Type</Label>
                          <Select 
                            value={newAnnouncement.type} 
                            onValueChange={(v) => setNewAnnouncement({ ...newAnnouncement, type: v })}
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="info">Info</SelectItem>
                              <SelectItem value="success">Success</SelectItem>
                              <SelectItem value="warning">Warning</SelectItem>
                              <SelectItem value="urgent">Urgent</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-2">
                          <Label>Content</Label>
                          <Textarea
                            value={newAnnouncement.content}
                            onChange={(e) => setNewAnnouncement({ ...newAnnouncement, content: e.target.value })}
                            placeholder="Announcement content..."
                            rows={4}
                          />
                        </div>
                      </div>
                      <div className="flex justify-end gap-3">
                        <Button variant="outline" onClick={() => setShowAnnouncementDialog(false)}>
                          Cancel
                        </Button>
                        <Button variant="gradient" onClick={handleCreateAnnouncement}>
                          Publish
                        </Button>
                      </div>
                    </DialogContent>
                  </Dialog>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {announcements.map((a) => (
                    <div 
                      key={a.id}
                      className="flex items-center justify-between p-4 rounded-lg border border-border"
                    >
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="font-medium">{a.title}</h4>
                          <Badge variant={a.is_active ? "default" : "secondary"}>
                            {a.type}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground mt-1 line-clamp-1">
                          {a.content}
                        </p>
                      </div>
                      <Button 
                        variant="ghost" 
                        size="icon"
                        className="text-destructive hover:text-destructive"
                        onClick={() => handleDeleteAnnouncement(a.id)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
};

export default AdminPanel;