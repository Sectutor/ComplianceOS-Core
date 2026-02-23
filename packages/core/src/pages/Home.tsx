import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useBranding, BrandLogo } from "@/config/branding";
import { Button } from "@complianceos/ui/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@complianceos/ui/ui/card";
import { getLoginUrl } from "@/const";
import { Shield, FileText, Link2, FolderOpen, BarChart3, ArrowRight, CheckCircle2, Check, X, Building2, Globe, Lock, PlayCircle, Star } from "lucide-react";
import { useLocation } from "wouter";
import { Badge } from "@complianceos/ui/ui/badge";

export default function Home() {
  const { user, loading } = useAuth();
  const { appName } = useBranding();
  const [location, setLocation] = useLocation();
  const [billingPeriod, setBillingPeriod] = useState<'monthly' | 'yearly'>('monthly');
  const SHOW_PRICING = false; // Toggle this to show/hide pricing section and menu option

  // Force landing page view if route is exactly /landing
  const isLandingPage = location === '/landing';
  const isAuthenticated = !!user && !isLandingPage;

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-pulse text-muted-foreground">Loading...</div>
      </div>
    );
  }

  // ----------------------------------------------------------------------
  // AUTHENTICATED DASHBOARD VIEW
  // ----------------------------------------------------------------------
  if (isAuthenticated) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5">
        <header className="border-b bg-card/80 backdrop-blur-sm sticky top-0 z-50">
          <div className="container flex h-16 items-center justify-between">
            <div className="flex items-center gap-3">
              <BrandLogo />
            </div>
            <div className="flex items-center gap-4">
              <span className="text-sm text-muted-foreground hidden md:inline-block">Welcome, {user?.user_metadata?.full_name || user?.email}</span>
              <Button onClick={() => setLocation('/dashboard')}>
                Go to Dashboard
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </div>
          </div>
        </header>

        <main className="container py-12">
          <div className="text-center mb-12">
            <h1 className="text-4xl font-bold mb-4">Welcome back</h1>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Ready to continue your compliance journey? Select a workspace to get started.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-5xl mx-auto">
            <Card className="hover:shadow-lg transition-all cursor-pointer border-t-4 border-t-primary" onClick={() => setLocation('/dashboard')}>
              <CardHeader>
                <BarChart3 className="h-10 w-10 text-primary mb-2" />
                <CardTitle>Dashboard</CardTitle>
                <CardDescription>View overall compliance status and metrics</CardDescription>
              </CardHeader>
            </Card>

            <Card className="hover:shadow-lg transition-all cursor-pointer border-t-4 border-t-blue-500" onClick={() => setLocation('/clients')}>
              <CardHeader>
                <FolderOpen className="h-10 w-10 text-blue-500 mb-2" />
                <CardTitle>Client Workspaces</CardTitle>
                <CardDescription>Manage client-specific controls and policies</CardDescription>
              </CardHeader>
            </Card>

            <Card className="hover:shadow-lg transition-all cursor-pointer border-t-4 border-t-[#00A36C]" onClick={() => setLocation('/controls')}>
              <CardHeader>
                <Shield className="h-10 w-10 text-[#00A36C] mb-2" />
                <CardTitle>Control Library</CardTitle>
                <CardDescription>Master library of ISO 27001 & SOC 2 controls</CardDescription>
              </CardHeader>
            </Card>

            <Card className="hover:shadow-lg transition-all cursor-pointer border-t-4 border-t-amber-500" onClick={() => setLocation('/policy-templates')}>
              <CardHeader>
                <FileText className="h-10 w-10 text-amber-500 mb-2" />
                <CardTitle>Policy Templates</CardTitle>
                <CardDescription>Pre-built policy templates for quick deployment</CardDescription>
              </CardHeader>
            </Card>

            <Card className="hover:shadow-lg transition-all cursor-pointer border-t-4 border-t-purple-500" onClick={() => setLocation('/mappings')}>
              <CardHeader>
                <Link2 className="h-10 w-10 text-purple-500 mb-2" />
                <CardTitle>Control Mapping</CardTitle>
                <CardDescription>Link controls to standard frameworks</CardDescription>
              </CardHeader>
            </Card>

            <Card className="hover:shadow-lg transition-all cursor-pointer border-t-4 border-t-rose-500" onClick={() => setLocation('/evidence')}>
              <CardHeader>
                <CheckCircle2 className="h-10 w-10 text-rose-500 mb-2" />
                <CardTitle>Evidence Tracking</CardTitle>
                <CardDescription>Track and verify compliance evidence</CardDescription>
              </CardHeader>
            </Card>
          </div>
        </main>
      </div>
    );
  }

  // ----------------------------------------------------------------------
  // PUBLIC MARKETING LANDING PAGE
  // ----------------------------------------------------------------------
  return (
    <div className="min-h-screen bg-white text-slate-900 leading-normal tracking-tight flex flex-col">
      {/* Navbar */}
      <nav className="bg-[#003366] sticky top-0 z-50 shadow-lg">
        <div className="max-w-full mx-auto px-4 sm:px-6">
          <div className="flex justify-between h-24">
            <div className="flex items-center">
              <BrandLogo invert showText={false} className="h-24 -ml-2" />
            </div>
            <div className="hidden md:flex items-center space-x-10">
              <a href="#features" className="text-blue-50 hover:text-white transition-colors text-xs font-black uppercase tracking-[0.2em]">Platform</a>
              <a href="#process" className="text-blue-50 hover:text-white transition-colors text-xs font-black uppercase tracking-[0.2em]">How it works</a>
              <Button asChild className="bg-[#00A36C] hover:bg-[#008F5D] text-white px-8 py-3 rounded-lg shadow-lg text-sm font-bold transition-all transform hover:-translate-y-0.5 border-none">
                <a href="/waitlist">Join the Waitlist</a>
              </Button>
            </div>
          </div>
        </div>
      </nav>

      <main className="flex-1">
        {/* Hero Section */}
        <div className="bg-white pt-20 pb-24 sm:pt-32 sm:pb-40">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <div className="max-w-3xl">
              <div className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold bg-blue-50 text-[#003366] mb-8 border border-blue-100 uppercase tracking-widest">
                Enterprise GRC Platform
              </div>

              <h1 className="text-5xl sm:text-6xl lg:text-7xl font-bold text-slate-900 leading-[1.1] mb-8">
                Compliance that moves as fast as you do.
              </h1>

              <p className="text-xl text-slate-600 leading-relaxed mb-12 max-w-2xl">
                Automate your SOC 2, ISO 27001, and NIST RMF audits. We partner with security-forward teams to build
                scalable, evidence-based compliance programs.
              </p>

              <div className="flex flex-col sm:flex-row gap-5">
                <Button size="lg" asChild className="h-14 px-8 text-lg font-bold bg-[#003366] text-white hover:bg-[#002244] transition-all shadow-sm">
                  <a href="/waitlist">Request Vetted Access</a>
                </Button>
                <Button size="lg" variant="outline" asChild className="h-14 px-8 text-lg font-bold border-slate-200 bg-white text-slate-800 hover:border-slate-300 transition-all shadow-sm">
                  <a href="/demo">View Product Demo</a>
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Trust Bench */}
        <div className="bg-slate-50 py-12 border-y border-slate-100">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-12 text-center md:text-left items-center opacity-70">
              <div className="text-xl font-bold text-slate-900 grayscale">ISO 27001</div>
              <div className="text-xl font-bold text-slate-900 grayscale">SOC 2 TYPE II</div>
              <div className="text-xl font-bold text-slate-900 grayscale">HIPAA</div>
              <div className="text-xl font-bold text-slate-900 grayscale">NIST 800-53</div>
            </div>
          </div>
        </div>

        {/* Process Section */}
        <div id="process" className="py-24 sm:py-32 bg-white">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <div className="mb-20 max-w-2xl">
              <h2 className="text-3xl sm:text-4xl font-bold text-slate-900 mb-6 tracking-tight">A vetted onboarding experience.</h2>
              <p className="text-lg text-slate-600 leading-relaxed">We provide high-touch support to ensure your instance is configured for maximum security and minimal friction.</p>
            </div>

            <div className="grid md:grid-cols-3 gap-12 sm:gap-16">
              <div>
                <div className="text-[#00A36C] font-bold mb-6 text-sm tracking-widest uppercase">Phase 01</div>
                <h3 className="text-xl font-bold text-slate-900 mb-4">Application</h3>
                <p className="text-slate-600 leading-relaxed">Join our waitlist and share your organization's compliance goals and existing technical landscape.</p>
              </div>
              <div>
                <div className="text-[#00A36C] font-bold mb-6 text-sm tracking-widest uppercase">Phase 02</div>
                <h3 className="text-xl font-bold text-slate-900 mb-4">Discovery</h3>
                <p className="text-slate-600 leading-relaxed">We host a discovery session to map our automation engines to your specific infrastructure and controls.</p>
              </div>
              <div>
                <div className="text-[#00A36C] font-bold mb-6 text-sm tracking-widest uppercase">Phase 03</div>
                <h3 className="text-xl font-bold text-slate-900 mb-4">Provisioning</h3>
                <p className="text-slate-600 leading-relaxed">Approved partners receive a private instance with pre-configured framework templates and API integrations.</p>
              </div>
            </div>
          </div>
        </div>

        {/* Features Section */}
        <div id="features" className="py-24 sm:py-32 bg-slate-50 border-t border-slate-100">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid lg:grid-cols-2 gap-20 items-center">
              <div>
                <h2 className="text-4xl font-bold text-slate-900 mb-8 tracking-tight leading-tight">Automation that actually eliminates manual work.</h2>
                <p className="text-lg text-slate-600 mb-10 leading-relaxed">While others just track compliance, we automate the evidence collection. No more massive spreadsheets or missed screenshots.</p>

                <div className="space-y-6">
                  <div className="flex gap-4">
                    <div className="w-6 h-6 rounded-full bg-emerald-100 flex items-center justify-center mt-1">
                      <Check className="w-4 h-4 text-[#00A36C]" />
                    </div>
                    <p className="text-slate-800 font-semibold italic">500+ pre-mapped control libraries.</p>
                  </div>
                  <div className="flex gap-4">
                    <div className="w-6 h-6 rounded-full bg-emerald-100 flex items-center justify-center mt-1">
                      <Check className="w-4 h-4 text-[#00A36C]" />
                    </div>
                    <p className="text-slate-800 font-semibold italic">Real-time gap analysis and alerting.</p>
                  </div>
                  <div className="flex gap-4">
                    <div className="w-6 h-6 rounded-full bg-emerald-100 flex items-center justify-center mt-1">
                      <Check className="w-4 h-4 text-[#00A36C]" />
                    </div>
                    <p className="text-slate-800 font-semibold italic">Isolated infrastructure for every client.</p>
                  </div>
                </div>
              </div>

              <div className="bg-white p-8 sm:p-12 rounded-2xl border border-slate-200 shadow-xl shadow-slate-200/50">
                <div className="space-y-6">
                  <div className="flex justify-between items-center pb-4 border-b border-slate-100">
                    <span className="text-sm font-bold text-slate-400 uppercase tracking-widest">Trust Center</span>
                    <span className="text-[10px] font-bold bg-blue-50 text-[#003366] px-2 py-1 rounded">Live Sync On</span>
                  </div>
                  <div className="p-4 bg-slate-50 border border-slate-100 rounded flex items-center justify-between">
                    <span className="text-sm font-bold text-slate-700">Access Management</span>
                    <div className="w-24 h-2 bg-slate-200 rounded overflow-hidden">
                      <div className="w-[85%] h-full bg-[#00A36C]"></div>
                    </div>
                  </div>
                  <div className="p-4 bg-slate-50 border border-slate-100 rounded flex items-center justify-between opacity-60">
                    <span className="text-sm font-bold text-slate-700">Encryption Controls</span>
                    <div className="w-24 h-2 bg-slate-200 rounded overflow-hidden">
                      <div className="w-[40%] h-full bg-[#00A36C]"></div>
                    </div>
                  </div>
                  <div className="p-4 bg-slate-50 border border-slate-100 rounded flex items-center justify-between">
                    <span className="text-sm font-bold text-slate-700">Data Minimization</span>
                    <div className="w-24 h-2 bg-slate-200 rounded overflow-hidden">
                      <div className="w-full h-full bg-[#00A36C]"></div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Final CTA */}
        <div className="bg-[#003366] py-24 sm:py-32">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <h2 className="text-3xl sm:text-4xl font-bold text-white mb-8 tracking-tight">Limited capacity available for 2026 onboarding.</h2>
            <Button size="lg" asChild className="h-16 px-10 text-xl font-extrabold rounded bg-white text-[#003366] hover:bg-slate-50 transition-all shadow-xl">
              <a href="/waitlist">Secure your spot on the Waitlist</a>
            </Button>
          </div>
        </div>
      </main>

      <footer className="bg-white border-t border-slate-100">
        <div className="container mx-auto py-16 px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row justify-between items-center gap-10">
            <div className="text-left">
              <span className="text-xl font-bold text-slate-900 tracking-tight">GRCompliance</span>
              <p className="mt-4 text-slate-500 text-sm max-w-xs">Enterprise compliance automation built for security-first organizations.</p>
            </div>
            <div className="flex flex-wrap items-center justify-center gap-x-12 gap-y-4 text-sm font-bold">
              <a href="/login" className="text-slate-400 hover:text-slate-900 transition-colors">Client Login</a>
              <a href="/privacy" className="text-slate-400 hover:text-slate-900 transition-colors">Privacy</a>
              <a href="/terms" className="text-slate-400 hover:text-slate-900 transition-colors">Terms</a>
              <a href="/cookies" className="text-slate-400 hover:text-slate-900 transition-colors">Cookie Policy</a>
            </div>
          </div>
          <div className="mt-16 pt-8 border-t border-slate-50 text-center">
            <p className="text-slate-400 text-xs font-bold tracking-widest uppercase">
              &copy; 2026 GRCompliance, Inc. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}

function FeatureCard({ icon, title, description }: { icon: React.ReactNode, title: string, description: string }) {
  return (
    <Card className="card-hover-effect border-none shadow-none bg-background/50">
      <CardHeader>
        <div className="mb-4">{icon}</div>
        <CardTitle className="text-lg">{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
    </Card>
  );
}

function CheckItem({ text }: { text: string }) {
  return (
    <li className="flex items-center gap-2">
      <Check className="h-4 w-4 text-primary shrink-0" />
      <span>{text}</span>
    </li>
  );
}
