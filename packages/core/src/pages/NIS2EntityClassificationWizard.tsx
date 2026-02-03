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
import { toast } from "sonner";
import { ArrowLeft, ArrowRight, CheckCircle2, AlertTriangle, Info, Building, Users, TrendingUp, FileText, Shield, Globe, Target } from "lucide-react";
import DashboardLayout from "@/components/DashboardLayout";

interface EntityClassification {
  id: string;
  sector: string;
  employeeCount: number;
  annualRevenue: number;
  providesEssentialServices: boolean;
  countryOfOperation: string;
  classification: 'essential' | 'important' | 'not-applicable';
  lastUpdated: string;
  evidence: string[];
  authorityRegistration?: {
    authority: string;
    registrationNumber: string;
    registrationDate: string;
  };
}

// NIS2 Critical Sectors as defined by EU Directive
const CRITICAL_SECTORS = [
  {
    id: 'energy',
    name: 'Energy',
    description: 'Electricity, oil, gas, and renewable energy sectors',
    examples: 'Power generation, grid operators, energy suppliers'
  },
  {
    id: 'transport',
    name: 'Transport', 
    description: 'Air, rail, water, and road transport systems',
    examples: 'Airlines, railways, shipping companies, traffic management'
  },
  {
    id: 'banking',
    name: 'Banking',
    description: 'Financial services and digital payment infrastructure',
    examples: 'Banks, payment processors, financial institutions'
  },
  {
    id: 'financial',
    name: 'Financial Market Infrastructure',
    description: 'Stock exchanges, clearing houses, and trading platforms',
    examples: 'Stock markets, investment firms, insurance companies'
  },
  {
    id: 'health',
    name: 'Healthcare',
    description: 'Medical services, hospitals, and health data systems',
    examples: 'Hospitals, medical device manufacturers, health IT systems'
  },
  {
    id: 'drinking',
    name: 'Drinking Water Supply',
    description: 'Water treatment and distribution systems',
    examples: 'Water utilities, treatment plants, distribution networks'
  },
  {
    id: 'digital',
    name: 'Digital Infrastructure',
    description: 'Critical internet services and digital platforms',
    examples: 'Cloud providers, DNS services, online marketplaces'
  },
  {
    id: 'public',
    name: 'Public Administration',
    description: 'Government services and administrative systems',
    examples: 'Tax systems, social security, public portals'
  },
  {
    id: 'postal',
    name: 'Postal Services',
    description: 'Mail delivery and logistics services',
    examples: 'Postal operators, delivery services, logistics companies'
  },
  {
    id: 'waste',
    name: 'Waste Management',
    description: 'Waste collection, treatment, and disposal systems',
    examples: 'Waste management companies, recycling facilities'
  }
];

const EU_AUTHORITIES = [
  { country: 'Germany', authority: 'BSI (Federal Office for Information Security)', registration: 'CIR Act Registration' },
  { country: 'France', authority: 'ANSSI (National Agency for the Security of Information Systems)', registration: 'ANSSI Registry' },
  { country: 'Netherlands', authority: 'NCSC (National Cyber Security Centre)', registration: 'Digital Trust Register' },
  { country: 'Spain', authority: 'CCN-CERT (National Cryptological Center)', registration: 'Esquema Nacional de Seguridad' },
  { country: 'Italy', authority: 'CSIRT (Computer Security Incident Response Team)', registration: 'Registro Nazionale' },
  { country: 'Poland', authority: 'CERT Polska (Polish Computer Emergency Response Team)', registration: 'National Register of Essential Services' },
  { country: 'Sweden', authority: 'MSB (Swedish Civil Contingencies Agency)', registration: 'NIS2 Registry' },
  { country: 'Denmark', authority: 'CFCS (Center for Cyber Security)', registration: 'NIS2 Register' },
  { country: 'Finland', authority: 'Traficom (Finnish Transport and Communications Agency)', registration: 'NIS2 Registry' }
];

const STEPS = [
  'Sector Analysis',
  'Size Assessment', 
  'Service Evaluation',
  'Classification Result',
  'Registration Guidance'
];

export default function NIS2EntityClassificationWizard() {
  const { clientId } = useParams();
  const [location, setLocation] = useLocation();
  
  const [currentStep, setCurrentStep] = useState(0);
  const [classification, setClassification] = useState<Partial<EntityClassification>>({});
  const [showResults, setShowResults] = useState(false);
  const [showRegistrationDialog, setShowRegistrationDialog] = useState(false);

  // Assessment data
  const [selectedSectors, setSelectedSectors] = useState<string[]>([]);
  const [employeeCount, setEmployeeCount] = useState('');
  const [annualRevenue, setAnnualRevenue] = useState('');
  const [providesEssentialServices, setProvidesEssentialServices] = useState<boolean | null>(null);
  const [countryOfOperation, setCountryOfOperation] = useState('');
  const [serviceDescription, setServiceDescription] = useState('');

  const determineClassification = () => {
    const employeeNum = parseInt(employeeCount) || 0;
    const revenueNum = parseFloat(annualRevenue.replace(/[^0-9.]/g, '')) || 0;
    
    // NIS2 thresholds
    const meetsSizeThreshold = employeeNum >= 50 || revenueNum >= 10000000; // €10M
    const isCriticalSector = selectedSectors.some(sector => {
      const criticalSectorIds = ['energy', 'transport', 'banking', 'financial', 'health', 'drinking', 'digital'];
      return criticalSectorIds.includes(sector);
    });
    
    let classification: 'essential' | 'important' | 'not-applicable';
    
    if (meetsSizeThreshold && isCriticalSector && providesEssentialServices) {
      classification = 'essential';
    } else if (meetsSizeThreshold && isCriticalSector) {
      classification = 'important';
    } else if (meetsSizeThreshold && selectedSectors.length > 0) {
      classification = 'important';
    } else {
      classification = 'not-applicable';
    }
    
    setClassification({
      id: `nis2_${Date.now()}`,
      sector: selectedSectors.join(', '),
      employeeCount: employeeNum,
      annualRevenue: revenueNum,
      providesEssentialServices: providesEssentialServices || false,
      countryOfOperation,
      classification,
      lastUpdated: new Date().toISOString(),
      evidence: []
    });
    
    return classification;
  };

  const getClassificationColor = (classification: string) => {
    switch (classification) {
      case 'essential': return 'text-red-600 bg-red-100';
      case 'important': return 'text-orange-600 bg-orange-100';
      default: return 'text-green-600 bg-green-100';
    }
  };

  const getClassificationIcon = (classification: string) => {
    switch (classification) {
      case 'essential': return <AlertTriangle className="h-5 w-5" />;
      case 'important': return <Shield className="h-5 w-5" />;
      default: return <CheckCircle2 className="h-5 w-5" />;
    }
  };

  const renderStep = () => {
    switch (currentStep) {
      case 0:
        return (
          <div className="space-y-6">
            <div>
              <h2 className="text-xl font-semibold mb-4">Sector Analysis</h2>
              <p className="text-gray-600 dark:text-gray-400 mb-6">
                Select all sectors where your organization operates. NIS2 applies to critical sectors defined by the EU.
              </p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {CRITICAL_SECTORS.map((sector) => (
                <Card 
                  key={sector.id}
                  className={`cursor-pointer transition-all ${
                    selectedSectors.includes(sector.id) 
                      ? 'ring-2 ring-blue-500 bg-blue-50 dark:bg-blue-900/20' 
                      : 'hover:shadow-md'
                  }`}
                >
                  <CardContent className="p-6">
                    <div className="flex items-start space-x-3">
                      <Checkbox
                        id={sector.id}
                        checked={selectedSectors.includes(sector.id)}
                        onCheckedChange={(checked) => {
                          if (checked) {
                            setSelectedSectors(prev => [...prev, sector.id]);
                          } else {
                            setSelectedSectors(prev => prev.filter(s => s !== sector.id));
                          }
                        }}
                      />
                      <div className="flex-1">
                        <Label htmlFor={sector.id} className="font-semibold text-lg mb-2">
                          {sector.name}
                        </Label>
                        <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                          {sector.description}
                        </p>
                        <p className="text-xs text-gray-500">
                          <strong>Examples:</strong> {sector.examples}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {selectedSectors.length > 0 && (
              <Alert>
                <Info className="h-4 w-4" />
                <AlertDescription>
                  You've selected {selectedSectors.length} sector(s). Next, we'll assess if you meet NIS2 size thresholds.
                </AlertDescription>
              </Alert>
            )}
          </div>
        );

      case 1:
        return (
          <div className="space-y-6">
            <div>
              <h2 className="text-xl font-semibold mb-4">Size Assessment</h2>
              <p className="text-gray-600 dark:text-gray-400 mb-6">
                NIS2 applies to organizations with 50+ employees OR €10M+ annual revenue.
              </p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Users className="h-5 w-5" />
                    <span>Employee Count</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <Label htmlFor="employees">Number of employees</Label>
                    <Input
                      id="employees"
                      type="number"
                      placeholder="Enter total employee count"
                      value={employeeCount}
                      onChange={(e) => setEmployeeCount(e.target.value)}
                      className="text-lg"
                    />
                    <p className="text-sm text-gray-500">
                      Include all employees across all selected sectors
                    </p>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <TrendingUp className="h-5 w-5" />
                    <span>Annual Revenue</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <Label htmlFor="revenue">Annual Revenue (€)</Label>
                    <Input
                      id="revenue"
                      type="text"
                      placeholder="10,000,000"
                      value={annualRevenue}
                      onChange={(e) => setAnnualRevenue(e.target.value)}
                      className="text-lg"
                    />
                    <p className="text-sm text-gray-500">
                      NIS2 threshold: €10,000,000 (10 million Euros)
                    </p>
                  </div>
                </CardContent>
              </Card>
            </div>

            <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg">
              <h4 className="font-medium mb-2">Size Threshold Analysis</h4>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span>Employee Count (50+ required):</span>
                  <Badge variant={parseInt(employeeCount) >= 50 ? "default" : "secondary"}>
                    {employeeCount || '0'} {parseInt(employeeCount) >= 50 ? '✓' : '✗'}
                  </Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span>Annual Revenue (€10M+ required):</span>
                  <Badge variant={parseFloat(annualRevenue.replace(/[^0-9.]/g, '')) >= 10000000 ? "default" : "secondary"}>
                    {annualRevenue || '€0'} {parseFloat(annualRevenue.replace(/[^0-9.]/g, '')) >= 10000000 ? '✓' : '✗'}
                  </Badge>
                </div>
              </div>
            </div>
          </div>
        );

      case 2:
        return (
          <div className="space-y-6">
            <div>
              <h2 className="text-xl font-semibold mb-4">Service Evaluation</h2>
              <p className="text-gray-600 dark:text-gray-400 mb-6">
                Determine if your organization provides essential services that society depends on.
              </p>
            </div>
            
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Target className="h-5 w-5" />
                  <span>Essential Service Assessment</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div>
                  <Label className="text-lg font-medium">Do you provide essential services?</Label>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                    Essential services are those whose disruption would have significant impact on society,
                    public safety, or economic activity.
                  </p>
                  
                  <RadioGroup
                    value={providesEssentialServices?.toString() || ''}
                    onValueChange={(value) => setProvidesEssentialServices(value === 'true')}
                  >
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="true" id="essential-yes" />
                      <Label htmlFor="essential-yes">Yes, we provide essential services</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="false" id="essential-no" />
                      <Label htmlFor="essential-no">No, we do not provide essential services</Label>
                    </div>
                  </RadioGroup>
                </div>

                <div>
                  <Label htmlFor="service-description">Service Description</Label>
                  <Textarea
                    id="service-description"
                    placeholder="Describe the services you provide and why they may be considered essential..."
                    value={serviceDescription}
                    onChange={(e) => setServiceDescription(e.target.value)}
                    rows={4}
                    className="mt-2"
                  />
                </div>

                <Alert>
                  <Info className="h-4 w-4" />
                  <AlertDescription>
                    Examples of essential services: Power grid operations, banking systems, 
                    hospital emergency services, water treatment, air traffic control.
                  </AlertDescription>
                </Alert>
              </CardContent>
            </Card>
          </div>
        );

      case 3:
        const classification = determineClassification();
        return (
          <div className="space-y-6">
            <div>
              <h2 className="text-xl font-semibold mb-4">Classification Result</h2>
              <p className="text-gray-600 dark:text-gray-400">
                Based on your assessment, here is your NIS2 classification.
              </p>
            </div>
            
            <div className="text-center space-y-6">
              <div className="relative inline-flex items-center justify-center">
                <div className="text-4xl font-bold capitalize">
                  {classification.replace('-', ' ')}
                </div>
                <div className={`absolute -top-2 -right-2 px-3 py-1 rounded-full text-xs font-medium ${getClassificationColor(classification)}`}>
                  {classification === 'essential' ? 'HIGH OBLIGATIONS' : 
                   classification === 'important' ? 'MODERATE OBLIGATIONS' : 'LIMITED OBLIGATIONS'}
                </div>
              </div>
              
              <div className={`inline-flex items-center space-x-3 px-6 py-4 rounded-full ${getClassificationColor(classification)}`}>
                {getClassificationIcon(classification)}
                <span className="text-lg font-medium">
                  {classification === 'essential' ? 'Essential Entity' :
                   classification === 'important' ? 'Important Entity' : 'Not Applicable to NIS2'}
                </span>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card>
                <CardContent className="p-4 text-center">
                  <Building className="h-8 w-8 text-blue-600 mx-auto mb-2" />
                  <h3 className="font-semibold mb-2">Sectors</h3>
                  <p className="text-sm text-gray-600">{selectedSectors.length} sector(s)</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4 text-center">
                  <Users className="h-8 w-8 text-green-600 mx-auto mb-2" />
                  <h3 className="font-semibold mb-2">Size</h3>
                  <p className="text-sm text-gray-600">{employeeCount} employees</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4 text-center">
                  <TrendingUp className="h-8 w-8 text-purple-600 mx-auto mb-2" />
                  <h3 className="font-semibold mb-2">Revenue</h3>
                  <p className="text-sm text-gray-600">{annualRevenue}</p>
                </CardContent>
              </Card>
            </div>

            <Alert>
              <FileText className="h-4 w-4" />
              <AlertDescription>
                {classification === 'essential' ? 
                  'As an Essential Entity, you must implement comprehensive cybersecurity measures, report incidents within 24 hours, and undergo regular audits.' :
                  classification === 'important' ?
                  'As an Important Entity, you must implement appropriate cybersecurity measures and establish risk management procedures.' :
                  'Your organization may not be subject to NIS2 obligations, but good cybersecurity practices are still recommended.'}
              </AlertDescription>
            </Alert>
          </div>
        );

      case 4:
        return (
          <div className="space-y-6">
            <div>
              <h2 className="text-xl font-semibold mb-4">Registration Guidance</h2>
              <p className="text-gray-600 dark:text-gray-400">
                NIS2 requires registration with national authorities. Here's guidance for your country.
              </p>
            </div>
            
            <div className="space-y-4">
              <div>
                <Label htmlFor="country">Country of Operation</Label>
                <Select value={countryOfOperation} onValueChange={setCountryOfOperation}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select your country" />
                  </SelectTrigger>
                  <SelectContent>
                    {EU_AUTHORITIES.map((authority) => (
                      <SelectItem key={authority.country} value={authority.country}>
                        {authority.country}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {countryOfOperation && (
                <Card>
                  <CardContent className="p-6">
                    <div className="space-y-4">
                      <div className="flex items-center space-x-3">
                        <Globe className="h-8 w-8 text-blue-600" />
                        <div>
                          <h3 className="font-semibold">{countryOfOperation}</h3>
                          <p className="text-sm text-gray-600">NIS2 Authority</p>
                        </div>
                      </div>
                      
                      <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded">
                        <p className="font-medium mb-2">
                          {EU_AUTHORITIES.find(a => a.country === countryOfOperation)?.authority}
                        </p>
                        <p className="text-sm text-gray-600 mb-2">
                          <strong>Registration:</strong> {EU_AUTHORITIES.find(a => a.country === countryOfOperation)?.registration}
                        </p>
                        
                        <Button 
                          onClick={() => setShowRegistrationDialog(true)}
                          className="w-full"
                        >
                          Get Registration Instructions
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}
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
      toast.success("NIS2 Entity Classification completed!");
    }
  };

  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const isStepValid = () => {
    switch (currentStep) {
      case 0: return selectedSectors.length > 0;
      case 1: return employeeCount && annualRevenue;
      case 2: return providesEssentialServices !== null;
      case 3: return true;
      case 4: return countryOfOperation;
      default: return false;
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
                onClick={() => setLocation(`/clients/${clientId}/cyber`)}
                className="flex items-center space-x-2"
              >
                <ArrowLeft className="h-4 w-4" />
                <span>Back to NIS2</span>
              </Button>
              <div>
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                  NIS2 Entity Classification
                </h1>
                <p className="text-gray-600 dark:text-gray-400">
                  Determine if your organization must comply with NIS2 Directive
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
              {currentStep === STEPS.length - 1 ? 'Complete Classification' : 'Next'}
              <ArrowRight className="h-4 w-4 ml-2" />
            </Button>
          </div>
        </div>
      </div>

      {/* Registration Instructions Dialog */}
      <Dialog open={showRegistrationDialog} onOpenChange={setShowRegistrationDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>NIS2 Registration Instructions</DialogTitle>
          </DialogHeader>
          <div className="space-y-6">
            {countryOfOperation && (
              <>
                <Alert>
                  <Info className="h-4 w-4" />
                  <AlertDescription>
                    These are general registration requirements. Contact your national authority for specific guidance.
                  </AlertDescription>
                </Alert>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Required Information</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <ul className="space-y-2 text-sm">
                        <li>• Organization registration details</li>
                        <li>• List of essential services provided</li>
                        <li>• Contact information for CSIRT reporting</li>
                        <li>• Cybersecurity risk assessment</li>
                        <li>• Description of security measures</li>
                      </ul>
                    </CardContent>
                  </Card>
                  
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Registration Timeline</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <ul className="space-y-2 text-sm">
                        <li>• Initial registration: within 21 months of adoption</li>
                        <li>• Annual updates: required</li>
                        <li>• Incident reporting: within 24 hours</li>
                        <li>• Compliance assessment: every 3 years</li>
                      </ul>
                    </CardContent>
                  </Card>
                </div>
              </>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowRegistrationDialog(false)}>
              Close
            </Button>
            <Button onClick={() => {
              toast.success("Registration instructions saved!");
              setShowRegistrationDialog(false);
              setLocation(`/clients/${clientId}/cyber`);
            }}>
              Go to NIS2 Dashboard
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
}