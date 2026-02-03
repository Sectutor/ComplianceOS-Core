import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@complianceos/ui/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@complianceos/ui/ui/card";
import { getLoginUrl } from "@/const";
import { Shield, FileText, Link2, FolderOpen, BarChart3, ArrowRight, CheckCircle2, Check, X, Building2, Globe, Lock, PlayCircle, Star } from "lucide-react";
import { useLocation } from "wouter";
import { Badge } from "@complianceos/ui/ui/badge";

export default function Home() {
  const { user, loading } = useAuth();
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
              <Shield className="h-8 w-8 text-primary" />
              <span className="text-xl font-semibold">GRCompliance</span>
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

            <Card className="hover:shadow-lg transition-all cursor-pointer border-t-4 border-t-emerald-500" onClick={() => setLocation('/controls')}>
              <CardHeader>
                <Shield className="h-10 w-10 text-emerald-500 mb-2" />
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
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      {/* Navbar - Brand Navy */}
      <header className="fixed top-0 w-full z-50 bg-[#002a40] backdrop-blur-md border-b border-white/10">
        <div className="container flex h-16 items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg bg-[#0ea5e9] flex items-center justify-center text-white">
              <Shield className="h-5 w-5" />
            </div>
            <span className="text-xl font-bold tracking-tight text-white">GRCompliance</span>
          </div>
          <nav className="hidden md:flex items-center gap-8 text-sm font-medium">
            <a href="#features" className="text-slate-300 hover:text-white transition-colors">Features</a>
            <a href="#solutions" className="text-slate-300 hover:text-white transition-colors">Solutions</a>
            {SHOW_PRICING && <a href="#pricing" className="text-slate-300 hover:text-white transition-colors">Pricing</a>}
            <a href="/managed-services" className="text-slate-300 hover:text-white transition-colors">Managed Services</a>
          </nav>
          <div className="flex items-center gap-4">
            <Button variant="ghost" asChild className="hidden sm:inline-flex text-slate-300 hover:text-white hover:bg-white/10">
              <a href={getLoginUrl()}>Sign In</a>
            </Button>
            <Button asChild className="bg-[#7FBF3F] hover:bg-[#6ba832] text-white border-none">
              <a href="/waitlist">Join Waitlist</a>
            </Button>
          </div>
        </div>
      </header>

      <main className="flex-1 pt-16">
        {/* Hero Section - Brand Navy Gradient */}
        <section className="relative py-20 md:py-32 overflow-hidden bg-gradient-to-br from-[#002a40] via-[#003d5c] to-[#00526c]">
          <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmYiIGZpbGwtb3BhY2l0eT0iMC4wMyI+PGNpcmNsZSBjeD0iMzAiIGN5PSIzMCIgcj0iMiIvPjwvZz48L2c+PC9zdmc+')] opacity-50" />
          <div className="container relative z-10 text-center">
            <div className="inline-flex items-center rounded-full border border-[#0ea5e9]/30 px-3 py-1 text-sm text-slate-300 mb-8 bg-white/5 backdrop-blur-sm">
              <span className="flex h-2 w-2 rounded-full bg-[#7FBF3F] mr-2" />
              Now supporting ISO 27001:2022 & SOC 2 Type II
            </div>
            <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold tracking-tight mb-6 text-white">
              Compliance Made Simple. <br className="hidden md:block" /><span className="text-[#0ea5e9]">At Your Pace.</span>
            </h1>
            <p className="text-xl text-slate-300 max-w-3xl mx-auto mb-10 leading-relaxed">
              Whether you're a startup building your first security program or an enterprise seeking full audit management —
              GRCompliance adapts to your journey with AI-powered tools, expert coaching, or fully managed services.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Button size="lg" className="h-12 px-8 text-lg bg-[#7FBF3F] hover:bg-[#6ba832] text-white border-none shadow-lg shadow-[#7FBF3F]/30" asChild>
                <a href="/waitlist">Join the Waiting List <ArrowRight className="ml-2 h-5 w-5" /></a>
              </Button>
              <Button size="lg" variant="outline" className="h-12 px-8 text-lg group border-2 border-[#0ea5e9] text-white bg-transparent hover:bg-[#0ea5e9]/20">
                <PlayCircle className="mr-2 h-5 w-5 text-[#0ea5e9] group-hover:text-white transition-colors" />
                Watch Demo
              </Button>
            </div>

            {/* Hero Screenshot */}
            <div className="mt-20 relative mx-auto max-w-6xl perspective-[2000px] group">
              {/* Glow Effect */}
              <div className="absolute -inset-4 bg-gradient-to-r from-cyan-500 to-purple-600 rounded-[2rem] blur-xl opacity-20 group-hover:opacity-30 transition duration-1000"></div>

              {/* Browser Window */}
              <div className="relative rounded-xl border border-white/10 bg-[#001e2b] shadow-2xl transform rotate-x-12 group-hover:rotate-x-0 transition-transform duration-700 ease-out overflow-hidden">
                {/* Browser Header */}
                <div className="flex items-center justify-between px-4 py-3 bg-[#002a40] border-b border-white/5">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-[#ff5f56]"></div>
                    <div className="w-3 h-3 rounded-full bg-[#ffbd2e]"></div>
                    <div className="w-3 h-3 rounded-full bg-[#27c93f]"></div>
                  </div>
                  <div className="bg-[#00151f] px-3 py-1 rounded text-xs text-slate-500 font-mono">app.grcompliance.com/dashboard</div>
                  <div className="w-16"></div>
                </div>
                {/* Image */}
                <img src="/screenshots/compliance_dashboard.png" alt="Compliance Dashboard" className="w-full h-auto opacity-90" />
              </div>
            </div>

            {/* Social Proof */}
            <div className="mt-16 pt-8 border-t border-white/10">
              <p className="text-sm font-medium text-slate-400 mb-6">TRUSTED BY SECURITY TEAMS AT</p>
              <div className="flex flex-wrap justify-center gap-8 md:gap-16 text-slate-400 hover:text-white transition-all duration-500">
                {/* Placeholders for logos */}
                <div className="flex items-center gap-2 font-bold text-xl"><Building2 className="h-6 w-6" /> Acme Corp</div>
                <div className="flex items-center gap-2 font-bold text-xl"><Globe className="h-6 w-6" /> GlobalNet</div>
                <div className="flex items-center gap-2 font-bold text-xl"><Shield className="h-6 w-6" /> SecureFlow</div>
                <div className="flex items-center gap-2 font-bold text-xl"><Lock className="h-6 w-6" /> TrustVault</div>
              </div>
            </div>
          </div>
        </section>

        {/* Product Tour Section */}
        {/* Product Tour Section - Brand Navy to match Hero */}
        <section className="py-32 bg-[#002a40] space-y-32" id="solutions">

          {/* Feature 1: Risk Management (Right Image) */}
          <div className="container">
            <div className="grid lg:grid-cols-2 gap-16 items-center">
              <div className="order-2 lg:order-1 space-y-6">
                <div className="inline-flex items-center gap-2 text-[#7FBF3F] font-bold bg-[#7FBF3F]/10 px-3 py-1 rounded-full text-sm">
                  <PlayCircle className="h-4 w-4" /> RISK OS
                </div>
                <h2 className="text-4xl font-bold text-white">Guided Risk Management</h2>
                <p className="text-xl text-slate-300 leading-relaxed">
                  Don't just list risks—solve them. Our guided workflows help you identify assets, assess threats, and implement treatments without needing a PhD in cybersecurity.
                </p>
                <ul className="space-y-3">
                  {["Automated Threat Library", "Asset Inventory Sync", "Residual Risk Calculation"].map(item => (
                    <li key={item} className="flex items-center gap-3 text-lg text-slate-300">
                      <CheckCircle2 className="h-5 w-5 text-[#7FBF3F]" /> {item}
                    </li>
                  ))}
                </ul>
              </div>
              <div className="order-1 lg:order-2 relative group">
                <div className="absolute -inset-2 bg-gradient-to-tr from-[#7FBF3F] to-emerald-500 rounded-2xl blur opacity-20 group-hover:opacity-40 transition"></div>
                <img src="/screenshots/risk_dashboard.png" className="relative rounded-xl shadow-2xl border border-slate-200 dark:border-slate-700" alt="Risk Workflows" />
              </div>
            </div>
          </div>

          {/* Feature 2: Deep Dive Analysis (Left Image) */}
          <div className="container">
            <div className="grid lg:grid-cols-2 gap-16 items-center">
              <div className="order-1 relative group">
                <div className="absolute -inset-2 bg-gradient-to-bl from-red-500 to-orange-500 rounded-2xl blur opacity-20 group-hover:opacity-40 transition"></div>
                <img src="/screenshots/risk_register.png" className="relative rounded-xl shadow-2xl border border-slate-200 dark:border-slate-700" alt="Risk Heatmap" />
              </div>
              <div className="order-2 space-y-6">
                <div className="inline-flex items-center gap-2 text-red-500 font-bold bg-red-500/10 px-3 py-1 rounded-full text-sm">
                  <BarChart3 className="h-4 w-4" /> ANALYTICS
                </div>
                <h2 className="text-4xl font-bold text-white">Visualize Your Risk Posture</h2>
                <p className="text-xl text-slate-300 leading-relaxed">
                  Instant heatmaps show you exactly where to focus. Filter by likelihood, impact, or asset criticality to prioritize your limited resources effectively.
                </p>
                <ul className="space-y-3">
                  {["Dynamic Heatmaps", "Filterable Risk Register", "One-Click Reports"].map(item => (
                    <li key={item} className="flex items-center gap-3 text-lg text-slate-300">
                      <CheckCircle2 className="h-5 w-5 text-red-500" /> {item}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>

          {/* Feature 3: Multi-Client (Right Image) */}
          <div className="container">
            <div className="grid lg:grid-cols-2 gap-16 items-center">
              <div className="order-2 lg:order-1 space-y-6">
                <div className="inline-flex items-center gap-2 text-primary font-bold bg-primary/10 px-3 py-1 rounded-full text-sm">
                  <Globe className="h-4 w-4" /> SCALE
                </div>
                <h2 className="text-4xl font-bold text-white">Manage Multiple Workspaces</h2>
                <p className="text-xl text-slate-300 leading-relaxed">
                  Perfect for MSPs and Fractional CISOs. Switch between client environments instantly, keeping policies, evidence, and risks completely segregated.
                </p>
                <ul className="space-y-3">
                  {["Unlimited Client Organizations", "Role-Based Access Control", "Centralized Admin View"].map(item => (
                    <li key={item} className="flex items-center gap-3 text-lg text-slate-300">
                      <CheckCircle2 className="h-5 w-5 text-blue-500" /> {item}
                    </li>
                  ))}
                </ul>
              </div>
              <div className="order-1 lg:order-2 relative group">
                <div className="absolute -inset-2 bg-gradient-to-tr from-blue-500 to-indigo-500 rounded-2xl blur opacity-20 group-hover:opacity-40 transition"></div>
                <img src="/screenshots/clients_list.png" className="relative rounded-xl shadow-2xl border border-slate-200 dark:border-slate-700" alt="Client Management" />
              </div>
            </div>
          </div>

          {/* Feature 4: Threat Library (Left Image) */}
          <div className="container">
            <div className="grid lg:grid-cols-2 gap-16 items-center">
              <div className="order-1 relative group">
                <div className="absolute -inset-2 bg-gradient-to-bl from-amber-500 to-orange-600 rounded-2xl blur opacity-20 group-hover:opacity-40 transition"></div>
                <img src="/screenshots/threat_library.png" className="relative rounded-xl shadow-2xl border border-slate-200 dark:border-slate-700" alt="Threat Library" />
              </div>
              <div className="order-2 space-y-6">
                <div className="inline-flex items-center gap-2 text-amber-600 font-bold bg-amber-500/10 px-3 py-1 rounded-full text-sm">
                  <Shield className="h-4 w-4" /> INTEL
                </div>
                <h2 className="text-4xl font-bold text-white">Stay Ahead of Threats</h2>
                <p className="text-xl text-slate-300 leading-relaxed">
                  Maintain a living library of threats relevant to your industry. Map them to vulnerabilities and assets to understand your true exposure.
                </p>
                <ul className="space-y-3">
                  {["Industry Standard Threats", "Vulnerability Mapping", "Review Cadence Tracking"].map(item => (
                    <li key={item} className="flex items-center gap-3 text-lg text-slate-700 dark:text-slate-200">
                      <CheckCircle2 className="h-5 w-5 text-amber-600" /> {item}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>

          {/* Feature 5: Policy Management (Right Image) */}
          <div className="container">
            <div className="grid lg:grid-cols-2 gap-16 items-center">
              <div className="order-2 lg:order-1 space-y-6">
                <div className="inline-flex items-center gap-2 text-purple-600 font-bold bg-purple-500/10 px-3 py-1 rounded-full text-sm">
                  <FileText className="h-4 w-4" /> GOVERNANCE
                </div>
                <h2 className="text-4xl font-bold text-slate-900 dark:text-white">Policies That Actually Work</h2>
                <p className="text-xl text-slate-600 dark:text-slate-300 leading-relaxed">
                  Stop chasing Word docs. Manage the entire policy lifecycle—from drafting and approval to version control and employee acknowledgement—in one place.
                </p>
                <ul className="space-y-3">
                  {["Version Control", "Approval Workflows", "Automated Employee Acceptance"].map(item => (
                    <li key={item} className="flex items-center gap-3 text-lg text-slate-700 dark:text-slate-200">
                      <CheckCircle2 className="h-5 w-5 text-purple-600" /> {item}
                    </li>
                  ))}
                </ul>
              </div>
              <div className="order-1 lg:order-2 relative group">
                <div className="absolute -inset-2 bg-gradient-to-tr from-purple-500 to-pink-500 rounded-2xl blur opacity-20 group-hover:opacity-40 transition"></div>
                <img src="/screenshots/policies_list.png" className="relative rounded-xl shadow-2xl border border-slate-200 dark:border-slate-700" alt="Policy Management" />
              </div>
            </div>
          </div>

          {/* Feature 6: Smart Mapping (Left Image) */}
          <div className="container">
            <div className="grid lg:grid-cols-2 gap-16 items-center">
              <div className="order-1 relative group">
                <div className="absolute -inset-2 bg-gradient-to-br from-indigo-500 to-cyan-500 rounded-2xl blur opacity-20 group-hover:opacity-40 transition"></div>
                <img src="/screenshots/control_mappings.png" className="relative rounded-xl shadow-2xl border border-slate-200 dark:border-slate-700" alt="Control Mapping" />
              </div>
              <div className="order-2 space-y-6">
                <div className="inline-flex items-center gap-2 text-indigo-600 font-bold bg-indigo-500/10 px-3 py-1 rounded-full text-sm">
                  <Link2 className="h-4 w-4" /> MAPPING
                </div>
                <h2 className="text-4xl font-bold text-slate-900 dark:text-white">Map Once, Comply Everywhere</h2>
                <p className="text-xl text-slate-600 dark:text-slate-300 leading-relaxed">
                  Link your internal controls to policies and evidence. Our smart mapping engine visualizes coverage gaps instantly.
                </p>
                <ul className="space-y-3">
                  {["Many-to-Many Mapping", "Gap Analysis Visualization", "Cross-Framework Support"].map(item => (
                    <li key={item} className="flex items-center gap-3 text-lg text-slate-700 dark:text-slate-200">
                      <CheckCircle2 className="h-5 w-5 text-indigo-600" /> {item}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>

          {/* Feature 7: Business Continuity (Right Image) */}
          <div className="container">
            <div className="grid lg:grid-cols-2 gap-16 items-center">
              <div className="order-2 lg:order-1 space-y-6">
                <div className="inline-flex items-center gap-2 text-rose-600 font-bold bg-rose-500/10 px-3 py-1 rounded-full text-sm">
                  <PlayCircle className="h-4 w-4" /> RESILIENCE
                </div>
                <h2 className="text-4xl font-bold text-slate-900 dark:text-white">Business Impact Analysis</h2>
                <p className="text-xl text-slate-600 dark:text-slate-300 leading-relaxed">
                  Identify your mission-critical processes and define recovery strategies. built-in BIA and Disaster Recovery planning modules.
                </p>
                <ul className="space-y-3">
                  {["RTO/RPO Definition", "Criticality Scoring", "Continuity Plan Generation"].map(item => (
                    <li key={item} className="flex items-center gap-3 text-lg text-slate-700 dark:text-slate-200">
                      <CheckCircle2 className="h-5 w-5 text-rose-600" /> {item}
                    </li>
                  ))}
                </ul>
              </div>
              <div className="order-1 lg:order-2 relative group">
                <div className="absolute -inset-2 bg-gradient-to-tr from-rose-500 to-orange-500 rounded-2xl blur opacity-20 group-hover:opacity-40 transition"></div>
                <img src="/screenshots/bia_assessments.png" className="relative rounded-xl shadow-2xl border border-slate-200 dark:border-slate-700" alt="Business Continuity" />
              </div>
            </div>
          </div>

        </section>

        {/* Features Grid */}
        <section className="py-24" id="features">
          <div className="container">
            <div className="text-center max-w-3xl mx-auto mb-16">
              <h2 className="text-3xl font-bold mb-4">Everything you need to get certified</h2>
              <p className="text-lg text-muted-foreground">
                From policy generation to automated gap analysis, we've built the tools compliance officers actually want.
              </p>
            </div>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
              <FeatureCard
                icon={<FileText className="h-6 w-6 text-blue-500" />}
                title="AI Policy Generator"
                description="Generate audit-ready policies in seconds using our LLM-powered engine tailored to your industry."
              />
              <FeatureCard
                icon={<Link2 className="h-6 w-6 text-purple-500" />}
                title="Smart Mapping"
                description="Define a control once and map it to ISO 27001, SOC 2, HIPAA, and GDPR automatically."
              />
              <FeatureCard
                icon={<CheckCircle2 className="h-6 w-6 text-green-500" />}
                title="Evidence Collection"
                description="Assign evidence tasks to team members with due dates, reminders, and review workflows."
              />
              <FeatureCard
                icon={<Shield className="h-6 w-6 text-red-500" />}
                title="Risk Management"
                description="Integrated risk register and heat maps to identify, assess, and treat security risks."
              />
              <FeatureCard
                icon={<BarChart3 className="h-6 w-6 text-orange-500" />}
                title="Audit Readiness"
                description="Real-time dashboards show your exact readiness score for each framework."
              />
              <FeatureCard
                icon={<Building2 className="h-6 w-6 text-cyan-500" />}
                title="Venfor Management"
                description="Track third-party vendors and their security posture in a centralized registry."
              />
            </div>
          </div>
        </section>

        {/* Pricing */}
        {SHOW_PRICING && (
          <section className="py-24 bg-muted/50" id="pricing">
            <div className="container">
              <div className="text-center max-w-3xl mx-auto mb-16">
                <Badge variant="secondary" className="mb-4">Choose Your Path</Badge>
                <h2 className="text-3xl font-bold mb-4">Compliance Made Simple. At Your Pace.</h2>
                <p className="text-lg text-muted-foreground">
                  From self-guided SaaS to fully managed private installations — we scale with your security requirements.
                </p>
              </div>

              {/* Billing Toggle */}
              <div className="flex justify-center mb-10">
                <div className="flex items-center p-1 bg-muted rounded-lg border">
                  <button
                    onClick={() => setBillingPeriod('monthly')}
                    className={`px-4 py-2 text-sm font-medium rounded-md transition-all ${billingPeriod === 'monthly' ? 'bg-background shadow text-foreground' : 'text-muted-foreground hover:text-foreground'
                      }`}
                  >
                    Monthly
                  </button>
                  <button
                    onClick={() => setBillingPeriod('yearly')}
                    className={`px-4 py-2 text-sm font-medium rounded-md transition-all ${billingPeriod === 'yearly' ? 'bg-background shadow text-foreground' : 'text-muted-foreground hover:text-foreground'
                      }`}
                  >
                    Yearly <span className="ml-1 text-xs text-green-600 font-bold">-16%</span>
                  </button>
                </div>
              </div>

              <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-7xl mx-auto items-stretch">
                {/* Self-Service Tier */}
                <Card className="relative overflow-hidden flex flex-col">
                  <div className="absolute top-0 left-0 right-0 h-1 bg-primary" />
                  <CardHeader>
                    <Badge variant="outline" className="w-fit mb-2 border-blue-200 text-blue-600 bg-blue-50">Best for Startups & SMBs</Badge>
                    <CardTitle className="text-xl flex items-center gap-2">
                      <div className="h-8 w-8 rounded-lg bg-blue-100 flex items-center justify-center">
                        <BarChart3 className="h-4 w-4 text-blue-600" />
                      </div>
                      GRCompliance Self-Service
                    </CardTitle>
                    <div className="mt-4">
                      {billingPeriod === 'monthly' ? (
                        <>
                          <div className="text-3xl font-bold">$199 <span className="text-sm font-normal text-muted-foreground">/month</span></div>
                          <div className="text-sm text-muted-foreground mt-1">Billed monthly</div>
                        </>
                      ) : (
                        <>
                          <div className="text-3xl font-bold">$1,999 <span className="text-sm font-normal text-muted-foreground">/year</span></div>
                          <div className="text-sm text-muted-foreground mt-1 text-green-600 font-medium">Save $389/year</div>
                        </>
                      )}
                    </div>
                    <CardDescription className="mt-3">Build your compliance program at your own pace with AI-powered guidance.</CardDescription>
                  </CardHeader>
                  <CardContent className="flex-1 flex flex-col">
                    <ul className="space-y-2 text-sm flex-1">
                      <CheckItem text="1 Organization" />
                      <CheckItem text="1 Demo Workspace" />
                      <CheckItem text="AI Policy Generator" />
                      <CheckItem text="Maturity Navigator" />
                      <CheckItem text="Gap Analysis" />
                      <CheckItem text="Evidence Collection" />
                    </ul>
                    <div className="pt-4 border-t mt-4">
                      <p className="text-xs text-muted-foreground mb-4">Perfect for getting started.</p>
                    </div>
                    <Button className="w-full mt-auto bg-emerald-500 hover:bg-emerald-600 text-white border-none" asChild>
                      <a href={`/signup?tier=startup&interval=${billingPeriod === 'yearly' ? 'year' : 'month'}`}>Start Trial</a>
                    </Button>
                  </CardContent>
                </Card>

                {/* Growth Tier (Pro) */}
                <Card className="border-primary/50 relative shadow-md hover:shadow-xl transition-all flex flex-col">
                  <div className="absolute top-0 left-0 right-0 h-1 bg-blue-600" />
                  <CardHeader>
                    <Badge variant="outline" className="w-fit mb-2 border-blue-200 text-blue-600 bg-blue-50">Best Value</Badge>
                    <CardTitle className="text-xl flex items-center gap-2">
                      <div className="h-8 w-8 rounded-lg bg-blue-100 flex items-center justify-center">
                        <Star className="h-4 w-4 text-blue-600" />
                      </div>
                      GRCompliance Growth
                    </CardTitle>
                    <div className="mt-4">
                      {billingPeriod === 'monthly' ? (
                        <>
                          <div className="text-3xl font-bold">$299 <span className="text-sm font-normal text-muted-foreground">/month</span></div>
                          <div className="text-sm text-muted-foreground mt-1">Billed monthly</div>
                        </>
                      ) : (
                        <>
                          <div className="text-3xl font-bold">$2,999 <span className="text-sm font-normal text-muted-foreground">/year</span></div>
                          <div className="text-sm text-muted-foreground mt-1 text-green-600 font-medium">Save $589/year</div>
                        </>
                      )}
                    </div>
                    <CardDescription className="mt-3">For growing teams managing multiple client organizations.</CardDescription>
                  </CardHeader>
                  <CardContent className="flex-1 flex flex-col">
                    <ul className="space-y-2 text-sm flex-1">
                      <CheckItem text="Everything in Self-Service, plus:" />
                      <CheckItem text="Up to 10 Organizations" />
                      <CheckItem text="Priority Email Support" />
                      <CheckItem text="Team Roles & Permissions" />
                      <CheckItem text="Bulk Evidence Management" />
                    </ul>
                    <div className="pt-4 border-t mt-4">
                      <p className="text-xs text-muted-foreground mb-4">Scale your compliance ops.</p>
                    </div>
                    <Button className="w-full mt-auto bg-emerald-500 hover:bg-emerald-600 text-white border-none" asChild>
                      <a href={`/signup?tier=guided&interval=${billingPeriod === 'yearly' ? 'year' : 'month'}`}>Start Trial</a>
                    </Button>
                  </CardContent>
                </Card>

                {/* Partially Managed */}
                <Card className="relative border-purple-500/20 flex flex-col">
                  <div className="absolute top-0 left-0 right-0 h-1 bg-purple-500" />
                  <CardHeader>
                    <Badge variant="outline" className="w-fit mb-2 border-purple-200 text-purple-600 bg-purple-50">Consulting</Badge>
                    <CardTitle className=" text-lg flex items-center gap-2">
                      <div className="h-8 w-8 rounded-lg bg-purple-100 flex items-center justify-center">
                        <Building2 className="h-4 w-4 text-purple-600" />
                      </div>
                      Partially Managed
                    </CardTitle>
                    <div className="mt-4">
                      <div className="text-3xl font-bold">Custom</div>
                      <div className="text-sm text-muted-foreground mt-1">Tailored Quote</div>
                    </div>
                    <CardDescription className="mt-3">We mentor and guide your team through compliance and security.</CardDescription>
                  </CardHeader>
                  <CardContent className="flex-1 flex flex-col">
                    <ul className="space-y-2 text-sm flex-1">
                      <CheckItem text="Everything in Growth, plus:" />
                      <CheckItem text="Dedicated Security Consultant" />
                      <CheckItem text="Weekly Coaching Calls" />
                      <CheckItem text="Policy Customization" />
                      <CheckItem text="Audit Liaison Support" />
                    </ul>
                    <div className="pt-4 border-t mt-4">
                      <p className="text-xs text-muted-foreground mb-4">Don't go it alone.</p>
                    </div>
                    <Button className="w-full mt-auto bg-emerald-500 hover:bg-emerald-600 text-white border-none" asChild><a href="/managed-services">Learn More</a></Button>
                  </CardContent>
                </Card>

                {/* Fully Managed */}
                <Card className="relative overflow-hidden bg-gradient-to-br from-slate-900 to-slate-800 text-white border-slate-700 flex flex-col">
                  <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-emerald-400 to-teal-500" />
                  <CardHeader>
                    <Badge variant="outline" className="w-fit mb-2 border-emerald-400/30 text-emerald-400 bg-emerald-400/10">Full Outsourcing</Badge>
                    <CardTitle className="text-lg flex items-center gap-2 text-white">
                      <div className="h-8 w-8 rounded-lg bg-emerald-500/20 flex items-center justify-center">
                        <Shield className="h-4 w-4 text-emerald-400" />
                      </div>
                      Fully Managed
                    </CardTitle>
                    <div className="mt-4">
                      <div className="text-3xl font-bold text-white">Custom <span className="text-sm font-normal text-slate-400">Pricing</span></div>
                    </div>
                    <CardDescription className="mt-3 text-slate-300">Your compliance and security — fully managed on our infrastructure.</CardDescription>
                  </CardHeader>
                  <CardContent className="flex-1 flex flex-col">
                    <ul className="space-y-2 text-sm text-slate-200 flex-1">
                      <li className="flex items-center gap-2"><Check className="h-4 w-4 text-emerald-400 shrink-0" /><span>Private Server Installation</span></li>
                      <li className="flex items-center gap-2"><Check className="h-4 w-4 text-emerald-400 shrink-0" /><span>Full Compliance & Security Mgmt</span></li>
                      <li className="flex items-center gap-2"><Check className="h-4 w-4 text-emerald-400 shrink-0" /><span>Evidence Collection & Triage</span></li>
                      <li className="flex items-center gap-2"><Check className="h-4 w-4 text-emerald-400 shrink-0" /><span>Audit Defense</span></li>
                    </ul>
                    <div className="pt-4 border-t border-slate-700 mt-4">
                      <p className="text-xs text-slate-400 mb-4">Your CISO in a box.</p>
                    </div>
                    <Button className="w-full bg-emerald-500 hover:bg-emerald-600 text-white mt-auto" asChild><a href="/managed-services">Learn More</a></Button>
                  </CardContent>
                </Card>
              </div>

              {/* Private Hosting Add-on Section */}
              <div className="mt-16 max-w-4xl mx-auto">
                <Card className="bg-[#002a40] border-slate-700">
                  <CardContent className="p-8">
                    <div className="flex flex-col md:flex-row gap-8 items-center">
                      <div className="flex-shrink-0">
                        <div className="h-16 w-16 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-lg">
                          <Lock className="h-8 w-8 text-white" />
                        </div>
                      </div>
                      <div className="flex-1 text-center md:text-left">
                        <h3 className="text-xl font-bold mb-2 text-white">Private Server Hosting Add-On</h3>
                        <p className="text-slate-300 mb-4">
                          For organizations with strict compliance, data residency, or regulatory requirements. Available for Growth, Partially Managed, and Fully Managed plans.
                        </p>
                        <div className="flex flex-wrap gap-4 justify-center md:justify-start text-sm text-slate-300">
                          <div className="flex items-center gap-2">
                            <Check className="h-4 w-4 text-emerald-400" />
                            <span>Dedicated infrastructure</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Check className="h-4 w-4 text-emerald-400" />
                            <span>We manage setup & updates</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Check className="h-4 w-4 text-emerald-400" />
                            <span>24/7 monitoring</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Check className="h-4 w-4 text-emerald-400" />
                            <span>Data sovereignty</span>
                          </div>
                        </div>
                      </div>
                      <div className="flex-shrink-0">
                        <Button variant="outline" asChild>
                          <a href="/managed-services">Learn More</a>
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Comparison Table */}
              <div className="mt-16 max-w-5xl mx-auto overflow-x-auto">
                <h3 className="text-xl font-bold text-center mb-8">Compare Plans</h3>
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-4 px-4 font-medium text-muted-foreground">Feature</th>
                      <th className="text-center py-4 px-4 font-bold">Self-Service</th>
                      <th className="text-center py-4 px-4 font-bold text-blue-600">Growth</th>
                      <th className="text-center py-4 px-4 font-bold text-purple-600">Partially Managed</th>
                      <th className="text-center py-4 px-4 font-bold text-emerald-600">Fully Managed</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    <tr>
                      <td className="py-3 px-4">Pricing</td>
                      <td className="text-center py-3 px-4">{billingPeriod === 'monthly' ? '$199/mo' : '$1,999/yr'}</td>
                      <td className="text-center py-3 px-4 bg-blue-50">{billingPeriod === 'monthly' ? '$299/mo' : '$2,999/yr'}</td>
                      <td className="text-center py-3 px-4 bg-purple-50">Custom</td>
                      <td className="text-center py-3 px-4 bg-emerald-50">Custom</td>
                    </tr>
                    <tr>
                      <td className="py-3 px-4">Organizations</td>
                      <td className="text-center py-3 px-4">1</td>
                      <td className="text-center py-3 px-4 bg-blue-50">Up to 10</td>
                      <td className="text-center py-3 px-4 bg-purple-50">Custom</td>
                      <td className="text-center py-3 px-4 bg-emerald-50">Unlimited</td>
                    </tr>
                    <tr>
                      <td className="py-3 px-4">Platform Access</td>
                      <td className="text-center py-3 px-4"><Check className="h-4 w-4 text-primary mx-auto" /></td>
                      <td className="text-center py-3 px-4 bg-blue-50"><Check className="h-4 w-4 text-primary mx-auto" /></td>
                      <td className="text-center py-3 px-4 bg-purple-50"><Check className="h-4 w-4 text-primary mx-auto" /></td>
                      <td className="text-center py-3 px-4 bg-emerald-50"><Check className="h-4 w-4 text-primary mx-auto" /></td>
                    </tr>
                    <tr>
                      <td className="py-3 px-4">Consulting & Mentorship</td>
                      <td className="text-center py-3 px-4"><X className="h-4 w-4 text-muted-foreground mx-auto" /></td>
                      <td className="text-center py-3 px-4 bg-blue-50"><X className="h-4 w-4 text-muted-foreground mx-auto" /></td>
                      <td className="text-center py-3 px-4 bg-purple-50"><Check className="h-4 w-4 text-primary mx-auto" /></td>
                      <td className="text-center py-3 px-4 bg-emerald-50"><Check className="h-4 w-4 text-primary mx-auto" /></td>
                    </tr>
                    <tr>
                      <td className="py-3 px-4">Execution (We Do It)</td>
                      <td className="text-center py-3 px-4"><X className="h-4 w-4 text-muted-foreground mx-auto" /></td>
                      <td className="text-center py-3 px-4 bg-blue-50"><X className="h-4 w-4 text-muted-foreground mx-auto" /></td>
                      <td className="text-center py-3 px-4 bg-purple-50"><X className="h-4 w-4 text-muted-foreground mx-auto" /></td>
                      <td className="text-center py-3 px-4 bg-emerald-50"><Check className="h-4 w-4 text-primary mx-auto" /></td>
                    </tr>
                    <tr>
                      <td className="py-3 px-4">Private Server</td>
                      <td className="text-center py-3 px-4"><X className="h-4 w-4 text-muted-foreground mx-auto" /></td>
                      <td className="text-center py-3 px-4 bg-blue-50">Add-On</td>
                      <td className="text-center py-3 px-4 bg-purple-50">Add-On</td>
                      <td className="text-center py-3 px-4 bg-emerald-50"><Check className="h-4 w-4 text-primary mx-auto" /></td>
                    </tr>
                    <tr>
                      <td className="py-3 px-4">Support</td>
                      <td className="text-center py-3 px-4">Community</td>
                      <td className="text-center py-3 px-4 bg-blue-50">Priority Email</td>
                      <td className="text-center py-3 px-4 bg-purple-50">Dedicated Consultant</td>
                      <td className="text-center py-3 px-4 bg-emerald-50">Account Manager</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </section>
        )}

        {/* CTA */}
        <section className="py-24">
          <div className="container">
            <div className="bg-gradient-to-br from-[#002a40] via-[#003d5c] to-[#00526c] text-white rounded-2xl p-12 text-center relative overflow-hidden">
              <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmYiIGZpbGwtb3BhY2l0eT0iMC4wMyI+PGNpcmNsZSBjeD0iMzAiIGN5PSIzMCIgcj0iMiIvPjwvZz48L2c+PC9zdmc+')] opacity-50" />
              <div className="relative z-10 max-w-2xl mx-auto">
                <h2 className="text-3xl font-bold mb-6 text-white">Ready to get compliant?</h2>
                <p className="text-lg text-slate-300 mb-8">
                  Join 500+ security teams who trust GRCompliance to manage their security program.
                </p>
                <Button size="lg" className="h-12 px-8 text-lg bg-[#7FBF3F] hover:bg-[#6ba832] text-white border-none shadow-lg shadow-[#7FBF3F]/30" asChild>
                  <a href={getLoginUrl()}>Create Free Account</a>
                </Button>
                <p className="mt-4 text-sm text-slate-400">No credit card required. Cancel anytime.</p>
              </div>
            </div>
          </div>
        </section>
      </main>

      <footer className="bg-[#002a40] py-12 border-t border-white/10">
        <div className="container grid md:grid-cols-4 gap-8">
          <div className="col-span-1 md:col-span-2">
            <div className="flex items-center gap-2 mb-4">
              <div className="h-6 w-6 rounded bg-[#0ea5e9] flex items-center justify-center">
                <Shield className="h-4 w-4 text-white" />
              </div>
              <span className="font-bold text-lg text-white">GRCompliance</span>
            </div>
            <p className="text-slate-400 text-sm max-w-xs">
              The modern operating system for governance, risk, and compliance. Built for high-growth tech companies.
            </p>
          </div>
          <div>
            <h4 className="font-semibold mb-4 text-white">Product</h4>
            <ul className="space-y-2 text-sm text-slate-400">
              <li><a href="#" className="hover:text-white transition-colors">Policies</a></li>
            </ul>
          </div>
          <div>
            <h4 className="font-semibold mb-4 text-white">Company</h4>
            <ul className="space-y-2 text-sm text-slate-400">
              <li><a href="#" className="hover:text-white transition-colors">About</a></li>
              <li><a href="#" className="hover:text-white transition-colors">Blog</a></li>
              <li><a href="mailto:sales@grcompliance.com" className="hover:text-white transition-colors">Contact</a></li>
            </ul>
          </div>
        </div>
        <div className="container mt-12 pt-8 border-t border-white/10 text-center text-xs text-slate-500">
          © {new Date().getFullYear()} GRCompliance. All rights reserved.
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
