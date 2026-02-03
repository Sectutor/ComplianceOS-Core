
import React, { useState } from "react";
import DashboardLayout from "@/components/DashboardLayout";
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
  const [questionnaireToDelete, setQuestionnaireToDelete] = useState<any>(null);

  const { data: questionnaires, refetch } = trpc.questionnaire.list.useQuery({ clientId });
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
            <Button variant="outline">
              <Filter className="w-4 h-4 mr-2" />
              Filter
            </Button>
            <Button onClick={() => setLocation(`/clients/${clientId}/questionnaire-workspace`)}>
              <Plus className="w-4 h-4 mr-2" />
              Upload Questionnaire
            </Button>
          </div>
        </div>

        <div className="bg-white rounded-lg border shadow-sm">
          <div className="p-4 border-b flex gap-2">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input placeholder="Search questionnaires..." className="pl-9" />
            </div>
          </div>

          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Questionnaire</TableHead>
                <TableHead>Progress</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Account / Sender</TableHead>
                <TableHead>Product</TableHead>
                <TableHead>Date Added</TableHead>
                <TableHead>Due Date</TableHead>
                <TableHead className="w-[50px]"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {questionnaires?.map((q) => (
                <TableRow
                  key={q.id}
                  onClick={() => setLocation(`/clients/${clientId}/questionnaires/${q.id}`)}
                  className="cursor-pointer hover:bg-muted/50 transition-colors"
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
                    <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${q.status === 'completed' ? 'bg-green-100 text-green-700' :
                      q.status === 'in_progress' ? 'bg-blue-100 text-blue-700' :
                        'bg-slate-100 text-slate-700'
                      }`}>
                      {q.status === 'completed' && <div className="w-2 h-2 rounded-full bg-green-500 mr-2" />}
                      {q.status === 'in_progress' && <div className="w-2 h-2 rounded-full bg-primary mr-2" />}
                      {q.status === 'open' && <div className="w-2 h-2 rounded-full bg-slate-400 mr-2" />}
                      {q.status?.replace('_', ' ').replace(/\b\w/g, c => c.toUpperCase())}
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
