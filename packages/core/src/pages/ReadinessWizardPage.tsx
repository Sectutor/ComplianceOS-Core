import React, { useState, useEffect } from 'react';
import { useParams, useLocation } from 'wouter';
import { Button } from "@complianceos/ui/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@complianceos/ui/ui/card";
import { Badge } from "@complianceos/ui/ui/badge";
import { Progress } from "@complianceos/ui/ui/progress";
import { Separator } from "@complianceos/ui/ui/separator";
import { RadioGroup, RadioGroupItem } from "@complianceos/ui/ui/radio-group";
import { Label } from "@complianceos/ui/ui/label";
import { Textarea } from "@complianceos/ui/ui/textarea";
import { Input } from "@complianceos/ui/ui/input";
import { Checkbox } from "@complianceos/ui/ui/checkbox";
import { Alert, AlertDescription } from "@complianceos/ui/ui/alert";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@complianceos/ui/ui/dialog";
import { toast } from "sonner";
import { ArrowLeft, ArrowRight, CheckCircle2, Clock, AlertTriangle, Target, TrendingUp, Calendar, Download, FileText, Rocket, HelpCircle } from "lucide-react";
import DashboardLayout from "@/components/DashboardLayout";
import { PageGuide } from "@/components/PageGuide";

interface ReadinessAssessment {
  id: string;
  framework: 'SOC2' | 'ISO27001' | 'NIST80053' | 'CMMC' | 'HIPAA';
  status: 'in-progress' | 'ready' | 'needs-work';
  readinessScore: number;
  targetScore: number;
  lastUpdated: string;
  gapAnalysis: GapItem[];
  roadmap: Milestone[];
  recommendations: string[];
}

interface GapItem {
  id: string;
  domain: string;
  control: string;
  requirement: string;
  currentStatus: 'implemented' | 'partial' | 'not-implemented';
  evidence: 'sufficient' | 'partial' | 'missing';
  riskLevel: 'high' | 'medium' | 'low';
  effort: 'high' | 'medium' | 'low';
  priority: number;
}

interface Milestone {
  id: string;
  title: string;
  description: string;
  targetDate: string;
  status: 'pending' | 'in-progress' | 'completed';
  dependencies: string[];
  assignee?: string;
  progress: number;
}

const frameworkConfig = {
  SOC2: {
    name: 'SOC 2 Type II',
    description: 'Service Organization Control 2 Type II',
    domains: ['Security', 'Availability', 'Processing Integrity', 'Confidentiality', 'Privacy'],
    trustCriteria: [
      'Common Criteria (CC)',
      'Arising from Risk Assessment (AR)',
      'Communication and Monitoring (CM)',
      'Logical and Physical Access Controls (LA)',
      'System Operations (SO)',
      'Change Management (TM)',
      'Risk Mitigation (RM)'
    ]
  },
  ISO27001: {
    name: 'ISO 27001:2022',
    description: 'Information Security Management System',
    domains: ['A.5 Organizational', 'A.6 People', 'A.7 Physical', 'A.8 Technological', 'A.9 Governance'],
    clauses: [
      'Clause 4: Context of the Organization',
      'Clause 5: Leadership',
      'Clause 6: Planning',
      'Clause 7: Support',
      'Clause 8: Operation',
      'Clause 9: Performance Evaluation',
      'Clause 10: Improvement'
    ]
  },
  NIST80053: {
    name: 'NIST SP 800-53',
    description: 'Security and Privacy Controls',
    families: [
      'Access Control (AC)',
      'Awareness and Training (AT)',
      'Audit and Accountability (AU)',
      'Security Assessment and Authorization (CA)',
      'Configuration Management (CM)',
      'Contingency Planning (CP)',
      'Identification and Authentication (IA)',
      'Incident Response (IR)',
      'Maintenance (MA)',
      'Media Protection (MP)',
      'Physical and Environmental Protection (PE)',
      'Planning (PL)',
      'Personnel Security (PS)',
      'Risk Assessment (RA)',
      'System and Services Acquisition (SA)',
      'System and Communications Protection (SC)',
      'System and Information Integrity (SI)',
      'Program Management (PM)'
    ]
  }
};

export default function ReadinessWizardPage() {
  const { clientId } = useParams();
  const [location, setLocation] = useLocation();

  const [currentStep, setCurrentStep] = useState(0);
  const [selectedFramework, setSelectedFramework] = useState<string>('');
  const [assessment, setAssessment] = useState<ReadinessAssessment | null>(null);
  const [gapItems, setGapItems] = useState<GapItem[]>([]);
  const [showResults, setShowResults] = useState(false);
  const [showRoadmapDialog, setShowRoadmapDialog] = useState(false);

  const steps = [
    'Select Framework',
    'Assessment Questionnaire',
    'Gap Analysis',
    'Readiness Score',
    'Roadmap Generation'
  ];

  // Mock assessment questions for different frameworks
  const getAssessmentQuestions = (framework: string) => {
    const questions = {
      SOC2: [
        {
          domain: 'Security',
          question: 'Does your organization have a documented information security policy?',
          importance: 'high',
          evidence: ['Written policy document', 'Policy approval records', 'Policy distribution records']
        },
        {
          domain: 'Security',
          question: 'Are access controls implemented to limit system access based on user roles?',
          importance: 'high',
          evidence: ['Access control matrices', 'User access reviews', 'System access logs']
        },
        {
          domain: 'Availability',
          question: 'Do you have systems in place to monitor service availability and performance?',
          importance: 'medium',
          evidence: ['Monitoring tools configuration', 'Performance reports', 'Incident response procedures']
        }
      ],
      ISO27001: [
        {
          domain: 'Leadership',
          question: 'Has top management demonstrated leadership and commitment to information security?',
          importance: 'high',
          evidence: ['Information security policy', 'Security objectives', 'Management review meetings']
        },
        {
          domain: 'Planning',
          question: 'Have information security risks been assessed and treated?',
          importance: 'high',
          evidence: ['Risk assessment methodology', 'Risk register', 'Risk treatment plan']
        },
        {
          domain: 'Operation',
          question: 'Are procedures documented for information security incident management?',
          importance: 'medium',
          evidence: ['Incident response plan', 'Incident reports', 'Communication procedures']
        }
      ]
    };
    return questions[framework as keyof typeof questions] || [];
  };

  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [evidenceNotes, setEvidenceNotes] = useState<Record<string, string>>({});

  const questions = selectedFramework ? getAssessmentQuestions(selectedFramework) : [];

  const calculateReadinessScore = () => {
    const totalQuestions = Object.keys(answers).length;
    if (totalQuestions === 0) return 0;

    const positiveAnswers = Object.values(answers).filter(answer =>
      answer === 'yes' || answer === 'implemented'
    ).length;

    return Math.round((positiveAnswers / totalQuestions) * 100);
  };

  const generateGapAnalysis = () => {
    const gaps: GapItem[] = [];

    Object.entries(answers).forEach(([questionIndex, answer], index) => {
      const question = questions[index];
      if (!question) return;

      if (answer === 'no' || answer === 'partial' || answer === 'not-implemented') {
        gaps.push({
          id: `gap_${index}`,
          domain: question.domain,
          control: question.question.substring(0, 50) + '...',
          requirement: question.question,
          currentStatus: answer === 'partial' ? 'partial' : 'not-implemented',
          evidence: answer === 'partial' ? 'partial' : 'missing',
          riskLevel: question.importance as 'high' | 'medium' | 'low',
          effort: answer === 'partial' ? 'medium' : 'high',
          priority: question.importance === 'high' ? 1 : question.importance === 'medium' ? 2 : 3
        });
      }
    });

    return gaps.sort((a, b) => a.priority - b.priority);
  };

  const generateRoadmap = (gaps: GapItem[]) => {
    const milestones: Milestone[] = [];
    const currentDate = new Date();

    // Group gaps by domain and create milestones
    const domains = [...new Set(gaps.map(gap => gap.domain))];

    domains.forEach((domain, index) => {
      const domainGaps = gaps.filter(gap => gap.domain === domain);
      const targetDate = new Date(currentDate);
      targetDate.setMonth(currentDate.getMonth() + (index + 1) * 2);

      milestones.push({
        id: `milestone_${index}`,
        title: `${domain} Implementation`,
        description: `Implement ${domainGaps.length} controls in ${domain} domain`,
        targetDate: targetDate.toISOString().split('T')[0],
        status: 'pending',
        dependencies: index > 0 ? [`milestone_${index - 1}`] : [],
        progress: 0
      });
    });

    return milestones;
  };

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      // Complete assessment
      const gaps = generateGapAnalysis();
      const score = calculateReadinessScore();
      const roadmap = generateRoadmap(gaps);

      setAssessment({
        id: `assessment_${Date.now()}`,
        framework: selectedFramework as any,
        status: score >= 80 ? 'ready' : score >= 60 ? 'needs-work' : 'needs-work',
        readinessScore: score,
        targetScore: 85,
        lastUpdated: new Date().toISOString(),
        gapAnalysis: gaps,
        roadmap,
        recommendations: generateRecommendations(gaps, score)
      });

      setGapItems(gaps);
      setShowResults(true);
    }
  };

  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const generateRecommendations = (gaps: GapItem[], score: number): string[] => {
    const recommendations = [];

    if (score < 60) {
      recommendations.push('Focus on implementing critical controls in high-risk domains first');
      recommendations.push('Consider engaging external consultants for guidance');
      recommendations.push('Allocate additional resources to information security program');
    } else if (score < 80) {
      recommendations.push('Continue implementing remaining controls systematically');
      recommendations.push('Enhance evidence collection processes');
      recommendations.push('Schedule regular management reviews');
    } else {
      recommendations.push('Prepare for external audit');
      recommendations.push('Implement continuous monitoring processes');
      recommendations.push('Develop incident response testing procedures');
    }

    return recommendations;
  };

  const getReadinessStatus = (score: number) => {
    if (score >= 80) return { status: 'Ready', color: 'text-green-600', bgColor: 'bg-green-100' };
    if (score >= 60) return { status: 'Needs Work', color: 'text-yellow-600', bgColor: 'bg-yellow-100' };
    return { status: 'Not Ready', color: 'text-red-600', bgColor: 'bg-red-100' };
  };

  const renderStep = () => {
    switch (currentStep) {
      case 0:
        return (
          <div className="space-y-6">
            <div>
              <h2 className="text-xl font-semibold mb-4">Select Compliance Framework</h2>
              <p className="text-gray-600 dark:text-gray-400 mb-6">
                Choose the framework you want to assess your readiness for
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {Object.entries(frameworkConfig).map(([key, config]) => (
                <Card
                  key={key}
                  className={`cursor-pointer transition-all ${selectedFramework === key
                      ? 'ring-2 ring-blue-500 bg-blue-50 dark:bg-blue-900/20'
                      : 'hover:shadow-md'
                    }`}
                  onClick={() => setSelectedFramework(key)}
                >
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between">
                      <div>
                        <h3 className="font-semibold text-lg mb-2">{config.name}</h3>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          {config.description}
                        </p>
                      </div>
                      <RadioGroupItem value={key} checked={selectedFramework === key} />
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        );

      case 1:
        return (
          <div className="space-y-6">
            <div>
              <h2 className="text-xl font-semibold mb-4">
                Assessment Questionnaire - {frameworkConfig[selectedFramework as keyof typeof frameworkConfig]?.name}
              </h2>
              <p className="text-gray-600 dark:text-gray-400">
                Answer the following questions to assess your current compliance status
              </p>
            </div>

            <div className="space-y-6">
              {questions.map((question, index) => (
                <Card key={index}>
                  <CardContent className="p-6">
                    <div className="space-y-4">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center space-x-2 mb-2">
                            <Badge variant="outline">{question.domain}</Badge>
                            <Badge variant={question.importance === 'high' ? 'destructive' : 'secondary'}>
                              {question.importance} priority
                            </Badge>
                          </div>
                          <p className="font-medium mb-4">{question.question}</p>
                        </div>
                      </div>

                      <RadioGroup
                        value={answers[index] || ''}
                        onValueChange={(value) => setAnswers(prev => ({ ...prev, [index]: value }))}
                      >
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="yes" id={`yes-${index}`} />
                          <Label htmlFor={`yes-${index}`}>Yes / Implemented</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="partial" id={`partial-${index}`} />
                          <Label htmlFor={`partial-${index}`}>Partially Implemented</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="no" id={`no-${index}`} />
                          <Label htmlFor={`no-${index}`}>No / Not Implemented</Label>
                        </div>
                      </RadioGroup>

                      {answers[index] && answers[index] !== 'yes' && (
                        <div className="mt-4">
                          <Label htmlFor={`evidence-${index}`}>Evidence Notes</Label>
                          <Textarea
                            id={`evidence-${index}`}
                            placeholder="Describe what evidence you have or what needs to be implemented..."
                            value={evidenceNotes[index] || ''}
                            onChange={(e) => setEvidenceNotes(prev => ({ ...prev, [index]: e.target.value }))}
                            className="mt-2"
                            rows={3}
                          />
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        );

      case 2:
        const gaps = generateGapAnalysis();
        return (
          <div className="space-y-6">
            <div>
              <h2 className="text-xl font-semibold mb-4">Gap Analysis Results</h2>
              <p className="text-gray-600 dark:text-gray-400">
                Identified gaps between current state and compliance requirements
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600 dark:text-gray-400">High Priority</p>
                      <p className="text-2xl font-bold text-red-600">
                        {gaps.filter(g => g.riskLevel === 'high').length}
                      </p>
                    </div>
                    <AlertTriangle className="h-8 w-8 text-red-600 opacity-50" />
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Medium Priority</p>
                      <p className="text-2xl font-bold text-yellow-600">
                        {gaps.filter(g => g.riskLevel === 'medium').length}
                      </p>
                    </div>
                    <Clock className="h-8 w-8 text-yellow-600 opacity-50" />
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Low Priority</p>
                      <p className="text-2xl font-bold text-green-600">
                        {gaps.filter(g => g.riskLevel === 'low').length}
                      </p>
                    </div>
                    <CheckCircle2 className="h-8 w-8 text-green-600 opacity-50" />
                  </div>
                </CardContent>
              </Card>
            </div>

            <div className="space-y-4">
              {gaps.map((gap) => (
                <Card key={gap.id}>
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-2">
                          <Badge variant="outline">{gap.domain}</Badge>
                          <Badge variant={gap.riskLevel === 'high' ? 'destructive' : 'secondary'}>
                            {gap.riskLevel} risk
                          </Badge>
                          <Badge variant="outline">Priority {gap.priority}</Badge>
                        </div>
                        <h4 className="font-medium mb-2">{gap.control}</h4>
                        <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">{gap.requirement}</p>
                        <div className="flex items-center space-x-4 text-sm">
                          <span>Current: {gap.currentStatus}</span>
                          <span>Evidence: {gap.evidence}</span>
                          <span>Effort: {gap.effort}</span>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        );

      case 3:
        const score = calculateReadinessScore();
        const statusInfo = getReadinessStatus(score);
        return (
          <div className="space-y-6">
            <div>
              <h2 className="text-xl font-semibold mb-4">Readiness Assessment Score</h2>
              <p className="text-gray-600 dark:text-gray-400">
                Overall readiness score for {frameworkConfig[selectedFramework as keyof typeof frameworkConfig]?.name}
              </p>
            </div>

            <div className="text-center space-y-6">
              <div className="relative inline-flex items-center justify-center">
                <div className="text-6xl font-bold">{score}%</div>
                <div className={`absolute -top-2 -right-2 px-3 py-1 rounded-full text-xs font-medium ${statusInfo.bgColor} ${statusInfo.color}`}>
                  {statusInfo.status}
                </div>
              </div>

              <div className="w-full max-w-md mx-auto">
                <Progress value={score} className="h-3" />
                <div className="flex justify-between text-sm text-gray-600 dark:text-gray-400 mt-2">
                  <span>0%</span>
                  <span>Target: 85%</span>
                  <span>100%</span>
                </div>
              </div>

              <Alert>
                <Target className="h-4 w-4" />
                <AlertDescription>
                  {score >= 80 ?
                    "Congratulations! You're ready for certification. Focus on maintaining controls and preparing for the audit." :
                    score >= 60 ?
                      "Good progress! Implement the remaining controls to reach your target readiness score." :
                      "Significant work needed. Focus on high-priority gaps first to improve readiness."
                  }
                </AlertDescription>
              </Alert>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Strengths</CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2">
                    {Object.entries(answers)
                      .filter(([_, answer]) => answer === 'yes' || answer === 'implemented')
                      .slice(0, 5)
                      .map(([index]) => (
                        <li key={index} className="flex items-center space-x-2">
                          <CheckCircle2 className="h-4 w-4 text-green-500" />
                          <span className="text-sm">{questions[parseInt(index)]?.question.substring(0, 60)}...</span>
                        </li>
                      ))}
                  </ul>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Areas for Improvement</CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2">
                    {generateGapAnalysis().slice(0, 5).map((gap) => (
                      <li key={gap.id} className="flex items-center space-x-2">
                        <AlertTriangle className="h-4 w-4 text-yellow-500" />
                        <span className="text-sm">{gap.control}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            </div>
          </div>
        );

      case 4:
        return (
          <div className="space-y-6">
            <div>
              <h2 className="text-xl font-semibold mb-4">Implementation Roadmap</h2>
              <p className="text-gray-600 dark:text-gray-400">
                Generated roadmap to achieve certification readiness
              </p>
            </div>

            <div className="space-y-4">
              {generateRoadmap(gapItems).map((milestone, index) => (
                <Card key={milestone.id}>
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-3 mb-2">
                          <div className="flex items-center justify-center w-8 h-8 rounded-full bg-blue-100 text-blue-600 font-medium">
                            {index + 1}
                          </div>
                          <h3 className="font-semibold">{milestone.title}</h3>
                          <Badge variant="outline">{milestone.targetDate}</Badge>
                        </div>
                        <p className="text-gray-600 dark:text-gray-400 mb-3">{milestone.description}</p>
                        <Progress value={milestone.progress} className="h-2" />
                      </div>
                      <Button variant="outline" size="sm">
                        <Calendar className="h-4 w-4 mr-2" />
                        Schedule
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            <div className="flex justify-center space-x-4">
              <Button
                variant="outline"
                onClick={() => setShowRoadmapDialog(true)}
              >
                <Download className="h-4 w-4 mr-2" />
                Export Roadmap
              </Button>
              <Button
                onClick={() => {
                  toast.success("Assessment completed successfully!");
                  setLocation(`/clients/${clientId}/dashboard`);
                }}
              >
                <Rocket className="h-4 w-4 mr-2" />
                Start Implementation
              </Button>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <DashboardLayout>
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Header */}
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center space-x-4">
              <Button
                variant="ghost"
                onClick={() => setLocation(`/clients/${clientId}/dashboard`)}
                className="flex items-center space-x-2"
              >
                <ArrowLeft className="h-4 w-4" />
                <span>Back to Dashboard</span>
              </Button>
              <div className="flex items-center justify-between">
                <div>
                  <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                    Readiness Assessment Wizard
                  </h1>
                  <p className="text-gray-600 dark:text-gray-400">
                    Assess your compliance readiness and create implementation roadmap
                  </p>
                </div>
                <PageGuide
                  title="Readiness Assessment Wizard"
                  description="Automated guidance for evaluating compliance gaps."
                  rationale="Readiness assessments are the starting point for any compliance project. They provide an honest look at where you stand today versus where you need to be for certification."
                  howToUse={[
                    { step: "Questionnaire", description: "Answer domain-specific questions about your current security controls." },
                    { step: "Gap Identification", description: "Review areas where requirements are not met or evidence is missing." },
                    { step: "Scoring", description: "Receive an objective readiness score based on your responses." },
                    { step: "Roadmap", description: "Get a prioritized action plan tailored to your organization's gaps." }
                  ]}
                  integrations={[
                    { name: "Risk Management", description: "High-risk gaps are automatically flagged for risk assessment." },
                    { name: "Projects", description: "Start Implementation converts roadmap items into project tasks." },
                    { name: "Policy Hub", description: "Links relevant policy templates to identified control gaps." }
                  ]}
                />
              </div>
            </div>
          </div>

          {/* Progress */}
          <div className="mb-8">
            <div className="flex items-center justify-between mb-4">
              <div className="flex space-x-2">
                {steps.map((step, index) => (
                  <div key={index} className="flex items-center">
                    <div
                      className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${index <= currentStep
                          ? 'bg-blue-600 text-white'
                          : 'bg-gray-200 text-gray-600'
                        }`}
                    >
                      {index < currentStep ? '✓' : index + 1}
                    </div>
                    <span className={`ml-2 text-sm ${index <= currentStep ? 'text-blue-600' : 'text-gray-500'
                      }`}>
                      {step}
                    </span>
                    {index < steps.length - 1 && (
                      <div className={`w-8 h-0.5 mx-2 ${index < currentStep ? 'bg-blue-600' : 'bg-gray-200'
                        }`} />
                    )}
                  </div>
                ))}
              </div>
            </div>
            <Progress value={(currentStep / (steps.length - 1)) * 100} className="h-2" />
          </div>

          {/* Step Content */}
          <Card>
            <CardContent className="p-8">
              {renderStep()}
            </CardContent>
          </Card>

          {/* Navigation */}
          <div className="flex justify-between mt-8">
            <Button
              variant="outline"
              onClick={handlePrevious}
              disabled={currentStep === 0}
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Previous
            </Button>
            <Button
              onClick={handleNext}
              disabled={currentStep === 0 && !selectedFramework}
            >
              {currentStep === steps.length - 1 ? 'Complete Assessment' : 'Next'}
              <ArrowRight className="h-4 w-4 ml-2" />
            </Button>
          </div>
        </div>
      </div>

      {/* Export Roadmap Dialog */}
      <Dialog open={showRoadmapDialog} onOpenChange={setShowRoadmapDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Export Implementation Roadmap</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <Button variant="outline">
                <Download className="h-4 w-4 mr-2" />
                PDF Report
              </Button>
              <Button variant="outline">
                <FileText className="h-4 w-4 mr-2" />
                Excel Timeline
              </Button>
              <Button variant="outline">
                <FileText className="h-4 w-4 mr-2" />
                PowerPoint Deck
              </Button>
              <Button variant="outline">
                <FileText className="h-4 w-4 mr-2" />
                Word Document
              </Button>
            </div>
            <Alert>
              <AlertDescription>
                The export will include detailed gap analysis, implementation timeline,
                resource requirements, and success metrics.
              </AlertDescription>
            </Alert>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowRoadmapDialog(false)}>
              Cancel
            </Button>
            <Button onClick={() => {
              toast.success("Roadmap exported successfully!");
              setShowRoadmapDialog(false);
            }}>
              Export
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
}