import React, { useState, useEffect } from 'react';
import { useParams, useLocation } from 'wouter';
import { Button } from "@complianceos/ui/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@complianceos/ui/ui/card";
import { Badge } from "@complianceos/ui/ui/badge";
import { Progress } from "@complianceos/ui/ui/progress";
import { RadioGroup, RadioGroupItem } from "@complianceos/ui/ui/radio-group";
import { Label } from "@complianceos/ui/ui/label";
import { Input } from "@complianceos/ui/ui/input";
import { Textarea } from "@complianceos/ui/ui/textarea";
import { Checkbox } from "@complianceos/ui/ui/checkbox";
import { Alert, AlertDescription } from "@complianceos/ui/ui/alert";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@complianceos/ui/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@complianceos/ui/ui/select";
import { Separator } from "@complianceos/ui/ui/separator";
import { toast } from "sonner";
import { ArrowLeft, ArrowRight, CheckCircle2, Clock, AlertTriangle, Shield, Target, TrendingUp, Users, FileText, Download, BookOpen, Award } from "lucide-react";
import DashboardLayout from "@/components/DashboardLayout";

interface SOC2TrustCriteria {
  id: string;
  category: string;
  principle: string;
  criteria: string;
  points: string[];
  implemented: boolean;
  evidence: string[];
  maturity: 'not-implemented' | 'initial' | 'repeatable' | 'defined' | 'managed' | 'measured' | 'optimized';
  notes?: string;
}

interface SOC2ReadinessAssessment {
  id: string;
  type: 'type1' | 'type2';
  readinessScore: number;
  targetScore: number;
  trustCriteria: SOC2TrustCriteria[];
  organization: string;
  systemDescription: string;
  serviceDescription: string;
  lastUpdated: string;
  recommendations: string[];
  implementationTimeline: Milestone[];
}

interface Milestone {
  id: string;
  title: string;
  description: string;
  targetDate: string;
  status: 'pending' | 'in-progress' | 'completed';
  dependencies: string[];
  priority: 'high' | 'medium' | 'low';
}

// SOC 2 Trust Services Criteria (2022)
const SOC2_TRUST_CRITERIA = {
  security: [
    {
      id: 'security-common',
      principle: 'Security',
      criteria: 'Common Criteria',
      points: [
        'Logical and physical access controls',
        'System operation controls',
        'Change management controls',
        'Risk mitigation controls'
      ]
    },
    {
      id: 'security-ar',
      principle: 'Security',
      criteria: 'Arising from Risk Assessment',
      points: [
        'Risk assessment methodology',
        'Threat identification',
        'Vulnerability analysis',
        'Risk treatment process'
      ]
    },
    {
      id: 'security-cm',
      principle: 'Security',
      criteria: 'Communication and Management',
      points: [
        'Information security policies',
        'Security awareness training',
        'Incident response procedures',
        'Vendor management'
      ]
    }
  ],
  availability: [
    {
      id: 'availability-ao',
      principle: 'Availability',
      criteria: 'Availability Online',
      points: [
        'System availability monitoring',
        'Performance measurement',
        'Disaster recovery procedures',
        'Business continuity planning'
      ]
    }
  ],
  processing_integrity: [
    {
      id: 'pi-detection',
      principle: 'Processing Integrity',
      criteria: 'Detection of Processing Errors',
      points: [
        'Input validation controls',
        'Processing validation controls',
        'Output validation controls',
        'Error logging and monitoring'
      ]
    },
    {
      id: 'pi-correction',
      principle: 'Processing Integrity',
      criteria: 'Correction of Processing Errors',
      points: [
        'Error correction procedures',
        'Rollback capabilities',
        'Data reconciliation processes',
        'Exception handling procedures'
      ]
    },
    {
      id: 'pi-timeliness',
      principle: 'Processing Integrity',
      criteria: 'Processing in Timely Manner',
      points: [
        'Processing performance standards',
        'Service level objectives',
        'Throughput monitoring',
        'Latency measurement'
      ]
    }
  ],
  confidentiality: [
    {
      id: 'confidentiality-data',
      principle: 'Confidentiality',
      criteria: 'Data at Rest',
      points: [
        'Encryption controls',
        'Access control mechanisms',
        'Data classification procedures',
        'Storage security measures'
      ]
    },
    {
      id: 'confidentiality-transit',
      principle: 'Confidentiality',
      criteria: 'Data in Transit',
      points: [
        'Transport encryption',
        'Secure transmission protocols',
        'Network security controls',
        'Endpoint protection'
      ]
    }
  ],
  privacy: [
    {
      id: 'privacy-collection',
      principle: 'Privacy',
      criteria: 'Data Collection and Retention',
      points: [
        'Data minimization practices',
        'Purpose limitation controls',
        'Retention policy implementation',
        'Data lifecycle management'
      ]
    },
    {
      id: 'privacy-usage',
      principle: 'Privacy',
      criteria: 'Data Usage and Processing',
      points: [
        'Consent management',
        'Processing purpose controls',
        'Third-party sharing controls',
        'User rights implementation'
      ]
    },
    {
      id: 'privacy-rights',
      principle: 'Privacy',
      criteria: 'Data Subject Rights',
      points: [
        'Access request procedures',
        'Correction mechanisms',
        'Deletion processes',
        'Portability capabilities'
      ]
    }
  ]
};

const MATURITY_LEVELS = {
  'not-implemented': { score: 0, label: 'Not Implemented', color: 'bg-red-100 text-red-800' },
  'initial': { score: 20, label: 'Initial', color: 'bg-orange-100 text-orange-800' },
  'repeatable': { score: 40, label: 'Repeatable', color: 'bg-yellow-100 text-yellow-800' },
  'defined': { score: 60, label: 'Defined', color: 'bg-blue-100 text-blue-800' },
  'managed': { score: 80, label: 'Managed', color: 'bg-indigo-100 text-indigo-800' },
  'measured': { score: 90, label: 'Measured', color: 'bg-purple-100 text-purple-800' },
  'optimized': { score: 100, label: 'Optimized', color: 'bg-green-100 text-green-800' }
};

const STEPS = [
  'System Overview',
  'Trust Criteria Assessment',
  'Gap Analysis',
  'Readiness Score',
  'Implementation Roadmap'
];

export default function SOC2ReadinessWizard() {
  const { clientId } = useParams();
  const [location, setLocation] = useLocation();
  
  const [currentStep, setCurrentStep] = useState(0);
  const [soc2Type, setSOC2Type] = useState<'type1' | 'type2'>('type2');
  const [organization, setOrganization] = useState('');
  const [systemDescription, setSystemDescription] = useState('');
  const [serviceDescription, setServiceDescription] = useState('');
  const [trustCriteria, setTrustCriteria] = useState<SOC2TrustCriteria[]>([]);
  const [showResults, setShowResults] = useState(false);
  const [showExportDialog, setShowExportDialog] = useState(false);

  // Initialize trust criteria
  useEffect(() => {
    const initialCriteria: SOC2TrustCriteria[] = [];
    
    Object.entries(SOC2_TRUST_CRITERIA).forEach(([category, criteria]) => {
      criteria.forEach((criterion, index) => {
        initialCriteria.push({
          id: `${category}-${index}`,
          category,
          principle: criterion.principle,
          criteria: criterion.criteria,
          points: criterion.points,
          implemented: false,
          evidence: [],
          maturity: 'not-implemented',
          notes: ''
        });
      });
    });
    
    setTrustCriteria(initialCriteria);
  }, []);

  const handleCriteriaChange = (id: string, field: keyof SOC2TrustCriteria, value: any) => {
    setTrustCriteria(prev => prev.map(criteria => 
      criteria.id === id ? { ...criteria, [field]: value } : criteria
    ));
  };

  const calculateReadinessScore = () => {
    const totalCriteria = trustCriteria.length;
    const implementedCount = trustCriteria.filter(c => c.implemented).length;
    
    const maturityScores = trustCriteria.reduce((sum, criteria) => {
      return sum + (MATURITY_LEVELS[criteria.maturity].score || 0);
    }, 0);
    
    const avgMaturity = totalCriteria > 0 ? maturityScores / totalCriteria : 0;
    const implementationScore = totalCriteria > 0 ? (implementedCount / totalCriteria) * 100 : 0;
    
    // Weighted score: 70% maturity, 30% implementation
    const finalScore = Math.round((avgMaturity * 0.7) + (implementationScore * 0.3));
    
    return finalScore;
  };

  const generateGapAnalysis = () => {
    return trustCriteria.filter(criteria => 
      !criteria.implemented || criteria.maturity === 'not-implemented'
    ).map(criteria => ({
      category: criteria.category,
      principle: criteria.principle,
      criteria: criteria.criteria,
      gap: !criteria.implemented ? 'Not Implemented' : 'Low Maturity',
      priority: criteria.principle === 'Security' ? 'high' : 'medium',
      effort: criteria.maturity === 'not-implemented' ? 'high' : 'medium'
    }));
  };

  const generateRoadmap = () => {
    const gaps = generateGapAnalysis();
    const currentDate = new Date();
    
    return gaps.map((gap, index) => {
      const targetDate = new Date(currentDate);
      targetDate.setMonth(currentDate.getMonth() + (index + 1) * 2);
      
      return {
        id: `milestone_${index}`,
        title: `Implement ${gap.principle} Controls`,
        description: `Address ${gap.gap} in ${gap.criteria}`,
        targetDate: targetDate.toISOString().split('T')[0],
        status: 'pending' as 'pending' | 'in-progress' | 'completed',
        dependencies: index > 0 ? [`milestone_${index - 1}`] : [],
        priority: gap.priority as 'high' | 'medium' | 'low'
      };
    });
  };

  const getProgressValue = (status: 'pending' | 'in-progress' | 'completed') => {
    switch (status) {
      case 'completed': return 100;
      case 'in-progress': return 50;
      default: return 0;
    }
  };

  const generateRecommendations = (score: number) => {
    const recommendations = [];
    
    if (score < 60) {
      recommendations.push('Focus on implementing basic security controls across all Trust Services Criteria');
      recommendations.push('Establish formal information security policies and procedures');
      recommendations.push('Conduct comprehensive risk assessment and treatment planning');
    } else if (score < 80) {
      recommendations.push('Enhance existing controls to achieve defined or managed maturity levels');
      recommendations.push('Implement automated monitoring and measurement processes');
      recommendations.push('Establish formal incident response and management procedures');
    } else {
      recommendations.push('Prepare for SOC 2 Type 2 audit readiness assessment');
      recommendations.push('Implement continuous monitoring and improvement processes');
      recommendations.push('Enhance documentation and evidence collection procedures');
    }
    
    // Category-specific recommendations
    const categoryGaps = generateGapAnalysis();
    const highRiskCategories = [...new Set(categoryGaps.filter(gap => gap.priority === 'high').map(gap => gap.category))];
    
    if (highRiskCategories.length > 0) {
      recommendations.push(`Prioritize improvements in: ${highRiskCategories.join(', ')}`);
    }
    
    return recommendations;
  };

  const getReadinessStatus = (score: number) => {
    if (score >= 80) return { status: 'Audit Ready', color: 'text-green-600', bgColor: 'bg-green-100' };
    if (score >= 60) return { status: 'Ready for Review', color: 'text-yellow-600', bgColor: 'bg-yellow-100' };
    return { status: 'Needs Improvement', color: 'text-red-600', bgColor: 'bg-red-100' };
  };

  const renderStep = () => {
    switch (currentStep) {
      case 0:
        return (
          <div className="space-y-6">
            <div>
              <h2 className="text-xl font-semibold mb-4">System Overview</h2>
              <p className="text-gray-600 dark:text-gray-400 mb-6">
                Provide basic information about your organization and the system being assessed.
              </p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Users className="h-5 w-5" />
                    <span>Organization Details</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label htmlFor="organization">Organization Name</Label>
                    <Input
                      id="organization"
                      placeholder="Enter your organization name"
                      value={organization}
                      onChange={(e) => setOrganization(e.target.value)}
                      className="mt-2"
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="soc2-type">SOC 2 Type</Label>
                    <Select value={soc2Type} onValueChange={(value: 'type1' | 'type2') => setSOC2Type(value)}>
                      <SelectTrigger className="mt-2">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="type1">SOC 2 Type 1 (Controls at a point in time)</SelectItem>
                        <SelectItem value="type2">SOC 2 Type 2 (Operating effectiveness over time)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <BookOpen className="h-5 w-5" />
                    <span>System Description</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label htmlFor="system-description">System Description</Label>
                    <Textarea
                      id="system-description"
                      placeholder="Describe the system, platform, or service being assessed..."
                      value={systemDescription}
                      onChange={(e) => setSystemDescription(e.target.value)}
                      className="mt-2"
                      rows={4}
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="service-description">Service Description</Label>
                    <Textarea
                      id="service-description"
                      placeholder="Describe the services provided by this system..."
                      value={serviceDescription}
                      onChange={(e) => setServiceDescription(e.target.value)}
                      className="mt-2"
                      rows={4}
                    />
                  </div>
                </CardContent>
              </Card>
            </div>

            <Alert>
              <Shield className="h-4 w-4" />
              <AlertDescription>
                {soc2Type === 'type1' ? 
                  'SOC 2 Type 1 focuses on controls at a specific point in time. You\'ll need to document your system controls and their design.' :
                  'SOC 2 Type 2 assesses operating effectiveness over time. You\'ll need to demonstrate ongoing monitoring and testing.'}
              </AlertDescription>
            </Alert>
          </div>
        );

      case 1:
        return (
          <div className="space-y-6">
            <div>
              <h2 className="text-xl font-semibold mb-4">Trust Services Criteria Assessment</h2>
              <p className="text-gray-600 dark:text-gray-400 mb-6">
                Evaluate your implementation of SOC 2 Trust Services Criteria across Security, Availability, Processing Integrity, Confidentiality, and Privacy.
              </p>
            </div>
            
            <div className="space-y-6">
              {Object.entries(SOC2_TRUST_CRITERIA).map(([category, criteria]) => (
                <Card key={category}>
                  <CardHeader>
                    <CardTitle className="flex items-center justify-between">
                      <span className="capitalize">{category.replace('_', ' ')} Principles</span>
                      <Badge variant="outline">{criteria.length} criteria</Badge>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {criteria.map((criterion, index) => {
                      const criteriaItem = trustCriteria.find(c => c.id === `${category}-${index}`);
                      
                      return (
                        <div key={index} className="border rounded-lg p-4 space-y-4">
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <h4 className="font-semibold mb-2">{criterion.principle}</h4>
                              <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">{criterion.criteria}</p>
                              
                              <div className="space-y-2">
                                <Label className="text-sm font-medium">Implementation Status</Label>
                                <Checkbox
                                  checked={criteriaItem?.implemented || false}
                                  onCheckedChange={(checked) => 
                                    handleCriteriaChange(`${category}-${index}`, 'implemented', checked)
                                  }
                                >
                                  Implemented
                                </Checkbox>
                                
                                {criteriaItem?.implemented && (
                                  <>
                                    <Label className="text-sm font-medium">Maturity Level</Label>
                                    <Select 
                                      value={criteriaItem?.maturity || 'not-implemented'} 
                                      onValueChange={(value: any) => 
                                        handleCriteriaChange(`${category}-${index}`, 'maturity', value)
                                      }
                                    >
                                      <SelectTrigger>
                                        <SelectValue />
                                      </SelectTrigger>
                                      <SelectContent>
                                        {Object.entries(MATURITY_LEVELS).map(([key, level]) => (
                                          <SelectItem key={key} value={key}>
                                            <div className="flex items-center space-x-2">
                                              <div className={`w-3 h-3 rounded-full ${level.color}`}></div>
                                              <span>{level.label}</span>
                                            </div>
                                          </SelectItem>
                                        ))}
                                      </SelectContent>
                                    </Select>
                                  </>
                                )}
                              </div>
                              
                              <div className="space-y-1">
                                <Label className="text-xs font-medium text-gray-500">Key Points</Label>
                                {criterion.points.map((point, pointIndex) => (
                                  <div key={pointIndex} className="flex items-center space-x-2">
                                    <div className="w-1.5 h-1.5 rounded-full bg-blue-600"></div>
                                    <span className="text-xs text-gray-600">{point}</span>
                                  </div>
                                ))}
                              </div>
                            </div>
                            
                            <div className="ml-4">
                              <Badge className={MATURITY_LEVELS[criteriaItem?.maturity || 'not-implemented'].color}>
                                {MATURITY_LEVELS[criteriaItem?.maturity || 'not-implemented'].label}
                              </Badge>
                            </div>
                          </div>
                          
                          {criteriaItem?.implemented && (
                            <div className="mt-3">
                              <Label htmlFor={`notes-${category}-${index}`} className="text-sm">Implementation Notes</Label>
                              <Textarea
                                id={`notes-${category}-${index}`}
                                placeholder="Add notes about implementation, evidence, or challenges..."
                                value={criteriaItem?.notes || ''}
                                onChange={(e) => 
                                  handleCriteriaChange(`${category}-${index}`, 'notes', e.target.value)
                                }
                                rows={3}
                                className="mt-1"
                              />
                            </div>
                          )}
                        </div>
                      );
                    })}
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
              <h2 className="text-xl font-semibold mb-4">Gap Analysis</h2>
              <p className="text-gray-600 dark:text-gray-400 mb-6">
                Identified gaps in your SOC 2 Trust Services Criteria implementation.
              </p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              <Card>
                <CardContent className="p-4 text-center">
                  <AlertTriangle className="h-8 w-8 text-red-600 mx-auto mb-2" />
                  <h3 className="font-semibold mb-2">Critical Gaps</h3>
                  <p className="text-2xl font-bold text-red-600">
                    {gaps.filter(g => g.priority === 'high').length}
                  </p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4 text-center">
                  <Clock className="h-8 w-8 text-yellow-600 mx-auto mb-2" />
                  <h3 className="font-semibold mb-2">Medium Gaps</h3>
                  <p className="text-2xl font-bold text-yellow-600">
                    {gaps.filter(g => g.priority === 'medium').length}
                  </p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4 text-center">
                  <Target className="h-8 w-8 text-blue-600 mx-auto mb-2" />
                  <h3 className="font-semibold mb-2">Total Score</h3>
                  <p className="text-2xl font-bold text-blue-600">
                    {calculateReadinessScore()}%
                  </p>
                </CardContent>
              </Card>
            </div>
            
            <div className="space-y-4">
              {gaps.map((gap, index) => (
                <Card key={index}>
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-3 mb-2">
                          <Badge variant="outline" className="capitalize">{gap.category}</Badge>
                          <Badge variant={gap.priority === 'high' ? 'destructive' : 'secondary'}>
                            {gap.priority} priority
                          </Badge>
                        </div>
                        <h4 className="font-semibold mb-2">{gap.principle}</h4>
                        <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">{gap.criteria}</p>
                        <div className="flex items-center space-x-4 text-sm">
                          <span>Gap: {gap.gap}</span>
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
        const status = getReadinessStatus(score);
        const recommendations = generateRecommendations(score);
        
        return (
          <div className="space-y-6">
            <div>
              <h2 className="text-xl font-semibold mb-4">Readiness Assessment Score</h2>
              <p className="text-gray-600 dark:text-gray-400 mb-6">
                Your overall SOC 2 readiness assessment based on Trust Services Criteria.
              </p>
            </div>
            
            <div className="text-center space-y-6">
              <div className="relative inline-flex items-center justify-center">
                <div className="text-6xl font-bold">{score}%</div>
                <div className={`absolute -top-2 -right-2 px-3 py-1 rounded-full text-xs font-medium ${status.bgColor} ${status.color}`}>
                  {status.status}
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
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Award className="h-5 w-5 text-green-600" />
                    <span>Strengths</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2">
                    {trustCriteria
                      .filter(c => c.implemented)
                      .slice(0, 5)
                      .map((criteria, index) => (
                        <li key={index} className="flex items-center space-x-2">
                          <CheckCircle2 className="h-4 w-4 text-green-500" />
                          <span className="text-sm">{criteria.principle}</span>
                        </li>
                      ))}
                  </ul>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <TrendingUp className="h-5 w-5 text-blue-600" />
                    <span>Recommendations</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2">
                    {recommendations.slice(0, 5).map((rec, index) => (
                      <li key={index} className="flex items-start space-x-2">
                        <ArrowRight className="h-4 w-4 text-blue-500 mt-0.5" />
                        <span className="text-sm">{rec}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            </div>
          </div>
        );

      case 4:
        const roadmap = generateRoadmap();
        return (
          <div className="space-y-6">
            <div>
              <h2 className="text-xl font-semibold mb-4">Implementation Roadmap</h2>
              <p className="text-gray-600 dark:text-gray-400 mb-6">
                Generated roadmap to achieve SOC 2 Type 2 readiness.
              </p>
            </div>
            
            <div className="space-y-4">
              {roadmap.map((milestone, index) => (
                <Card key={index}>
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-3 mb-2">
                          <div className="flex items-center justify-center w-8 h-8 rounded-full bg-blue-600 text-white font-medium">
                            {index + 1}
                          </div>
                          <h3 className="font-semibold">{milestone.title}</h3>
                          <Badge variant="outline">{milestone.targetDate}</Badge>
                          {milestone.priority === 'high' && (
                            <Badge variant="destructive">High Priority</Badge>
                          )}
                        </div>
                        <p className="text-gray-600 dark:text-gray-400 mb-3">{milestone.description}</p>
                        <Progress value={getProgressValue(milestone.status)} className="h-2" />
                      </div>
                      <Button variant="outline" size="sm">
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
                onClick={() => setShowExportDialog(true)}
              >
                <Download className="h-4 w-4 mr-2" />
                Export Assessment
              </Button>
              <Button 
                onClick={() => {
                  toast.success("SOC 2 Readiness Assessment completed!");
                  setLocation(`/clients/${clientId}/cyber`);
                }}
              >
                <CheckCircle2 className="h-4 w-4 mr-2" />
                Start Implementation
              </Button>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  const handleNext = () => {
    if (currentStep < STEPS.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      setShowResults(true);
      toast.success("SOC 2 Readiness Assessment completed!");
    }
  };

  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const isStepValid = () => {
    switch (currentStep) {
      case 0: return organization && soc2Type;
      case 1: return trustCriteria.some(c => c.implemented);
      case 2: return true;
      case 3: return true;
      case 4: return true;
      default: return false;
    }
  };

  return (
    <DashboardLayout>
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Header */}
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center space-x-4">
              <Button
                variant="ghost"
                onClick={() => setLocation(`/clients/${clientId}/cyber`)}
                className="flex items-center space-x-2"
              >
                <ArrowLeft className="h-4 w-4" />
                <span>Back to SOC 2</span>
              </Button>
              <div>
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                  SOC 2 {soc2Type.toUpperCase()} Readiness Assessment
                </h1>
                <p className="text-gray-600 dark:text-gray-400">
                  Comprehensive Trust Services Criteria evaluation and implementation roadmap
                </p>
              </div>
            </div>
          </div>

          {/* Progress */}
          <div className="mb-8">
            <div className="flex items-center justify-between mb-4">
              <div className="flex space-x-2">
                {STEPS.map((step, index) => (
                  <div key={index} className="flex items-center">
                    <div
                      className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                        index <= currentStep 
                          ? 'bg-blue-600 text-white' 
                          : 'bg-gray-200 text-gray-600'
                      }`}
                    >
                      {index < currentStep ? '✓' : index + 1}
                    </div>
                    <span className={`ml-2 text-sm ${
                      index <= currentStep ? 'text-blue-600' : 'text-gray-500'
                    }`}>
                      {step}
                    </span>
                    {index < STEPS.length - 1 && (
                      <div className={`w-8 h-0.5 mx-2 ${
                        index < currentStep ? 'bg-blue-600' : 'bg-gray-200'
                      }`} />
                    )}
                  </div>
                ))}
              </div>
            </div>
            <Progress value={(currentStep / (STEPS.length - 1)) * 100} className="h-2" />
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
              disabled={!isStepValid()}
            >
              {currentStep === STEPS.length - 1 ? 'Complete Assessment' : 'Next'}
              <ArrowRight className="h-4 w-4 ml-2" />
            </Button>
          </div>
        </div>
      </div>

      {/* Export Dialog */}
      <Dialog open={showExportDialog} onOpenChange={setShowExportDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Export SOC 2 Readiness Assessment</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <Button variant="outline">
                <FileText className="h-4 w-4 mr-2" />
                PDF Report
              </Button>
              <Button variant="outline">
                <FileText className="h-4 w-4 mr-2" />
                Excel Dashboard
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
              <FileText className="h-4 w-4" />
              <AlertDescription>
                Export includes: Trust Services Criteria assessment, gap analysis, 
                readiness score, implementation roadmap, and executive summary.
              </AlertDescription>
            </Alert>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowExportDialog(false)}>
              Cancel
            </Button>
            <Button onClick={() => {
              toast.success("Assessment exported successfully!");
              setShowExportDialog(false);
            }}>
              Export
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
}