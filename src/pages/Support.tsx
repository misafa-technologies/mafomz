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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { 
  HelpCircle, 
  Plus, 
  MessageSquare,
  Clock,
  CheckCircle2,
  Loader2,
  Send,
  ExternalLink,
  BookOpen,
  Video,
  Mail
} from "lucide-react";

interface Ticket {
  id: string;
  subject: string;
  description: string;
  priority: string;
  status: string;
  created_at: string;
  updated_at: string;
}

const Support = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);
  const [showDialog, setShowDialog] = useState(false);
  const [newTicket, setNewTicket] = useState({
    subject: "",
    description: "",
    priority: "medium"
  });

  useEffect(() => {
    fetchTickets();
  }, [user]);

  const fetchTickets = async () => {
    if (!user) return;
    
    try {
      const { data, error } = await supabase
        .from("support_tickets")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setTickets(data || []);
    } catch (error) {
      console.error("Error fetching tickets:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const createTicket = async () => {
    if (!user || !newTicket.subject || !newTicket.description) return;

    setIsCreating(true);
    try {
      const { error } = await supabase
        .from("support_tickets")
        .insert({
          user_id: user.id,
          subject: newTicket.subject,
          description: newTicket.description,
          priority: newTicket.priority,
          status: "open"
        });

      if (error) throw error;

      toast({
        title: "Ticket created",
        description: "Our support team will respond within 24 hours.",
      });

      setShowDialog(false);
      setNewTicket({ subject: "", description: "", priority: "medium" });
      fetchTickets();
    } catch (error: unknown) {
      console.error("Error creating ticket:", error);
      toast({
        title: "Error",
        description: "Failed to create ticket. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsCreating(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const config: Record<string, { variant: "default" | "secondary" | "outline"; icon: React.ReactNode }> = {
      open: { variant: "secondary", icon: <Clock className="w-3 h-3 mr-1" /> },
      in_progress: { variant: "default", icon: <MessageSquare className="w-3 h-3 mr-1" /> },
      resolved: { variant: "outline", icon: <CheckCircle2 className="w-3 h-3 mr-1" /> },
      closed: { variant: "outline", icon: <CheckCircle2 className="w-3 h-3 mr-1" /> }
    };
    const { variant, icon } = config[status] || config.open;
    return (
      <Badge variant={variant} className="capitalize flex items-center">
        {icon}
        {status.replace('_', ' ')}
      </Badge>
    );
  };

  const getPriorityBadge = (priority: string) => {
    const colors: Record<string, string> = {
      low: "bg-muted text-muted-foreground",
      medium: "bg-warning/20 text-warning",
      high: "bg-destructive/20 text-destructive",
      urgent: "bg-destructive text-destructive-foreground"
    };
    return (
      <span className={`px-2 py-0.5 rounded text-xs font-medium capitalize ${colors[priority] || colors.medium}`}>
        {priority}
      </span>
    );
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
              <HelpCircle className="w-6 h-6 text-primary" />
              Support
            </h1>
            <p className="text-muted-foreground mt-1">
              Get help from our support team or browse resources
            </p>
          </div>
          <Dialog open={showDialog} onOpenChange={setShowDialog}>
            <DialogTrigger asChild>
              <Button variant="gradient" className="gap-2">
                <Plus className="w-4 h-4" />
                New Ticket
              </Button>
            </DialogTrigger>
            <DialogContent className="glass border-border">
              <DialogHeader>
                <DialogTitle>Create Support Ticket</DialogTitle>
                <DialogDescription>
                  Describe your issue and we'll get back to you within 24 hours.
                </DialogDescription>
              </DialogHeader>
              
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label>Subject</Label>
                  <Input
                    value={newTicket.subject}
                    onChange={(e) => setNewTicket({ ...newTicket, subject: e.target.value })}
                    placeholder="Brief summary of your issue"
                  />
                </div>

                <div className="space-y-2">
                  <Label>Priority</Label>
                  <Select 
                    value={newTicket.priority} 
                    onValueChange={(v) => setNewTicket({ ...newTicket, priority: v })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="low">Low - General question</SelectItem>
                      <SelectItem value="medium">Medium - Need help</SelectItem>
                      <SelectItem value="high">High - Blocking issue</SelectItem>
                      <SelectItem value="urgent">Urgent - Critical problem</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Description</Label>
                  <Textarea
                    value={newTicket.description}
                    onChange={(e) => setNewTicket({ ...newTicket, description: e.target.value })}
                    placeholder="Describe your issue in detail..."
                    rows={5}
                  />
                </div>
              </div>

              <div className="flex justify-end gap-3">
                <Button variant="outline" onClick={() => setShowDialog(false)}>
                  Cancel
                </Button>
                <Button 
                  variant="gradient" 
                  onClick={createTicket}
                  disabled={!newTicket.subject || !newTicket.description || isCreating}
                >
                  {isCreating ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Creating...
                    </>
                  ) : (
                    <>
                      <Send className="w-4 h-4 mr-2" />
                      Submit Ticket
                    </>
                  )}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {/* Quick Help */}
        <div className="grid gap-4 sm:grid-cols-3">
          <Card className="glass border-border hover:border-primary/30 transition-colors cursor-pointer">
            <CardContent className="pt-6">
              <div className="flex items-start gap-4">
                <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                  <BookOpen className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <h3 className="font-semibold">Documentation</h3>
                  <p className="text-sm text-muted-foreground mt-1">
                    Browse guides and tutorials
                  </p>
                </div>
                <ExternalLink className="w-4 h-4 text-muted-foreground ml-auto" />
              </div>
            </CardContent>
          </Card>
          <Card className="glass border-border hover:border-primary/30 transition-colors cursor-pointer">
            <CardContent className="pt-6">
              <div className="flex items-start gap-4">
                <div className="h-10 w-10 rounded-lg bg-accent/10 flex items-center justify-center">
                  <Video className="h-5 w-5 text-accent" />
                </div>
                <div>
                  <h3 className="font-semibold">Video Tutorials</h3>
                  <p className="text-sm text-muted-foreground mt-1">
                    Watch step-by-step guides
                  </p>
                </div>
                <ExternalLink className="w-4 h-4 text-muted-foreground ml-auto" />
              </div>
            </CardContent>
          </Card>
          <Card className="glass border-border hover:border-primary/30 transition-colors cursor-pointer">
            <CardContent className="pt-6">
              <div className="flex items-start gap-4">
                <div className="h-10 w-10 rounded-lg bg-success/10 flex items-center justify-center">
                  <Mail className="h-5 w-5 text-success" />
                </div>
                <div>
                  <h3 className="font-semibold">Email Us</h3>
                  <p className="text-sm text-muted-foreground mt-1">
                    support@derivforge.com
                  </p>
                </div>
                <ExternalLink className="w-4 h-4 text-muted-foreground ml-auto" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Tickets */}
        <Card className="glass border-border">
          <CardHeader>
            <CardTitle>Your Tickets</CardTitle>
            <CardDescription>
              Track and manage your support requests
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex items-center justify-center h-48">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
              </div>
            ) : tickets.length === 0 ? (
              <div className="text-center py-12">
                <div className="mx-auto mb-4 h-16 w-16 rounded-2xl glass flex items-center justify-center">
                  <MessageSquare className="h-8 w-8 text-muted-foreground" />
                </div>
                <h3 className="text-lg font-semibold text-foreground mb-2">No support tickets</h3>
                <p className="text-muted-foreground max-w-sm mx-auto mb-6">
                  Need help? Create a support ticket and our team will assist you.
                </p>
                <Button variant="gradient" onClick={() => setShowDialog(true)} className="gap-2">
                  <Plus className="w-4 h-4" />
                  Create Ticket
                </Button>
              </div>
            ) : (
              <div className="space-y-3">
                {tickets.map((ticket) => (
                  <div 
                    key={ticket.id}
                    className="flex items-center justify-between p-4 rounded-lg border border-border hover:border-primary/30 transition-colors cursor-pointer"
                  >
                    <div className="flex items-start gap-4">
                      <div className="h-10 w-10 rounded-lg bg-secondary flex items-center justify-center">
                        <MessageSquare className="h-5 w-5 text-muted-foreground" />
                      </div>
                      <div>
                        <h4 className="font-medium">{ticket.subject}</h4>
                        <div className="flex items-center gap-3 mt-1">
                          {getStatusBadge(ticket.status)}
                          {getPriorityBadge(ticket.priority)}
                          <span className="text-xs text-muted-foreground">
                            {formatDate(ticket.created_at)}
                          </span>
                        </div>
                      </div>
                    </div>
                    <Button variant="ghost" size="sm">
                      View
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default Support;