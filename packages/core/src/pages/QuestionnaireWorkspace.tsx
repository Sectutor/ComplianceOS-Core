import React, { useState, useEffect } from "react";
import { useParams, useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import DashboardLayout from "@/components/DashboardLayout";
import { PageGuide } from "@/components/PageGuide";
import { Button } from "@complianceos/ui/ui/button";
import { Input } from "@complianceos/ui/ui/input";
import { Textarea } from "@complianceos/ui/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@complianceos/ui/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@complianceos/ui/ui/table";
import { Badge } from "@complianceos/ui/ui/badge";
import { Loader2, Upload, FileText, CheckCircle, AlertCircle, RefreshCw, Save, ChevronRight, ArrowLeft, Sparkles, Lock, FileDown, FileSpreadsheet, Mail, LayoutGrid, Check } from "lucide-react";
import { toast } from "sonner";
import { Progress } from "@complianceos/ui/ui/progress";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription
} from "@complianceos/ui/ui/dialog";
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
import { Label } from "@complianceos/ui/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@complianceos/ui/ui/tabs";

type Step = "upload" | "preview" | "generating" | "review";

export default function QuestionnaireWorkspace() {
  const params = useParams();
  const [location, setLocation] = useLocation();
  const clientId = parseInt(params.id || "0");
  const qId = params.qId ? parseInt(params.qId) : null;

  const [currentStep, setCurrentStep] = useState<Step>("upload");
  const [file, setFile] = useState<File | null>(null);
  const [questions, setQuestions] = useState<Array<{ questionId?: string; question: string }>>([]);
  const [answers, setAnswers] = useState<any[]>([]);

  // Create Questionnaire State
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isCompleteOpen, setIsCompleteOpen] = useState(false);
  const [projectName, setProjectName] = useState("");
  const [senderName, setSenderName] = useState("");
  const [uploadProgress, setUploadProgress] = useState(0);
  const [generatedCount, setGeneratedCount] = useState(0);
  const [isParseComplete, setIsParseComplete] = useState(false);

  // Template Selection State
  const [isTemplateMode, setIsTemplateMode] = useState(false);
  const [selectedTemplateId, setSelectedTemplateId] = useState<string | null>(null);
  const [showTemplateDialog, setShowTemplateDialog] = useState(false);

  // Vendor Dialog State
  const [showVendorDialog, setShowVendorDialog] = useState(false);
  const [vendorName, setVendorName] = useState("");
  const [vendorEmail, setVendorEmail] = useState("");
  const [vendorMessage, setVendorMessage] = useState("");

  // Detect template mode from URL (SSR-safe)
  useEffect(() => {
    // Skip during SSR - window is not available on the server
    if (typeof window === 'undefined') return;

    const params = new URLSearchParams(window.location.search);
    if (params.get('mode') === 'template') {
      setIsTemplateMode(true);
      setShowTemplateDialog(true);
    }
  }, []);

  // Fetch template questions when a template is selected
  const { data: templateQuestions } = trpc.questionnaire.getTemplateQuestions.useQuery(
    { templateId: selectedTemplateId! },
    { enabled: !!selectedTemplateId }
  );

  // Queries & Mutations
  const { data: projectData, isLoading: isProjectLoading, refetch: refetchProject } = trpc.questionnaire.get.useQuery({ id: qId! }, {
    enabled: !!qId
  });

  // Load project data when it changes
  useEffect(() => {
    if (projectData?.questions && projectData.questions.length > 0) {
      const mappedAnswers = projectData.questions.map((q: any) => ({
        questionId: q.questionId,
        question: q.question,
        answer: q.answer || "",
        confidence: q.confidence || 0,
        sources: q.sources || [],
        status: q.status
      }));
      setAnswers(mappedAnswers);
      setQuestions(mappedAnswers.map((a: any) => ({ questionId: a.questionId, question: a.question })));

      // Determine step
      setCurrentStep("review");
    }
  }, [projectData]);

  const parseMutation = trpc.questionnaire.parse.useMutation({
    onSuccess: (data) => {
      setQuestions(data.questions);
      // setFileName(file?.name || "Untitled Questionnaire");
      setProjectName(file?.name?.replace(/\.[^/.]+$/, "") || "New Questionnaire");
      setIsCreateOpen(true); // Prompt to create project immediately
    },
    onError: (err) => {
      toast.error(`Failed to parse file: ${err.message}`);
    }
  });

  const createProjectMutation = trpc.questionnaire.create.useMutation({
    onSuccess: async (data) => {
      toast.success("Questionnaire created successfully");
      setIsCreateOpen(false);
      // Save initial questions
      await saveQuestionsMutation.mutateAsync({
        questionnaireId: data.id,
        questions: questions.map(q => ({
          questionId: q.questionId,
          question: q.question,
          status: 'pending'
        }))
      });

      // Initialize answers array for the review table
      const initialAnswers = questions.map(q => ({
        questionId: q.questionId,
        question: q.question,
        answer: "",
        comment: "",
        tags: [],
        access: "internal",
        assignee: null,
        confidence: 0,
        sources: [],
        status: "pending"
      }));
      setAnswers(initialAnswers);
      setCurrentStep("review"); // Go directly to review table

      // Redirect to persistent URL
      setLocation(`/clients/${clientId}/questionnaires/${data.id}`);
    }
  });

  const saveQuestionsMutation = trpc.questionnaire.saveQuestions.useMutation({
    onSuccess: () => {
      // toast.success("Saved");
    }
  });

  const updateMutation = trpc.questionnaire.update.useMutation({
    onSuccess: () => {
      toast.success("Questionnaire updated");
      refetchProject();
    }
  });

  const completeMutation = trpc.questionnaire.complete.useMutation({
    onSuccess: (data) => {
      toast.success(`Questionnaire completed! ${data.indexedCount} answers saved.`);
      refetchProject();
    },
    onError: (err) => {
      toast.error(`Failed to complete questionnaire: ${err.message}`);
    }
  });

  const generateMutation = trpc.questionnaire.generateAnswers.useMutation({
    onError: (err) => {
      // Surface the error clearly — this is a Premium gated feature
      toast.error(err.message || 'AI generation failed. Please upgrade to Premium.');
    }
  });

  // Export queries
  const exportExcelQuery = trpc.questionnaire.exportExcel.useQuery({ id: qId! }, {
    enabled: false // Only fetch when needed
  });
  const exportJSONQuery = trpc.questionnaire.exportJSON.useQuery({ id: qId! }, {
    enabled: false // Only fetch when needed
  });

  // Template queries - only pass clientId if valid to ensure built-in templates always show
  const { data: templates } = trpc.questionnaire.listTemplates.useQuery(
    clientId && clientId > 0 ? { clientId } : {},
    { enabled: clientId !== undefined }
  );

  // Vendor list for dropdown - use listVendors to get org-specific vendors
  const { data: vendorList } = trpc.vendors.listVendors.useQuery(
    { clientId },
    { enabled: !!clientId && clientId > 0 }
  );

  // Vendor mutations
  const sendVendorInviteMutation = trpc.questionnaire.sendVendorInvite.useMutation({
    onSuccess: (data) => {
      toast.success(`Vendor invite sent to ${vendorEmail}!`);
      setShowVendorDialog(false);
      setVendorName("");
      setVendorEmail("");
      setVendorMessage("");
      refetchProject();
    },
    onError: (err) => {
      toast.error(`Failed to send invite: ${err.message}`);
    }
  });

  const submitForReviewMutation = trpc.questionnaire.submitForReview.useMutation({
    onSuccess: () => {
      toast.success("Questionnaire submitted for review!");
      refetchProject();
    },
    onError: (err) => {
      toast.error(`Failed to submit: ${err.message}`);
    }
  });

  // Handle sending to vendor
  const handleSendToVendor = () => {
    if (!qId || !vendorEmail || !vendorName) {
      toast.error("Please fill in vendor name and email");
      return;
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(vendorEmail)) {
      toast.error("Please enter a valid email address");
      return;
    }

    sendVendorInviteMutation.mutate({
      id: qId,
      clientId,
      vendorName,
      vendorEmail,
      message: vendorMessage
    });
  };

  // Handle submit for review
  const handleSubmitForReview = () => {
    if (!qId) return;
    submitForReviewMutation.mutate({ id: qId, clientId });
  };

  // Handle template selection
  const handleTemplateSelect = (templateId: string) => {
    setSelectedTemplateId(templateId);
  };

  // Apply selected template - load questions and open create dialog
  const handleUseTemplate = () => {
    if (!selectedTemplateId || !templateQuestions) return;

    setProjectName(templates?.find(t => t.id === selectedTemplateId)?.name || "New Questionnaire");
    setQuestions(templateQuestions.map(q => ({ questionId: q.questionId, question: q.question })));
    setShowTemplateDialog(false);
    setIsCreateOpen(true);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
    }
  };

  const handleParse = async () => {
    if (!file) return;

    setUploadProgress(0);
    setIsParseComplete(false);

    // Simulate progress
    const interval = setInterval(() => {
      setUploadProgress(prev => {
        if (prev >= 90) return prev;
        return prev + 10;
      });
    }, 500);

    const reader = new FileReader();
    reader.onload = async (e) => {
      const base64 = e.target?.result?.toString().split(',')[1];
      if (!base64) {
        clearInterval(interval);
        return;
      }

      const fileType = file.name.endsWith('.pdf') ? 'pdf' :
        file.name.endsWith('.xlsx') ? 'xlsx' :
          file.name.endsWith('.csv') ? 'csv' : 'pdf';

      try {
        await parseMutation.mutateAsync({
          fileBase64: base64,
          filename: file.name,
          fileType: fileType as any
        });
        clearInterval(interval);
        setUploadProgress(100);
        setIsParseComplete(true);
      } catch (error) {
        clearInterval(interval);
        setUploadProgress(0);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleCreateProject = () => {
    createProjectMutation.mutate({
      clientId,
      name: projectName,
      senderName: senderName,
      productName: "Default"
    });
  };

  const handleGenerate = async () => {
    // AI generation disabled
    toast.info("AI generation is not available in this version.");
  };

  const handleSaveProgress = async () => {
    if (!qId) return;
    await saveQuestionsMutation.mutateAsync({
      questionnaireId: qId,
      questions: answers.map((a: any) => ({
        question: a.question,
        answer: a.answer,
        confidence: a.confidence,
        sources: a.sources,
        status: a.status,
      })),
    });
    toast.success("Progress saved");
  };

  // Export handlers
  const handleExportExcel = async () => {
    if (!qId) return;
    try {
      const data = await exportExcelQuery.refetch();
      if (!data.data) return;

      // Convert to CSV-like format for download
      const rows = data.data.questions;
      const headers = Object.keys(rows[0] || {});
      const csvContent = [
        headers.join(','),
        ...rows.map((row: any) => headers.map(h => `"${(row[h] || '').toString().replace(/"/g, '""')}"`).join(','))
      ].join('\n');

      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = `${data.data.name.replace(/[^a-z0-9]/gi, '_')}_export.csv`;
      link.click();
      toast.success('Exported to CSV successfully');
    } catch (err) {
      toast.error('Export failed');
    }
  };

  const handleExportJSON = async () => {
    if (!qId) return;
    try {
      const data = await exportJSONQuery.refetch();
      if (!data.data) return;

      const blob = new Blob([JSON.stringify(data.data, null, 2)], { type: 'application/json' });
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = `${data.data.metadata.name.replace(/[^a-z0-9]/gi, '_')}_export.json`;
      link.click();
      toast.success('Exported to JSON successfully');
    } catch (err) {
      toast.error('Export failed');
    }
  };

  const formatStatus = (status: string) =>
    status.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());

  if (qId && isProjectLoading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-screen">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="p-8 max-w-[1600px] mx-auto space-y-8">
        {/* Breadcrumb */}
        <nav className="flex items-center space-x-1 text-sm text-muted-foreground">
          <button
            onClick={() => setLocation(`/clients/${clientId}/questionnaires`)}
            className="hover:text-foreground transition-colors"
          >
            Questionnaires
          </button>
          <ChevronRight className="h-4 w-4" />
          <span className="text-foreground font-medium">
            {projectData?.name || "New Questionnaire"}
          </span>
        </nav>

        <div className="flex justify-between items-center">
          <div className="flex items-center gap-4">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setLocation(`/clients/${clientId}/questionnaires`)}
              className="flex items-center gap-2"
            >
              <ArrowLeft className="h-4 w-4" />
              Back
            </Button>
            <div>
              <h1 className="text-3xl font-bold tracking-tight">
                {projectData ? projectData.name : "AI Questionnaire Workspace"}
              </h1>
              <p className="text-muted-foreground mt-1">
                {projectData
                  ? `Status: ${formatStatus(projectData.status)}`
                  : "Upload a security questionnaire to automatically generate answers."
                }
              </p>
            </div>
          </div>
          <PageGuide
            title="Questionnaire Workspace"
            description="AI-powered workspace for completing security assessments."
            rationale="Significantly reduces time spent on manual questionnaire filling by leveraging your Knowledge Base."
            howToUse={[
              { step: "Upload", description: "Import Excel, CSV, or PDF security questionnaires." },
              { step: "Generate", description: "AI automatically suggests answers based on your policies and past responses." },
              { step: "Review", description: "Verify confidence scores, edit answers, and approve for export." }
            ]}
            integrations={[
              { name: "Knowledge Base", description: "Source of truth for automated answers." },
              { name: "Exports", description: "Download completed files." }
            ]}
          />
        </div>

        {/* Stepper */}
        {!qId && (
          <div className="flex items-center space-x-4 text-sm font-medium text-muted-foreground">
            <div className={`flex items-center ${currentStep === 'upload' ? 'text-primary' : ''}`}>
              <div className="w-6 h-6 rounded-full border flex items-center justify-center mr-2 text-xs">1</div>
              Upload
            </div>
            <div className="h-px bg-border w-8" />
            <div className={`flex items-center ${currentStep === 'preview' ? 'text-primary' : ''}`}>
              <div className="w-6 h-6 rounded-full border flex items-center justify-center mr-2 text-xs">2</div>
              Verify Questions
            </div>
            <div className="h-px bg-border w-8" />
            <div className={`flex items-center ${currentStep === 'generating' || currentStep === 'review' ? 'text-primary' : ''}`}>
              <div className="w-6 h-6 rounded-full border flex items-center justify-center mr-2 text-xs">3</div>
              Review
            </div>
          </div>
        )}

        {/* Step 1: Upload */}
        {currentStep === "upload" && (
          <Card className="max-w-xl mx-auto border-dashed border-2 hover:border-primary/50 hover:bg-slate-50/50 hover:shadow-lg transition-all duration-300 transform hover:-translate-y-1">
            <CardContent className="pt-6 flex flex-col items-center justify-center min-h-[300px] space-y-4">
              {isParseComplete ? (
                <div className="flex flex-col items-center animate-in fade-in zoom-in duration-500">
                  <div className="h-16 w-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center mb-4">
                    <CheckCircle className="h-8 w-8" />
                  </div>
                  <h3 className="text-xl font-bold text-green-700">Import Completed!</h3>
                  <p className="text-muted-foreground mt-2">Preparing workspace...</p>
                </div>
              ) : (
                <>
                  <div className="p-4 bg-muted rounded-full transition-transform duration-300 hover:scale-110">
                    <Upload className="h-8 w-8 text-muted-foreground" />
                  </div>
                  <div className="text-center">
                    <h3 className="font-semibold text-lg">Upload Questionnaire</h3>
                    <p className="text-sm text-muted-foreground mt-1">
                      Support for PDF, Excel (.xlsx), and CSV files.
                    </p>
                  </div>

                  {!parseMutation.isPending && (
                    <Input
                      type="file"
                      accept=".pdf,.xlsx,.csv"
                      onChange={handleFileUpload}
                      className="max-w-xs cursor-pointer"
                    />
                  )}

                  {parseMutation.isPending ? (
                    <div className="w-full max-w-xs space-y-3">
                      <Progress value={uploadProgress} className="h-2 w-full" />
                      <div className="flex justify-between text-xs text-muted-foreground">
                        <span>Extracting questions...</span>
                        <span>{uploadProgress}%</span>
                      </div>
                    </div>
                  ) : (
                    <Button onClick={handleParse} disabled={!file} className="min-w-[150px]">
                      Process Document
                    </Button>
                  )}
                </>
              )}
            </CardContent>
          </Card>
        )}

        {/* Step 2: Preview Questions */}
        {currentStep === "preview" && (
          <Card>
            <CardHeader>
              <CardTitle>Verify Extracted Questions</CardTitle>
              <CardDescription>
                We found {questions.length} questions. Remove any headers or irrelevant text before generating answers.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="border rounded-md divide-y max-h-[500px] overflow-y-auto">
                {questions.map((q, i) => (
                  <div key={i} className="p-3 flex gap-3 group">
                    {q.questionId && (
                      <span className="text-primary text-sm font-mono font-semibold min-w-[80px]">{q.questionId}</span>
                    )}
                    {!q.questionId && (
                      <span className="text-muted-foreground text-sm font-mono w-6">{i + 1}</span>
                    )}
                    <Input
                      value={q.question}
                      onChange={(e) => {
                        const newQ = [...questions];
                        newQ[i] = { ...newQ[i], question: e.target.value };
                        setQuestions(newQ);
                      }}
                      className="flex-1 h-8 text-sm"
                    />
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        const newQ = questions.filter((_, idx) => idx !== i);
                        setQuestions(newQ);
                      }}
                      className="opacity-0 group-hover:opacity-100 text-destructive hover:bg-destructive/10"
                    >
                      Remove
                    </Button>
                  </div>
                ))}
              </div>
              <div className="flex justify-end gap-2">
                {!qId && <Button variant="outline" onClick={() => setCurrentStep("upload")}>Back</Button>}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Step 3: Generating (Loading) */}
        {currentStep === "generating" && (
          <Card className="max-w-xl mx-auto text-center py-12">
            <CardContent className="space-y-6">
              <div className="relative w-20 h-20 mx-auto">
                <RefreshCw className="w-full h-full animate-spin text-primary opacity-20" />
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="w-3 h-3 bg-primary rounded-full animate-pulse" />
                </div>
              </div>
              <div>
                <h3 className="text-xl font-semibold">Generating Answers...</h3>
                <p className="text-muted-foreground">
                  Analyzing {questions.length} questions against your Knowledge Base.
                </p>
              </div>
              <Progress value={(generatedCount / Math.max(questions.length, 1)) * 100} className="w-[60%] mx-auto" />
              <p className="text-xs text-muted-foreground mt-2">
                Processed {generatedCount} of {questions.length} questions
              </p>
            </CardContent>
          </Card>
        )}

        {/* Step 4: Review Answers */}
        {currentStep === "review" && (
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Review Generated Answers</CardTitle>
                <CardDescription>Verify AI-suggested answers and edit as needed before completing.</CardDescription>
              </div>
              <div className="flex gap-2">
                {projectData?.status !== 'completed' && (
                  <Button variant="outline" onClick={() => setIsCompleteOpen(true)} disabled={completeMutation.isPending}>
                    {completeMutation.isPending ? <Loader2 className="animate-spin mr-2 h-4 w-4" /> : <CheckCircle className="mr-2 h-4 w-4" />}
                    Mark as Completed
                  </Button>
                )}
                {/* Show "Send to Vendor" for open/in_progress status */}
                {(projectData?.status === 'open' || projectData?.status === 'in_progress') && (
                  <Button variant="outline" className="border-green-600 text-green-600 hover:bg-green-50" onClick={() => setShowVendorDialog(true)}>
                    <Mail className="mr-2 h-4 w-4" /> Send to Vendor
                  </Button>
                )}
                {/* Show "Submit for Review" for vendor_pending status */}
                {projectData?.status === 'vendor_pending' && (
                  <Button variant="outline" className="border-amber-600 text-amber-600 hover:bg-amber-50" onClick={handleSubmitForReview} disabled={submitForReviewMutation.isPending}>
                    {submitForReviewMutation.isPending ? <Loader2 className="animate-spin mr-2 h-4 w-4" /> : <Check className="mr-2 h-4 w-4" />}
                    Submit for Review
                  </Button>
                )}
                {/* Show vendor info if already sent */}
                {projectData?.status === 'vendor_pending' && projectData?.vendorName && (
                  <div className="flex items-center gap-2 px-3 py-2 bg-amber-50 border border-amber-200 rounded-lg text-sm">
                    <Mail className="h-4 w-4 text-amber-600" />
                    <span className="text-amber-800">Sent to: <strong>{projectData.vendorName}</strong></span>
                    {projectData.vendorLinkExpiresAt && (
                      <span className="text-amber-600 text-xs">
                        (expires {new Date(projectData.vendorLinkExpiresAt).toLocaleDateString()})
                      </span>
                    )}
                  </div>
                )}
                <Button onClick={handleSaveProgress}>
                  <Save className="mr-2 h-4 w-4" /> Save
                </Button>
                <Button variant="outline" onClick={handleExportExcel} disabled={exportExcelQuery.isFetching}>
                  <FileSpreadsheet className="mr-2 h-4 w-4" /> Export CSV
                </Button>
                <Button variant="outline" onClick={handleExportJSON} disabled={exportJSONQuery.isFetching}>
                  <FileDown className="mr-2 h-4 w-4" /> Export JSON
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow className="bg-[#1C4D8D] hover:bg-[#1C4D8D] border-none">
                    <TableHead className="w-[3%] text-white font-semibold py-4">#</TableHead>
                    <TableHead className="w-[10%] text-white font-semibold py-4">Question ID</TableHead>
                    <TableHead className="w-[25%] text-white font-semibold py-4">Question</TableHead>
                    <TableHead className="w-[30%] text-white font-semibold py-4">Answer</TableHead>
                    <TableHead className="w-[8%] text-white font-semibold py-4">Confidence</TableHead>
                    <TableHead className="w-[12%] text-white font-semibold py-4">Sources</TableHead>
                    <TableHead className="w-[12%] text-white font-semibold py-4">Comment</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {answers.map((item, i) => (
                    <TableRow key={i}>
                      <TableCell className="align-top text-xs text-muted-foreground">
                        {i + 1}
                      </TableCell>
                      <TableCell className="align-top font-mono text-xs font-medium">
                        {item.questionId || "-"}
                      </TableCell>
                      <TableCell className="align-top font-medium text-sm">
                        {item.question}
                      </TableCell>
                      <TableCell className="align-top">
                        <Textarea
                          className="text-sm min-h-[80px]"
                          defaultValue={item.answer}
                          onChange={(e) => {
                            const newAnswers = [...answers];
                            newAnswers[i].answer = e.target.value;
                            setAnswers(newAnswers);
                          }}
                        />
                      </TableCell>
                      <TableCell className="align-top">
                        {item.confidence > 0 && (
                          <Badge className={`${item.confidence > 0.7 ? 'bg-green-100 text-green-700 hover:bg-green-100' :
                            item.confidence > 0.4 ? 'bg-amber-100 text-amber-700 hover:bg-amber-100' :
                              'bg-red-100 text-red-700 hover:bg-red-100'
                            }`}>
                            {Math.round(item.confidence * 100)}%
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell className="align-top space-y-1">
                        {item.sources?.map((s: any, idx: number) => (
                          <div key={idx} className="text-xs flex items-center gap-1 group relative cursor-help">
                            <Badge variant="outline" className="max-w-[120px] truncate">
                              {s.title || `Source ${idx + 1}`}
                            </Badge>
                            <div className="hidden group-hover:block absolute left-0 bottom-full mb-2 w-64 p-2 bg-slate-800 text-white rounded shadow-lg z-50 text-xs pointer-events-none">
                              <p className="font-semibold mb-1">{s.title}</p>
                              {s.excerpt && <p className="text-slate-300 line-clamp-3">{s.excerpt}</p>}
                            </div>
                          </div>
                        ))}
                      </TableCell>
                      <TableCell className="align-top">
                        <Input
                          className="text-sm"
                          placeholder="Add a note..."
                          defaultValue={item.comment || ""}
                          onChange={(e) => {
                            const newAnswers = [...answers];
                            newAnswers[i].comment = e.target.value;
                            setAnswers(newAnswers);
                          }}
                        />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        )}

        {/* Template Selection Dialog */}
        <Dialog open={showTemplateDialog} onOpenChange={(open) => {
          setShowTemplateDialog(open);
          if (!open) {
            // Clear URL param when closing
            const url = new URL(window.location.href);
            url.searchParams.delete('mode');
            window.history.replaceState({}, '', url.toString());
            setIsTemplateMode(false);
          }
        }}>
          <DialogContent className="max-w-4xl max-h-[80vh] overflow-hidden flex flex-col">
            <DialogHeader>
              <DialogTitle className="text-xl flex items-center gap-2">
                <LayoutGrid className="h-5 w-5" />
                Select a Questionnaire Template
              </DialogTitle>
              <DialogDescription>
                Choose from pre-built templates for common compliance frameworks
              </DialogDescription>
            </DialogHeader>

            <div className="flex-1 overflow-y-auto py-4">
              {templates?.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  No templates available. Upload a file to create a questionnaire.
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {templates?.map((template) => (
                    <div
                      key={template.id}
                      onClick={() => handleTemplateSelect(template.id)}
                      className={`
                        relative p-4 rounded-lg border-2 cursor-pointer transition-all hover:shadow-md
                        ${selectedTemplateId === template.id
                          ? 'border-[#3ABEF9] bg-[#3ABEF9]/10'
                          : 'border-gray-200 hover:border-gray-300'
                        }
                      `}
                    >
                      {selectedTemplateId === template.id && (
                        <div className="absolute top-2 right-2 h-5 w-5 rounded-full bg-[#3ABEF9] flex items-center justify-center">
                          <Check className="h-3 w-3 text-white" />
                        </div>
                      )}
                      <div className="flex items-start gap-3">
                        <div className="p-2 rounded-lg bg-[#1C4D8D]/10">
                          <FileText className="h-5 w-5 text-[#1C4D8D]" />
                        </div>
                        <div className="flex-1">
                          <h3 className="font-semibold text-gray-900">{template.name}</h3>
                          <p className="text-sm text-gray-500 mt-1">{template.description}</p>
                          <div className="flex items-center gap-3 mt-2">
                            <Badge variant="outline" className="text-xs">
                              {template.framework}
                            </Badge>
                            <span className="text-xs text-gray-400">
                              {template.questionCount} questions
                            </span>
                            <Badge variant="secondary" className="text-xs">
                              {template.category}
                            </Badge>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => {
                setShowTemplateDialog(false);
                const url = new URL(window.location.href);
                url.searchParams.delete('mode');
                window.history.replaceState({}, '', url.toString());
              }}>
                Cancel
              </Button>
              <Button
                onClick={handleUseTemplate}
                disabled={!selectedTemplateId}
                className="bg-[#1C4D8D] hover:bg-[#1C4D8D]/90"
              >
                Use Template
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Save New Questionnaire</DialogTitle>
              <DialogDescription>
                Give this questionnaire a name to save your progress.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label>Questionnaire Name</Label>
                <Input value={projectName} onChange={e => setProjectName(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>Sent By (Vendor / Account)</Label>
                <Input value={senderName} onChange={e => setSenderName(e.target.value)} placeholder="e.g. Acme Corp" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Framework / Standard</Label>
                  <Input placeholder="e.g. ISO 27001, SOC 2" />
                </div>
                <div className="space-y-2">
                  <Label>Due Date</Label>
                  <Input type="date" />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Risk Tier</Label>
                <select className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
                  <option value="">Select risk tier...</option>
                  <option value="critical">Critical</option>
                  <option value="high">High</option>
                  <option value="medium">Medium</option>
                  <option value="low">Low</option>
                </select>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsCreateOpen(false)}>Cancel</Button>
              <Button onClick={handleCreateProject} disabled={createProjectMutation.isPending}>
                {createProjectMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Create Questionnaire
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Mark as Completed — Proper AlertDialog */}
        <AlertDialog open={isCompleteOpen} onOpenChange={setIsCompleteOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Mark as Completed?</AlertDialogTitle>
              <AlertDialogDescription>
                This will mark <strong>{projectData?.name}</strong> as completed and lock all answers.
                Any unanswered questions will remain as-is. This action cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction
                className="bg-emerald-600 hover:bg-emerald-700"
                onClick={() => {
                  completeMutation.mutate({ id: qId! });
                  setIsCompleteOpen(false);
                }}
              >
                <CheckCircle className="mr-2 h-4 w-4" />
                Confirm Completion
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        {/* Send to Vendor Dialog */}
        <Dialog open={showVendorDialog} onOpenChange={setShowVendorDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Send Questionnaire to Vendor</DialogTitle>
              <DialogDescription>
                Send this questionnaire to a vendor for them to complete directly.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label>Select Vendor</Label>
                {vendorList && vendorList.length > 0 ? (
                  <select
                    value={vendorName}
                    onChange={e => {
                      const selectedVendor = vendorList.find(v => v.name === e.target.value);
                      setVendorName(e.target.value);
                      if (selectedVendor?.primaryContactEmail) {
                        setVendorEmail(selectedVendor.primaryContactEmail);
                      }
                    }}
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                  >
                    <option value="">Select a vendor...</option>
                    {vendorList.map((vendor: any) => (
                      <option key={vendor.id} value={vendor.name}>
                        {vendor.name}
                      </option>
                    ))}
                  </select>
                ) : (
                  <Input
                    value={vendorName}
                    onChange={e => setVendorName(e.target.value)}
                    placeholder="e.g. Acme Corporation (no vendors found)"
                  />
                )}
              </div>
              <div className="space-y-2">
                <Label>Vendor Email</Label>
                <Input
                  type="email"
                  value={vendorEmail}
                  onChange={e => setVendorEmail(e.target.value)}
                  placeholder="vendor@example.com"
                />
              </div>
              <div className="space-y-2">
                <Label>Message (Optional)</Label>
                <Textarea
                  value={vendorMessage}
                  onChange={e => setVendorMessage(e.target.value)}
                  placeholder="Add a message for the vendor..."
                  rows={3}
                />
              </div>
              {projectData?.vendorLinkExpiresAt && (
                <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg text-sm">
                  <p className="font-medium text-amber-800">Link already sent</p>
                  <p className="text-amber-600">
                    Expires: {new Date(projectData.vendorLinkExpiresAt).toLocaleDateString()}
                  </p>
                </div>
              )}
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowVendorDialog(false)}>Cancel</Button>
              <Button
                onClick={handleSendToVendor}
                disabled={sendVendorInviteMutation.isPending || !vendorName || !vendorEmail}
                className="bg-green-600 hover:bg-green-700"
              >
                {sendVendorInviteMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                <Mail className="mr-2 h-4 w-4" />
                Send to Vendor
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

      </div>
    </DashboardLayout>
  );
}
