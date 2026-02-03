import React, { useState, useEffect } from "react";
import { useParams, useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import DashboardLayout from "@/components/DashboardLayout";
import { Button } from "@complianceos/ui/ui/button";
import { Input } from "@complianceos/ui/ui/input";
import { Textarea } from "@complianceos/ui/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@complianceos/ui/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@complianceos/ui/ui/table";
import { Badge } from "@complianceos/ui/ui/badge";
import { Loader2, Upload, FileText, CheckCircle, AlertCircle, RefreshCw, Save, ChevronRight, ArrowLeft, Sparkles } from "lucide-react";
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
import { Label } from "@complianceos/ui/ui/label";

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

  // Create Project State
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [projectName, setProjectName] = useState("");
  const [senderName, setSenderName] = useState("");
  const [uploadProgress, setUploadProgress] = useState(0);
  const [generatedCount, setGeneratedCount] = useState(0);
  const [isParseComplete, setIsParseComplete] = useState(false);

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
      toast.success("Project created successfully");
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
      toast.success("Project updated");
      refetchProject();
    }
  });

  const completeMutation = trpc.questionnaire.complete.useMutation({
    onSuccess: (data) => {
      toast.success(`Project completed! Indexed ${data.indexedCount} answer pairs.`);
      refetchProject();
    },
    onError: (err) => {
      toast.error(`Failed to complete project: ${err.message}`);
    }
  });

  const generateMutation = trpc.questionnaire.generateAnswers.useMutation({
    // We handle success manually in the loop
    onError: (err) => {
      // Toast only on critical failure, otherwise we continue
      console.error(err);
    }
  });

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
    setCurrentStep("generating");
    setGeneratedCount(0);

    // Initialize answers with placeholders based on questions
    const initialAnswers = questions.map((q: any) => ({
      questionId: q.questionId,
      question: q.question,
      answer: "",
      confidence: 0,
      sources: [],
      status: 'pending'
    }));
    setAnswers(initialAnswers);

    const BATCH_SIZE = 3;
    const total = questions.length;

    // Process in batches
    for (let i = 0; i < total; i += BATCH_SIZE) {
      const batch = questions.slice(i, i + BATCH_SIZE);
      try {
        const batchResults = await generateMutation.mutateAsync({
          clientId,
          questions: batch
        });

        // Update answers state with new results
        setAnswers(prev => {
          const next = [...prev];
          batchResults.forEach((res: any, idx: number) => {
            const targetIndex = i + idx;
            if (next[targetIndex]) {
              next[targetIndex] = {
                ...next[targetIndex],
                answer: res.answer,
                confidence: res.confidence,
                sources: res.sources
              };
            }
          });
          return next;
        });

        setGeneratedCount(prev => Math.min(prev + batch.length, total));

      } catch (e) {
        console.error("Batch failed", e);
        toast.error(`Batch ${i / BATCH_SIZE + 1} failed, continuing...`);
      }
    }

    setCurrentStep("review");
    toast.success("Generation complete!");

    // Final Auto-save
    if (qId) {
      await saveQuestionsMutation.mutateAsync({
        questionnaireId: qId,
        questions: answers.map((a: any) => ({
          question: a.question,
          answer: a.answer,
          confidence: a.confidence,
          sources: a.sources,
          status: 'pending'
        }))
      });
    }
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
        status: a.status
      }))
    });
    toast.success("Progress saved");
  };

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
            AI Questionnaires
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
                {projectData ? `Status: ${projectData.status}` : "Upload a security questionnaire to automatically generate answers."}
              </p>
            </div>
          </div>
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
                <Button onClick={handleGenerate} disabled={questions.length === 0 || generateMutation.isPending}>
                  {generateMutation.isPending ? <Loader2 className="animate-spin mr-2 h-4 w-4" /> : null}
                  Generate Answers with AI
                </Button>
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
                <CardDescription>Review usage of AI sources and edit as needed.</CardDescription>
              </div>
              <div className="flex gap-2">
                <Button
                  onClick={handleGenerate}
                  disabled={generateMutation.isPending}
                  className="bg-purple-600 hover:bg-purple-700 text-white"
                >
                  {generateMutation.isPending ? <Loader2 className="animate-spin mr-2 h-4 w-4" /> : <Sparkles className="mr-2 h-4 w-4" />}
                  Generate with AI
                </Button>
                {projectData?.status !== 'completed' && (
                  <Button variant="outline" onClick={() => {
                    if (window.confirm("This will mark the project as completed and index all approved answers into the Knowledge Base. Continue?")) {
                      completeMutation.mutate({ id: qId! });
                    }
                  }} disabled={completeMutation.isPending}>
                    {completeMutation.isPending ? <Loader2 className="animate-spin mr-2 h-4 w-4" /> : <CheckCircle className="mr-2 h-4 w-4" />}
                    Mark as Completed
                  </Button>
                )}
                <Button variant="outline" onClick={() => toast.info("Export CSV coming soon")}>
                  Export CSV
                </Button>
                <Button onClick={handleSaveProgress}>
                  <Save className="mr-2 h-4 w-4" /> Save Project
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[3%]">#</TableHead>
                    <TableHead className="w-[10%]">Question ID</TableHead>
                    <TableHead className="w-[20%]">Question</TableHead>
                    <TableHead className="w-[20%]">Answer</TableHead>
                    <TableHead className="w-[8%]">Confidence</TableHead>
                    <TableHead className="w-[10%]">Sources</TableHead>
                    <TableHead className="w-[15%]">Comment</TableHead>
                    <TableHead className="w-[8%]">Tags</TableHead>
                    <TableHead className="w-[8%]">Access</TableHead>
                    <TableHead className="w-[8%]">Assignee</TableHead>
                    <TableHead className="w-[8%]">Last Modified</TableHead>
                    <TableHead className="w-[3%]"></TableHead>
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
                            </div>
                          </div>
                        ))}
                      </TableCell>
                      <TableCell className="align-top">
                        <Input
                          className="text-sm"
                          placeholder="-"
                          defaultValue={item.comment || ""}
                          onChange={(e) => {
                            const newAnswers = [...answers];
                            newAnswers[i].comment = e.target.value;
                            setAnswers(newAnswers);
                          }}
                        />
                      </TableCell>
                      <TableCell className="align-top">
                        <Badge variant="outline" className="text-xs">
                          {item.tags?.join(", ") || "-"}
                        </Badge>
                      </TableCell>
                      <TableCell className="align-top">
                        <Badge variant="secondary" className="text-xs">
                          {item.access || "Internal"}
                        </Badge>
                      </TableCell>
                      <TableCell className="align-top text-sm text-muted-foreground">
                        {item.assignee || "-"}
                      </TableCell>
                      <TableCell className="align-top text-xs text-muted-foreground">
                        {item.updatedAt ? new Date(item.updatedAt).toLocaleDateString() : "-"}
                      </TableCell>
                      <TableCell className="align-top">
                        <Button variant="ghost" size="sm">
                          ⋮
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        )}

        <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Save New Questionnaire</DialogTitle>
              <DialogDescription>
                Create a new project to save your progress.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label>Questionnaire Name</Label>
                <Input value={projectName} onChange={e => setProjectName(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>Sent By (Vendor/Account)</Label>
                <Input value={senderName} onChange={e => setSenderName(e.target.value)} placeholder="e.g. Acme Corp" />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsCreateOpen(false)}>Cancel</Button>
              <Button onClick={handleCreateProject} disabled={createProjectMutation.isPending}>
                {createProjectMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Create Project
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

      </div>
    </DashboardLayout>
  );
}
