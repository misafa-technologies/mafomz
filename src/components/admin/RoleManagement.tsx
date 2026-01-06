import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
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
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Users, Shield, UserPlus, Loader2, Trash2, AlertTriangle, Lock } from "lucide-react";
import type { Database } from "@/integrations/supabase/types";

type AppRole = Database["public"]["Enums"]["app_role"];

interface UserRole {
  id: string;
  user_id: string;
  role: AppRole;
  created_at: string;
  profile?: {
    email: string | null;
    full_name: string | null;
  };
}

export function RoleManagement() {
  const { isAdmin } = useAuth();
  const [userRoles, setUserRoles] = useState<UserRole[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [email, setEmail] = useState("");
  const [selectedRole, setSelectedRole] = useState<AppRole>("moderator");
  const [isAdding, setIsAdding] = useState(false);

  useEffect(() => {
    fetchUserRoles();
  }, []);

  const fetchUserRoles = async () => {
    try {
      // Fetch roles
      const { data: roles, error: rolesError } = await supabase
        .from("user_roles")
        .select("*")
        .order("created_at", { ascending: false });

      if (rolesError) throw rolesError;

      // Fetch profiles separately
      const userIds = roles?.map(r => r.user_id) || [];
      const { data: profiles } = await supabase
        .from("profiles")
        .select("id, email, full_name")
        .in("id", userIds);

      // Merge data
      const merged = roles?.map(role => ({
        ...role,
        profile: profiles?.find(p => p.id === role.user_id) || undefined
      })) || [];

      setUserRoles(merged);
    } catch (error) {
      console.error("Error fetching roles:", error);
      toast.error("Failed to load user roles");
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddRole = async () => {
    if (!isAdmin) {
      toast.error("Only administrators can assign roles");
      return;
    }

    if (!email) {
      toast.error("Please enter an email address");
      return;
    }

    setIsAdding(true);
    try {
      // Find user by email
      const { data: profile, error: profileError } = await supabase
        .from("profiles")
        .select("id")
        .eq("email", email)
        .single();

      if (profileError || !profile) {
        toast.error("User not found. Make sure they have registered.");
        return;
      }

      // Check if role already exists
      const existingRole = userRoles.find(
        r => r.user_id === profile.id && r.role === selectedRole
      );

      if (existingRole) {
        toast.error("User already has this role");
        return;
      }

      // Add role
      const { error } = await supabase.from("user_roles").insert({
        user_id: profile.id,
        role: selectedRole,
      });

      if (error) throw error;

      toast.success(`${selectedRole} role assigned to ${email}`);
      setEmail("");
      fetchUserRoles();
    } catch (error) {
      console.error("Error adding role:", error);
      toast.error("Failed to assign role");
    } finally {
      setIsAdding(false);
    }
  };

  const handleRemoveRole = async (roleId: string) => {
    if (!isAdmin) {
      toast.error("Only administrators can remove roles");
      return;
    }

    try {
      const { error } = await supabase
        .from("user_roles")
        .delete()
        .eq("id", roleId);

      if (error) throw error;

      toast.success("Role removed successfully");
      fetchUserRoles();
    } catch (error) {
      console.error("Error removing role:", error);
      toast.error("Failed to remove role");
    }
  };

  const getRoleBadgeVariant = (role: AppRole) => {
    switch (role) {
      case "admin":
        return "destructive";
      case "moderator":
        return "default";
      default:
        return "secondary";
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-32">
        <Loader2 className="w-6 h-6 animate-spin text-primary" />
      </div>
    );
  }

  // Show access denied if not admin
  if (!isAdmin) {
    return (
      <Card className="glass border-border">
        <CardContent className="pt-6">
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <Lock className="w-12 h-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold">Admin Access Required</h3>
            <p className="text-muted-foreground mt-2">
              Only administrators can manage user roles.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="glass border-border">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Shield className="w-5 h-5 text-primary" />
          Role Management
        </CardTitle>
        <CardDescription>
          Assign admin and moderator roles to users. Only admins can modify roles.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Security Notice */}
        <div className="rounded-lg border border-warning/30 bg-warning/10 p-4">
          <div className="flex items-center gap-3">
            <AlertTriangle className="w-5 h-5 text-warning flex-shrink-0" />
            <div>
              <p className="font-medium text-warning">Security Notice</p>
              <p className="text-sm text-warning/80">
                Only grant admin access to trusted individuals. Admins have full platform control.
              </p>
            </div>
          </div>
        </div>

        {/* Add Role Form */}
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <Label htmlFor="email" className="sr-only">Email</Label>
            <Input
              id="email"
              type="email"
              placeholder="user@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
          <div className="w-full sm:w-40">
            <Select value={selectedRole} onValueChange={(v) => setSelectedRole(v as AppRole)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="admin">Admin</SelectItem>
                <SelectItem value="moderator">Moderator</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <Button onClick={handleAddRole} disabled={isAdding} className="gap-2">
            {isAdding ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <UserPlus className="w-4 h-4" />
            )}
            Assign Role
          </Button>
        </div>

        {/* Role Descriptions */}
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="rounded-lg bg-secondary/30 p-4">
            <div className="flex items-center gap-2 mb-2">
              <Badge variant="destructive">Admin</Badge>
            </div>
            <ul className="text-sm text-muted-foreground space-y-1">
              <li>• Full platform control</li>
              <li>• Manage all users and roles</li>
              <li>• Configure payments and settings</li>
              <li>• View all data and analytics</li>
            </ul>
          </div>
          <div className="rounded-lg bg-secondary/30 p-4">
            <div className="flex items-center gap-2 mb-2">
              <Badge variant="default">Moderator</Badge>
            </div>
            <ul className="text-sm text-muted-foreground space-y-1">
              <li>• View all transactions</li>
              <li>• Approve/reject deposits</li>
              <li>• Handle support tickets</li>
              <li>• View user profiles</li>
            </ul>
          </div>
        </div>

        {/* Roles Table */}
        <div className="rounded-lg border border-border overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>User</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Assigned</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {userRoles.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} className="text-center text-muted-foreground py-8">
                    <Users className="w-8 h-8 mx-auto mb-2 opacity-50" />
                    No role assignments yet
                  </TableCell>
                </TableRow>
              ) : (
                userRoles.map((role) => (
                  <TableRow key={role.id}>
                    <TableCell>
                      <div>
                        <p className="font-medium">
                          {role.profile?.full_name || "Unknown"}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {role.profile?.email || role.user_id.slice(0, 8)}
                        </p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant={getRoleBadgeVariant(role.role)}>
                        {role.role}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {new Date(role.created_at).toLocaleDateString()}
                    </TableCell>
                    <TableCell className="text-right">
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-destructive hover:text-destructive"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Remove Role</AlertDialogTitle>
                            <AlertDialogDescription>
                              Are you sure you want to remove the {role.role} role from{" "}
                              {role.profile?.email || "this user"}? They will lose all associated permissions.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction
                              onClick={() => handleRemoveRole(role.id)}
                              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                            >
                              Remove Role
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}
