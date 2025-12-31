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
import { Switch } from "@/components/ui/switch";
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
  Bell,
  Save,
  Loader2,
  Plus,
  Trash2,
  UserCog,
  DollarSign,
  Activity,
  Smartphone,
  CreditCard,
  Bot,
  TrendingUp,
  Eye,
  Ban,
  CheckCircle,
  XCircle,
  RefreshCw,
  Download
} from "lucide-react";

interface User {
  id: string;
  email: string;
  full_name: string | null;
  created_at: string;
  roles: string[];
  sites_count?: number;
  total_commissions?: number;
}

interface PlatformSettings {
  platform_name: string;
  platform_description: string;
  favicon_url: string;
  mpesa_enabled: string;
  mpesa_default_environment: string;
  commission_rate: string;
  auto_payout_enabled: string;
  min_payout_amount: string;
}

interface Announcement {
  id: string;
  title: string;
  content: string;
  type: string;
  is_active: boolean;
  created_at: string;
}

interface Commission {
  id: string;
  user_id: string;
  amount: number;
  currency: string;
  status: string;
  type: string;
  deriv_loginid: string;
  created_at: string;
  user_email?: string;
}

interface PaymentConfig {
  id: string;
  user_id: string;
  config_name: string;
  provider: string;
  shortcode: string | null;
  environment: string | null;
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
  const [commissions, setCommissions] = useState<Commission[]>([]);
  const [paymentConfigs, setPaymentConfigs] = useState<PaymentConfig[]>([]);
  const [settings, setSettings] = useState<PlatformSettings>({
    platform_name: "",
    platform_description: "",
    favicon_url: "",
    mpesa_enabled: "true",
    mpesa_default_environment: "sandbox",
    commission_rate: "0.10",
    auto_payout_enabled: "false",
    min_payout_amount: "100",
  });
  const [showAnnouncementDialog, setShowAnnouncementDialog] = useState(false);
  const [showMpesaDialog, setShowMpesaDialog] = useState(false);
  const [newAnnouncement, setNewAnnouncement] = useState({
    title: "",
    content: "",
    type: "info"
  });
  const [newMpesaConfig, setNewMpesaConfig] = useState({
    config_name: "",
    consumer_key: "",
    consumer_secret: "",
    shortcode: "",
    passkey: "",
    callback_url: "",
    environment: "sandbox"
  });
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalSites: 0,
    totalCommissions: 0,
    activeSites: 0,
    pendingPayouts: 0,
    activeBots: 0,
    monthlyRevenue: 0
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
        mpesa_enabled: "true",
        mpesa_default_environment: "sandbox",
        commission_rate: "0.10",
        auto_payout_enabled: "false",
        min_payout_amount: "100",
      };
      settingsData?.forEach((item) => {
        if (item.setting_key in settingsMap) {
          settingsMap[item.setting_key as keyof PlatformSettings] = item.setting_value || "";
        }
      });
      setSettings(settingsMap);

      // Fetch users with their roles and stats
      const { data: profilesData } = await supabase
        .from("profiles")
        .select("id, email, full_name, created_at");

      const { data: rolesData } = await supabase
        .from("user_roles")
        .select("user_id, role");

      const { data: sitesData } = await supabase
        .from("sites")
        .select("user_id");

      const { data: commissionsData } = await supabase
        .from("commissions")
        .select("*")
        .order("created_at", { ascending: false });

      // Calculate user stats
      const usersWithRoles = profilesData?.map(profile => {
        const userSites = sitesData?.filter(s => s.user_id === profile.id) || [];
        const userCommissions = commissionsData?.filter(c => c.user_id === profile.id) || [];
        const totalCommission = userCommissions.reduce((sum, c) => sum + Number(c.amount), 0);
        
        return {
          ...profile,
          roles: rolesData?.filter(r => r.user_id === profile.id).map(r => r.role) || [],
          sites_count: userSites.length,
          total_commissions: totalCommission
        };
      }) || [];
      setUsers(usersWithRoles);

      // Set commissions with user email
      const commissionsWithEmail = commissionsData?.map(c => ({
        ...c,
        user_email: profilesData?.find(p => p.id === c.user_id)?.email || "Unknown"
      })) || [];
      setCommissions(commissionsWithEmail);

      // Fetch announcements
      const { data: announcementsData } = await supabase
        .from("announcements")
        .select("*")
        .order("created_at", { ascending: false });
      setAnnouncements(announcementsData || []);

      // Fetch payment configs
      const { data: paymentData } = await supabase
        .from("payment_configs")
        .select("*")
        .order("created_at", { ascending: false });
      setPaymentConfigs(paymentData || []);

      // Fetch stats
      const { count: sitesCount } = await supabase
        .from("sites")
        .select("*", { count: "exact", head: true });

      const { count: activeSitesCount } = await supabase
        .from("sites")
        .select("*", { count: "exact", head: true })
        .eq("status", "live");

      const { count: activeBotsCount } = await supabase
        .from("bot_configs")
        .select("*", { count: "exact", head: true })
        .eq("is_active", true);

      const pendingCommissions = commissionsData?.filter(c => c.status === "pending") || [];
      const pendingTotal = pendingCommissions.reduce((sum, c) => sum + Number(c.amount), 0);
      const totalCommissionsAmount = commissionsData?.reduce((sum, c) => sum + Number(c.amount), 0) || 0;

      setStats({
        totalUsers: profilesData?.length || 0,
        totalSites: sitesCount || 0,
        totalCommissions: totalCommissionsAmount,
        activeSites: activeSitesCount || 0,
        pendingPayouts: pendingTotal,
        activeBots: activeBotsCount || 0,
        monthlyRevenue: totalCommissionsAmount * 0.1 // Platform takes 10%
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
        await supabase
          .from("platform_settings")
          .upsert({ 
            setting_key: key,
            setting_value: value,
            updated_by: user?.id 
          }, { onConflict: 'setting_key' });
      }

      toast({
        title: "Settings saved",
        description: "Platform settings have been updated successfully",
      });
    } catch (error) {
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
      await supabase
        .from("user_roles")
        .delete()
        .eq("user_id", userId);

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

  const handleCreateMpesaConfig = async () => {
    if (!newMpesaConfig.config_name || !newMpesaConfig.consumer_key) return;

    try {
      const { error } = await supabase
        .from("payment_configs")
        .insert({
          user_id: user?.id,
          provider: "mpesa",
          ...newMpesaConfig,
          is_active: false
        });

      if (error) throw error;

      toast({
        title: "M-Pesa config created",
        description: "M-Pesa Daraja configuration has been saved",
      });

      setShowMpesaDialog(false);
      setNewMpesaConfig({
        config_name: "",
        consumer_key: "",
        consumer_secret: "",
        shortcode: "",
        passkey: "",
        callback_url: "",
        environment: "sandbox"
      });
      fetchData();
    } catch (error) {
      console.error("Error creating M-Pesa config:", error);
      toast({
        title: "Error",
        description: "Failed to create M-Pesa configuration",
        variant: "destructive",
      });
    }
  };

  const toggleMpesaConfig = async (id: string, isActive: boolean) => {
    try {
      const { error } = await supabase
        .from("payment_configs")
        .update({ is_active: !isActive })
        .eq("id", id);

      if (error) throw error;

      setPaymentConfigs(paymentConfigs.map(c => 
        c.id === id ? { ...c, is_active: !isActive } : c
      ));

      toast({
        title: isActive ? "Config deactivated" : "Config activated",
        description: `M-Pesa configuration has been ${isActive ? "deactivated" : "activated"}`,
      });
    } catch (error) {
      console.error("Error toggling config:", error);
    }
  };

  const updateCommissionStatus = async (id: string, status: string) => {
    try {
      const { error } = await supabase
        .from("commissions")
        .update({ status })
        .eq("id", id);

      if (error) throw error;

      setCommissions(commissions.map(c => 
        c.id === id ? { ...c, status } : c
      ));

      toast({
        title: "Status updated",
        description: `Commission status changed to ${status}`,
      });
    } catch (error) {
      console.error("Error updating status:", error);
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

  if (!isAdmin) {
    return (
      <DashboardLayout>
        <div className="flex flex-col items-center justify-center h-64">
          <Shield className="w-16 h-16 text-muted-foreground mb-4" />
          <h2 className="text-xl font-semibold">Access Denied</h2>
          <p className="text-muted-foreground">You don't have permission to view this page.</p>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
              <Shield className="w-6 h-6 text-primary" />
              Admin Control Center
            </h1>
            <p className="text-muted-foreground mt-1">
              Manage users, payments, commissions, and platform configuration
            </p>
          </div>
          <Button variant="outline" onClick={fetchData} className="gap-2">
            <RefreshCw className="w-4 h-4" />
            Refresh Data
          </Button>
        </div>

        {/* Stats Grid */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-7">
          <Card className="glass border-border">
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                  <Users className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{stats.totalUsers}</p>
                  <p className="text-xs text-muted-foreground">Total Users</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="glass border-border">
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-lg bg-accent/10 flex items-center justify-center">
                  <Globe className="h-5 w-5 text-accent" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{stats.totalSites}</p>
                  <p className="text-xs text-muted-foreground">Total Sites</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="glass border-border">
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-lg bg-success/10 flex items-center justify-center">
                  <Activity className="h-5 w-5 text-success" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{stats.activeSites}</p>
                  <p className="text-xs text-muted-foreground">Active Sites</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="glass border-border">
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-lg bg-warning/10 flex items-center justify-center">
                  <DollarSign className="h-5 w-5 text-warning" />
                </div>
                <div>
                  <p className="text-2xl font-bold">${stats.totalCommissions.toLocaleString()}</p>
                  <p className="text-xs text-muted-foreground">Total Commissions</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="glass border-border">
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-lg bg-destructive/10 flex items-center justify-center">
                  <CreditCard className="h-5 w-5 text-destructive" />
                </div>
                <div>
                  <p className="text-2xl font-bold">${stats.pendingPayouts.toLocaleString()}</p>
                  <p className="text-xs text-muted-foreground">Pending Payouts</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="glass border-border">
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                  <Bot className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{stats.activeBots}</p>
                  <p className="text-xs text-muted-foreground">Active Bots</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="glass border-border bg-gradient-to-br from-primary/20 to-accent/20">
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-lg bg-primary/20 flex items-center justify-center">
                  <TrendingUp className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="text-2xl font-bold">${stats.monthlyRevenue.toLocaleString()}</p>
                  <p className="text-xs text-muted-foreground">Platform Revenue</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="users" className="space-y-6">
          <TabsList className="bg-secondary flex-wrap h-auto p-1">
            <TabsTrigger value="users" className="gap-2">
              <Users className="w-4 h-4" />
              Users
            </TabsTrigger>
            <TabsTrigger value="commissions" className="gap-2">
              <DollarSign className="w-4 h-4" />
              Commissions
            </TabsTrigger>
            <TabsTrigger value="mpesa" className="gap-2">
              <Smartphone className="w-4 h-4" />
              M-Pesa
            </TabsTrigger>
            <TabsTrigger value="announcements" className="gap-2">
              <Bell className="w-4 h-4" />
              Announcements
            </TabsTrigger>
            <TabsTrigger value="settings" className="gap-2">
              <Settings className="w-4 h-4" />
              Settings
            </TabsTrigger>
          </TabsList>

          {/* Users Tab */}
          <TabsContent value="users">
            <Card className="glass border-border">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <UserCog className="w-5 h-5 text-primary" />
                      User Management
                    </CardTitle>
                    <CardDescription>
                      View and manage user accounts, roles, and permissions
                    </CardDescription>
                  </div>
                  <Button variant="outline" size="sm" className="gap-2">
                    <Download className="w-4 h-4" />
                    Export CSV
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="rounded-lg border border-border overflow-hidden">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-secondary/50">
                        <TableHead>User</TableHead>
                        <TableHead>Email</TableHead>
                        <TableHead>Role</TableHead>
                        <TableHead>Sites</TableHead>
                        <TableHead>Commissions</TableHead>
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
                          <TableCell className="text-muted-foreground">{u.email}</TableCell>
                          <TableCell>
                            <Badge variant={u.roles.includes("admin") ? "default" : u.roles.includes("moderator") ? "secondary" : "outline"}>
                              {u.roles[0] || "user"}
                            </Badge>
                          </TableCell>
                          <TableCell>{u.sites_count || 0}</TableCell>
                          <TableCell className="text-success">${(u.total_commissions || 0).toFixed(2)}</TableCell>
                          <TableCell className="text-muted-foreground">
                            {new Date(u.created_at).toLocaleDateString()}
                          </TableCell>
                          <TableCell>
                            <Select
                              defaultValue={u.roles[0] || "user"}
                              onValueChange={(value) => handleUpdateRole(u.id, value)}
                            >
                              <SelectTrigger className="w-28 h-8">
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
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Commissions Tab */}
          <TabsContent value="commissions">
            <Card className="glass border-border">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <DollarSign className="w-5 h-5 text-primary" />
                      Commission Management
                    </CardTitle>
                    <CardDescription>
                      View and manage all affiliate commissions and payouts
                    </CardDescription>
                  </div>
                  <Button variant="outline" size="sm" className="gap-2">
                    <Download className="w-4 h-4" />
                    Export Report
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="rounded-lg border border-border overflow-hidden">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-secondary/50">
                        <TableHead>User</TableHead>
                        <TableHead>Deriv ID</TableHead>
                        <TableHead>Amount</TableHead>
                        <TableHead>Type</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Date</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {commissions.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                            No commissions found
                          </TableCell>
                        </TableRow>
                      ) : (
                        commissions.map((c) => (
                          <TableRow key={c.id}>
                            <TableCell className="text-muted-foreground">{c.user_email}</TableCell>
                            <TableCell className="font-mono text-sm">{c.deriv_loginid}</TableCell>
                            <TableCell className="font-semibold text-success">
                              ${Number(c.amount).toFixed(2)} {c.currency}
                            </TableCell>
                            <TableCell>
                              <Badge variant="secondary">{c.type}</Badge>
                            </TableCell>
                            <TableCell>
                              <Badge variant={
                                c.status === "paid" ? "default" : 
                                c.status === "pending" ? "secondary" : "destructive"
                              }>
                                {c.status}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-muted-foreground">
                              {new Date(c.created_at).toLocaleDateString()}
                            </TableCell>
                            <TableCell>
                              <div className="flex gap-1">
                                <Button 
                                  size="sm" 
                                  variant="ghost"
                                  className="h-8 w-8 p-0"
                                  onClick={() => updateCommissionStatus(c.id, "paid")}
                                >
                                  <CheckCircle className="w-4 h-4 text-success" />
                                </Button>
                                <Button 
                                  size="sm" 
                                  variant="ghost"
                                  className="h-8 w-8 p-0"
                                  onClick={() => updateCommissionStatus(c.id, "rejected")}
                                >
                                  <XCircle className="w-4 h-4 text-destructive" />
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* M-Pesa Tab */}
          <TabsContent value="mpesa">
            <div className="grid gap-6 lg:grid-cols-2">
              <Card className="glass border-border">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="flex items-center gap-2">
                        <Smartphone className="w-5 h-5 text-success" />
                        M-Pesa Daraja Configuration
                      </CardTitle>
                      <CardDescription>
                        Configure M-Pesa payment integration for the platform
                      </CardDescription>
                    </div>
                    <Dialog open={showMpesaDialog} onOpenChange={setShowMpesaDialog}>
                      <DialogTrigger asChild>
                        <Button variant="gradient" size="sm" className="gap-2">
                          <Plus className="w-4 h-4" />
                          Add Config
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="glass border-border max-w-lg">
                        <DialogHeader>
                          <DialogTitle>Add M-Pesa Configuration</DialogTitle>
                          <DialogDescription>
                            Enter your Safaricom Daraja API credentials
                          </DialogDescription>
                        </DialogHeader>
                        <div className="space-y-4 py-4">
                          <div className="space-y-2">
                            <Label>Configuration Name</Label>
                            <Input
                              value={newMpesaConfig.config_name}
                              onChange={(e) => setNewMpesaConfig({ ...newMpesaConfig, config_name: e.target.value })}
                              placeholder="e.g., Production M-Pesa"
                            />
                          </div>
                          <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                              <Label>Consumer Key</Label>
                              <Input
                                value={newMpesaConfig.consumer_key}
                                onChange={(e) => setNewMpesaConfig({ ...newMpesaConfig, consumer_key: e.target.value })}
                                placeholder="Consumer Key"
                              />
                            </div>
                            <div className="space-y-2">
                              <Label>Consumer Secret</Label>
                              <Input
                                type="password"
                                value={newMpesaConfig.consumer_secret}
                                onChange={(e) => setNewMpesaConfig({ ...newMpesaConfig, consumer_secret: e.target.value })}
                                placeholder="Consumer Secret"
                              />
                            </div>
                          </div>
                          <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                              <Label>Shortcode</Label>
                              <Input
                                value={newMpesaConfig.shortcode}
                                onChange={(e) => setNewMpesaConfig({ ...newMpesaConfig, shortcode: e.target.value })}
                                placeholder="174379"
                              />
                            </div>
                            <div className="space-y-2">
                              <Label>Passkey</Label>
                              <Input
                                type="password"
                                value={newMpesaConfig.passkey}
                                onChange={(e) => setNewMpesaConfig({ ...newMpesaConfig, passkey: e.target.value })}
                                placeholder="Passkey"
                              />
                            </div>
                          </div>
                          <div className="space-y-2">
                            <Label>Callback URL (Optional)</Label>
                            <Input
                              value={newMpesaConfig.callback_url}
                              onChange={(e) => setNewMpesaConfig({ ...newMpesaConfig, callback_url: e.target.value })}
                              placeholder="https://your-callback-url.com"
                            />
                          </div>
                          <div className="space-y-2">
                            <Label>Environment</Label>
                            <Select 
                              value={newMpesaConfig.environment} 
                              onValueChange={(v) => setNewMpesaConfig({ ...newMpesaConfig, environment: v })}
                            >
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="sandbox">Sandbox (Testing)</SelectItem>
                                <SelectItem value="production">Production (Live)</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                        </div>
                        <div className="flex justify-end gap-3">
                          <Button variant="outline" onClick={() => setShowMpesaDialog(false)}>
                            Cancel
                          </Button>
                          <Button variant="gradient" onClick={handleCreateMpesaConfig}>
                            Save Configuration
                          </Button>
                        </div>
                      </DialogContent>
                    </Dialog>
                  </div>
                </CardHeader>
                <CardContent>
                  {paymentConfigs.length === 0 ? (
                    <div className="text-center py-8">
                      <Smartphone className="w-12 h-12 mx-auto text-muted-foreground mb-3" />
                      <p className="text-muted-foreground">No M-Pesa configurations yet</p>
                      <p className="text-sm text-muted-foreground">Click "Add Config" to set up M-Pesa payments</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {paymentConfigs.map((config) => (
                        <div key={config.id} className="flex items-center justify-between p-4 rounded-lg bg-secondary/50 border border-border">
                          <div className="flex items-center gap-3">
                            <div className={`h-10 w-10 rounded-lg flex items-center justify-center ${config.is_active ? 'bg-success/20' : 'bg-muted'}`}>
                              <Smartphone className={`w-5 h-5 ${config.is_active ? 'text-success' : 'text-muted-foreground'}`} />
                            </div>
                            <div>
                              <p className="font-medium">{config.config_name}</p>
                              <div className="flex gap-2 mt-1">
                                <Badge variant="secondary" className="text-xs">
                                  {config.shortcode || "No shortcode"}
                                </Badge>
                                <Badge variant={config.environment === "production" ? "default" : "outline"} className="text-xs">
                                  {config.environment}
                                </Badge>
                              </div>
                            </div>
                          </div>
                          <Switch
                            checked={config.is_active}
                            onCheckedChange={() => toggleMpesaConfig(config.id, config.is_active)}
                          />
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card className="glass border-border">
                <CardHeader>
                  <CardTitle>M-Pesa Documentation</CardTitle>
                  <CardDescription>Quick reference for Daraja API integration</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="rounded-lg bg-secondary/50 p-4">
                    <h4 className="font-semibold mb-2">Getting Started</h4>
                    <ol className="list-decimal list-inside text-sm text-muted-foreground space-y-1">
                      <li>Register at developer.safaricom.co.ke</li>
                      <li>Create an app to get API credentials</li>
                      <li>Use Sandbox for testing</li>
                      <li>Apply for production Go-Live</li>
                    </ol>
                  </div>
                  <div className="rounded-lg bg-secondary/50 p-4">
                    <h4 className="font-semibold mb-2">Supported Features</h4>
                    <ul className="text-sm text-muted-foreground space-y-1">
                      <li>✓ STK Push (Lipa Na M-Pesa)</li>
                      <li>✓ Payment callbacks</li>
                      <li>✓ Transaction status queries</li>
                      <li>✓ Reversal requests</li>
                    </ul>
                  </div>
                  <Button variant="outline" className="w-full" asChild>
                    <a href="https://developer.safaricom.co.ke/Documentation" target="_blank" rel="noopener noreferrer">
                      Open Safaricom Documentation
                    </a>
                  </Button>
                </CardContent>
              </Card>
            </div>
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
                      Create and manage platform-wide announcements
                    </CardDescription>
                  </div>
                  <Dialog open={showAnnouncementDialog} onOpenChange={setShowAnnouncementDialog}>
                    <DialogTrigger asChild>
                      <Button variant="gradient" size="sm" className="gap-2">
                        <Plus className="w-4 h-4" />
                        New Announcement
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="glass border-border">
                      <DialogHeader>
                        <DialogTitle>Create Announcement</DialogTitle>
                        <DialogDescription>
                          This will be visible to all platform users
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
                              <SelectItem value="error">Error</SelectItem>
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
                {announcements.length === 0 ? (
                  <div className="text-center py-8">
                    <Bell className="w-12 h-12 mx-auto text-muted-foreground mb-3" />
                    <p className="text-muted-foreground">No announcements yet</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {announcements.map((announcement) => (
                      <div key={announcement.id} className="flex items-start justify-between p-4 rounded-lg bg-secondary/50 border border-border">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <Badge variant={
                              announcement.type === "success" ? "default" :
                              announcement.type === "warning" ? "secondary" :
                              announcement.type === "error" ? "destructive" : "outline"
                            }>
                              {announcement.type}
                            </Badge>
                            <Badge variant={announcement.is_active ? "default" : "secondary"}>
                              {announcement.is_active ? "Active" : "Inactive"}
                            </Badge>
                          </div>
                          <h4 className="font-semibold">{announcement.title}</h4>
                          <p className="text-sm text-muted-foreground mt-1">{announcement.content}</p>
                          <p className="text-xs text-muted-foreground mt-2">
                            {new Date(announcement.created_at).toLocaleString()}
                          </p>
                        </div>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="text-destructive hover:text-destructive"
                          onClick={() => handleDeleteAnnouncement(announcement.id)}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Settings Tab */}
          <TabsContent value="settings">
            <div className="grid gap-6 lg:grid-cols-2">
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
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label>Platform Name</Label>
                    <Input
                      value={settings.platform_name}
                      onChange={(e) => setSettings({ ...settings, platform_name: e.target.value })}
                      placeholder="Mafomz"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Platform Description</Label>
                    <Textarea
                      value={settings.platform_description}
                      onChange={(e) => setSettings({ ...settings, platform_description: e.target.value })}
                      placeholder="A platform for building trading websites..."
                      rows={3}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Favicon URL</Label>
                    <Input
                      value={settings.favicon_url}
                      onChange={(e) => setSettings({ ...settings, favicon_url: e.target.value })}
                      placeholder="https://example.com/favicon.ico"
                    />
                  </div>
                </CardContent>
              </Card>

              <Card className="glass border-border">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <DollarSign className="w-5 h-5 text-primary" />
                    Commission Settings
                  </CardTitle>
                  <CardDescription>
                    Configure commission rates and payout settings
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label>Commission Rate (%)</Label>
                    <Input
                      type="number"
                      step="0.01"
                      value={(parseFloat(settings.commission_rate) * 100).toString()}
                      onChange={(e) => setSettings({ ...settings, commission_rate: (parseFloat(e.target.value) / 100).toString() })}
                      placeholder="10"
                    />
                    <p className="text-xs text-muted-foreground">Platform takes this percentage from affiliate earnings</p>
                  </div>
                  <div className="space-y-2">
                    <Label>Minimum Payout Amount ($)</Label>
                    <Input
                      type="number"
                      value={settings.min_payout_amount}
                      onChange={(e) => setSettings({ ...settings, min_payout_amount: e.target.value })}
                      placeholder="100"
                    />
                  </div>
                  <div className="flex items-center justify-between rounded-lg border border-border p-4">
                    <div>
                      <Label>Auto Payout</Label>
                      <p className="text-xs text-muted-foreground">Automatically process payouts when threshold is reached</p>
                    </div>
                    <Switch
                      checked={settings.auto_payout_enabled === "true"}
                      onCheckedChange={(checked) => setSettings({ ...settings, auto_payout_enabled: checked ? "true" : "false" })}
                    />
                  </div>
                  <div className="flex items-center justify-between rounded-lg border border-border p-4">
                    <div>
                      <Label>M-Pesa Enabled</Label>
                      <p className="text-xs text-muted-foreground">Enable M-Pesa payment processing</p>
                    </div>
                    <Switch
                      checked={settings.mpesa_enabled === "true"}
                      onCheckedChange={(checked) => setSettings({ ...settings, mpesa_enabled: checked ? "true" : "false" })}
                    />
                  </div>
                </CardContent>
              </Card>
            </div>

            <div className="mt-6 flex justify-end">
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
                    Save All Settings
                  </>
                )}
              </Button>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
};

export default AdminPanel;
