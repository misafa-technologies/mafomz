import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  DollarSign, 
  TrendingUp, 
  ArrowUpRight, 
  ArrowDownRight,
  Calendar,
  Download,
  Loader2,
  Wallet,
  PiggyBank,
  CreditCard
} from "lucide-react";
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

interface Commission {
  id: string;
  deriv_loginid: string;
  amount: number;
  currency: string;
  type: string;
  status: string;
  period_start: string | null;
  period_end: string | null;
  created_at: string;
}

const Commissions = () => {
  const { user } = useAuth();
  const [commissions, setCommissions] = useState<Commission[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filter, setFilter] = useState("all");

  // Mock stats for demo
  const stats = {
    totalEarnings: 12450.00,
    pendingPayment: 1250.00,
    thisMonth: 3200.00,
    percentChange: 12.5,
  };

  useEffect(() => {
    fetchCommissions();
  }, [user]);

  const fetchCommissions = async () => {
    if (!user) return;
    
    try {
      const { data, error } = await supabase
        .from("commissions")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setCommissions(data || []);
    } catch (error) {
      console.error("Error fetching commissions:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
      pending: "secondary",
      approved: "default",
      paid: "default",
      rejected: "destructive",
    };
    return (
      <Badge variant={variants[status] || "outline"} className="capitalize">
        {status}
      </Badge>
    );
  };

  const formatCurrency = (amount: number, currency = "USD") => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency,
    }).format(amount);
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
              <DollarSign className="w-6 h-6 text-primary" />
              Commissions
            </h1>
            <p className="text-muted-foreground mt-1">
              Track your affiliate earnings and payouts
            </p>
          </div>
          <Button variant="outline" className="gap-2">
            <Download className="w-4 h-4" />
            Export Report
          </Button>
        </div>

        {/* Stats Cards */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Card className="glass border-border">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Total Earnings</p>
                  <p className="text-2xl font-bold gradient-text">
                    {formatCurrency(stats.totalEarnings)}
                  </p>
                </div>
                <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center">
                  <Wallet className="h-6 w-6 text-primary" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="glass border-border">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Pending Payout</p>
                  <p className="text-2xl font-bold text-warning">
                    {formatCurrency(stats.pendingPayment)}
                  </p>
                </div>
                <div className="h-12 w-12 rounded-xl bg-warning/10 flex items-center justify-center">
                  <PiggyBank className="h-6 w-6 text-warning" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="glass border-border">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">This Month</p>
                  <p className="text-2xl font-bold text-success">
                    {formatCurrency(stats.thisMonth)}
                  </p>
                </div>
                <div className="h-12 w-12 rounded-xl bg-success/10 flex items-center justify-center">
                  <CreditCard className="h-6 w-6 text-success" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="glass border-border">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Growth</p>
                  <div className="flex items-center gap-1">
                    <p className="text-2xl font-bold text-foreground">
                      {stats.percentChange}%
                    </p>
                    {stats.percentChange >= 0 ? (
                      <ArrowUpRight className="w-5 h-5 text-success" />
                    ) : (
                      <ArrowDownRight className="w-5 h-5 text-destructive" />
                    )}
                  </div>
                </div>
                <div className="h-12 w-12 rounded-xl bg-accent/10 flex items-center justify-center">
                  <TrendingUp className="h-6 w-6 text-accent" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Commission History */}
        <Card className="glass border-border">
          <CardHeader>
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <CardTitle>Commission History</CardTitle>
                <CardDescription>Your affiliate earnings and payouts</CardDescription>
              </div>
              <Select value={filter} onValueChange={setFilter}>
                <SelectTrigger className="w-40">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="approved">Approved</SelectItem>
                  <SelectItem value="paid">Paid</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex items-center justify-center h-48">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
              </div>
            ) : commissions.length === 0 ? (
              <div className="text-center py-12">
                <div className="mx-auto mb-4 h-16 w-16 rounded-2xl glass flex items-center justify-center">
                  <DollarSign className="h-8 w-8 text-muted-foreground" />
                </div>
                <h3 className="text-lg font-semibold text-foreground mb-2">No commissions yet</h3>
                <p className="text-muted-foreground max-w-sm mx-auto">
                  Start earning by creating a site and linking your Deriv account. Commissions are generated automatically from trading activity.
                </p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Account</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {commissions.map((commission) => (
                    <TableRow key={commission.id}>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Calendar className="w-4 h-4 text-muted-foreground" />
                          {formatDate(commission.created_at)}
                        </div>
                      </TableCell>
                      <TableCell className="font-mono text-sm">
                        {commission.deriv_loginid}
                      </TableCell>
                      <TableCell className="capitalize">
                        {commission.type}
                      </TableCell>
                      <TableCell className="font-semibold text-success">
                        +{formatCurrency(commission.amount, commission.currency)}
                      </TableCell>
                      <TableCell>
                        {getStatusBadge(commission.status)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        {/* Payout Info */}
        <Card className="glass border-border">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CreditCard className="w-5 h-5 text-primary" />
              Payout Information
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-3 gap-6">
              <div className="space-y-2">
                <h4 className="font-medium text-foreground">Minimum Payout</h4>
                <p className="text-muted-foreground text-sm">
                  Minimum payout threshold is $100. Once reached, payouts are processed automatically.
                </p>
              </div>
              <div className="space-y-2">
                <h4 className="font-medium text-foreground">Payout Schedule</h4>
                <p className="text-muted-foreground text-sm">
                  Payouts are processed on the 15th of each month for the previous month's earnings.
                </p>
              </div>
              <div className="space-y-2">
                <h4 className="font-medium text-foreground">Payment Methods</h4>
                <p className="text-muted-foreground text-sm">
                  Payments are made via bank transfer, PayPal, or cryptocurrency (BTC/ETH).
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default Commissions;