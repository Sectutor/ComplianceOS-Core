import DashboardLayout from '@/components/DashboardLayout';
import { AnimatedMetricCard } from '@complianceos/ui/ui/AnimatedMetricCard';
import { ProgressIndicator } from '@complianceos/ui/ui/ProgressIndicator';
import { StepWizard } from '@complianceos/ui/ui/StepWizard';
import { StatusBadge, StatusDot } from '@complianceos/ui/ui/StatusBadge';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@complianceos/ui/ui/card';
import { Button } from '@complianceos/ui/ui/button';
import { 
  Shield, 
  Users, 
  FileText, 
  TrendingUp,
  CheckCircle,
  Clock,
  AlertCircle 
} from 'lucide-react';
import { useState } from 'react';

export default function UIPatternShowcase() {
  const [currentStep, setCurrentStep] = useState(0);

  const wizardSteps = [
    {
      title: 'Getting Started',
      description: 'Set up your compliance framework',
      content: (
        <Card>
          <CardContent className="pt-6">
            <p>Welcome to the compliance setup wizard. Let's configure your framework.</p>
          </CardContent>
        </Card>
      )
    },
    {
      title: 'Select Framework',
      description: 'Choose compliance standards',
      content: (
        <Card>
          <CardContent className="pt-6 space-y-3">
            <div className="flex items-center gap-3 p-4 border rounded-lg hover-lift cursor-pointer">
              <Shield className="w-6 h-6 text-blue-600" />
              <div>
                <p className="font-medium">ISO 27001</p>
                <p className="text-sm text-muted-foreground">Information Security Management</p>
              </div>
            </div>
            <div className="flex items-center gap-3 p-4 border rounded-lg hover-lift cursor-pointer">
              <FileText className="w-6 h-6 text-purple-600" />
              <div>
                <p className="font-medium">SOC 2</p>
                <p className="text-sm text-muted-foreground">Service Organization Control</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )
    },
    {
      title: 'Configure Settings',
      description: 'Set up your preferences',
      content: (
        <Card>
          <CardContent className="pt-6">
            <p>Configure your organization settings and preferences.</p>
          </CardContent>
        </Card>
      )
    },
    {
      title: 'Review & Launch',
      description: 'Confirm and activate',
      content: (
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3 text-emerald-600">
              <CheckCircle className="w-8 h-8" />
              <p className="text-lg font-medium">You're all set! Ready to launch.</p>
            </div>
          </CardContent>
        </Card>
      )
    }
  ];

  const progressSteps = [
    { label: 'Discover', status: 'complete' as const },
    { label: 'Assess', status: 'complete' as const },
    { label: 'Remediate', status: 'current' as const },
    { label: 'Monitor', status: 'upcoming' as const },
    { label: 'Report', status: 'upcoming' as const }
  ];

  return (
    <DashboardLayout>
      <div className="space-y-8">
        {/* Header */}
        <div className="animate-slide-down">
          <h1 className="text-3xl font-bold">UI Pattern Showcase</h1>
          <p className="text-muted-foreground mt-1">
            Premium design components and animations
          </p>
        </div>

        {/* Animated Metric Cards */}
        <section>
          <h2 className="text-xl font-semibold mb-4">Animated Metrics</h2>
          <div className="dashboard-grid grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <AnimatedMetricCard
              title="Total Vendors"
              value={156}
              previousValue={142}
              icon={<Users className="w-6 h-6" />}
              variant="info"
              delay={0}
            />
            <AnimatedMetricCard
              title="Compliance Score"
              value={87}
              format={(v) => `${v}%`}
              previousValue={82}
              icon={<Shield className="w-6 h-6" />}
              variant="success"
              delay={100}
            />
            <AnimatedMetricCard
              title="Open Findings"
              value={23}
              previousValue={31}
              icon={<AlertCircle className="w-6 h-6" />}
              variant="warning"
              delay={200}
            />
            <AnimatedMetricCard
              title="Recent Audits"
              value={12}
              previousValue={9}
              icon={<FileText className="w-6 h-6" />}
              variant="default"
              delay={300}
            />
          </div>
        </section>

        {/* Status Badges */}
        <section className="animate-slide-up">
          <h2 className="text-xl font-semibold mb-4">Status Badges & Dots</h2>
          <Card>
            <CardContent className="pt-6 space-y-4">
              <div>
                <h3 className="font-medium mb-2">Default Badges</h3>
                <div className="flex flex-wrap gap-2">
                  <StatusBadge status="success" />
                  <StatusBadge status="warning" />
                  <StatusBadge status="error" />
                  <StatusBadge status="info" />
                  <StatusBadge status="neutral" />
                  <StatusBadge status="pending" />
                </div>
              </div>
              <div>
                <h3 className="font-medium mb-2">With Pulse Dots</h3>
                <div className="flex flex-wrap gap-2">
                  <StatusBadge status="success" withDot withPulse label="Active" />
                  <StatusBadge status="warning" withDot withPulse label="In Progress" />
                  <StatusBadge status="error" withDot withPulse label="Failed" />
                  <StatusBadge status="info" withDot withPulse label="Processing" />
                </div>
              </div>
              <div>
                <h3 className="font-medium mb-2">Status Dots Only</h3>
                <div className="flex gap-4 items-center">
                  <div className="flex items-center gap-2">
                    <StatusDot status="success" />
                    <span className="text-sm">Healthy</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <StatusDot status="warning" />
                    <span className="text-sm">Warning</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <StatusDot status="error" />
                    <span className="text-sm">Critical</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <StatusDot status="info" />
                    <span className="text-sm">Info</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </section>

        {/* Progress Indicators */}
        <section className="animate-slide-up">
          <h2 className="text-xl font-semibold mb-4">Progress Indicators</h2>
          <Card>
            <CardContent className="pt-6 space-y-8">
              <div>
                <h3 className="font-medium mb-4">Horizontal Progress</h3>
                <ProgressIndicator steps={progressSteps} variant="horizontal" />
              </div>
              <div>
                <h3 className="font-medium mb-4">Vertical Progress</h3>
                <ProgressIndicator steps={progressSteps} variant="vertical" />
              </div>
            </CardContent>
          </Card>
        </section>

        {/* Step Wizard */}
        <section className="animate-slide-up">
          <h2 className="text-xl font-semibold mb-4">Step Wizard</h2>
          <Card>
            <CardContent className="pt-6">
              <StepWizard 
                steps={wizardSteps}
                currentStep={currentStep}
                onStepChange={setCurrentStep}
              />
              <div className="flex justify-between mt-6">
                <Button
                  variant="outline"
                  onClick={() => setCurrentStep(Math.max(0, currentStep - 1))}
                  disabled={currentStep === 0}
                >
                  Previous
                </Button>
                <Button
                  onClick={() => setCurrentStep(Math.min(wizardSteps.length - 1, currentStep + 1))}
                  disabled={currentStep === wizardSteps.length - 1}
                >
                  {currentStep === wizardSteps.length - 1 ? 'Finish' : 'Next'}
                </Button>
              </div>
            </CardContent>
          </Card>
        </section>

        {/* Premium Hover Effects */}
        <section className="animate-slide-up">
          <h2 className="text-xl font-semibold mb-4">Hover Effects</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card className="hover-lift cursor-pointer">
              <CardHeader>
                <CardTitle>Lift Effect</CardTitle>
                <CardDescription>Hovers up with shadow</CardDescription>
              </CardHeader>
            </Card>
            <Card className="hover-scale cursor-pointer">
              <CardHeader>
                <CardTitle>Scale Effect</CardTitle>
                <CardDescription>Slightly grows on hover</CardDescription>
              </CardHeader>
            </Card>
            <Card className="hover-glow cursor-pointer">
              <CardHeader>
                <CardTitle>Glow Effect</CardTitle>
                <CardDescription>Glowing border appears</CardDescription>
              </CardHeader>
            </Card>
          </div>
        </section>
      </div>
    </DashboardLayout>
  );
}
