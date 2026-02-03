import React, { useState, useEffect } from 'react';
import { useParams, useLocation } from 'wouter';
import { Button } from "@complianceos/ui/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@complianceos/ui/ui/card";
import { Badge } from "@complianceos/ui/ui/badge";
import { Separator } from "@complianceos/ui/ui/separator";
import { Avatar, AvatarFallback, AvatarImage } from "@complianceos/ui/ui/avatar";
import { Textarea } from "@complianceos/ui/ui/textarea";
import { Label } from "@complianceos/ui/ui/label";
import { Switch } from "@complianceos/ui/ui/switch";
import { Alert, AlertDescription } from "@complianceos/ui/ui/alert";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@complianceos/ui/ui/dialog";
import { toast } from "sonner";
import { trpc } from "@/lib/trpc";
import { ArrowLeft, CheckCircle2, Clock, AlertTriangle, FileText, Users, Calendar, MessageSquare } from "lucide-react";
import DashboardLayout from "@/components/DashboardLayout";

interface ApprovalItem {
  id: string;
  title: string;
  type: 'risk-treatment' | 'soa' | 'policy';
  description: string;
  status: 'pending' | 'approved' | 'rejected';
  submitter: string;
  submittedDate: string;
  requiredApprovers: string[];
  currentApprover?: string;
  signatures: DigitalSignature[];
  content?: string;
  metadata?: Record<string, any>;
}

interface DigitalSignature {
  id: string;
  signerId: string;
  signerName: string;
  signerRole: string;
  signature: string;
  timestamp: string;
  status: 'signed' | 'pending';
  comment?: string;
}

export default function ManagementSignOffPage() {
  const { clientId } = useParams();
  const [location, setLocation] = useLocation();
  const utils = trpc.useUtils();

  const [selectedItem, setSelectedItem] = useState<ApprovalItem | null>(null);
  const [isSignDialogOpen, setIsSignDialogOpen] = useState(false);
  const [signatureComment, setSignatureComment] = useState('');
  const [rejectDialogOpen, setRejectDialogOpen] = useState(false);
  const [rejectComment, setRejectComment] = useState('');

  const { data: approvalItems = [], isLoading } = trpc.management.getApprovals.useQuery(
    { clientId: parseInt(clientId || '0') },
    { enabled: !!clientId }
  );

  const processMutation = trpc.management.processApproval.useMutation({
    onSuccess: () => {
      utils.management.getApprovals.invalidate();
      toast.success("Document processed successfully");
      setIsSignDialogOpen(false);
      setRejectDialogOpen(false);
      setSignatureComment('');
      setRejectComment('');
      setSelectedItem(null);
    },
    onError: (err) => {
      toast.error(`Failed to process document: ${err.message}`);
    }
  });

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'approved':
        return <CheckCircle2 className="h-4 w-4 text-green-500" />;
      case 'rejected':
        return <AlertTriangle className="h-4 w-4 text-red-500" />;
      default:
        return <Clock className="h-4 w-4 text-yellow-500" />;
    }
  };

  const getStatusBadge = (status: string) => {
    const variants = {
      approved: 'bg-green-100 text-green-800',
      rejected: 'bg-red-100 text-red-800',
      pending: 'bg-yellow-100 text-yellow-800'
    } as const;

    return (
      <Badge className={variants[status as keyof typeof variants]}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </Badge>
    );
  };

  const handleSign = async (approve: boolean) => {
    if (!selectedItem) return;

    processMutation.mutate({
      approvalId: selectedItem.id,
      action: approve ? 'approve' : 'reject',
      comment: approve ? signatureComment : rejectComment,
      signature: 'digital-signature-placeholder'
    });
  };

  return (
    <DashboardLayout>
      <div className="min-h-screen bg-slate-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Header */}
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center space-x-4">
              <Button
                variant="ghost"
                onClick={() => setLocation(`/clients/${clientId}/coverage`)}
                className="flex items-center space-x-2"
              >
                <ArrowLeft className="h-4 w-4" />
                <span>Back to Coverage</span>
              </Button>
              <div>
                <h1 className="text-2xl font-bold text-slate-900">
                  Management Sign-off
                </h1>
                <p className="text-slate-600">
                  Review and approve critical compliance documents
                </p>
              </div>
            </div>
          </div>

          {/* Quick Stats */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
            <Card className="bg-white border-slate-200 shadow-sm">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-slate-600">Pending</p>
                    <p className="text-2xl font-bold text-amber-600">
                      {approvalItems.filter(item => item.status === 'pending').length}
                    </p>
                  </div>
                  <Clock className="h-8 w-8 text-amber-600 opacity-20" />
                </div>
              </CardContent>
            </Card>
            <Card className="bg-white border-slate-200 shadow-sm">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-slate-600">Approved</p>
                    <p className="text-2xl font-bold text-emerald-600">
                      {approvalItems.filter(item => item.status === 'approved').length}
                    </p>
                  </div>
                  <CheckCircle2 className="h-8 w-8 text-emerald-600 opacity-20" />
                </div>
              </CardContent>
            </Card>
            <Card className="bg-white border-slate-200 shadow-sm">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-slate-600">Rejected</p>
                    <p className="text-2xl font-bold text-rose-600">
                      {approvalItems.filter(item => item.status === 'rejected').length}
                    </p>
                  </div>
                  <AlertTriangle className="h-8 w-8 text-rose-600 opacity-20" />
                </div>
              </CardContent>
            </Card>
            <Card className="bg-white border-slate-200 shadow-sm">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-slate-600">Total</p>
                    <p className="text-2xl font-bold text-slate-900">
                      {approvalItems.length}
                    </p>
                  </div>
                  <FileText className="h-8 w-8 text-slate-400 opacity-20" />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Document List */}
          <div className="space-y-4">
            {approvalItems.map((item) => (
              <Card key={item.id} className="bg-white border-slate-200 shadow-sm hover:shadow-md transition-shadow">
                <CardContent className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-2">
                        {getStatusIcon(item.status)}
                        <h3 className="text-lg font-semibold text-slate-900">
                          {item.title}
                        </h3>
                        {getStatusBadge(item.status)}
                        <Badge variant="outline" className="border-slate-200 text-slate-600">
                          {item.type.replace('-', ' ').toUpperCase()}
                        </Badge>
                      </div>

                      <p className="text-slate-600 mb-4">
                        {item.description}
                      </p>

                      <div className="flex items-center space-x-6 text-sm text-slate-500">
                        <div className="flex items-center space-x-2">
                          <Users className="h-4 w-4" />
                          <span>Submitted by {item.submitter}</span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Calendar className="h-4 w-4" />
                          <span>{item.submittedDate}</span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <FileText className="h-4 w-4" />
                          <span>Required: {item.requiredApprovers.join(', ')}</span>
                        </div>
                      </div>

                      {item.signatures.length > 0 && (
                        <div className="mt-4">
                          <Separator className="mb-4" />
                          <div className="space-y-2">
                            <p className="text-sm font-medium text-slate-700">Signatures:</p>
                            {item.signatures.map((signature) => (
                              <div key={signature.id} className="flex items-center space-x-3 p-2 bg-slate-50 border border-slate-100 rounded">
                                <Avatar className="h-8 w-8">
                                  <AvatarFallback className="bg-slate-200 text-slate-700">
                                    {signature.signerName.split(' ').map(n => n[0]).join('')}
                                  </AvatarFallback>
                                </Avatar>
                                <div className="flex-1">
                                  <p className="text-sm font-medium text-slate-900">{signature.signerName}</p>
                                  <p className="text-xs text-slate-500">{signature.signerRole} • {new Date(signature.timestamp).toLocaleDateString()}</p>
                                  {signature.comment && (
                                    <p className="text-xs text-slate-600 mt-1">
                                      <MessageSquare className="h-3 w-3 inline mr-1" />
                                      {signature.comment}
                                    </p>
                                  )}
                                </div>
                                <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>

                    <div className="flex space-x-2 ml-4">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setSelectedItem(item)}
                      >
                        View Details
                      </Button>
                      {item.status === 'pending' && (
                        <>
                          <Button
                            size="sm"
                            onClick={() => setIsSignDialogOpen(true)}
                            className="bg-green-600 hover:bg-green-700"
                          >
                            Approve & Sign
                          </Button>
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={() => setRejectDialogOpen(true)}
                          >
                            Reject
                          </Button>
                        </>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>

      {/* Approve Dialog */}
      <Dialog open={isSignDialogOpen} onOpenChange={setIsSignDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Approve and Sign Document</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="comment">Approval Comment (Optional)</Label>
              <Textarea
                id="comment"
                placeholder="Add any comments for the approval record..."
                value={signatureComment}
                onChange={(e) => setSignatureComment(e.target.value)}
                className="mt-2"
              />
            </div>
            <Alert>
              <AlertDescription>
                By clicking "Approve & Sign", you are digitally signing this document
                and confirming your approval of its contents.
              </AlertDescription>
            </Alert>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsSignDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={() => handleSign(true)} className="bg-green-600 hover:bg-green-700">
              Approve & Sign
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Reject Dialog */}
      <Dialog open={rejectDialogOpen} onOpenChange={setRejectDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reject Document</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="reject-comment">Rejection Reason (Required)</Label>
              <Textarea
                id="reject-comment"
                placeholder="Please provide a reason for rejection..."
                value={rejectComment}
                onChange={(e) => setRejectComment(e.target.value)}
                className="mt-2"
                required
              />
            </div>
            <Alert>
              <AlertDescription>
                This document will be returned to the submitter with your comments for revision.
              </AlertDescription>
            </Alert>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRejectDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={() => handleSign(false)}
              disabled={!rejectComment.trim()}
            >
              Reject Document
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Details View */}
      {selectedItem && (
        <Dialog open={!!selectedItem} onOpenChange={() => setSelectedItem(null)}>
          <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center space-x-3">
                {getStatusIcon(selectedItem.status)}
                {selectedItem.title}
                {getStatusBadge(selectedItem.status)}
                <Badge variant="outline" className="border-slate-200 text-slate-600">{selectedItem.type.toUpperCase()}</Badge>
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-6">
              <div>
                <h4 className="font-medium mb-2 text-slate-900">Description</h4>
                <p className="text-slate-600">{selectedItem.description}</p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h4 className="font-medium mb-2 text-slate-900">Submission Details</h4>
                  <div className="space-y-1 text-sm text-slate-600">
                    <p>Submitter: {selectedItem.submitter}</p>
                    <p>Date: {selectedItem.submittedDate}</p>
                    <p>Current Approver: {selectedItem.currentApprover}</p>
                  </div>
                </div>
                <div>
                  <h4 className="font-medium mb-2 text-slate-900">Approval Requirements</h4>
                  <div className="space-y-1 text-sm text-slate-600">
                    {selectedItem.requiredApprovers.map(approver => (
                      <p key={approver}>{approver}</p>
                    ))}
                  </div>
                </div>
              </div>

              {selectedItem.metadata && (
                <div>
                  <h4 className="font-medium mb-2 text-slate-900">Metadata</h4>
                  <div className="bg-slate-50 p-4 rounded border border-slate-100">
                    {Object.entries(selectedItem.metadata).map(([key, value]) => (
                      <div key={key} className="flex justify-between py-1">
                        <span className="text-sm font-medium text-slate-700">{key}:</span>
                        <span className="text-sm text-slate-600">{String(value)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {selectedItem.content && (
                <div>
                  <h4 className="font-medium mb-2 text-slate-900">Document Content</h4>
                  <div className="bg-slate-50 p-4 rounded border border-slate-100 max-h-96 overflow-y-auto">
                    <pre className="whitespace-pre-wrap text-sm text-slate-700 font-mono">{selectedItem.content}</pre>
                  </div>
                </div>
              )}
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setSelectedItem(null)}>
                Close
              </Button>
              {selectedItem.status === 'pending' && (
                <>
                  <Button
                    onClick={() => {
                      setSelectedItem(null);
                      setIsSignDialogOpen(true);
                    }}
                    className="bg-green-600 hover:bg-green-700"
                  >
                    Approve & Sign
                  </Button>
                  <Button
                    variant="destructive"
                    onClick={() => {
                      setSelectedItem(null);
                      setRejectDialogOpen(true);
                    }}
                  >
                    Reject
                  </Button>
                </>
              )}
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </DashboardLayout>
  );
}