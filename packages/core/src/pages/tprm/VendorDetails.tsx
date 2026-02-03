import React, { useState } from "react";
import { Breadcrumb } from "@/components/Breadcrumb";
import { useParams, useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@complianceos/ui/ui/card";
import { Button } from "@complianceos/ui/ui/button";
import { Badge } from "@complianceos/ui/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@complianceos/ui/ui/tabs";
import { Loader2, Calendar as CalendarIcon, FileText, ExternalLink, ShieldAlert, CheckCircle, AlertTriangle, User, Phone, Mail, Plus, Trash2, Edit2, Info, Zap, AlertOctagon, History, Send, ScrollText, ChevronDown, Shield, Brain } from "lucide-react";
import { EnhancedDialog } from "@complianceos/ui/ui/enhanced-dialog";
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
import { Input } from "@complianceos/ui/ui/input";
import { Label } from "@complianceos/ui/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@complianceos/ui/ui/select";
import { Textarea } from "@complianceos/ui/ui/textarea";
import { toast } from "sonner";
import { format } from "date-fns";
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';
import { VendorTrustCenter } from "@/components/tprm/VendorTrustCenter";
import { RequestItemsDialog } from "@/components/tprm/RequestItemsDialog";
import VendorMitigationPlanViewer from "@complianceos/premium/components/advisor/VendorMitigationPlanViewer";
import GenericFileUploader from "@/components/GenericFileUploader";

export default function VendorDetails() {
    const { id, vendorId } = useParams<{ id: string, vendorId: string }>();
    const [, setLocation] = useLocation();
    const clientId = parseInt(id || "0");
    const vId = parseInt(vendorId || "0");

    const utils = trpc.useContext();

    // Optimized consolidated vendor data endpoint
    const { data: vendorData, isLoading } = trpc.vendorAssessments.getVendorDetails.useQuery(
        { vendorId: vId, clientId },
        { enabled: !!vId && !!clientId }
    );

    // Extract data from consolidated response
    const vendor = vendorData?.vendor;
    const assessments = vendorData?.assessments || [];
    const scanResult = vendorData?.scanResult;
    const cveSuggestions = scanResult?.vulnerabilities || [];

    const runScanMutation = trpc.vendors.runRiskScan.useMutation({
        onSuccess: () => {
            toast.success("Risk scan completed");
            utils.vendorAssessments.getVendorDetails.invalidate({ vendorId: vId, clientId });
        },
        onError: (err) => toast.error("Scan failed: " + err.message)
    });

    // Calculate Risk Score (Use Backend or Fallback)
    const riskScore = React.useMemo(() => {
        if (scanResult?.scan?.riskScore) return scanResult.scan.riskScore;

        if (!cveSuggestions || cveSuggestions.length === 0) return 0;
        let score = 0;
        // Simple heuristic: 10 pts for each Critical/High CVE, max 100
        const criticalCount = cveSuggestions.filter((c: any) => parseFloat(c.cvssScore || "0") >= 9).length;
        const highCount = cveSuggestions.filter((c: any) => parseFloat(c.cvssScore || "0") >= 7 && parseFloat(c.cvssScore || "0") < 9).length;
        score = (criticalCount * 20) + (highCount * 10);
        return Math.min(score, 100);
    }, [cveSuggestions, scanResult]);

    const breaches = scanResult?.breaches || [];

    // State for expanded scan in history
    const [expandedScanId, setExpandedScanId] = useState<number | null>(null);

    // Get CVEs for a specific scan
    // Lazy load scan history details
    const { data: expandedScanVulnerabilities, isLoading: isLoadingHistory } = trpc.vendors.getScanVulnerabilities.useQuery(
        { scanId: expandedScanId! },
        { enabled: !!expandedScanId }
    );

    // Mitigation Dialog State
    const [selectedCveForMitigation, setSelectedCveForMitigation] = useState<any>(null);
    const [mitigationForm, setMitigationForm] = useState({
        priority: 'high',
        assignee: '',
        dueDate: '',
        notes: ''
    });

    const createRemediationMutation = trpc.vendors.createRemediationTask.useMutation({
        onSuccess: () => {
            toast.success("Remediation task created", {
                description: `Task for ${selectedCveForMitigation?.cveId} added to the Task Management page.`
            });
            setSelectedCveForMitigation(null);
            setMitigationForm({ priority: 'high', assignee: '', dueDate: '', notes: '' });
        },
        onError: (err) => toast.error("Failed to create task: " + err.message)
    });

    // Assessment Dialog State
    const [isAssessmentOpen, setIsAssessmentOpen] = useState(false);
    const [assessmentForm, setAssessmentForm] = useState({
        type: "",
        dueDate: "",
        status: "Planned"
    });

    const createAssessmentMutation = trpc.vendorAssessments.create.useMutation({
        onSuccess: () => {
            toast.success("Assessment scheduled");
            setIsAssessmentOpen(false);
            setAssessmentForm({ type: "", dueDate: "", status: "Planned" });
            refetchAssessments();
        },
        onError: (err) => toast.error("Failed to schedule: " + err.message)
    });

    /* ... (Update Assessment Mutation and other state logic remains the same) ... */




    // --- Automated Assessment Logic ---
    const [isSendOpen, setIsSendOpen] = useState(false);
    const [sendForm, setSendForm] = useState({
        templateId: "",
        recipientEmail: "",
        dueDate: ""
    });

    const { data: templates } = trpc.vendorAssessments.listTemplates.useQuery({ clientId }, { enabled: !!clientId });

    const sendConsolidatedMutation = trpc.vendorAssessments.sendConsolidatedRequest.useMutation({
        onSuccess: () => {
            toast.success("Requests sent to vendor");
            setIsSendOpen(false);
            refetchAssessments();
        },
        onError: (err) => toast.error("Failed to send: " + err.message)
    });

    const handleSendConsolidated = (data: any) => {
        sendConsolidatedMutation.mutate({
            clientId,
            vendorId: vId,
            ...data
        });
    };

    const updateAssessmentMutation = trpc.vendorAssessments.update.useMutation({
        onSuccess: () => {
            toast.success("Assessment updated");
            setIsConductOpen(false);
            setConductForm({ id: 0, status: "", score: 0, findings: "", documentUrl: "", inherentImpact: "", inherentLikelihood: "", inherentRiskLevel: "", residualImpact: "", residualLikelihood: "", residualRiskLevel: "" });
            refetchAssessments();
        },
        onError: (err) => toast.error("Failed to update assessment: " + err.message)
    });

    // Conduct Assessment State
    const [isConductOpen, setIsConductOpen] = useState(false);
    const [conductForm, setConductForm] = useState({
        id: 0,
        status: "",
        score: 0,
        findings: "",
        documentUrl: "",
        inherentImpact: "",
        inherentLikelihood: "",
        inherentRiskLevel: "",
        residualImpact: "",
        residualLikelihood: "",
        residualRiskLevel: ""
    });

    const handleConductAssessment = () => {
        if (!conductForm.id) return;
        updateAssessmentMutation.mutate({
            id: conductForm.id,
            status: conductForm.status,
            score: conductForm.score,
            findings: conductForm.findings,
            documentUrl: conductForm.documentUrl,
            inherentImpact: conductForm.inherentImpact,
            inherentLikelihood: conductForm.inherentLikelihood,
            inherentRiskLevel: conductForm.inherentRiskLevel,
            residualImpact: conductForm.residualImpact,
            residualLikelihood: conductForm.residualLikelihood,
            residualRiskLevel: conductForm.residualRiskLevel
        });
    };

    const openConductDialog = (assessment: any) => {
        setConductForm({
            id: assessment.id,
            status: assessment.status || "In Progress",
            score: assessment.score || 0,
            findings: assessment.findings || "",
            documentUrl: assessment.documentUrl || "",
            inherentImpact: assessment.inherentImpact || "",
            inherentLikelihood: assessment.inherentLikelihood || "",
            inherentRiskLevel: assessment.inherentRiskLevel || "",
            residualImpact: assessment.residualImpact || "",
            residualLikelihood: assessment.residualLikelihood || "",
            residualRiskLevel: assessment.residualRiskLevel || ""
        });
        setIsConductOpen(true);
    };

    // Contacts Data
    const { data: contacts, refetch: refetchContacts } = trpc.vendorContacts.list.useQuery({ vendorId: vId }, { enabled: !!vId });

    // Contact Dialog State
    const [isContactOpen, setIsContactOpen] = useState(false);
    const [editingContact, setEditingContact] = useState<any>(null);
    const [contactForm, setContactForm] = useState({
        name: "",
        email: "",
        phone: "",
        role: "",
        isPrimary: false
    });

    const createContactMutation = trpc.vendorContacts.create.useMutation({
        onSuccess: () => {
            toast.success("Contact added");
            setIsContactOpen(false);
            setContactForm({ name: "", email: "", phone: "", role: "", isPrimary: false });
            refetchContacts();
        },
        onError: (err) => toast.error("Failed to add contact: " + err.message)
    });

    const updateContactMutation = trpc.vendorContacts.update.useMutation({
        onSuccess: () => {
            toast.success("Contact updated");
            setIsContactOpen(false);
            setEditingContact(null);
            refetchContacts();
        },
        onError: (err) => toast.error("Failed to update contact: " + err.message)
    });

    const deleteContactMutation = trpc.vendorContacts.delete.useMutation({
        onSuccess: () => {
            toast.success("Contact deleted");
            refetchContacts();
        }
    });

    // Contracts Data
    const { data: contracts, refetch: refetchContracts } = trpc.vendorContracts.list.useQuery({ vendorId: vId }, { enabled: !!vId });

    // Contract Dialog State
    const [isContractOpen, setIsContractOpen] = useState(false);
    const [editingContract, setEditingContract] = useState<any>(null);
    const [contractForm, setContractForm] = useState({
        title: "",
        description: "",
        startDate: "",
        endDate: "",
        autoRenew: false,
        value: "",
        status: "Active",
        documentUrl: "",
        noticePeriod: "",
        paymentTerms: "",
        slaDetails: "",
        dpaStatus: "Not Signed",
        owner: ""
    });

    const createContractMutation = trpc.vendorContracts.create.useMutation({
        onSuccess: () => {
            toast.success("Contract added");
            setIsContractOpen(false);
            setContractForm({
                title: "", description: "", startDate: "", endDate: "", autoRenew: false, value: "", status: "Active", documentUrl: "",
                noticePeriod: "", paymentTerms: "", slaDetails: "", dpaStatus: "Not Signed", owner: ""
            });
            refetchContracts();
        },
        onError: (err) => toast.error("Failed to add contract: " + err.message)
    });

    const updateContractMutation = trpc.vendorContracts.update.useMutation({
        onSuccess: () => {
            toast.success("Contract updated");
            setIsContractOpen(false);
            setEditingContract(null);
            refetchContracts();
        },
        onError: (err) => toast.error("Failed to update contract: " + err.message)
    });

    const deleteContractMutation = trpc.vendorContracts.delete.useMutation({
        onSuccess: () => {
            toast.success("Contract deleted");
            refetchContracts();
            setIsContractOpen(false);
        }
    });

    // DPA Agreements Data
    const { data: dpas, refetch: refetchDpas } = trpc.vendorDpas.list.useQuery({ vendorId: vId, clientId }, { enabled: !!vId && !!clientId });
    const { data: dpaTemplates, error: templatesError } = trpc.dpaTemplates.list.useQuery(undefined, {
        onSuccess: (data) => console.log("Fetched DPA templates:", data),
        onError: (err) => console.error("Error fetching DPA templates:", err)
    });

    if (templatesError) {
        console.error("Templates query error:", templatesError);
    }

    const [isDpaOpen, setIsDpaOpen] = useState(false);


    const [dpaForm, setDpaForm] = useState({
        templateId: "",
        name: ""
    });

    const createDpaMutation = trpc.vendorDpas.createFromTemplate.useMutation({
        onSuccess: (data) => {
            console.log("DPA created successfully:", data);
            toast.success("DPA generated from template");
            setIsDpaOpen(false);
            setDpaForm({ templateId: "", name: "" });
            refetchDpas();
        },
        onError: (err) => {
            console.error("DPA creation error:", err);
            toast.error("Failed to generate DPA: " + err.message);
        }
    });

    const deleteDpaMutation = trpc.vendorDpas.delete.useMutation({
        onSuccess: () => {
            toast.success("DPA deleted");
            refetchDpas();
        },
        onError: (err) => toast.error("Failed to delete DPA: " + err.message)
    });



    const handleSaveContract = () => {
        if (!contractForm.title) return toast.error("Title is required");

        if (editingContract) {
            updateContractMutation.mutate({
                id: editingContract.id,
                ...contractForm
            });
        } else {
            createContractMutation.mutate({
                clientId,
                vendorId: vId,
                ...contractForm
            });
        }
    };

    const openContractDialog = (contract?: any) => {
        if (contract) {
            setEditingContract(contract);
            setContractForm({
                title: contract.title,
                description: contract.description || "",
                startDate: contract.startDate ? format(new Date(contract.startDate), 'yyyy-MM-dd') : "",
                endDate: contract.endDate ? format(new Date(contract.endDate), 'yyyy-MM-dd') : "",
                autoRenew: contract.autoRenew || false,
                value: contract.value || "",
                status: contract.status || "Active",
                documentUrl: contract.documentUrl || ""
            });
        } else {
            setEditingContract(null);
            setContractForm({ title: "", description: "", startDate: "", endDate: "", autoRenew: false, value: "", status: "Active", documentUrl: "" });
        }
        setIsContractOpen(true);
    };

    const handleSaveContact = () => {
        if (!contactForm.name) return toast.error("Name is required");

        if (editingContact) {
            updateContactMutation.mutate({
                id: editingContact.id,
                ...contactForm
            });
        } else {
            createContactMutation.mutate({
                clientId,
                vendorId: vId,
                ...contactForm
            });
        }
    };

    const openContactDialog = (contact?: any) => {
        if (contact) {
            setEditingContact(contact);
            setContactForm({
                name: contact.name,
                email: contact.email || "",
                phone: contact.phone || "",
                role: contact.role || "",
                isPrimary: contact.isPrimary || false
            });
        } else {
            setEditingContact(null);
            setContactForm({ name: "", email: "", phone: "", role: "", isPrimary: false });
        }
        setIsContactOpen(true);
    };


    const handleCreateAssessment = () => {
        if (!assessmentForm.type) return toast.error("Type is required");
        createAssessmentMutation.mutate({
            clientId,
            vendorId: vId,
            ...assessmentForm
        });
    };

    // Edit Vendor State
    const [isEditOpen, setIsEditOpen] = useState(false);
    const [editForm, setEditForm] = useState({
        name: "",
        description: "",
        website: "",
        criticality: "Low",
        dataAccess: "Internal",
        status: "Active",
        category: "SaaS",
        source: "Manual",
        reviewStatus: "needs_review",
        serviceDescription: "",
        additionalNotes: "",
        isSubprocessor: false,
        trustCenterUrl: "",
        usesAi: false,
        isAiService: false,
        aiDataUsage: ""
    });

    const updateVendorMutation = trpc.vendors.update.useMutation({
        onSuccess: () => {
            toast.success("Vendor updated");
            setIsEditOpen(false);
            utils.vendors.get.invalidate({ id: vId });
        },
        onError: (err) => toast.error("Failed to update: " + err.message)
    });

    const handleUpdateVendor = () => {
        if (!editForm.name) return toast.error("Name is required");
        updateVendorMutation.mutate({
            id: vId,
            ...editForm
        });
    };

    // Email Dialog State
    const [isEmailOpen, setIsEmailOpen] = useState(false);
    const [emailForm, setEmailForm] = useState({
        to: "",
        subject: "Request for Compliance Documents",
        body: "Hello,\n\nWe are updating our vendor compliance records. Please provide the following documents:\n\n- SOC 2 Report\n- ISO 27001 Certificate\n- Latest Penetration Test Summary\n\nThank you,\nSecurity Team"
    });

    const sendEmailMutation = trpc.communication.sendVendorEmail.useMutation({
        onSuccess: () => {
            toast.success("Email sent successfully");
            setIsEmailOpen(false);
            setEmailForm({
                to: "",
                subject: "Request for Compliance Documents",
                body: "Hello,\n\nWe are updating our vendor compliance records. Please provide the following documents:\n\n- SOC 2 Report\n- ISO 27001 Certificate\n- Latest Penetration Test Summary\n\nThank you,\nSecurity Team"
            });
        },
        onError: (err) => toast.error("Failed to send email: " + err.message)
    });

    const handleSendEmail = () => {
        if (!emailForm.to) return toast.error("Recipient email is required");
        sendEmailMutation.mutate({
            clientId,
            vendorId: vId,
            to: emailForm.to,
            subject: emailForm.subject,
            body: emailForm.body.replace(/\n/g, '<br/>') // Simple conversion for HTML
        });
    };

    // Add Document State & Handler
    const [isAddDocumentOpen, setIsAddDocumentOpen] = useState(false);
    const [documentForm, setDocumentForm] = useState({ name: "", url: "" });

    const [deleteConfirmation, setDeleteConfirmation] = useState<{
        type: 'dpa' | 'contact' | 'contract';
        id: number;
        name?: string;
    } | null>(null);

    const handleAddDocument = () => {
        if (!documentForm.name || !documentForm.url) return toast.error("Name and URL are required");

        const currentDocs = (vendor?.additionalDocuments as any[]) || [];
        const newDocs = [...currentDocs, {
            name: documentForm.name,
            url: documentForm.url,
            date: new Date().toISOString()
        }];

        updateVendorMutation.mutate({
            id: vId,
            additionalDocuments: newDocs
        });
        setIsAddDocumentOpen(false);
        setDocumentForm({ name: "", url: "" });
    };

    const openEditDialog = () => {
        if (vendor) {
            setEditForm({
                name: vendor.name,
                description: vendor.description || "",
                website: vendor.website || "",
                criticality: vendor.criticality || "Low",
                dataAccess: vendor.dataAccess || "Internal",
                status: vendor.status || "Active",
                category: vendor.category || "SaaS",
                source: vendor.source || "Manual",
                reviewStatus: vendor.reviewStatus || "needs_review",
                serviceDescription: vendor.serviceDescription || "",
                additionalNotes: vendor.additionalNotes || "",
                isSubprocessor: vendor.isSubprocessor || false,
                trustCenterUrl: vendor.trustCenterUrl || "",
                usesAi: vendor.usesAi || false,
                isAiService: vendor.isAiService || false,
                aiDataUsage: vendor.aiDataUsage || ""
            });
            setIsEditOpen(true);
        }
    };

    if (isLoading) {
        return (
            <div className="flex h-[50vh] w-full items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        );
    }

    if (!vendor) {
        return (
            <div className="flex h-[50vh] w-full flex-col items-center justify-center gap-4">
                <h2 className="text-xl font-semibold">Vendor not found</h2>
                <Button onClick={() => setLocation(`/clients/${clientId}/vendors/all`)}>
                    Return to Vendor List
                </Button>
            </div>
        );
    }

    return (
        <div className="p-6 space-y-6">
            <div className="flex justify-between items-center">
                <Breadcrumb
                    items={[
                        { label: "Vendors", href: `/clients/${clientId}/vendors/overview` },
                        { label: vendor.name },
                    ]}
                />
                <div className="flex gap-2">
                    <Button variant="outline" size="sm" asChild>
                        <a href={`/clients/${clientId}/vendors/all`}>Back</a>
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => setIsEmailOpen(true)}>
                        <Mail className="mr-2 h-4 w-4" /> Email Vendor
                    </Button>
                    <Button variant="outline" size="sm" onClick={openEditDialog}>
                        <Edit2 className="mr-2 h-4 w-4" /> Edit Vendor
                    </Button>
                </div>
            </div>

            {/* Vendor Header */}
            <div className="flex flex-col md:flex-row gap-6 items-start">
                <div className="h-24 w-24 rounded-lg bg-white border shadow-sm flex items-center justify-center text-3xl font-bold text-slate-500 uppercase shrink-0">
                    {vendor.name.substring(0, 2)}
                </div>
                <div className="flex-1 space-y-2">
                    <div className="flex items-center gap-3">
                        <h1 className="text-3xl font-bold tracking-tight">{vendor.name}</h1>
                        <Badge className={
                            vendor.status === 'Active' ? 'bg-emerald-100 text-emerald-800' :
                                vendor.status === 'Onboarding' ? 'bg-blue-100 text-blue-800' : 'bg-slate-100 text-slate-800'
                        }>
                            {vendor.status}
                        </Badge>
                        {vendor.isSubprocessor && (
                            <Badge className="bg-purple-100 text-purple-800 border-purple-200">
                                Approved Subprocessor
                            </Badge>
                        )}
                        {vendor.category && (
                            <Badge variant="outline" className="text-slate-600">
                                {vendor.category}
                            </Badge>
                        )}
                        {vendor.reviewStatus === 'needs_review' && (
                            <Badge variant="destructive" className="animate-pulse">
                                Review Needed
                            </Badge>
                        )}
                    </div>
                    <p className="text-muted-foreground">{vendor.description}</p>
                    <div className="flex gap-4 text-sm text-slate-500">
                        {vendor.website && (
                            <a href={vendor.website} target="_blank" rel="noreferrer" className="flex items-center text-blue-600 hover:underline">
                                {vendor.website} <ExternalLink className="ml-1 h-3 w-3" />
                            </a>
                        )}
                        {vendor.source && (
                            <span className="flex items-center gap-1">
                                <Info className="w-3 h-3" /> Source: {vendor.source}
                            </span>
                        )}
                    </div>
                </div>

                {/* Key Risk Indicators Card */}
                {/* ... existing card ... */}

                {/* Key Risk Indicators Card */}
                <Card className="min-w-[250px] bg-slate-50 border-slate-200">
                    <CardHeader className="py-3">
                        <CardTitle className="text-sm font-medium uppercase tracking-wider text-muted-foreground">Inherent Risk</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2">
                        <div className="flex justify-between items-center">
                            <span className="text-sm">Criticality</span>
                            <Badge variant="outline" className={vendor.criticality === 'High' ? 'text-rose-600 border-rose-200 bg-rose-50' : 'text-emerald-600 border-emerald-200 bg-emerald-50'}>
                                {vendor.criticality}
                            </Badge>
                        </div>
                        <div className="flex justify-between items-center">
                            <span className="text-sm">Data Access</span>
                            <Badge variant="outline" className={vendor.dataAccess === 'Restricted' ? 'text-rose-600 border-rose-200 bg-rose-50' : 'text-slate-600 border-slate-200 bg-slate-50'}>
                                {vendor.dataAccess}
                            </Badge>
                        </div>
                    </CardContent>
                </Card>
            </div>



            <div className="bg-indigo-600 text-white p-2 rounded text-xs font-bold text-center mb-4">
                DPA SYSTEM ACTIVE
            </div>
            <Tabs defaultValue="overview" className="w-full">
                <TabsList className="flex flex-wrap h-auto bg-slate-100 p-1 mb-2">
                    <TabsTrigger value="legal" className="data-[state=active]:bg-indigo-600 data-[state=active]:text-white">
                        Legal & DPAs
                        <Badge variant="secondary" className="ml-2 bg-indigo-100 text-indigo-700 border-indigo-200 scale-75 origin-left font-bold">NEW</Badge>
                    </TabsTrigger>
                    <TabsTrigger value="overview">Overview</TabsTrigger>
                    <TabsTrigger value="documents">Documents</TabsTrigger>
                    <TabsTrigger value="assessments">Assessments</TabsTrigger>
                    <TabsTrigger value="trust-center">Trust Center</TabsTrigger>
                    <TabsTrigger value="risk-scan">Risk Scan</TabsTrigger>
                    <TabsTrigger value="contacts">Contacts</TabsTrigger>
                    <TabsTrigger value="contracts">Contracts</TabsTrigger>
                    {vendor.usesAi && (
                        <TabsTrigger value="ai-governance" className="bg-primary/5 text-primary data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
                            <Brain className="h-4 w-4 mr-2" /> AI Governance
                        </TabsTrigger>
                    )}
                </TabsList>

                <TabsContent value="legal" className="pt-4 space-y-4">
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between">
                            <div>
                                <CardTitle>Data Processing Agreements (DPAs)</CardTitle>
                                <CardDescription>Manage and generate DPAs for this vendor.</CardDescription>
                            </div>
                            <Button className="bg-blue-600 hover:bg-blue-700" onClick={() => setIsDpaOpen(true)}>
                                <Plus className="h-4 w-4 mr-2" />
                                Generate DPA
                            </Button>
                        </CardHeader>
                        <CardContent>
                            {!dpas || dpas.length === 0 ? (
                                <div className="text-center py-12 border border-dashed rounded-lg bg-slate-50">
                                    <FileText className="h-12 w-12 text-slate-300 mx-auto mb-4" />
                                    <h3 className="text-lg font-medium text-slate-900">No DPAs Found</h3>
                                    <p className="text-slate-500 max-w-sm mx-auto mt-2">
                                        No Data Processing Agreements have been generated or uploaded for this vendor.
                                    </p>
                                    <Button variant="outline" className="mt-4" onClick={() => setIsDpaOpen(true)}>
                                        Select Template
                                    </Button>
                                </div>
                            ) : (
                                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                                    {dpas.map(dpa => (
                                        <Card key={dpa.id} className="overflow-hidden border-l-4 border-l-blue-500">
                                            <CardContent className="p-4">
                                                <div className="flex justify-between items-start mb-2">
                                                    <Badge variant="secondary" className={
                                                        dpa.status === 'Signed' ? 'bg-green-100 text-green-700' :
                                                            dpa.status === 'Review' ? 'bg-amber-100 text-amber-700' :
                                                                'bg-slate-100 text-slate-700'
                                                    }>{dpa.status}</Badge>
                                                    <div className="flex gap-1">
                                                        <Button variant="ghost" size="icon" onClick={() => setLocation(`/clients/${clientId}/vendors/dpa-editor/${dpa.id}`)}>
                                                            <Edit2 className="h-4 w-4" />
                                                        </Button>
                                                        <Button variant="ghost" size="icon" className="text-rose-500" onClick={() => {
                                                            setDeleteConfirmation({ type: 'dpa', id: dpa.id, name: dpa.name });
                                                        }}>
                                                            <Trash2 className="h-4 w-4" />
                                                        </Button>
                                                    </div>
                                                </div>
                                                <h4 className="font-bold text-slate-900 truncate">{dpa.name}</h4>
                                                <p className="text-xs text-slate-500 mt-1">Generated: {format(new Date(dpa.createdAt!), 'MMM d, yyyy')}</p>
                                                {dpa.signedAt && (
                                                    <p className="text-xs text-green-600 mt-1 flex items-center">
                                                        <CheckCircle className="h-3 w-3 mr-1" /> Signed: {format(new Date(dpa.signedAt), 'MMM d, yyyy')}
                                                    </p>
                                                )}
                                                <Button variant="outline" className="w-full mt-4 text-xs h-8" onClick={() => setLocation(`/clients/${clientId}/vendors/dpa-editor/${dpa.id}`)}>
                                                    View content
                                                </Button>
                                            </CardContent>
                                        </Card>
                                    ))}
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="overview" className="space-y-4 pt-4">
                    <div className="grid gap-6 md:grid-cols-2">
                        <Card>
                            <CardHeader>
                                <CardTitle>Service Description</CardTitle>
                            </CardHeader>
                            <CardContent>
                                {vendor.serviceDescription ? (
                                    <div className="whitespace-pre-wrap text-sm text-slate-700">{vendor.serviceDescription}</div>
                                ) : (
                                    <div className="text-sm text-muted-foreground italic">No service description provided.</div>
                                )}
                            </CardContent>
                        </Card>
                        <Card>
                            <CardHeader>
                                <CardTitle>Additional Notes</CardTitle>
                            </CardHeader>
                            <CardContent>
                                {vendor.additionalNotes ? (
                                    <div className="whitespace-pre-wrap text-sm text-slate-700">{vendor.additionalNotes}</div>
                                ) : (
                                    <div className="text-sm text-muted-foreground italic">No additional notes.</div>
                                )}
                            </CardContent>
                        </Card>
                    </div>

                    {vendor.usesAi && (
                        <Card className="border-primary/20 bg-primary/5">
                            <CardHeader className="flex flex-row items-center gap-2 pb-2">
                                <Brain className="h-5 w-5 text-primary" />
                                <div>
                                    <CardTitle className="text-primary font-bold">AI Governance Profile</CardTitle>
                                    <CardDescription>This vendor has been flagged as having AI-enabled services (MAP 1.5).</CardDescription>
                                </div>
                            </CardHeader>
                            <CardContent className="grid md:grid-cols-2 gap-6">
                                <div className="space-y-4">
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-1">
                                            <p className="text-xs font-bold text-slate-500 uppercase">Service Type</p>
                                            <Badge variant="outline" className="bg-white">{vendor.isAiService ? "Core AI Provider" : "AI-Augmented Service"}</Badge>
                                        </div>
                                        <div className="space-y-1">
                                            <p className="text-xs font-bold text-slate-500 uppercase">Data Usage</p>
                                            <p className="text-sm text-slate-800 italic">{vendor.aiDataUsage || "No policy documented"}</p>
                                        </div>
                                    </div>
                                    <div className="p-3 bg-white rounded-lg border border-primary/10">
                                        <p className="text-xs font-bold text-primary uppercase mb-2">Policy Alignment</p>
                                        <div className="flex items-center gap-2 text-xs text-emerald-700">
                                            <CheckCircle className="h-3 w-3" />
                                            <span>Aligned with AI Acceptable Use Policy</span>
                                        </div>
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <p className="text-xs font-bold text-slate-500 uppercase">Risk Context (NIST MEASURE)</p>
                                    <div className="p-4 bg-white rounded-lg border space-y-3">
                                        <div className="flex items-center justify-between">
                                            <span className="text-xs font-medium">Safety Impact</span>
                                            <Badge className="bg-emerald-100 text-emerald-800 text-[10px] h-4">LOW</Badge>
                                        </div>
                                        <div className="flex items-center justify-between">
                                            <span className="text-xs font-medium">Bias Vulnerability</span>
                                            <Badge className="bg-amber-100 text-amber-800 text-[10px] h-4">MEDIUM</Badge>
                                        </div>
                                        <div className="flex items-center justify-between">
                                            <span className="text-xs font-medium">Explainability</span>
                                            <Badge className="bg-emerald-100 text-emerald-800 text-[10px] h-4">HIGH</Badge>
                                        </div>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    )}
                </TabsContent>

                <TabsContent value="documents" className="space-y-4 pt-4">
                    <div className="flex justify-between items-center bg-white p-4 rounded-lg border shadow-sm">
                        <div>
                            <h3 className="font-semibold">Additional Documents</h3>
                            <p className="text-sm text-muted-foreground">Compliance certificates, reports, and other files.</p>
                        </div>
                        <div className="flex gap-2">
                            <Button size="sm" variant="outline" onClick={() => {
                                setEmailForm(prev => ({ ...prev, subject: `Request for Information - ${vendor?.name}` }));
                                setIsEmailOpen(true);
                            }}>
                                <Mail className="mr-2 h-4 w-4" /> Request Information
                            </Button>
                            <Button size="sm" onClick={() => setIsAddDocumentOpen(true)}>
                                <Plus className="mr-2 h-4 w-4" /> Add Documents
                            </Button>
                        </div>
                    </div>
                    <Card>
                        <CardContent className="pt-6">
                            {(vendor.additionalDocuments as any[])?.length > 0 ? (
                                <div className="space-y-2">
                                    {(vendor.additionalDocuments as any[]).map((doc: any, i: number) => (
                                        <div key={i} className="flex justify-between items-center p-3 hover:bg-slate-50 rounded border border-transparent hover:border-slate-100 transition-colors">
                                            <div className="flex items-center gap-3">
                                                <FileText className="h-4 w-4 text-blue-500" />
                                                <div>
                                                    <div className="font-medium text-sm">{doc.name}</div>
                                                    <div className="text-xs text-muted-foreground">{doc.date || 'No date'}</div>
                                                </div>
                                            </div>
                                            <Button variant="ghost" size="sm" asChild>
                                                <a href={doc.url} target="_blank" rel="noreferrer"><ExternalLink className="h-4 w-4" /></a>
                                            </Button>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="text-center py-8 text-muted-foreground">No additional documents.</div>
                            )}
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="trust-center" className="space-y-4 pt-4">
                    <VendorTrustCenter
                        vendor={vendor}
                        onRefresh={() => utils.vendors.get.invalidate({ id: vId })}
                    />
                </TabsContent>

                <TabsContent value="assessments" className="space-y-4">
                    <div className="flex justify-between items-center bg-white p-4 rounded-lg border shadow-sm">
                        <div>
                            <h3 className="font-semibold">Assessment History</h3>
                            <p className="text-sm text-muted-foreground">Track security questionnaires, SOC2 reviews, and other due diligence.</p>
                        </div>

                        <div className="flex gap-2">
                            <Button size="sm" variant="outline" onClick={() => setIsSendOpen(true)}>
                                <Shield className="mr-2 h-4 w-4 text-indigo-500" /> Request Evidence
                            </Button>
                            <Button size="sm" onClick={() => setIsAssessmentOpen(true)}>
                                <CalendarIcon className="mr-2 h-4 w-4" /> Schedule Manual
                            </Button>
                        </div>
                    </div>

                    <div className="grid gap-4">
                        {assessments?.map(assessment => (
                            <Card key={assessment.id}>
                                <div className="flex items-center p-4 gap-4">
                                    <div className="h-10 w-10 rounded-full bg-blue-50 flex items-center justify-center text-blue-600 shrink-0">
                                        <FileText className="h-5 w-5" />
                                    </div>
                                    <div className="flex-1">
                                        <h4 className="font-medium flex items-center gap-2 flex-wrap">
                                            {assessment.type}
                                            <div className="flex gap-2">
                                                <Badge variant="outline" className={
                                                    assessment.inherentRiskLevel === 'Critical' ? 'text-rose-600 border-rose-200 bg-rose-50' :
                                                        assessment.inherentRiskLevel === 'High' ? 'text-orange-600 border-orange-200 bg-orange-50' :
                                                            assessment.inherentRiskLevel === 'Medium' ? 'text-amber-600 border-amber-200 bg-amber-50' :
                                                                assessment.inherentRiskLevel === 'Low' ? 'text-emerald-600 border-emerald-200 bg-emerald-50' :
                                                                    'text-slate-500 border-slate-200 bg-slate-50'
                                                }>
                                                    Inherent: {assessment.inherentRiskLevel || 'Not Rated'}
                                                </Badge>
                                                <Badge variant="outline" className={
                                                    assessment.residualRiskLevel === 'Critical' ? 'text-rose-600 border-rose-200 bg-rose-50' :
                                                        assessment.residualRiskLevel === 'High' ? 'text-orange-600 border-orange-200 bg-orange-50' :
                                                            assessment.residualRiskLevel === 'Medium' ? 'text-amber-600 border-amber-200 bg-amber-50' :
                                                                assessment.residualRiskLevel === 'Low' ? 'text-emerald-600 border-emerald-200 bg-emerald-50' :
                                                                    'text-slate-500 border-slate-200 bg-slate-50'
                                                }>
                                                    Residual: {assessment.residualRiskLevel || 'Not Rated'}
                                                </Badge>
                                            </div>
                                        </h4>
                                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                            <span>Status: <strong className="text-slate-700">{assessment.status}</strong></span>
                                            <span>•</span>
                                            <span>Due: {assessment.dueDate ? format(new Date(assessment.dueDate), 'MMM d, yyyy') : 'No date'}</span>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-4">
                                        {assessment.score && (
                                            <div className="text-right">
                                                <div className="text-2xl font-bold">{assessment.score}%</div>
                                                <div className="text-[10px] text-muted-foreground uppercase">Score</div>
                                            </div>
                                        )}
                                        <Button variant="outline" size="sm" onClick={() => openConductDialog(assessment)}>
                                            {assessment.status === 'Completed' ? 'View/Edit' : 'Start Review'}
                                        </Button>
                                    </div>
                                </div>
                            </Card>
                        ))}
                        {assessments?.length === 0 && (
                            <div className="flex flex-col items-center justify-center py-12 text-muted-foreground bg-slate-50 rounded-lg border border-dashed gap-2">
                                <p>No assessments recorded for this vendor.</p>
                                <Button variant="outline" size="sm" onClick={() => setIsAssessmentOpen(true)}>
                                    <CalendarIcon className="mr-2 h-4 w-4" /> Schedule First Assessment
                                </Button>
                            </div>
                        )}
                    </div>
                </TabsContent>

                <TabsContent value="risk-scan" className="space-y-4">
                    <div className="flex justify-between items-center bg-white p-4 rounded-lg border shadow-sm">
                        <div>
                            <h3 className="font-semibold">Automated Risk Analysis</h3>
                            <p className="text-sm text-muted-foreground">Continuous monitoring of vulnerabilities (CVEs) and data breaches.</p>
                        </div>
                        <Button size="sm" onClick={() => runScanMutation.mutate({ vendorId: vId, clientId })} disabled={runScanMutation.isPending}>
                            {runScanMutation.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Zap className="mr-2 h-4 w-4" />}
                            Run Risk Scan
                        </Button>
                    </div>

                    {scanResult?.scan ? (
                        <div className="space-y-6">
                            {/* Risk Score Card - Always shown when scan exists */}
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <Card className="border-l-4 border-l-blue-500">
                                    <CardContent className="pt-6">
                                        <div className="text-sm text-muted-foreground font-medium mb-1">Automated Risk Score</div>
                                        <div className="flex items-baseline gap-2">
                                            <span className={`text-3xl font-bold ${scanResult.scan.riskScore > 80 ? 'text-rose-600' :
                                                scanResult.scan.riskScore > 50 ? 'text-amber-600' : 'text-emerald-600'
                                                }`}>
                                                {scanResult.scan.riskScore}/100
                                            </span>
                                            <span className="text-xs text-muted-foreground">
                                                {cveSuggestions.length > 0 ? `Based on ${cveSuggestions.length} detected vulnerabilities` : 'No vulnerabilities detected'}
                                            </span>
                                        </div>
                                        <div className="mt-2 text-xs text-muted-foreground flex items-center gap-1">
                                            <History className="h-3 w-3" />
                                            Last scanned: {scanResult.scan.scanDate ? format(new Date(scanResult.scan.scanDate), 'PPp') : 'Never'}
                                        </div>
                                    </CardContent>
                                </Card>

                                <Card>
                                    <CardContent className="pt-6 flex flex-col items-center justify-center text-center p-6">
                                        <AlertOctagon className="h-8 w-8 text-rose-500 mb-2" />
                                        <div className="text-2xl font-bold">{scanResult.scan.breachCount || 0}</div>
                                        <div className="text-xs text-muted-foreground uppercase tracking-wide">Data Breaches</div>
                                    </CardContent>
                                </Card>

                                <Card>
                                    <CardContent className="pt-6 flex flex-col items-center justify-center text-center p-6">
                                        <ShieldAlert className="h-8 w-8 text-amber-500 mb-2" />
                                        <div className="text-2xl font-bold">{scanResult.scan.vulnerabilityCount || 0}</div>
                                        <div className="text-xs text-muted-foreground uppercase tracking-wide">Vulnerabilities</div>
                                    </CardContent>
                                </Card>
                            </div>

                            {/* Vulnerabilities List - Only show if vulnerabilities exist */}
                            {cveSuggestions.length > 0 ? (
                                <Card>
                                    <CardHeader className="pb-3">
                                        <CardTitle className="text-md flex items-center gap-2">
                                            <Zap className="h-4 w-4 text-amber-500" /> Recent Vulnerabilities (CVEs)
                                        </CardTitle>
                                    </CardHeader>
                                    <CardContent>
                                        <div className="space-y-2">
                                            {cveSuggestions.map(vuln => (
                                                <div key={vuln.cveId} className="flex justify-between items-center p-2 hover:bg-slate-50 rounded border border-transparent hover:border-slate-100 transition-colors">
                                                    <div className="flex items-center gap-3">
                                                        <Badge variant="outline">{vuln.cveId}</Badge>
                                                        <div>
                                                            <div className="text-sm font-medium text-slate-900 line-clamp-1">{vuln.description}</div>
                                                            <div className="text-xs text-slate-500 flex gap-2">
                                                                <span>CVSS: {vuln.cvssScore}</span>
                                                                <span className="text-slate-400">|</span>
                                                                <span className="truncate max-w-[300px]">{vuln.matchReason}</span>
                                                            </div>
                                                        </div>
                                                    </div>
                                                    <div className="flex items-center gap-2">
                                                        <Button
                                                            variant="outline"
                                                            size="sm"
                                                            className="text-xs h-7"
                                                            onClick={() => setSelectedCveForMitigation(vuln)}
                                                        >
                                                            <ShieldAlert className="h-3 w-3 mr-1" />
                                                            Mitigate
                                                        </Button>
                                                        <a href={`https://nvd.nist.gov/vuln/detail/${vuln.cveId}`} target="_blank" rel="noreferrer" className="text-blue-600 hover:underline p-1">
                                                            <ExternalLink className="h-4 w-4" />
                                                        </a>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </CardContent>
                                </Card>
                            ) : (
                                <Card className="bg-emerald-50/50 border-emerald-200">
                                    <CardContent className="pt-6 text-center">
                                        <CheckCircle className="h-10 w-10 text-emerald-500 mx-auto mb-3" />
                                        <h4 className="font-semibold text-emerald-800">No Known Vulnerabilities Found</h4>
                                        <p className="text-sm text-emerald-600 mt-1">The NVD database scan did not find any CVEs directly matching this vendor.</p>
                                    </CardContent>
                                </Card>
                            )}

                            {/* Scan History */}
                            {scanResult?.scans && scanResult.scans.length > 0 && (
                                <Card>
                                    <CardHeader className="pb-3">
                                        <CardTitle className="text-md flex items-center gap-2">
                                            <History className="h-4 w-4 text-slate-500" /> Scan History
                                        </CardTitle>
                                    </CardHeader>
                                    <CardContent>
                                        <div className="space-y-3">
                                            {scanResult.scans.map((scan: any, index: number) => {
                                                const isExpanded = expandedScanId === scan.id;
                                                const scanCves = isExpanded ? (expandedScanVulnerabilities || []) : [];

                                                return (
                                                    <div key={scan.id} className="space-y-2">
                                                        <div
                                                            className={`flex items-center justify-between p-3 rounded-lg border cursor-pointer transition-colors ${index === 0 ? 'bg-indigo-50/50 border-indigo-200 hover:bg-indigo-100/50' :
                                                                'bg-slate-50 border-slate-200 hover:bg-slate-100'
                                                                }`}
                                                            onClick={() => setExpandedScanId(isExpanded ? null : scan.id)}
                                                        >
                                                            <div className="flex items-center gap-4">
                                                                <div className={`h-10 w-10 rounded-full flex items-center justify-center text-xs font-bold ${scan.riskScore > 80 ? 'bg-rose-100 text-rose-600' :
                                                                    scan.riskScore > 50 ? 'bg-amber-100 text-amber-600' :
                                                                        'bg-emerald-100 text-emerald-600'
                                                                    }`}>
                                                                    {scan.riskScore}
                                                                </div>
                                                                <div>
                                                                    <div className="flex items-center gap-2">
                                                                        <span className="font-medium text-sm">
                                                                            {scan.scanDate ? format(new Date(scan.scanDate), 'PPP') : 'Unknown Date'}
                                                                        </span>
                                                                        {index === 0 && <Badge className="bg-indigo-500 text-white text-[10px]">Latest</Badge>}
                                                                    </div>
                                                                    <div className="text-xs text-muted-foreground">
                                                                        {scan.scanDate ? format(new Date(scan.scanDate), 'p') : ''} •
                                                                        {scan.vulnerabilityCount || 0} CVEs •
                                                                        {scan.breachCount || 0} Breaches
                                                                    </div>
                                                                </div>
                                                            </div>
                                                            <div className="flex items-center gap-2">
                                                                <span className="text-xs text-muted-foreground">{scan.status}</span>
                                                                <ChevronDown className={`h-4 w-4 text-slate-400 transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
                                                            </div>
                                                        </div>

                                                        {/* Expanded CVE List */}
                                                        {isExpanded && (
                                                            <div className="ml-14 p-3 rounded-lg bg-white border border-slate-200 space-y-2">
                                                                {isLoadingHistory ? (
                                                                    <div className="flex justify-center py-4">
                                                                        <Loader2 className="h-5 w-5 animate-spin text-slate-400" />
                                                                    </div>
                                                                ) : scanCves.length > 0 ? (
                                                                    scanCves.map((vuln: any) => (
                                                                        <div key={vuln.id} className="flex justify-between items-center p-2 hover:bg-slate-50 rounded border border-transparent hover:border-slate-100 transition-colors">
                                                                            <div className="flex items-center gap-3">
                                                                                <Badge variant="outline">{vuln.cveId}</Badge>
                                                                                <div>
                                                                                    <div className="text-sm font-medium text-slate-900 line-clamp-1">{vuln.description}</div>
                                                                                    <div className="text-xs text-slate-500 flex gap-2">
                                                                                        <span>CVSS: {vuln.cvssScore}</span>
                                                                                    </div>
                                                                                </div>
                                                                            </div>
                                                                            <div className="flex items-center gap-2">
                                                                                <Button
                                                                                    variant="outline"
                                                                                    size="sm"
                                                                                    className="text-xs h-7"
                                                                                    onClick={(e) => {
                                                                                        e.stopPropagation();
                                                                                        setSelectedCveForMitigation(vuln);
                                                                                    }}
                                                                                >
                                                                                    <ShieldAlert className="h-3 w-3 mr-1" />
                                                                                    Mitigate
                                                                                </Button>
                                                                                <a href={`https://nvd.nist.gov/vuln/detail/${vuln.cveId}`} target="_blank" rel="noreferrer" className="text-blue-600 hover:underline p-1">
                                                                                    <ExternalLink className="h-4 w-4" />
                                                                                </a>
                                                                            </div>
                                                                        </div>
                                                                    ))
                                                                ) : (
                                                                    <div className="text-sm text-muted-foreground text-center py-2">
                                                                        <CheckCircle className="h-5 w-5 text-emerald-500 mx-auto mb-1" />
                                                                        No vulnerabilities found in this scan
                                                                    </div>
                                                                )}
                                                            </div>
                                                        )}
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </CardContent>
                                </Card>
                            )}

                            <div className="flex justify-end pt-4">
                                <div className="w-full md:w-auto">
                                    <VendorMitigationPlanViewer
                                        clientId={clientId}
                                        vendorId={vId}
                                        vendorName={vendor.name}
                                        hasScanData={true}
                                    />
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className="flex flex-col items-center justify-center py-16 text-muted-foreground bg-slate-50 rounded-lg border border-dashed gap-2">
                            <ShieldAlert className="h-12 w-12 text-slate-300 mb-2" />
                            <h3 className="font-semibold text-lg text-slate-700">No Scan Data Available</h3>
                            <p className="max-w-md text-center">Run a risk scan to check for known vulnerabilities (CVEs) and data breaches associated with this vendor.</p>
                            <Button variant="outline" size="sm" className="mt-4" onClick={() => runScanMutation.mutate({ vendorId: vId, clientId })} disabled={runScanMutation.isPending}>
                                {runScanMutation.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Zap className="mr-2 h-4 w-4" />}
                                Run First Scan
                            </Button>
                        </div>
                    )}
                </TabsContent>

                <TabsContent value="contacts" className="space-y-4">
                    <div className="flex justify-between items-center bg-white p-4 rounded-lg border shadow-sm">
                        <div>
                            <h3 className="font-semibold">Vendor Contacts</h3>
                            <p className="text-sm text-muted-foreground">Key personnel for security, legal, and billing inquiries.</p>
                        </div>
                        <Button size="sm" onClick={() => openContactDialog()}>
                            <Plus className="mr-2 h-4 w-4" /> Add Contact
                        </Button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {contacts?.map(contact => (
                            <Card key={contact.id} className="relative group">
                                <CardContent className="pt-6">
                                    <div className="flex justify-between items-start mb-4">
                                        <div className="flex items-center gap-3">
                                            <div className="h-10 w-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-500">
                                                <User className="h-5 w-5" />
                                            </div>
                                            <div>
                                                <div className="font-semibold flex items-center gap-2">
                                                    {contact.name}
                                                    {contact.isPrimary && <Badge variant="secondary" className="text-[10px] h-4">Primary</Badge>}
                                                </div>
                                                <div className="text-sm text-muted-foreground">{contact.role || "No Role"}</div>
                                            </div>
                                        </div>
                                        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <Button variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={() => openContactDialog(contact)}>
                                                <Edit2 className="h-4 w-4 text-slate-500" />
                                            </Button>
                                            <Button variant="ghost" size="sm" className="h-8 w-8 p-0 hover:bg-red-50 hover:text-red-600" onClick={() => {
                                                setDeleteConfirmation({ type: 'contact', id: contact.id, name: contact.name });
                                            }}>
                                                <Trash2 className="h-4 w-4" />
                                            </Button>
                                        </div>
                                    </div>

                                    <div className="space-y-2 text-sm">
                                        {contact.email && (
                                            <div className="flex items-center gap-2 text-slate-600">
                                                <Mail className="h-3.5 w-3.5" />
                                                <a href={`mailto:${contact.email}`} className="hover:underline">{contact.email}</a>
                                            </div>
                                        )}
                                        {contact.phone && (
                                            <div className="flex items-center gap-2 text-slate-600">
                                                <Phone className="h-3.5 w-3.5" />
                                                <span>{contact.phone}</span>
                                            </div>
                                        )}
                                    </div>
                                </CardContent>
                            </Card>
                        ))}
                        {contacts?.length === 0 && (
                            <div className="col-span-full py-12 text-center text-muted-foreground bg-slate-50 border border-dashed rounded-lg">
                                No contacts added yet.
                            </div>
                        )}
                    </div>
                </TabsContent>

                <TabsContent value="contracts" className="space-y-4">
                    <div className="flex justify-between items-center bg-white p-4 rounded-lg border shadow-sm">
                        <div>
                            <h3 className="font-semibold">Vendor Contracts</h3>
                            <p className="text-sm text-muted-foreground">Manage legal agreements, SLAs, and renewal terms.</p>
                        </div>
                        <Button size="sm" onClick={() => setIsContractOpen(true)}>
                            <Plus className="mr-2 h-4 w-4" /> Add Contract
                        </Button>
                    </div>

                    <div className="grid gap-4">
                        {contracts?.map(contract => (
                            <Card key={contract.id} className="relative group hover:border-blue-200 transition-colors">
                                <CardContent className="pt-6">
                                    <div className="flex justify-between items-start">
                                        <div className="flex items-start gap-4">
                                            <div className="h-10 w-10 rounded-full bg-indigo-50 flex items-center justify-center text-indigo-600 shrink-0">
                                                <ScrollText className="h-5 w-5" />
                                            </div>
                                            <div className="space-y-1">
                                                <h4 className="font-semibold text-base flex items-center gap-2">
                                                    {contract.title}
                                                    <Badge variant="outline" className={contract.status === 'Active' ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-50 text-slate-500'}>
                                                        {contract.status}
                                                    </Badge>
                                                    {contract.autoRenew && (
                                                        <Badge variant="secondary" className="text-[10px]">Auto-Renews</Badge>
                                                    )}
                                                </h4>
                                                <p className="text-sm text-muted-foreground max-w-2xl">{contract.description}</p>

                                                <div className="grid grid-cols-2 md:grid-cols-4 gap-6 pt-3">
                                                    <div className="space-y-0.5">
                                                        <div className="text-[10px] uppercase text-muted-foreground font-medium">Term</div>
                                                        <div className="text-sm font-medium">
                                                            {contract.startDate ? format(new Date(contract.startDate), 'MMM yyyy') : 'N/A'} - {contract.endDate ? format(new Date(contract.endDate), 'MMM yyyy') : 'Indefinite'}
                                                        </div>
                                                        {contract.noticePeriod && <div className="text-xs text-rose-600">Notice: {contract.noticePeriod}</div>}
                                                    </div>
                                                    <div className="space-y-0.5">
                                                        <div className="text-[10px] uppercase text-muted-foreground font-medium">Financials</div>
                                                        <div className="text-sm font-medium">{contract.value || 'N/A'}</div>
                                                        {contract.paymentTerms && <div className="text-xs text-muted-foreground">{contract.paymentTerms}</div>}
                                                    </div>
                                                    <div className="space-y-0.5">
                                                        <div className="text-[10px] uppercase text-muted-foreground font-medium">Compliance</div>
                                                        <div className="text-sm font-medium">DPA: {contract.dpaStatus}</div>
                                                        {contract.owner && <div className="text-xs text-muted-foreground">Owner: {contract.owner}</div>}
                                                    </div>
                                                    <div className="space-y-0.5">
                                                        <div className="text-[10px] uppercase text-muted-foreground font-medium">SLA Support</div>
                                                        <div className="text-sm font-medium truncate max-w-[150px]" title={contract.slaDetails}>{contract.slaDetails || 'Standard'}</div>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                            {contract.documentUrl && (
                                                <Button variant="outline" size="sm" asChild>
                                                    <a href={contract.documentUrl} target="_blank" rel="noreferrer">
                                                        <ExternalLink className="h-4 w-4" />
                                                    </a>
                                                </Button>
                                            )}
                                            <Button variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={() => {
                                                setEditingContract(contract);
                                                setContractForm({
                                                    title: contract.title,
                                                    description: contract.description || "",
                                                    startDate: contract.startDate ? new Date(contract.startDate).toISOString().split('T')[0] : "",
                                                    endDate: contract.endDate ? new Date(contract.endDate).toISOString().split('T')[0] : "",
                                                    autoRenew: contract.autoRenew || false,
                                                    value: contract.value || "",
                                                    status: contract.status || "Active",
                                                    documentUrl: contract.documentUrl || "",
                                                    noticePeriod: contract.noticePeriod || "",
                                                    paymentTerms: contract.paymentTerms || "",
                                                    slaDetails: contract.slaDetails || "",
                                                    dpaStatus: contract.dpaStatus || "Not Signed",
                                                    owner: contract.owner || ""
                                                });
                                                setIsContractOpen(true);
                                            }}>
                                                <Edit2 className="h-4 w-4 text-slate-500" />
                                            </Button>
                                            <Button variant="ghost" size="sm" className="h-8 w-8 p-0 hover:bg-red-50 hover:text-red-600" onClick={() => {
                                                setDeleteConfirmation({ type: 'contract', id: contract.id, name: contract.title });
                                            }}>
                                                <Trash2 className="h-4 w-4" />
                                            </Button>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        ))}
                        {contracts?.length === 0 && (
                            <div className="flex flex-col items-center justify-center py-16 text-muted-foreground bg-slate-50 rounded-lg border border-dashed gap-2">
                                <ScrollText className="h-12 w-12 text-slate-300 mb-2" />
                                <h3 className="font-semibold text-lg text-slate-700">No Contracts on File</h3>
                                <Button variant="outline" size="sm" onClick={() => setIsContractOpen(true)}>
                                    Add Contract Details
                                </Button>
                            </div>
                        )}
                    </div>
                </TabsContent>

                <TabsContent value="ai-governance" className="space-y-6 pt-4">
                    <div className="grid md:grid-cols-3 gap-6">
                        <Card className="col-span-2">
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <Brain className="h-5 w-5 text-primary" />
                                    AI Impact Assessment Summary (NIST MEASURE)
                                </CardTitle>
                                <CardDescription>Summary of results from the latest AI risk evaluation.</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-6">
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                    <div className="p-4 bg-slate-50 rounded-lg border text-center">
                                        <p className="text-xs font-bold text-slate-500 uppercase">Safety Score</p>
                                        <p className="text-2xl font-bold text-emerald-600">92/100</p>
                                    </div>
                                    <div className="p-4 bg-slate-50 rounded-lg border text-center">
                                        <p className="text-xs font-bold text-slate-500 uppercase">Bias Risk</p>
                                        <p className="text-2xl font-bold text-amber-600">Low</p>
                                    </div>
                                    <div className="p-4 bg-slate-50 rounded-lg border text-center">
                                        <p className="text-xs font-bold text-slate-500 uppercase">Privacy</p>
                                        <p className="text-2xl font-bold text-emerald-600">High</p>
                                    </div>
                                    <div className="p-4 bg-slate-50 rounded-lg border text-center">
                                        <p className="text-xs font-bold text-slate-500 uppercase">Explainability</p>
                                        <p className="text-2xl font-bold text-slate-400">N/A</p>
                                    </div>
                                </div>

                                <div className="space-y-4">
                                    <h4 className="font-bold text-sm">Key Findings & Remediation</h4>
                                    <div className="space-y-2">
                                        <div className="p-3 border rounded-lg bg-amber-50 border-amber-200 flex gap-3">
                                            <ShieldAlert className="h-5 w-5 text-amber-600 shrink-0" />
                                            <div>
                                                <p className="text-sm font-bold text-amber-900">Incomplete Model Card</p>
                                                <p className="text-xs text-amber-800">The vendor has not provided a complete model card for the specific version used in our tenant. Requested on 2024-05-15.</p>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader>
                                <CardTitle className="text-sm">Control Coverage</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="space-y-2">
                                    <div className="flex justify-between text-xs">
                                        <span>NIST AI RMF (MAP)</span>
                                        <span className="font-bold">85%</span>
                                    </div>
                                    <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                                        <div className="h-full bg-emerald-500 w-[85%]" />
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <div className="flex justify-between text-xs">
                                        <span>NIST AI RMF (GOVERN)</span>
                                        <span className="font-bold">60%</span>
                                    </div>
                                    <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                                        <div className="h-full bg-amber-500 w-[60%]" />
                                    </div>
                                </div>
                                <div className="pt-4 border-t space-y-2">
                                    <Button variant="outline" className="w-full text-xs h-8" onClick={() => setLocation(`/clients/${clientId}/ai-governance`)}>
                                        View Full NIST Map
                                    </Button>
                                    <Button className="w-full text-xs h-8">
                                        Download AI Report
                                    </Button>
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                </TabsContent>
            </Tabs>

            <EnhancedDialog
                open={isAssessmentOpen}
                onOpenChange={setIsAssessmentOpen}
                title="Schedule Assessment"
                description="Schedule a new security assessment."
                size="md"
                footer={
                    <div className="flex justify-end gap-2 w-full">
                        <Button variant="outline" onClick={() => setIsAssessmentOpen(false)}>Cancel</Button>
                        <Button onClick={handleCreateAssessment} disabled={createAssessmentMutation.isPending}>
                            {createAssessmentMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Schedule
                        </Button>
                    </div>
                }
            >
                <div className="grid gap-4 py-2">
                    <div className="grid gap-2">
                        <Label>Assessment Type</Label>
                        <Select
                            value={assessmentForm.type}
                            onValueChange={(val) => setAssessmentForm({ ...assessmentForm, type: val })}
                        >
                            <SelectTrigger><SelectValue placeholder="Select type..." /></SelectTrigger>
                            <SelectContent>
                                <SelectItem value="Security Questionnaire (SIG Lite)">Security Questionnaire (SIG Lite)</SelectItem>
                                <SelectItem value="SOC 2 Review">SOC 2 Review</SelectItem>
                                <SelectItem value="ISO 27001 Certificate Review">ISO 27001 Certificate Review</SelectItem>
                                <SelectItem value="Penetration Test Review">Penetration Test Review</SelectItem>
                                <SelectItem value="Privacy Impact Assessment">Privacy Impact Assessment</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                    <div className="grid gap-2">
                        <Label>Due Date</Label>
                        <Input
                            type="date"
                            value={assessmentForm.dueDate}
                            onChange={(e) => setAssessmentForm({ ...assessmentForm, dueDate: e.target.value })}
                        />
                    </div>
                    <div className="grid gap-2">
                        <Label>Initial Status</Label>
                        <Select
                            value={assessmentForm.status}
                            onValueChange={(val) => setAssessmentForm({ ...assessmentForm, status: val })}
                        >
                            <SelectTrigger><SelectValue /></SelectTrigger>
                            <SelectContent>
                                <SelectItem value="Planned">Planned</SelectItem>
                                <SelectItem value="Sent">Sent to Vendor</SelectItem>
                                <SelectItem value="In Progress">In Progress</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                </div>
            </EnhancedDialog>




            <AlertDialog open={!!deleteConfirmation} onOpenChange={(open) => !open && setDeleteConfirmation(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                        <AlertDialogDescription>
                            This action cannot be undone. This will permanently delete the
                            {deleteConfirmation?.type === 'dpa' ? ' DPA' :
                                deleteConfirmation?.type === 'contract' ? ' contract' :
                                    ' contact'}
                            {deleteConfirmation?.name && <span className="font-semibold text-foreground"> "{deleteConfirmation.name}"</span>}.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                            className="bg-destructive hover:bg-destructive/90 text-destructive-foreground"
                            onClick={() => {
                                if (!deleteConfirmation) return;
                                if (deleteConfirmation.type === 'dpa') {
                                    deleteDpaMutation.mutate({ id: deleteConfirmation.id, clientId });
                                } else if (deleteConfirmation.type === 'contact') {
                                    deleteContactMutation.mutate({ id: deleteConfirmation.id });
                                } else if (deleteConfirmation.type === 'contract') {
                                    deleteContractMutation.mutate({ id: deleteConfirmation.id });
                                }
                                setDeleteConfirmation(null);
                            }}
                        >
                            Delete
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

            <RequestItemsDialog
                isOpen={isSendOpen}
                onClose={() => setIsSendOpen(false)}
                vendorName={vendor?.name || "Vendor"}
                templates={templates || []}
                onSend={handleSendConsolidated}
            />

            <EnhancedDialog
                open={isContactOpen}
                onOpenChange={setIsContactOpen}
                title={editingContact ? "Edit Contact" : "Add Contact"}
                description="Add or edit vendor contact information."
                size="md"
                footer={
                    <div className="flex justify-end gap-2 w-full">
                        <Button variant="outline" onClick={() => setIsContactOpen(false)}>Cancel</Button>
                        <Button onClick={handleSaveContact} disabled={createContactMutation.isPending || updateContactMutation.isPending}>
                            {(createContactMutation.isPending || updateContactMutation.isPending) && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Save Contact
                        </Button>
                    </div>
                }
            >
                <div className="grid gap-4 py-2">
                    <div className="grid gap-2">
                        <Label>Full Name</Label>
                        <Input
                            value={contactForm.name}
                            onChange={(e) => setContactForm({ ...contactForm, name: e.target.value })}
                            placeholder="e.g. Jane Doe"
                        />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div className="grid gap-2">
                            <Label>Email</Label>
                            <Input
                                value={contactForm.email}
                                onChange={(e) => setContactForm({ ...contactForm, email: e.target.value })}
                                placeholder="jane@vendor.com"
                            />
                        </div>
                        <div className="grid gap-2">
                            <Label>Phone</Label>
                            <Input
                                value={contactForm.phone}
                                onChange={(e) => setContactForm({ ...contactForm, phone: e.target.value })}
                                placeholder="+1 (555) 000-0000"
                            />
                        </div>
                    </div>
                    <div className="grid gap-2">
                        <Label>Role / Title</Label>
                        <Select
                            value={contactForm.role}
                            onValueChange={(val) => setContactForm({ ...contactForm, role: val })}
                        >
                            <SelectTrigger><SelectValue placeholder="Select role..." /></SelectTrigger>
                            <SelectContent>
                                <SelectItem value="Account Manager">Account Manager</SelectItem>
                                <SelectItem value="Security Lead">Security Lead (CISO)</SelectItem>
                                <SelectItem value="Technical Support">Technical Support</SelectItem>
                                <SelectItem value="Legal / Compliance">Legal / Compliance</SelectItem>
                                <SelectItem value="Billing">Billing</SelectItem>
                                <SelectItem value="Other">Other</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                    <div className="flex items-center space-x-2 pt-2">
                        <input
                            type="checkbox"
                            id="isPrimary"
                            className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                            checked={contactForm.isPrimary}
                            onChange={(e) => setContactForm({ ...contactForm, isPrimary: e.target.checked })}
                        />
                        <Label htmlFor="isPrimary">Mark as Primary Contact</Label>
                    </div>
                </div>
            </EnhancedDialog>

            <EnhancedDialog
                open={isEditOpen}
                onOpenChange={setIsEditOpen}
                title="Edit Vendor Details"
                description="Update vendor profile information."
                size="lg"
                footer={
                    <div className="flex justify-end gap-2 w-full">
                        <Button variant="outline" onClick={() => setIsEditOpen(false)}>Cancel</Button>
                        <Button onClick={handleUpdateVendor} disabled={updateVendorMutation.isPending}>
                            {updateVendorMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Save Changes
                        </Button>
                    </div>
                }
            >
                <div className="grid gap-4 py-2">
                    <div className="grid grid-cols-2 gap-4">
                        <div className="grid gap-2">
                            <Label>Vendor Name</Label>
                            <Input
                                value={editForm.name}
                                onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                            />
                        </div>
                        <div className="grid gap-2">
                            <Label>Website</Label>
                            <Input
                                value={editForm.website}
                                onChange={(e) => setEditForm({ ...editForm, website: e.target.value })}
                            />
                        </div>
                    </div>
                    <div className="grid gap-2">
                        <Label>Trust Center URL</Label>
                        <Input
                            value={editForm.trustCenterUrl}
                            onChange={(e) => setEditForm({ ...editForm, trustCenterUrl: e.target.value })}
                            placeholder="https://trust.vendor.com"
                        />
                    </div>
                    <div className="grid gap-2">
                        <Label>Description</Label>
                        <Input
                            value={editForm.description}
                            onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                        />
                    </div>

                    <div className="p-4 bg-primary/5 border border-primary/20 rounded-lg space-y-4">
                        <div className="flex items-center gap-2 mb-2">
                            <Brain className="h-5 w-5 text-primary" />
                            <h4 className="font-bold text-primary">AI Governance (MAP 1.5)</h4>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <label className="flex items-center space-x-2 cursor-pointer">
                                <input
                                    type="checkbox"
                                    checked={editForm.usesAi}
                                    onChange={e => setEditForm({ ...editForm, usesAi: e.target.checked })}
                                    className="rounded border-slate-300"
                                />
                                <span className="text-sm font-medium">Uses AI in Service</span>
                            </label>
                            <label className="flex items-center space-x-2 cursor-pointer">
                                <input
                                    type="checkbox"
                                    checked={editForm.isAiService}
                                    onChange={e => setEditForm({ ...editForm, isAiService: e.target.checked })}
                                    className="rounded border-slate-300"
                                />
                                <span className="text-sm font-medium">Core AI Service Provider</span>
                            </label>
                        </div>
                        {(editForm.usesAi || editForm.isAiService) && (
                            <div className="space-y-2">
                                <Label>AI Data Usage Policy</Label>
                                <Input
                                    value={editForm.aiDataUsage}
                                    onChange={e => setEditForm({ ...editForm, aiDataUsage: e.target.value })}
                                    placeholder="e.g. Inputs used for training, Zero retention, etc."
                                />
                            </div>
                        )}
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="grid gap-2">
                            <Label>Status</Label>
                            <Select
                                value={editForm.status}
                                onValueChange={(val) => setEditForm({ ...editForm, status: val })}
                            >
                                <SelectTrigger><SelectValue /></SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="Onboarding">Onboarding</SelectItem>
                                    <SelectItem value="Active">Active</SelectItem>
                                    <SelectItem value="Offboarding">Offboarding</SelectItem>
                                    <SelectItem value="Offboarded">Offboarded</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="grid gap-2">
                            <Label>Review Status</Label>
                            <Select
                                value={editForm.reviewStatus}
                                onValueChange={(val) => setEditForm({ ...editForm, reviewStatus: val })}
                            >
                                <SelectTrigger><SelectValue /></SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="needs_review">Needs Review</SelectItem>
                                    <SelectItem value="in_progress">In Progress</SelectItem>
                                    <SelectItem value="approved">Approved</SelectItem>
                                    <SelectItem value="rejected">Rejected</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="grid gap-2">
                            <Label>Category</Label>
                            <Select value={editForm.category} onValueChange={(val) => setEditForm({ ...editForm, category: val })}>
                                <SelectTrigger><SelectValue /></SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="SaaS">SaaS</SelectItem>
                                    <SelectItem value="PaaS">PaaS</SelectItem>
                                    <SelectItem value="IaaS">IaaS</SelectItem>
                                    <SelectItem value="Service">Service Provider</SelectItem>
                                    <SelectItem value="Hardware">Hardware</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="grid gap-2">
                            <Label>Source</Label>
                            <Select value={editForm.source} onValueChange={(val) => setEditForm({ ...editForm, source: val })}>
                                <SelectTrigger><SelectValue /></SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="Manual">Manual Entry</SelectItem>
                                    <SelectItem value="SSO">SSO Detection</SelectItem>
                                    <SelectItem value="Finance">Finance API</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="grid gap-2">
                            <Label>Criticality</Label>
                            <Select
                                value={editForm.criticality}
                                onValueChange={(val) => setEditForm({ ...editForm, criticality: val })}
                            >
                                <SelectTrigger><SelectValue /></SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="Low">Low</SelectItem>
                                    <SelectItem value="Medium">Medium</SelectItem>
                                    <SelectItem value="High">High</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="grid gap-2">
                            <Label>Data Access</Label>
                            <Select
                                value={editForm.dataAccess}
                                onValueChange={(val) => setEditForm({ ...editForm, dataAccess: val })}
                            >
                                <SelectTrigger><SelectValue /></SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="Internal">Internal</SelectItem>
                                    <SelectItem value="Confidential">Confidential</SelectItem>
                                    <SelectItem value="Restricted">Restricted</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>


                    <div className="grid gap-2">
                        <Label>Service Description</Label>
                        <Textarea
                            value={editForm.serviceDescription}
                            onChange={(e) => setEditForm({ ...editForm, serviceDescription: e.target.value })}
                            placeholder="Describe the service provided..."
                            className="min-h-[100px]"
                        />
                    </div>

                    <div className="grid gap-2">
                        <Label>Additional Notes</Label>
                        <Textarea
                            value={editForm.additionalNotes}
                            onChange={(e) => setEditForm({ ...editForm, additionalNotes: e.target.value })}
                            placeholder="Internal notes, context, etc."
                            className="min-h-[100px]"
                        />
                    </div>

                    <div className="flex items-center space-x-2 border p-3 rounded-md bg-slate-50 mt-4">
                        <input
                            type="checkbox"
                            id="isSubprocessor"
                            className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                            checked={!!editForm.isSubprocessor}
                            onChange={(e) => setEditForm({ ...editForm, isSubprocessor: e.target.checked })}
                        />
                        <div className="grid gap-0.5">
                            <Label htmlFor="isSubprocessor" className="font-medium cursor-pointer">Approved Subprocessor</Label>
                            <p className="text-xs text-muted-foreground">Mark this vendor as a subprocessor processing personal data (Article 28).</p>
                        </div>
                    </div>
                </div>
            </EnhancedDialog>

            <EnhancedDialog
                open={isConductOpen}
                onOpenChange={setIsConductOpen}
                title="Conduct Security Assessment"
                description="Evaluate inherent and residual risks for this vendor."
                size="lg"
                footer={
                    <div className="flex justify-end gap-2 w-full">
                        <Button variant="outline" onClick={() => setIsConductOpen(false)}>Cancel</Button>
                        <Button onClick={handleConductAssessment} disabled={updateAssessmentMutation.isPending}>
                            {updateAssessmentMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Save Assessment
                        </Button>
                    </div>
                }
            >

                <div className="grid gap-4 py-2">
                    <div className="grid grid-cols-2 gap-8 mb-6">
                        {/* Inherent Risk Column */}
                        <div className="space-y-4 border-r pr-4">
                            <h4 className="font-semibold text-sm text-slate-500 border-b pb-2">Inherent Risk (Before Controls)</h4>
                            <div className="grid gap-2">
                                <Label>Impact</Label>
                                <Select
                                    value={conductForm.inherentImpact}
                                    onValueChange={(val) => {
                                        const newImpact = val;
                                        const impactScore = { "Low": 1, "Medium": 2, "High": 3, "Critical": 4 }[newImpact] || 0;
                                        const likeScore = { "Low": 1, "Medium": 2, "High": 3, "Critical": 4 }[conductForm.inherentLikelihood] || 0;
                                        const total = impactScore * likeScore;
                                        let risk = "Low";
                                        if (total >= 12) risk = "Critical";
                                        else if (total >= 8) risk = "High";
                                        else if (total >= 4) risk = "Medium";

                                        setConductForm({ ...conductForm, inherentImpact: val, inherentRiskLevel: risk });
                                    }}
                                >
                                    <SelectTrigger><SelectValue placeholder="Select Impact" /></SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="Low">Low</SelectItem>
                                        <SelectItem value="Medium">Medium</SelectItem>
                                        <SelectItem value="High">High</SelectItem>
                                        <SelectItem value="Critical">Critical</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="grid gap-2">
                                <Label>Likelihood</Label>
                                <Select
                                    value={conductForm.inherentLikelihood}
                                    onValueChange={(val) => {
                                        const newLike = val;
                                        const impactScore = { "Low": 1, "Medium": 2, "High": 3, "Critical": 4 }[conductForm.inherentImpact] || 0;
                                        const likeScore = { "Low": 1, "Medium": 2, "High": 3, "Critical": 4 }[newLike] || 0;
                                        const total = impactScore * likeScore;
                                        let risk = "Low";
                                        if (total >= 12) risk = "Critical";
                                        else if (total >= 8) risk = "High";
                                        else if (total >= 4) risk = "Medium";

                                        setConductForm({ ...conductForm, inherentLikelihood: val, inherentRiskLevel: risk });
                                    }}
                                >
                                    <SelectTrigger><SelectValue placeholder="Select Likelihood" /></SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="Low">Low</SelectItem>
                                        <SelectItem value="Medium">Medium</SelectItem>
                                        <SelectItem value="High">High</SelectItem>
                                        <SelectItem value="Critical">Critical</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="bg-slate-50 p-3 rounded-md flex justify-between items-center">
                                <span className="text-xs font-medium">Inherent Risk:</span>
                                <Badge variant="outline" className={
                                    conductForm.inherentRiskLevel === 'Critical' ? 'text-rose-600 bg-rose-50 border-rose-200' :
                                        conductForm.inherentRiskLevel === 'High' ? 'text-orange-600 bg-orange-50 border-orange-200' :
                                            conductForm.inherentRiskLevel === 'Medium' ? 'text-amber-600 bg-amber-50 border-amber-200' :
                                                'text-emerald-600 bg-emerald-50 border-emerald-200'
                                }>{conductForm.inherentRiskLevel || "Not Rated"}</Badge>
                            </div>
                        </div>

                        {/* Residual Risk Column */}
                        <div className="space-y-4">
                            <h4 className="font-semibold text-sm text-slate-500 border-b pb-2">Residual Risk (After Controls)</h4>
                            <div className="grid gap-2">
                                <Label>Impact</Label>
                                <Select
                                    value={conductForm.residualImpact}
                                    onValueChange={(val) => {
                                        const newImpact = val;
                                        const impactScore = { "Low": 1, "Medium": 2, "High": 3, "Critical": 4 }[newImpact] || 0;
                                        const likeScore = { "Low": 1, "Medium": 2, "High": 3, "Critical": 4 }[conductForm.residualLikelihood] || 0;
                                        const total = impactScore * likeScore;
                                        let risk = "Low";
                                        if (total >= 12) risk = "Critical";
                                        else if (total >= 8) risk = "High";
                                        else if (total >= 4) risk = "Medium";

                                        setConductForm({ ...conductForm, residualImpact: val, residualRiskLevel: risk });
                                    }}
                                >
                                    <SelectTrigger><SelectValue placeholder="Select Impact" /></SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="Low">Low</SelectItem>
                                        <SelectItem value="Medium">Medium</SelectItem>
                                        <SelectItem value="High">High</SelectItem>
                                        <SelectItem value="Critical">Critical</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="grid gap-2">
                                <Label>Likelihood</Label>
                                <Select
                                    value={conductForm.residualLikelihood}
                                    onValueChange={(val) => {
                                        const newLike = val;
                                        const impactScore = { "Low": 1, "Medium": 2, "High": 3, "Critical": 4 }[conductForm.residualImpact] || 0;
                                        const likeScore = { "Low": 1, "Medium": 2, "High": 3, "Critical": 4 }[newLike] || 0;
                                        const total = impactScore * likeScore;
                                        let risk = "Low";
                                        if (total >= 12) risk = "Critical";
                                        else if (total >= 8) risk = "High";
                                        else if (total >= 4) risk = "Medium";

                                        setConductForm({ ...conductForm, residualLikelihood: val, residualRiskLevel: risk });
                                    }}
                                >
                                    <SelectTrigger><SelectValue placeholder="Select Likelihood" /></SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="Low">Low</SelectItem>
                                        <SelectItem value="Medium">Medium</SelectItem>
                                        <SelectItem value="High">High</SelectItem>
                                        <SelectItem value="Critical">Critical</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="bg-slate-50 p-3 rounded-md flex justify-between items-center">
                                <span className="text-xs font-medium">Residual Risk:</span>
                                <Badge className={
                                    conductForm.residualRiskLevel === 'Critical' ? 'bg-rose-600' :
                                        conductForm.residualRiskLevel === 'High' ? 'bg-orange-500' :
                                            conductForm.residualRiskLevel === 'Medium' ? 'bg-amber-500' :
                                                'bg-emerald-500'
                                }>{conductForm.residualRiskLevel || "Not Rated"}</Badge>
                            </div>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="grid gap-2">
                            <Label>Current Status</Label>
                            <Select
                                value={conductForm.status}
                                onValueChange={(val) => setConductForm({ ...conductForm, status: val })}
                            >
                                <SelectTrigger><SelectValue /></SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="Planned">Planned</SelectItem>
                                    <SelectItem value="Sent">Sent to Vendor</SelectItem>
                                    <SelectItem value="In Progress">In Progress</SelectItem>
                                    <SelectItem value="Review">In Review</SelectItem>
                                    <SelectItem value="Completed">Completed</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="grid gap-2">
                            <Label>Score (0-100)</Label>
                            <Input
                                type="number"
                                min="0"
                                max="100"
                                value={conductForm.score}
                                onChange={(e) => setConductForm({ ...conductForm, score: parseInt(e.target.value) || 0 })}
                            />
                        </div>
                    </div>

                    <div className="grid gap-2">
                        <Label>Detailed Findings</Label>
                        <Textarea
                            className="min-h-[150px]"
                            placeholder="Enter detailed observations, missing controls, or risks identified..."
                            value={conductForm.findings}
                            onChange={(e) => setConductForm({ ...conductForm, findings: e.target.value })}
                        />
                    </div>

                    <div className="grid gap-2">
                        <Label>Evidence Link (URL)</Label>
                        <div className="flex gap-2">
                            <Input
                                placeholder="https://..."
                                value={conductForm.documentUrl}
                                onChange={(e) => setConductForm({ ...conductForm, documentUrl: e.target.value })}
                            />
                            {conductForm.documentUrl && (
                                <Button variant="ghost" size="icon" asChild>
                                    <a href={conductForm.documentUrl} target="_blank" rel="noreferrer">
                                        <ExternalLink className="h-4 w-4" />
                                    </a>
                                </Button>
                            )}
                        </div>
                        <p className="text-[10px] text-muted-foreground">Link to SharePoint, Google Drive, or stored artifact.</p>
                    </div>
                </div>
            </EnhancedDialog>
            <EnhancedDialog
                open={isEmailOpen}
                onOpenChange={setIsEmailOpen}
                title="Send Email to Vendor"
                description="Send a quick email to request documents or follow up."
                size="md"
                footer={
                    <div className="flex justify-end gap-2 w-full">
                        <Button variant="outline" onClick={() => setIsEmailOpen(false)}>Cancel</Button>
                        <Button onClick={handleSendEmail} disabled={sendEmailMutation.isPending}>
                            {sendEmailMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Send Email
                        </Button>
                    </div>
                }
            >
                <div className="grid gap-4 py-2">
                    <div className="grid gap-2">
                        <Label>Recipient (To)</Label>
                        <Input
                            value={emailForm.to}
                            onChange={(e) => setEmailForm({ ...emailForm, to: e.target.value })}
                            placeholder="vendor@example.com"
                        />
                        {contacts && contacts.length > 0 && (
                            <div className="flex gap-2 flex-wrap">
                                {contacts.map(c => (
                                    <Badge
                                        key={c.id}
                                        variant="outline"
                                        className="cursor-pointer hover:bg-slate-100"
                                        onClick={() => c.email && setEmailForm(prev => ({ ...prev, to: c.email || '' }))}
                                    >
                                        {c.name} ({c.email})
                                    </Badge>
                                ))}
                            </div>
                        )}
                    </div>
                    <div className="grid gap-2">
                        <Label>Subject</Label>
                        <Input
                            value={emailForm.subject}
                            onChange={(e) => setEmailForm({ ...emailForm, subject: e.target.value })}
                        />
                    </div>
                    <div className="grid gap-2">
                        <Label>Message</Label>
                        <Textarea
                            value={emailForm.body}
                            onChange={(e) => setEmailForm({ ...emailForm, body: e.target.value })}
                            className="min-h-[150px]"
                        />
                    </div>
                </div>
            </EnhancedDialog>

            <EnhancedDialog
                open={isAddDocumentOpen}
                onOpenChange={setIsAddDocumentOpen}
                title="Add Document"
                description="Link an external document to this vendor."
                size="md"
                footer={
                    <div className="flex justify-end gap-2 w-full">
                        <Button variant="outline" onClick={() => setIsAddDocumentOpen(false)}>Cancel</Button>
                        <Button onClick={handleAddDocument} disabled={updateVendorMutation.isPending}>
                            {updateVendorMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Add Document
                        </Button>
                    </div>
                }
            >
                <div className="grid gap-4 py-4">
                    <div className="grid gap-2">
                        <Label>Upload File</Label>
                        <GenericFileUploader
                            onUploadComplete={(file) => {
                                setDocumentForm(prev => ({
                                    ...prev,
                                    url: file.url,
                                    name: prev.name || file.name
                                }));
                                toast.success("File uploaded successfully");
                            }}
                            folder="vendor-docs"
                        />
                    </div>
                    <div className="relative">
                        <div className="absolute inset-0 flex items-center">
                            <span className="w-full border-t" />
                        </div>
                        <div className="relative flex justify-center text-xs uppercase">
                            <span className="bg-background px-2 text-muted-foreground">Or link external URL</span>
                        </div>
                    </div>
                    <div className="grid gap-2">
                        <Label>Document Name</Label>
                        <Input
                            value={documentForm.name}
                            onChange={(e) => setDocumentForm({ ...documentForm, name: e.target.value })}
                            placeholder="e.g. SOC 2 Report 2024"
                        />
                    </div>
                    <div className="grid gap-2">
                        <Label>Document URL</Label>
                        <Input
                            value={documentForm.url}
                            onChange={(e) => setDocumentForm({ ...documentForm, url: e.target.value })}
                            placeholder="https://..."
                        />
                    </div>
                </div>
            </EnhancedDialog>
            <EnhancedDialog
                open={isContractOpen}
                onOpenChange={setIsContractOpen}
                title={editingContract ? "Edit Contract" : "Add Contract"}
                description="Manage contract terms, SLA, and DPA details."
                size="lg"
                footer={
                    <div className="flex justify-end gap-2 w-full">
                        <Button variant="outline" onClick={() => setIsContractOpen(false)}>Cancel</Button>
                        <Button onClick={() => {
                            const payload: any = {
                                ...contractForm,
                                clientId,
                                vendorId: vId
                            };
                            if (editingContract) {
                                updateContractMutation.mutate({ id: editingContract.id, ...payload });
                            } else {
                                createContractMutation.mutate(payload);
                            }
                        }} disabled={createContractMutation.isPending || updateContractMutation.isPending}>
                            {createContractMutation.isPending || updateContractMutation.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                            {editingContract ? "Update Contract" : "Add Contract"}
                        </Button>
                    </div>
                }
            >
                <div className="grid grid-cols-2 gap-4 py-2">
                    <div className="col-span-2 grid gap-2">
                        <Label>Contract Title / Name</Label>
                        <Input value={contractForm.title} onChange={(e) => setContractForm({ ...contractForm, title: e.target.value })} placeholder="e.g. Master Services Agreement" />
                    </div>
                    <div className="col-span-2 grid gap-2">
                        <Label>Description</Label>
                        <Textarea value={contractForm.description} onChange={(e) => setContractForm({ ...contractForm, description: e.target.value })} placeholder="Scope of services..." />
                    </div>

                    <div className="grid gap-2">
                        <Label>Start Date</Label>
                        <Input type="date" value={contractForm.startDate} onChange={(e) => setContractForm({ ...contractForm, startDate: e.target.value })} />
                    </div>
                    <div className="grid gap-2">
                        <Label>End Date</Label>
                        <Input type="date" value={contractForm.endDate} onChange={(e) => setContractForm({ ...contractForm, endDate: e.target.value })} />
                    </div>

                    <div className="grid gap-2">
                        <Label>Auto-Renewal</Label>
                        <Select value={contractForm.autoRenew ? "yes" : "no"} onValueChange={(val) => setContractForm({ ...contractForm, autoRenew: val === 'yes' })}>
                            <SelectTrigger><SelectValue /></SelectTrigger>
                            <SelectContent>
                                <SelectItem value="yes">Yes, Auto-Renews</SelectItem>
                                <SelectItem value="no">No, Fixed Term</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                    <div className="grid gap-2">
                        <Label>Notice Period</Label>
                        <Input value={contractForm.noticePeriod} onChange={(e) => setContractForm({ ...contractForm, noticePeriod: e.target.value })} placeholder="e.g. 30 days" />
                    </div>

                    <div className="grid gap-2">
                        <Label>Contract Value</Label>
                        <Input value={contractForm.value} onChange={(e) => setContractForm({ ...contractForm, value: e.target.value })} placeholder="e.g. $10,000/yr" />
                    </div>
                    <div className="grid gap-2">
                        <Label>Payment Terms</Label>
                        <Input value={contractForm.paymentTerms} onChange={(e) => setContractForm({ ...contractForm, paymentTerms: e.target.value })} placeholder="e.g. Net 30" />
                    </div>

                    <div className="grid gap-2">
                        <Label>Status</Label>
                        <Select value={contractForm.status} onValueChange={(val) => setContractForm({ ...contractForm, status: val })}>
                            <SelectTrigger><SelectValue /></SelectTrigger>
                            <SelectContent>
                                <SelectItem value="Active">Active</SelectItem>
                                <SelectItem value="Expired">Expired</SelectItem>
                                <SelectItem value="Draft">Draft</SelectItem>
                                <SelectItem value="Terminated">Terminated</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                    <div className="grid gap-2">
                        <Label>DPA Status</Label>
                        <Select value={contractForm.dpaStatus} onValueChange={(val) => setContractForm({ ...contractForm, dpaStatus: val })}>
                            <SelectTrigger><SelectValue /></SelectTrigger>
                            <SelectContent>
                                <SelectItem value="Signed">Signed</SelectItem>
                                <SelectItem value="Not Signed">Not Signed</SelectItem>
                                <SelectItem value="Not Required">Not Required</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="col-span-2 grid gap-2">
                        <Label>SLA Details</Label>
                        <Input value={contractForm.slaDetails} onChange={(e) => setContractForm({ ...contractForm, slaDetails: e.target.value })} placeholder="e.g. 99.9% uptime, 4hr response time" />
                    </div>

                    <div className="col-span-2 grid gap-2">
                        <Label>Document Link (URL)</Label>
                        <Input value={contractForm.documentUrl} onChange={(e) => setContractForm({ ...contractForm, documentUrl: e.target.value })} placeholder="https://..." />
                    </div>
                    <div className="col-span-2 grid gap-2">
                        <Label>Internal Owner</Label>
                        <Input value={contractForm.owner} onChange={(e) => setContractForm({ ...contractForm, owner: e.target.value })} placeholder="e.g. Legal Team, CTO" />
                    </div>
                </div>
            </EnhancedDialog>

            {/* DPA Generation Dialog */}
            <EnhancedDialog
                open={isDpaOpen}
                onOpenChange={setIsDpaOpen}
                title="Generate DPA from Template"
                description="Select a standard template to generate a new DPA for this vendor."
                size="md"
                footer={
                    <div className="flex justify-end gap-2 w-full">
                        <Button variant="outline" onClick={() => setIsDpaOpen(false)}>Cancel</Button>
                        <Button
                            onClick={() => {
                                if (!dpaForm.templateId || !dpaForm.name) {
                                    return toast.error("Please select a template and provide a name");
                                }
                                createDpaMutation.mutate({
                                    clientId,
                                    vendorId: vId,
                                    templateId: Number(dpaForm.templateId),
                                    name: dpaForm.name
                                });
                            }}
                            disabled={createDpaMutation.isPending}
                        >
                            {createDpaMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Generate DPA
                        </Button>
                    </div>
                }
            >
                <div className="grid gap-4 py-4">
                    <div className="grid gap-2">
                        <Label>DPA Document Name</Label>
                        <Input
                            placeholder="e.g. AWS DPA 2024"
                            value={dpaForm.name}
                            onChange={(e) => setDpaForm({ ...dpaForm, name: e.target.value })}
                        />
                    </div>
                    <div className="grid gap-2">
                        <Label>Standard Template</Label>
                        <Select
                            value={dpaForm.templateId}
                            onValueChange={(val) => {
                                setDpaForm({ ...dpaForm, templateId: val });
                                // Auto-fill name if empty
                                if (!dpaForm.name) {
                                    const template = dpaTemplates?.find(t => String(t.id) === val);
                                    if (template && vendor) {
                                        setDpaForm(prev => ({ ...prev, name: `${vendor.name} - ${template.name}` }));
                                    }
                                }
                            }}
                        >
                            <SelectTrigger><SelectValue placeholder="Select Template" /></SelectTrigger>
                            <SelectContent>
                                {dpaTemplates?.map(t => (
                                    <SelectItem key={t.id} value={String(t.id)}>{t.name} ({t.jurisdiction})</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                </div>
            </EnhancedDialog>

            {/* CVE Mitigation Dialog */}
            <EnhancedDialog
                open={!!selectedCveForMitigation}
                onOpenChange={(open) => !open && setSelectedCveForMitigation(null)}
                title={`Mitigation: ${selectedCveForMitigation?.cveId}`}
                icon={ShieldAlert}
                description="Review vulnerability details and create a remediation task."
                submitText="Create Remediation Task"
                onSubmit={() => {
                    toast.success("Remediation task created", {
                        description: `Task for ${selectedCveForMitigation?.cveId} added to your roadmap.`
                    });
                    setSelectedCveForMitigation(null);
                }}
            >
                {selectedCveForMitigation && (
                    <div className="space-y-4">
                        <div className="p-4 bg-slate-50 rounded-lg border">
                            <div className="flex items-center justify-between mb-2">
                                <Badge variant="outline" className="text-sm">{selectedCveForMitigation.cveId}</Badge>
                                <Badge className={`${parseFloat(selectedCveForMitigation.cvssScore || "0") >= 9 ? 'bg-rose-500' :
                                    parseFloat(selectedCveForMitigation.cvssScore || "0") >= 7 ? 'bg-amber-500' :
                                        'bg-emerald-500'
                                    } text-white`}>
                                    CVSS: {selectedCveForMitigation.cvssScore}
                                </Badge>
                            </div>
                            <p className="text-sm text-slate-700">{selectedCveForMitigation.description}</p>
                        </div>

                        <div className="grid gap-3">
                            <div className="grid gap-2">
                                <Label>Remediation Priority</Label>
                                <Select value={mitigationForm.priority} onValueChange={(val) => setMitigationForm({ ...mitigationForm, priority: val })}>
                                    <SelectTrigger><SelectValue /></SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="critical">Critical</SelectItem>
                                        <SelectItem value="high">High</SelectItem>
                                        <SelectItem value="medium">Medium</SelectItem>
                                        <SelectItem value="low">Low</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="grid gap-2">
                                <Label>Assigned To</Label>
                                <Input
                                    value={mitigationForm.assignee}
                                    onChange={(e) => setMitigationForm({ ...mitigationForm, assignee: e.target.value })}
                                    placeholder="e.g. Security Team, DevOps"
                                />
                            </div>
                            <div className="grid gap-2">
                                <Label>Due Date</Label>
                                <Input
                                    type="date"
                                    value={mitigationForm.dueDate}
                                    onChange={(e) => setMitigationForm({ ...mitigationForm, dueDate: e.target.value })}
                                />
                            </div>
                            <div className="grid gap-2">
                                <Label>Notes</Label>
                                <Textarea
                                    value={mitigationForm.notes}
                                    onChange={(e) => setMitigationForm({ ...mitigationForm, notes: e.target.value })}
                                    placeholder="Add any notes about the remediation plan..."
                                    rows={3}
                                />
                            </div>
                        </div>

                        <div className="flex gap-2 pt-2">
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => window.open(`https://nvd.nist.gov/vuln/detail/${selectedCveForMitigation.cveId}`, '_blank')}
                            >
                                <ExternalLink className="h-4 w-4 mr-2" />
                                View on NVD
                            </Button>
                            <Button
                                className="flex-1"
                                onClick={() => createRemediationMutation.mutate({
                                    clientId,
                                    vendorId: vId,
                                    cveId: selectedCveForMitigation.cveId,
                                    cveDescription: selectedCveForMitigation.description,
                                    cvssScore: selectedCveForMitigation.cvssScore,
                                    priority: mitigationForm.priority,
                                    assignee: mitigationForm.assignee,
                                    dueDate: mitigationForm.dueDate,
                                    notes: mitigationForm.notes,
                                })}
                                disabled={createRemediationMutation.isPending}
                            >
                                {createRemediationMutation.isPending ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Plus className="h-4 w-4 mr-2" />}
                                Create Remediation Task
                            </Button>
                        </div>
                    </div>
                )}
            </EnhancedDialog>
        </div>
    );
}
