import React from 'react';
import { Button } from "@complianceos/ui/ui/button";
import { Badge } from "@complianceos/ui/ui/badge";
import { Check, Shield, Building2, Users, FileText, Target, ArrowRight, Lock, CheckCircle2, Zap, BarChart } from 'lucide-react';
import { motion } from "framer-motion";

export default function ManagedServicesPage() {
    const container = {
        hidden: { opacity: 0 },
        show: {
            opacity: 1,
            transition: {
                staggerChildren: 0.1
            }
        }
    };

    const item = {
        hidden: { opacity: 0, y: 20 },
        show: { opacity: 1, y: 0 }
    };

    return (
        <div className="min-h-screen bg-[#002a40] text-white font-sans selection:bg-emerald-500/30">
            {/* Navbar */}
            <nav className="sticky top-0 z-50 w-full border-b border-white/10 bg-[#002a40]/80 backdrop-blur-md">
                <div className="container flex h-16 items-center justify-between">
                    <div className="flex items-center gap-2">
                        <div className="h-8 w-8 rounded bg-[#0ea5e9] flex items-center justify-center shadow-[0_0_15px_rgba(14,165,233,0.5)]">
                            <Shield className="h-5 w-5 text-white" />
                        </div>
                        <a href="/" className="font-bold text-xl tracking-tight">GRCompliance</a>
                    </div>
                    <div className="hidden md:flex items-center gap-8 text-sm font-medium">
                        <a href="/#features" className="text-slate-300 hover:text-white transition-colors">Features</a>
                        <a href="/#pricing" className="text-slate-300 hover:text-white transition-colors">Pricing</a>
                        <a href="/managed-services" className="text-white font-semibold transition-colors relative after:content-[''] after:absolute after:-bottom-1 after:left-0 after:w-full after:h-0.5 after:bg-emerald-500">Managed Services</a>
                    </div>
                    <div className="flex items-center gap-4">
                        <Button variant="ghost" className="text-slate-300 hover:text-white hover:bg-white/10" asChild>
                            <a href="/login">Log in</a>
                        </Button>
                        <Button className="bg-[#7FBF3F] hover:bg-[#6ba832] text-white border-none shadow-[0_0_20px_rgba(127,191,63,0.3)] transition-all hover:scale-105" asChild>
                            <a href="/signup">Get Started</a>
                        </Button>
                    </div>
                </div>
            </nav>

            <main className="flex-1 overflow-x-hidden">
                {/* Hero Section */}
                <section className="relative pt-32 pb-40">
                    {/* Background Effects */}
                    <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[500px] bg-[#0ea5e9] rounded-full blur-[120px] opacity-20 pointer-events-none" />
                    <div className="absolute bottom-0 right-0 w-[800px] h-[600px] bg-emerald-500 rounded-full blur-[150px] opacity-10 pointer-events-none" />

                    <div className="container relative z-10 text-center">
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.6 }}
                        >
                            <Badge variant="outline" className="mb-8 border-emerald-500/30 text-emerald-400 bg-emerald-500/10 px-4 py-1.5 text-sm uppercase tracking-wider backdrop-blur-sm">
                                Managed Services
                            </Badge>
                            <h1 className="text-5xl md:text-7xl lg:text-8xl font-bold tracking-tight mb-8">
                                Compliance is Hard.<br />
                                <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#0ea5e9] via-emerald-400 to-[#7FBF3F]">
                                    We Make It Done.
                                </span>
                            </h1>
                            <p className="text-xl md:text-2xl text-slate-300 max-w-3xl mx-auto mb-12 leading-relaxed">
                                Stop struggling with spreadsheets and confusing requirements. Get a dedicated security team embedded directly in your workflow.
                            </p>

                            <div className="flex flex-col sm:flex-row items-center justify-center gap-6">
                                <Button size="lg" className="h-16 px-10 text-xl bg-[#0ea5e9] hover:bg-[#0284c7] text-white border-none shadow-[0_0_30px_rgba(14,165,233,0.4)] transition-all hover:scale-105" asChild>
                                    <a href="mailto:sales@grcompliance.com">Book a Consultation</a>
                                </Button>
                                <Button size="lg" className="h-16 px-10 text-xl bg-transparent border-2 border-white/20 text-white hover:bg-white hover:text-[#002a40] transition-all backdrop-blur-sm" asChild>
                                    <a href="#tiers">Compare Options</a>
                                </Button>
                            </div>
                        </motion.div>
                    </div>
                </section>

                {/* Value Props Grid */}
                <section className="py-24 bg-white/5 backdrop-blur-lg border-y border-white/5 relative">
                    <div className="container">
                        <motion.div
                            variants={container}
                            initial="hidden"
                            whileInView="show"
                            viewport={{ once: true }}
                            className="grid md:grid-cols-3 gap-8"
                        >
                            <motion.div variants={item} className="bg-[#002a40]/50 p-8 rounded-3xl border border-white/10 hover:border-emerald-500/50 transition-colors group">
                                <div className="h-14 w-14 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-2xl flex items-center justify-center mb-6 shadow-lg group-hover:scale-110 transition-transform">
                                    <Users className="h-7 w-7 text-white" />
                                </div>
                                <h3 className="text-2xl font-bold mb-4">Fractional CISO Team</h3>
                                <p className="text-slate-400 leading-relaxed text-lg">
                                    Don't hire a $200k executive. Get an entire team of experts for a fraction of the cost, available whenever you need them.
                                </p>
                            </motion.div>

                            <motion.div variants={item} className="bg-[#002a40]/50 p-8 rounded-3xl border border-white/10 hover:border-emerald-500/50 transition-colors group">
                                <div className="h-14 w-14 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-2xl flex items-center justify-center mb-6 shadow-lg group-hover:scale-110 transition-transform">
                                    <Shield className="h-7 w-7 text-white" />
                                </div>
                                <h3 className="text-2xl font-bold mb-4">Audit Guarantee</h3>
                                <p className="text-slate-400 leading-relaxed text-lg">
                                    We don't just advise—we defend. We join your audit calls, answer technical questions, and ensure you pass.
                                </p>
                            </motion.div>

                            <motion.div variants={item} className="bg-[#002a40]/50 p-8 rounded-3xl border border-white/10 hover:border-emerald-500/50 transition-colors group">
                                <div className="h-14 w-14 bg-gradient-to-br from-[#0ea5e9] to-blue-600 rounded-2xl flex items-center justify-center mb-6 shadow-lg group-hover:scale-110 transition-transform">
                                    <Zap className="h-7 w-7 text-white" />
                                </div>
                                <h3 className="text-2xl font-bold mb-4">Zero Friction</h3>
                                <p className="text-slate-400 leading-relaxed text-lg">
                                    We integrate directly into your tool stack (Jira, GitHub, AWS) to collect evidence automatically. No manual screenshots.
                                </p>
                            </motion.div>
                        </motion.div>
                    </div>
                </section>

                {/* Tiers Detail */}
                <section id="tiers" className="py-32 relative">
                    {/* Decorative elements */}
                    <div className="absolute top-1/2 left-0 w-[500px] h-[500px] bg-purple-500/20 rounded-full blur-[100px] pointer-events-none" />
                    <div className="absolute bottom-0 right-0 w-[500px] h-[500px] bg-primary/20 rounded-full blur-[100px] pointer-events-none" />

                    <div className="container relative z-10">
                        <div className="text-center mb-16">
                            <h2 className="text-4xl md:text-5xl font-bold mb-6">Choose Your Level of Support</h2>
                            <p className="text-xl text-slate-400">From expert guidance to full outsourcing.</p>
                        </div>

                        <div className="grid lg:grid-cols-2 gap-8 lg:gap-16 items-stretch">
                            {/* Tier 1: Partially Managed */}
                            <motion.div
                                whileHover={{ y: -10 }}
                                transition={{ type: "spring", stiffness: 300 }}
                                className="relative group flex flex-col"
                            >
                                <div className="absolute inset-0 bg-gradient-to-b from-white/10 to-transparent rounded-[2rem] -z-10 blur-sm" />
                                <div className="flex-1 bg-slate-900/50 backdrop-blur-xl border border-white/10 rounded-[2rem] p-10 overflow-hidden relative">
                                    <div className="absolute top-0 right-0 p-8 opacity-10">
                                        <Target className="h-48 w-48 text-white" />
                                    </div>

                                    <div className="relative z-10">
                                        <div className="inline-block p-3 rounded-xl bg-purple-500/20 text-purple-300 font-bold mb-6">
                                            TIER 1
                                        </div>
                                        <h3 className="text-4xl font-bold mb-2 text-white">Partially Managed</h3>
                                        <p className="text-xl text-purple-300 font-medium mb-8">"We Guide, You Execute"</p>

                                        <div className="h-px w-full bg-gradient-to-r from-purple-500/50 to-transparent mb-8" />

                                        <p className="text-lg text-slate-300 mb-8 leading-relaxed">
                                            Perfect for teams that have an internal ops person who can do the work, but lacks the specific security compliance expertise to know <em>what</em> to do.
                                        </p>

                                        <ul className="space-y-4 mb-10">
                                            {[
                                                "Dedicated Consultant assigned to your account",
                                                "Weekly 30-min strategy & coaching calls",
                                                "Policy Review & Customization",
                                                "Audit Liaison Support (We verify your evidence)"
                                            ].map((feature, i) => (
                                                <li key={i} className="flex items-start gap-4">
                                                    <div className="mt-1 h-6 w-6 rounded-full bg-purple-500 flex items-center justify-center shrink-0">
                                                        <Check className="h-3.5 w-3.5 text-white" />
                                                    </div>
                                                    <span className="text-slate-200 text-lg">{feature}</span>
                                                </li>
                                            ))}
                                        </ul>
                                    </div>

                                    <div className="mt-auto">
                                        <Button className="w-full h-14 text-lg bg-purple-600 hover:bg-purple-500 text-white shadow-lg shadow-purple-500/25 transition-all" asChild>
                                            <a href="mailto:sales@grcompliance.com?subject=Inquiry%20about%20Partially%20Managed%20Service">Get Started</a>
                                        </Button>
                                    </div>
                                </div>
                            </motion.div>

                            {/* Tier 2: Fully Managed */}
                            <motion.div
                                whileHover={{ y: -10 }}
                                transition={{ type: "spring", stiffness: 300 }}
                                className="relative group flex flex-col"
                            >
                                {/* Glowing Border effect */}
                                <div className="absolute -inset-0.5 bg-gradient-to-b from-emerald-500 to-[#0ea5e9] rounded-[2rem] blur opacity-75 group-hover:opacity-100 transition duration-1000 group-hover:duration-200" />

                                <div className="flex-1 bg-[#001e2b] rounded-[2rem] p-10 overflow-hidden relative border border-emerald-500/50">
                                    <div className="absolute top-0 right-0 p-8 opacity-10">
                                        <Shield className="h-48 w-48 text-emerald-500" />
                                    </div>

                                    <div className="relative z-10">
                                        <div className="inline-flex items-center gap-2 p-3 rounded-xl bg-emerald-500/20 text-emerald-300 font-bold mb-6">
                                            <Shield className="h-4 w-4" /> TIER 2
                                        </div>
                                        <h3 className="text-4xl font-bold mb-2 text-white">Fully Managed</h3>
                                        <p className="text-xl text-emerald-400 font-medium mb-8">"We Do It All"</p>

                                        <div className="h-px w-full bg-gradient-to-r from-emerald-500/50 to-transparent mb-8" />

                                        <p className="text-lg text-slate-300 mb-8 leading-relaxed">
                                            Our most popular plan. We act as your internal security team, handling implementation, evidence collection, and the complete audit.
                                        </p>

                                        <ul className="space-y-4 mb-10">
                                            {[
                                                "Private Hosted Infrastructure Included",
                                                "Automated Evidence Collection (We log in for you)",
                                                "Vendor Risk Management on Autopilot",
                                                "Full Audit Defense (We run the audit)"
                                            ].map((feature, i) => (
                                                <li key={i} className="flex items-start gap-4">
                                                    <div className="mt-1 h-6 w-6 rounded-full bg-emerald-500 flex items-center justify-center shrink-0">
                                                        <Check className="h-3.5 w-3.5 text-white" />
                                                    </div>
                                                    <span className="text-slate-200 text-lg font-medium">{feature}</span>
                                                </li>
                                            ))}
                                        </ul>
                                    </div>

                                    <div className="mt-auto">
                                        <Button className="w-full h-14 text-lg bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg shadow-emerald-500/25 transition-all" asChild>
                                            <a href="mailto:sales@grcompliance.com?subject=Inquiry%20about%20Fully%20Managed%20Service">Contact Sales</a>
                                        </Button>
                                    </div>
                                </div>
                            </motion.div>
                        </div>
                    </div>
                </section>

                {/* Comparison Table */}
                <section className="py-24 bg-white/5 border-t border-white/5">
                    <div className="container max-w-5xl">
                        <h2 className="text-3xl md:text-4xl font-bold text-center mb-16">In-Depth Comparison</h2>

                        <div className="bg-slate-900/50 backdrop-blur-md rounded-2xl border border-white/10 overflow-hidden shadow-2xl">
                            <table className="w-full text-left border-collapse">
                                <thead>
                                    <tr className="border-b border-white/10">
                                        <th className="p-6 md:p-8 font-semibold text-lg text-slate-300">Feature Deliverable</th>
                                        <th className="p-6 md:p-8 font-bold text-xl text-purple-400 border-l border-white/10 w-1/3">Partially Managed</th>
                                        <th className="p-6 md:p-8 font-bold text-xl text-emerald-400 border-l border-white/10 w-1/3 bg-emerald-500/5">Fully Managed</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-white/10">
                                    {[
                                        { name: "Policy Writing", partial: "Review & Editing", full: "Written from scratch" },
                                        { name: "Evidence Collection", partial: "You upload, we verify", full: "We log in & collect it" },
                                        { name: "Infrastructure Hosting", partial: "Shared Cloud Model", full: "Dedicated Private Server" },
                                        { name: "Meeting Cadence", partial: "Weekly 30m Sync", full: "Slack-embedded (Unlimited)" },
                                        { name: "Audit Role", partial: "Advisor / Liaison", full: "Primary Defender" },
                                        { name: "Vendor Reviews", partial: "Templates Provided", full: "We perform the reviews" }
                                    ].map((row, i) => (
                                        <tr key={i} className="hover:bg-white/5 transition-colors">
                                            <td className="p-6 md:p-8 font-medium text-slate-300">{row.name}</td>
                                            <td className="p-6 md:p-8 border-l border-white/10 text-slate-200">{row.partial}</td>
                                            <td className="p-6 md:p-8 border-l border-white/10 bg-emerald-500/5 text-white font-semibold flex items-center gap-2">
                                                {row.full === "Dedicated Private Server" && <Lock className="h-4 w-4 text-emerald-500" />}
                                                {row.full}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </section>

                {/* Final CTA */}
                <section className="py-32 relative overflow-hidden">
                    <div className="absolute inset-0 bg-gradient-to-t from-emerald-900/50 to-[#002a40]" />
                    <div className="container relative z-10 text-center">
                        <h2 className="text-4xl md:text-5xl font-bold mb-8">Ready to offload your compliance burden?</h2>
                        <p className="text-xl text-slate-300 max-w-2xl mx-auto mb-12">
                            Join high-growth companies that trust GRCompliance as their dedicated security partner.
                        </p>
                        <Button size="lg" className="h-20 px-12 text-2xl bg-[#7FBF3F] hover:bg-[#6ba832] text-white border-none shadow-[0_0_40px_rgba(127,191,63,0.4)] transition-all hover:scale-105 rounded-2xl" asChild>
                            <a href="mailto:sales@grcompliance.com">Book Your Free Consultation</a>
                        </Button>
                    </div>
                </section>
            </main>

            {/* Footer */}
            <footer className="bg-[#001e2b] py-16 border-t border-white/10 text-slate-400">
                <div className="container text-center">
                    <div className="flex items-center justify-center gap-3 mb-6">
                        <div className="h-8 w-8 rounded bg-[#0ea5e9] flex items-center justify-center">
                            <Shield className="h-5 w-5 text-white" />
                        </div>
                        <span className="font-bold text-2xl text-white">GRCompliance</span>
                    </div>
                    <p className="text-lg mb-8 max-w-md mx-auto">The modern operating system for governance, risk, and compliance. Built for high-growth tech companies.</p>
                    <div className="flex justify-center gap-8 mb-8 text-sm font-medium">
                        <a href="/" className="hover:text-white transition-colors">Home</a>
                        <a href="/#features" className="hover:text-white transition-colors">Platform</a>
                        <a href="mailto:sales@grcompliance.com" className="hover:text-white transition-colors">Contact</a>
                    </div>
                    <div className="text-sm opacity-50">
                        © {new Date().getFullYear()} GRCompliance. All rights reserved.
                    </div>
                </div>
            </footer>
        </div>
    );
}
