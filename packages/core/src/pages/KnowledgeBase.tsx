
import React, { useState } from "react";
import { useParams } from "wouter";
import { trpc } from "@/lib/trpc";
import { useClientContext } from "@/contexts/ClientContext";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@complianceos/ui/ui/table";
import { Input } from "@complianceos/ui/ui/input";
import { Button } from "@complianceos/ui/ui/button";
import { Search, Plus, Filter, MoreHorizontal, Edit, Trash, Loader2 } from "lucide-react";
import { Badge } from "@complianceos/ui/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@complianceos/ui/ui/dialog";
import { Label } from "@complianceos/ui/ui/label";
import { Textarea } from "@complianceos/ui/ui/textarea";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@complianceos/ui/ui/dropdown-menu";
import { toast } from "sonner";

import DashboardLayout from "@/components/DashboardLayout";
import { PageGuide } from "@/components/PageGuide";

export default function KnowledgeBase() {
  const params = useParams();
  const clientId = parseInt(params.id || "0");
  const [search, setSearch] = useState("");
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [selectedEntry, setSelectedEntry] = useState<any>(null);

  // Form states
  const [question, setQuestion] = useState("");
  const [answer, setAnswer] = useState("");
  const [comments, setComments] = useState("");
  const [access, setAccess] = useState("internal");

  const utils = trpc.useContext();

  const { data: entries, isLoading } = trpc.knowledgeBase.list.useQuery({
    clientId,
    search: search || undefined,
  });

  const createMutation = trpc.knowledgeBase.create.useMutation({
    onSuccess: () => {
      utils.knowledgeBase.list.invalidate();
      setIsAddOpen(false);
      resetForm();
      toast.success("Entry added successfully");
    },
  });

  const updateMutation = trpc.knowledgeBase.update.useMutation({
    onSuccess: () => {
      utils.knowledgeBase.list.invalidate();
      setIsEditOpen(false);
      resetForm();
      toast.success("Entry updated successfully");
    },
  });

  const deleteMutation = trpc.knowledgeBase.delete.useMutation({
    onSuccess: () => {
      utils.knowledgeBase.list.invalidate();
      toast.success("Entry deleted successfully");
    },
  });

  const resetForm = () => {
    setQuestion("");
    setAnswer("");
    setComments("");
    setAccess("internal");
    setSelectedEntry(null);
  };

  const handleEdit = (entry: any) => {
    setSelectedEntry(entry);
    setQuestion(entry.question);
    setAnswer(entry.answer);
    setComments(entry.comments || "");
    setAccess(entry.access || "internal");
    setIsEditOpen(true);
  };

  const handleSave = () => {
    if (!question || !answer) return;

    if (isEditOpen && selectedEntry) {
      updateMutation.mutate({
        id: selectedEntry.id,
        question,
        answer,
        comments,
        access: access as any,
      });
    } else {
      createMutation.mutate({
        clientId,
        question,
        answer,
        comments,
        access: access as any,
      });
    }
  };

  return (
    <DashboardLayout>
      <div className="p-8 w-full max-w-full">
        <div className="flex flex-col gap-6">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold tracking-tight">Knowledge Base (FAQ)</h1>
              <p className="text-muted-foreground mt-1">
                Manage standard answers for compliance questionnaires.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <PageGuide
                title="Knowledge Base"
                description="Answer library for security questionnaires."
                rationale="Speeds up vendor reviews by storing standard security responses."
                howToUse={[
                  { step: "Search Answers", description: "Find approved responses for common security questions." },
                  { step: "Add Entries", description: "Document new security controls and procedures." },
                  { step: "Manage Access", description: "Control internal vs. external visibility." }
                ]}
                integrations={[
                  { name: "AI Questionnaires", description: "Auto-fill source." },
                  { name: "Sales Enablement", description: "Shareable security facts." }
                ]}
              />
              <Button onClick={() => setIsAddOpen(true)}>
                <Plus className="mr-2 h-4 w-4" /> Add entries
              </Button>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search questions or answers..."
                className="pl-9"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <Button variant="outline">
              <Filter className="mr-2 h-4 w-4" /> Filter
            </Button>
          </div>

          <div className="border rounded-lg bg-card shadow-sm">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[40%]">Question</TableHead>
                  <TableHead className="w-[30%]">Answer</TableHead>
                  <TableHead>Comment</TableHead>
                  <TableHead>Access</TableHead>
                  <TableHead>Date Added</TableHead>
                  <TableHead className="w-[50px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={6} className="h-24 text-center">
                      <Loader2 className="h-6 w-6 animate-spin mx-auto text-muted-foreground" />
                    </TableCell>
                  </TableRow>
                ) : entries?.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="h-24 text-center text-muted-foreground">
                      No entries found. Add one to get started.
                    </TableCell>
                  </TableRow>
                ) : (
                  entries?.map((entry: any) => (
                    <TableRow key={entry.id}>
                      <TableCell className="font-medium">{entry.question}</TableCell>
                      <TableCell className="truncate max-w-[300px]" title={entry.answer}>
                        {entry.answer}
                      </TableCell>
                      <TableCell>{entry.comments}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className="capitalize">
                          {entry.access}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {new Date(entry.createdAt).toLocaleDateString()}
                      </TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" className="h-8 w-8 p-0">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => handleEdit(entry)}>
                              <Edit className="mr-2 h-4 w-4" /> Edit
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              className="text-destructive focus:text-destructive"
                              onClick={() => deleteMutation.mutate({ id: entry.id })}
                            >
                              <Trash className="mr-2 h-4 w-4" /> Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </div>

        <Dialog open={isAddOpen || isEditOpen} onOpenChange={(open) => {
          if (!open) {
            setIsAddOpen(false);
            setIsEditOpen(false);
            resetForm();
          }
        }}>
          <DialogContent className="sm:max-w-[600px]">
            <DialogHeader>
              <DialogTitle>{isEditOpen ? "Edit Entry" : "Add Entry"}</DialogTitle>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="question">Question</Label>
                <Input
                  id="question"
                  value={question}
                  onChange={(e) => setQuestion(e.target.value)}
                  placeholder="e.g. Are employee endpoints encrypted?"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="answer">Answer</Label>
                <Textarea
                  id="answer"
                  value={answer}
                  onChange={(e) => setAnswer(e.target.value)}
                  placeholder="Yes, we use BitLocker..."
                  className="min-h-[100px]"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="comments">Internal Comments</Label>
                <Input
                  id="comments"
                  value={comments}
                  onChange={(e) => setComments(e.target.value)}
                  placeholder="Optional notes"
                />
              </div>
              {/* Tag input could be added here */}
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => {
                setIsAddOpen(false);
                setIsEditOpen(false);
                resetForm();
              }}>
                Cancel
              </Button>
              <Button onClick={handleSave} disabled={createMutation.isPending || updateMutation.isPending}>
                {createMutation.isPending || updateMutation.isPending ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : null}
                Save
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
}
