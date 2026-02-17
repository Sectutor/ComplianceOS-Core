
import React, { useState, useEffect } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { PageGuide } from "@/components/PageGuide";
import { trpc } from "@/lib/trpc";
import { useParams, useLocation } from "wouter";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from "@complianceos/ui/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@complianceos/ui/ui/tabs";
import { Button } from "@complianceos/ui/ui/button";
import {
  Plus,
  FileText,
  MoreVertical,
  Trash2,
  ExternalLink,
  Search,
  Filter
} from "lucide-react";
import { Input } from "@complianceos/ui/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger
} from "@complianceos/ui/ui/dropdown-menu";
import { format } from "date-fns";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@complianceos/ui/ui/alert-dialog";

export default function QuestionnairesDashboard() {
  const { id } = useParams<{ id: string }>();
  const [location, setLocation] = useLocation();
  const clientId = parseInt(id || "0");
  const [file, setFile] = useState<File | null>(null);
  const queryParams = new URLSearchParams(window.location.search);
  const initialStatus = queryParams.get("status") || "all";
  const [statusFilter, setStatusFilter] = useState(initialStatus);
  const [questionnaireToDelete, setQuestionnaireToDelete] = useState<any>(null);

  const { data: questionnaires, refetch } = trpc.questionnaire.list.useQuery({ clientId });

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (statusFilter !== "all") {
      params.set("status", statusFilter);
    } else {
      params.delete("status");
    }
    const newRelativePathQuery = window.location.pathname + (params.toString() ? "?" + params.toString() : "");
    window.history.replaceState(null, "", newRelativePathQuery);
  }, [statusFilter]);

  const filteredQuestionnaires = questionnaires?.filter(q => {
    if (statusFilter === "all") return true;
    return q.status === statusFilter;
  });

  const deleteMutation = trpc.questionnaire.delete.useMutation({
    onSuccess: () => refetch()
  });

  const handleDelete = (q: any) => {
    setQuestionnaireToDelete(q);
  };

  const confirmDelete = async () => {
    if (questionnaireToDelete) {
      await deleteMutation.mutateAsync({ id: questionnaireToDelete.id });
      setQuestionnaireToDelete(null);
    }
  };

  return (
    <DashboardLayout>
      <div className="p-8">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Questionnaires</h1>
            <p className="text-muted-foreground mt-1">Manage all security questionnaires and assessments.</p>
          </div>
          <div className="flex gap-2">
            <PageGuide
              title="Questionnaires"
              description="Manage incoming and outgoing security assessments."
              rationale="Streamlines the vendor risk assessment process using AI automation."
              howToUse={[
                { step: "Upload Assessment", description: "Import Excel or CSV questionnaires." },
                { step: "Auto-Fill", description: "Use AI to answer questions from your Knowledge Base." },
                { step: "Review & Export", description: "Validate answers and export back to original format." }
              ]}
              integrations={[
                { name: "Knowledge Base", description: "Source for AI answers." },
                { name: "Evidence Library", description: "Attach proofs." }
              ]}
            />
            <Button variant="outline">
              <Filter className="w-4 h-4 mr-2" />
              Filter
            </Button>
            <Button
              className="bg-[#1C4D8D] hover:bg-[#1C4D8D]/90 text-white font-bold shadow-md transition-all hover:scale-[1.02]"
              onClick={() => setLocation(`/clients/${clientId}/questionnaire-workspace`)}
            >
              <Plus className="w-4 h-4 mr-2" />
              Upload Questionnaire
            </Button>
          </div>
        </div>

        <div className="space-y-4 mb-6">
          <Tabs value={statusFilter} onValueChange={setStatusFilter} className="w-full">
            <TabsList className="bg-[#1C4D8D]/10 p-1.5 h-auto flex flex-wrap justify-start gap-2 w-full border border-[#1C4D8D]/20 rounded-xl">
              <TabsTrigger
                value="all"
                className="data-[state=active]:bg-[#3ABEF9] data-[state=active]:text-white bg-[#1C4D8D] text-white hover:bg-[#3ABEF9] transition-all font-bold border-none px-4 py-2.5 rounded-lg flex items-center gap-2"
              >
                All Assessments
              </TabsTrigger>
              <TabsTrigger
                value="open"
                className="data-[state=active]:bg-[#3ABEF9] data-[state=active]:text-white bg-[#1C4D8D] text-white hover:bg-[#3ABEF9] transition-all font-bold border-none px-4 py-2.5 rounded-lg flex items-center gap-2"
              >
                Open
              </TabsTrigger>
              <TabsTrigger
                value="in_progress"
                className="data-[state=active]:bg-[#3ABEF9] data-[state=active]:text-white bg-[#1C4D8D] text-white hover:bg-[#3ABEF9] transition-all font-bold border-none px-4 py-2.5 rounded-lg flex items-center gap-2"
              >
                In Progress
              </TabsTrigger>
              <TabsTrigger
                value="completed"
                className="data-[state=active]:bg-[#3ABEF9] data-[state=active]:text-white bg-[#1C4D8D] text-white hover:bg-[#3ABEF9] transition-all font-bold border-none px-4 py-2.5 rounded-lg flex items-center gap-2"
              >
                Completed
              </TabsTrigger>
            </TabsList>
          </Tabs>

          <div className="flex gap-4 items-center">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search questionnaires..."
                className="pl-10 border-[#1C4D8D]/20 focus-visible:ring-[#3ABEF9]"
              />
            </div>
            <div className="text-sm text-muted-foreground ml-auto">
              {filteredQuestionnaires?.length || 0} assessment{filteredQuestionnaires?.length !== 1 ? 's' : ''}
            </div>
          </div>
        </div>

        <div className="rounded-xl border border-slate-200 shadow-lg overflow-hidden bg-white">
          <Table>
            <TableHeader>
              <TableRow className="bg-[#1C4D8D] hover:bg-[#1C4D8D] border-none">
                <TableHead className="text-white font-semibold py-4">Questionnaire</TableHead>
                <TableHead className="text-white font-semibold py-4">Progress</TableHead>
                <TableHead className="text-white font-semibold py-4">Status</TableHead>
                <TableHead className="text-white font-semibold py-4">Account / Sender</TableHead>
                <TableHead className="text-white font-semibold py-4">Product</TableHead>
                <TableHead className="text-white font-semibold py-4">Date Added</TableHead>
                <TableHead className="text-white font-semibold py-4">Due Date</TableHead>
                <TableHead className="w-[50px] text-white font-semibold py-4"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredQuestionnaires?.map((q) => (
                <TableRow
                  key={q.id}
                  onClick={() => setLocation(`/clients/${clientId}/questionnaires/${q.id}`)}
                  className="cursor-pointer hover:bg-muted/30 transition-colors border-slate-100"
                >
                  <TableCell className="font-medium">
                    <div className="font-semibold">{q.name}</div>
                  </TableCell>
                  <TableCell>
                    <div className="w-full max-w-[100px] bg-slate-100 rounded-full h-2.5">
                      <div className="bg-emerald-500 h-2.5 rounded-full" style={{ width: `${q.progress}%` }}></div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-bold ${q.status === 'completed' ? 'bg-emerald-100 text-emerald-700' :
                      q.status === 'in_progress' ? 'bg-[#3ABEF9]/10 text-[#1C4D8D]' :
                        'bg-slate-100 text-slate-600'
                      }`}>
                      {q.status === 'completed' && <div className="w-2 h-2 rounded-full bg-emerald-500 mr-2" />}
                      {q.status === 'in_progress' && <div className="w-2 h-2 rounded-full bg-[#3ABEF9] mr-2" />}
                      {q.status === 'open' && <div className="w-2 h-2 rounded-full bg-slate-400 mr-2" />}
                      {q.status?.replace('_', ' ').split(' ').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')}
                    </span>
                  </TableCell>
                  <TableCell>{q.senderName || '-'}</TableCell>
                  <TableCell>{q.productName || 'Default'}</TableCell>
                  <TableCell>{format(new Date(q.createdAt!), 'MM/dd/yyyy')}</TableCell>
                  <TableCell>{q.dueDate ? format(new Date(q.dueDate), 'MM/dd/yyyy') : '-'}</TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                        <Button variant="ghost" className="h-8 w-8 p-0">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => setLocation(`/clients/${clientId}/questionnaires/${q.id}`)}>
                          <ExternalLink className="mr-2 h-4 w-4" />
                          Open
                        </DropdownMenuItem>
                        <DropdownMenuItem className="text-red-600" onClick={() => handleDelete(q)}>
                          <Trash2 className="mr-2 h-4 w-4" />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
              {questionnaires?.length === 0 && (
                <TableRow>
                  <TableCell colSpan={8} className="text-center h-24 text-muted-foreground">
                    No questionnaires found. Upload one to get started.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </div>
      <AlertDialog open={!!questionnaireToDelete} onOpenChange={(open) => !open && setQuestionnaireToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Questionnaire?</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete <b>{questionnaireToDelete?.name}</b>? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-red-600 hover:bg-red-700"
              onClick={(e) => {
                e.preventDefault();
                confirmDelete();
              }}
            >
              Delete Questionnaire
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </DashboardLayout >
  );
}
