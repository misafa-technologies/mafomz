import { useState, useEffect } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { 
  CheckCircle2, 
  XCircle, 
  Clock, 
  AlertTriangle,
  MessageSquare,
  DollarSign,
  Users,
  Search,
  Loader2,
  FileText,
  RefreshCw
} from "lucide-react";

interface Transaction {
  id: string;
  user_id: string;
  type: string;
  amount: number;
  currency: string;
  status: string;
  phone_number: string | null;
  mpesa_receipt: string | null;
  notes: string | null;
  created_at: string;
  profiles?: { email: string; full_name: string } | null;
}

interface SupportTicket {
  id: string;
  user_id: string;
  subject: string;
  description: string;
  status: string;
  priority: string;
  created_at: string;
  profiles?: { email: string; full_name: string } | null;
}

export default function ModeratorPanel() {
  const { user } = useAuth();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedTransaction, setSelectedTransaction] = useState<Transaction | null>(null);
  const [selectedTicket, setSelectedTicket] = useState<SupportTicket | null>(null);
  const [approvalDialog, setApprovalDialog] = useState(false);
  const [rejectDialog, setRejectDialog] = useState(false);
  const [responseDialog, setResponseDialog] = useState(false);
  const [notes, setNotes] = useState("");
  const [ticketResponse, setTicketResponse] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      // Fetch pending transactions
      const { data: txData, error: txError } = await supabase
        .from("transactions")
        .select("*")
        .in("status", ["pending", "processing"])
        .order("created_at", { ascending: false });

      if (txError) throw txError;
      
      // Fetch profiles for transactions
      const txWithProfiles = await Promise.all(
        (txData || []).map(async (tx) => {
          const { data: profile } = await supabase
            .from("profiles")
            .select("email, full_name")
            .eq("id", tx.user_id)
            .single();
          return { ...tx, profiles: profile };
        })
      );
      setTransactions(txWithProfiles);

      // Fetch open tickets
      const { data: ticketData, error: ticketError } = await supabase
        .from("support_tickets")
        .select("*")
        .in("status", ["open", "in_progress"])
        .order("created_at", { ascending: false });

      if (ticketError) throw ticketError;
      
      // Fetch profiles for tickets
      const ticketsWithProfiles = await Promise.all(
        (ticketData || []).map(async (ticket) => {
          const { data: profile } = await supabase
            .from("profiles")
            .select("email, full_name")
            .eq("id", ticket.user_id)
            .single();
          return { ...ticket, profiles: profile };
        })
      );
      setTickets(ticketsWithProfiles);
    } catch (error) {
      console.error("Error fetching data:", error);
      toast.error("Failed to load data");
    } finally {
      setIsLoading(false);
    }
  };

  const handleApproveTransaction = async () => {
    if (!selectedTransaction || !user) return;
    
    setIsProcessing(true);
    try {
      // Update transaction status
      const { error: txError } = await supabase
        .from("transactions")
        .update({
          status: "completed",
          moderator_id: user.id,
          approved_at: new Date().toISOString(),
          notes: notes || null,
        })
        .eq("id", selectedTransaction.id);

      if (txError) throw txError;

      // Update user balance
      const { data: balanceData } = await supabase
        .from("user_balances")
        .select("*")
        .eq("user_id", selectedTransaction.user_id)
        .single();

      if (balanceData) {
        await supabase
          .from("user_balances")
          .update({
            balance: balanceData.balance + selectedTransaction.amount,
            total_deposits: (balanceData.total_deposits || 0) + selectedTransaction.amount,
          })
          .eq("user_id", selectedTransaction.user_id);
      } else {
        await supabase
          .from("user_balances")
          .insert({
            user_id: selectedTransaction.user_id,
            balance: selectedTransaction.amount,
            total_deposits: selectedTransaction.amount,
          });
      }

      toast.success("Transaction approved and balance updated!");
      setApprovalDialog(false);
      setSelectedTransaction(null);
      setNotes("");
      fetchData();
    } catch (error) {
      console.error("Error approving transaction:", error);
      toast.error("Failed to approve transaction");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleRejectTransaction = async () => {
    if (!selectedTransaction || !user) return;
    
    setIsProcessing(true);
    try {
      const { error } = await supabase
        .from("transactions")
        .update({
          status: "failed",
          moderator_id: user.id,
          notes: notes || "Transaction rejected by moderator",
        })
        .eq("id", selectedTransaction.id);

      if (error) throw error;

      toast.success("Transaction rejected");
      setRejectDialog(false);
      setSelectedTransaction(null);
      setNotes("");
      fetchData();
    } catch (error) {
      console.error("Error rejecting transaction:", error);
      toast.error("Failed to reject transaction");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleRespondToTicket = async () => {
    if (!selectedTicket || !user || !ticketResponse.trim()) return;
    
    setIsProcessing(true);
    try {
      // Add message
      const { error: msgError } = await supabase
        .from("ticket_messages")
        .insert({
          ticket_id: selectedTicket.id,
          user_id: user.id,
          message: ticketResponse,
          is_staff: true,
        });

      if (msgError) throw msgError;

      // Update ticket status
      await supabase
        .from("support_tickets")
        .update({ status: "in_progress" })
        .eq("id", selectedTicket.id);

      toast.success("Response sent!");
      setResponseDialog(false);
      setSelectedTicket(null);
      setTicketResponse("");
      fetchData();
    } catch (error) {
      console.error("Error responding to ticket:", error);
      toast.error("Failed to send response");
    } finally {
      setIsProcessing(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
      pending: "secondary",
      processing: "default",
      completed: "default",
      failed: "destructive",
      cancelled: "outline",
    };
    return <Badge variant={variants[status] || "secondary"}>{status}</Badge>;
  };

  const getPriorityBadge = (priority: string) => {
    const colors: Record<string, string> = {
      low: "bg-blue-500/20 text-blue-400",
      medium: "bg-yellow-500/20 text-yellow-400",
      high: "bg-orange-500/20 text-orange-400",
      urgent: "bg-red-500/20 text-red-400",
    };
    return <Badge className={colors[priority] || colors.medium}>{priority}</Badge>;
  };

  const formatCurrency = (amount: number, currency: string) => {
    return new Intl.NumberFormat("en-KE", {
      style: "currency",
      currency: currency,
    }).format(amount);
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleString("en-KE", {
      dateStyle: "medium",
      timeStyle: "short",
    });
  };

  const pendingTxCount = transactions.filter(t => t.status === "pending").length;
  const openTicketCount = tickets.filter(t => t.status === "open").length;

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Moderator Panel</h1>
            <p className="text-muted-foreground">Manage transactions and support tickets</p>
          </div>
          <Button onClick={fetchData} variant="outline" disabled={isLoading}>
            <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? "animate-spin" : ""}`} />
            Refresh
          </Button>
        </div>

        {/* Important Notice */}
        <Card className="border-amber-500/30 bg-amber-500/5">
          <CardContent className="p-4">
            <div className="flex items-start gap-3">
              <AlertTriangle className="h-5 w-5 text-amber-500 mt-0.5" />
              <div>
                <h4 className="font-medium text-amber-500">Important Guidelines</h4>
                <ul className="text-sm text-muted-foreground mt-2 space-y-1 list-disc list-inside">
                  <li>Only approve transactions that have valid M-Pesa receipts</li>
                  <li>Never send money directly to users - all payments are handled through the platform</li>
                  <li>Verify the M-Pesa receipt number matches the transaction amount</li>
                  <li>Contact admin if you notice any suspicious activity</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Stats */}
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Pending Transactions</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{pendingTxCount}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Open Tickets</CardTitle>
              <MessageSquare className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{openTicketCount}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Processing</CardTitle>
              <Loader2 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {transactions.filter(t => t.status === "processing").length}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Total Volume Today</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {formatCurrency(
                  transactions.reduce((sum, t) => sum + t.amount, 0),
                  "KES"
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="transactions" className="space-y-4">
          <TabsList>
            <TabsTrigger value="transactions" className="gap-2">
              <DollarSign className="h-4 w-4" />
              Transactions
              {pendingTxCount > 0 && (
                <Badge variant="destructive" className="ml-1 h-5 w-5 p-0 flex items-center justify-center">
                  {pendingTxCount}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="tickets" className="gap-2">
              <MessageSquare className="h-4 w-4" />
              Support Tickets
              {openTicketCount > 0 && (
                <Badge variant="destructive" className="ml-1 h-5 w-5 p-0 flex items-center justify-center">
                  {openTicketCount}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="documentation" className="gap-2">
              <FileText className="h-4 w-4" />
              Documentation
            </TabsTrigger>
          </TabsList>

          {/* Transactions Tab */}
          <TabsContent value="transactions">
            <Card>
              <CardHeader>
                <CardTitle>Pending Transactions</CardTitle>
                <CardDescription>Review and approve M-Pesa deposits</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="mb-4">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Search by phone number or receipt..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>

                {isLoading ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                  </div>
                ) : transactions.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <Clock className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>No pending transactions</p>
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>User</TableHead>
                        <TableHead>Amount</TableHead>
                        <TableHead>Phone</TableHead>
                        <TableHead>Receipt</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Date</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {transactions
                        .filter(tx => 
                          !searchQuery || 
                          tx.phone_number?.includes(searchQuery) ||
                          tx.mpesa_receipt?.includes(searchQuery)
                        )
                        .map((tx) => (
                          <TableRow key={tx.id}>
                            <TableCell>
                              <div>
                                <p className="font-medium">{tx.profiles?.full_name || "Unknown"}</p>
                                <p className="text-sm text-muted-foreground">{tx.profiles?.email}</p>
                              </div>
                            </TableCell>
                            <TableCell className="font-medium">
                              {formatCurrency(tx.amount, tx.currency)}
                            </TableCell>
                            <TableCell>{tx.phone_number || "-"}</TableCell>
                            <TableCell className="font-mono text-sm">{tx.mpesa_receipt || "-"}</TableCell>
                            <TableCell>{getStatusBadge(tx.status)}</TableCell>
                            <TableCell className="text-sm">{formatDate(tx.created_at)}</TableCell>
                            <TableCell>
                              <div className="flex gap-2">
                                <Button
                                  size="sm"
                                  variant="default"
                                  className="bg-green-600 hover:bg-green-700"
                                  onClick={() => {
                                    setSelectedTransaction(tx);
                                    setApprovalDialog(true);
                                  }}
                                >
                                  <CheckCircle2 className="h-4 w-4" />
                                </Button>
                                <Button
                                  size="sm"
                                  variant="destructive"
                                  onClick={() => {
                                    setSelectedTransaction(tx);
                                    setRejectDialog(true);
                                  }}
                                >
                                  <XCircle className="h-4 w-4" />
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Support Tickets Tab */}
          <TabsContent value="tickets">
            <Card>
              <CardHeader>
                <CardTitle>Support Tickets</CardTitle>
                <CardDescription>Respond to user inquiries</CardDescription>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                  </div>
                ) : tickets.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <MessageSquare className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>No open tickets</p>
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>User</TableHead>
                        <TableHead>Subject</TableHead>
                        <TableHead>Priority</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Date</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {tickets.map((ticket) => (
                        <TableRow key={ticket.id}>
                          <TableCell>
                            <div>
                              <p className="font-medium">{ticket.profiles?.full_name || "Unknown"}</p>
                              <p className="text-sm text-muted-foreground">{ticket.profiles?.email}</p>
                            </div>
                          </TableCell>
                          <TableCell>
                            <p className="font-medium">{ticket.subject}</p>
                            <p className="text-sm text-muted-foreground line-clamp-1">{ticket.description}</p>
                          </TableCell>
                          <TableCell>{getPriorityBadge(ticket.priority)}</TableCell>
                          <TableCell>{getStatusBadge(ticket.status)}</TableCell>
                          <TableCell className="text-sm">{formatDate(ticket.created_at)}</TableCell>
                          <TableCell>
                            <Button
                              size="sm"
                              onClick={() => {
                                setSelectedTicket(ticket);
                                setResponseDialog(true);
                              }}
                            >
                              <MessageSquare className="h-4 w-4 mr-1" />
                              Respond
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Documentation Tab */}
          <TabsContent value="documentation">
            <Card>
              <CardHeader>
                <CardTitle>Moderator Guidelines</CardTitle>
                <CardDescription>Best practices and procedures</CardDescription>
              </CardHeader>
              <CardContent className="prose prose-invert max-w-none">
                <div className="space-y-6">
                  <section>
                    <h3 className="text-lg font-semibold mb-2">Transaction Approval Process</h3>
                    <ol className="list-decimal list-inside space-y-2 text-muted-foreground">
                      <li>Verify the M-Pesa receipt number is valid and matches the amount</li>
                      <li>Check that the phone number corresponds to the user's registered details</li>
                      <li>Confirm the transaction hasn't already been processed</li>
                      <li>Approve only if all verification checks pass</li>
                      <li>Add notes for any special circumstances</li>
                    </ol>
                  </section>

                  <section>
                    <h3 className="text-lg font-semibold mb-2">M-Pesa Receipt Verification</h3>
                    <ul className="list-disc list-inside space-y-2 text-muted-foreground">
                      <li>Valid receipts start with a letter followed by numbers (e.g., RAJ1234567)</li>
                      <li>Receipt should be from within the last 24 hours</li>
                      <li>Amount on receipt must match transaction amount exactly</li>
                      <li>Contact admin if receipt format seems suspicious</li>
                    </ul>
                  </section>

                  <section>
                    <h3 className="text-lg font-semibold mb-2">Support Ticket Guidelines</h3>
                    <ul className="list-disc list-inside space-y-2 text-muted-foreground">
                      <li>Respond to all tickets within 24 hours</li>
                      <li>Be professional and courteous in all communications</li>
                      <li>Escalate complex issues to admin immediately</li>
                      <li>Never share user data with third parties</li>
                      <li>Never engage in sending money directly to users</li>
                    </ul>
                  </section>

                  <section className="bg-destructive/10 border border-destructive/30 rounded-lg p-4">
                    <h3 className="text-lg font-semibold mb-2 text-destructive">⚠️ Important Security Rules</h3>
                    <ul className="list-disc list-inside space-y-2 text-muted-foreground">
                      <li><strong>NEVER</strong> send money directly to users via M-Pesa or any other means</li>
                      <li><strong>NEVER</strong> share your moderator credentials with anyone</li>
                      <li><strong>NEVER</strong> approve transactions without valid receipt verification</li>
                      <li><strong>ALWAYS</strong> report suspicious activity to admin immediately</li>
                    </ul>
                  </section>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Approval Dialog */}
        <Dialog open={approvalDialog} onOpenChange={setApprovalDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Approve Transaction</DialogTitle>
              <DialogDescription>
                Verify the M-Pesa receipt before approving this transaction.
              </DialogDescription>
            </DialogHeader>
            {selectedTransaction && (
              <div className="space-y-4">
                <div className="bg-muted rounded-lg p-4 space-y-2">
                  <p><strong>Amount:</strong> {formatCurrency(selectedTransaction.amount, selectedTransaction.currency)}</p>
                  <p><strong>Phone:</strong> {selectedTransaction.phone_number}</p>
                  <p><strong>Receipt:</strong> {selectedTransaction.mpesa_receipt || "Not provided"}</p>
                </div>
                <div>
                  <Label>Notes (optional)</Label>
                  <Textarea
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Add verification notes..."
                  />
                </div>
              </div>
            )}
            <DialogFooter>
              <Button variant="outline" onClick={() => setApprovalDialog(false)}>
                Cancel
              </Button>
              <Button
                onClick={handleApproveTransaction}
                disabled={isProcessing}
                className="bg-green-600 hover:bg-green-700"
              >
                {isProcessing ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                Approve & Credit Balance
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Reject Dialog */}
        <Dialog open={rejectDialog} onOpenChange={setRejectDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Reject Transaction</DialogTitle>
              <DialogDescription>
                Provide a reason for rejecting this transaction.
              </DialogDescription>
            </DialogHeader>
            <div>
              <Label>Reason</Label>
              <Textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Enter rejection reason..."
                required
              />
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setRejectDialog(false)}>
                Cancel
              </Button>
              <Button
                variant="destructive"
                onClick={handleRejectTransaction}
                disabled={isProcessing || !notes.trim()}
              >
                {isProcessing ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                Reject Transaction
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Ticket Response Dialog */}
        <Dialog open={responseDialog} onOpenChange={setResponseDialog}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Respond to Ticket</DialogTitle>
              <DialogDescription>
                {selectedTicket?.subject}
              </DialogDescription>
            </DialogHeader>
            {selectedTicket && (
              <div className="space-y-4">
                <div className="bg-muted rounded-lg p-4">
                  <p className="text-sm text-muted-foreground mb-2">User's message:</p>
                  <p>{selectedTicket.description}</p>
                </div>
                <div>
                  <Label>Your Response</Label>
                  <Textarea
                    value={ticketResponse}
                    onChange={(e) => setTicketResponse(e.target.value)}
                    placeholder="Type your response..."
                    rows={5}
                  />
                </div>
              </div>
            )}
            <DialogFooter>
              <Button variant="outline" onClick={() => setResponseDialog(false)}>
                Cancel
              </Button>
              <Button
                onClick={handleRespondToTicket}
                disabled={isProcessing || !ticketResponse.trim()}
              >
                {isProcessing ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                Send Response
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
}