
import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@complianceos/ui/ui/button";
import { Input } from "@complianceos/ui/ui/input";
import { Shield, CheckCircle2, Lock, Star } from "lucide-react";
import { toast } from "sonner";
import { motion } from "framer-motion";

export default function WaitlistPage() {
    const [email, setEmail] = useState("");
    const [firstName, setFirstName] = useState("");
    const [lastName, setLastName] = useState("");
    const [company, setCompany] = useState("");
    const [certification, setCertification] = useState("");
    const [orgSize, setOrgSize] = useState("");
    const [industry, setIndustry] = useState("");
    const [submitted, setSubmitted] = useState(false);

    const joinMutation = trpc.waitlist.join.useMutation({
        onSuccess: (data) => {
            setSubmitted(true);
            toast.success(data.message);
        },
        onError: (error) => {
            toast.error(error.message);
        }
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!email) return;
        joinMutation.mutate({
            email,
            firstName,
            lastName,
            company,
            certification,
            orgSize,
            industry
        });
    };

    if (submitted) {
        return (
            <div className="min-h-screen bg-[#002a40] text-white flex flex-col items-center justify-center p-4">
                <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="max-w-md w-full text-center space-y-6"
                >
                    <div className="h-20 w-20 bg-emerald-500/20 rounded-full flex items-center justify-center mx-auto text-emerald-500">
                        <CheckCircle2 className="h-10 w-10" />
                    </div>
                    <h1 className="text-3xl font-bold">You're on the list!</h1>
                    <p className="text-slate-300 text-lg">
                        We've reserved your spot. A member of our team will reach out to you shortly to discuss your compliance requirements.
                    </p>
                    <Button
                        variant="outline"
                        className="mt-8 border-emerald-500 text-emerald-500 hover:bg-emerald-500/10"
                        onClick={() => { window.location.href = "/"; }}
                    >
                        Return Home
                    </Button>
                </motion.div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#002a40] text-white overflow-hidden relative selection:bg-emerald-500/30">
            {/* Background Gradients */}
            <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
                <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-blue-600/20 rounded-full blur-[120px]" />
                <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-emerald-600/10 rounded-full blur-[120px]" />
            </div>

            <nav className="relative z-10 container mx-auto px-6 py-6 flex justify-between items-center">
                <div className="flex items-center gap-2 font-bold text-xl tracking-tight">
                    <div className="h-8 w-8 rounded-lg bg-emerald-500 flex items-center justify-center text-[#002a40]">
                        <Shield className="h-5 w-5 fill-current" />
                    </div>
                    GRCompliance
                </div>
                <div className="hidden md:flex gap-4 text-sm font-medium text-slate-400">
                    <span className="flex items-center gap-1"><Lock className="h-3 w-3" /> Secure</span>
                    <span className="flex items-center gap-1"><Star className="h-3 w-3" /> Private Beta</span>
                </div>
            </nav>

            <main className="relative z-10 container mx-auto px-4 pt-16 pb-24 md:pt-32 md:pb-32 flex flex-col items-center text-center">

                <div className="inline-flex items-center rounded-full border border-emerald-500/30 px-3 py-1 text-sm text-emerald-400 mb-8 bg-emerald-500/10 backdrop-blur-sm">
                    <span className="flex h-2 w-2 rounded-full bg-emerald-500 mr-2 animate-pulse" />
                    Exclusive Early Access
                </div>

                <h1 className="text-5xl md:text-7xl font-bold tracking-tight mb-6 max-w-4xl bg-clip-text text-transparent bg-gradient-to-b from-white to-white/70">
                    The Operating System for <span className="text-emerald-400">Compliance</span>.
                </h1>

                <p className="text-xl md:text-2xl text-slate-300 max-w-2xl mx-auto mb-12 leading-relaxed">
                    Stop drowning in spreadsheets. Join the waiting list for the first AI-powered platform that automates your security governance.
                </p>

                <CardForm
                    email={email}
                    setEmail={setEmail}
                    firstName={firstName}
                    setFirstName={setFirstName}
                    lastName={lastName}
                    setLastName={setLastName}
                    company={company}
                    setCompany={setCompany}
                    certification={certification}
                    setCertification={setCertification}
                    orgSize={orgSize}
                    setOrgSize={setOrgSize}
                    industry={industry}
                    setIndustry={setIndustry}
                    loading={joinMutation.isPending}
                    onSubmit={handleSubmit}
                />

                <div className="mt-16 flex flex-col md:flex-row items-center gap-8 md:gap-16 opacity-70 grayscale hover:grayscale-0 transition-all duration-700">
                    <div className="text-sm font-medium text-slate-500">TRUSTED BY LEADERS AT</div>
                    <div className="text-lg font-bold text-slate-400">Acme Corp</div>
                    <div className="text-lg font-bold text-slate-400">Stark Industries</div>
                    <div className="text-lg font-bold text-slate-400">Wayne Ent.</div>
                </div>

            </main>

            <footer className="relative z-10 border-t border-white/5 bg-[#002a40]/50 backdrop-blur-md py-8">
                <div className="container mx-auto px-6 text-center text-slate-500 text-sm">
                    © {new Date().getFullYear()} GRCompliance. All rights reserved.
                </div>
            </footer>
        </div>
    );
}

function CardForm({
    email, setEmail, firstName, setFirstName, lastName, setLastName, company, setCompany,
    certification, setCertification, orgSize, setOrgSize, industry, setIndustry, loading, onSubmit
}: {
    email: string, setEmail: (s: string) => void,
    firstName: string, setFirstName: (s: string) => void,
    lastName: string, setLastName: (s: string) => void,
    company: string, setCompany: (s: string) => void,
    certification: string, setCertification: (s: string) => void,
    orgSize: string, setOrgSize: (s: string) => void,
    industry: string, setIndustry: (s: string) => void,
    loading: boolean, onSubmit: (e: React.FormEvent) => void
}) {
    return (
        <div className="w-full max-w-2xl relative group">
            <div className="absolute -inset-1 bg-gradient-to-r from-emerald-500 to-blue-500 rounded-2xl blur opacity-25 group-hover:opacity-50 transition duration-1000"></div>
            <div className="relative bg-[#001e2b] border border-white/10 rounded-xl p-4 md:p-8 shadow-2xl">
                <form onSubmit={onSubmit} className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2 text-left">
                            <label className="text-sm font-medium text-slate-400">First Name</label>
                            <Input
                                placeholder="John"
                                className="bg-white/5 border-white/10 text-white placeholder:text-slate-500 h-12"
                                value={firstName}
                                onChange={(e) => setFirstName(e.target.value)}
                                required
                            />
                        </div>
                        <div className="space-y-2 text-left">
                            <label className="text-sm font-medium text-slate-400">Last Name</label>
                            <Input
                                placeholder="Doe"
                                className="bg-white/5 border-white/10 text-white placeholder:text-slate-500 h-12"
                                value={lastName}
                                onChange={(e) => setLastName(e.target.value)}
                                required
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2 text-left">
                            <label className="text-sm font-medium text-slate-400">Work Email</label>
                            <Input
                                type="email"
                                placeholder="john@acme.com"
                                className="bg-white/5 border-white/10 text-white placeholder:text-slate-500 h-12"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                required
                            />
                        </div>
                        <div className="space-y-2 text-left">
                            <label className="text-sm font-medium text-slate-400">Company Name</label>
                            <Input
                                placeholder="Acme Inc"
                                className="bg-white/5 border-white/10 text-white placeholder:text-slate-500 h-12"
                                value={company}
                                onChange={(e) => setCompany(e.target.value)}
                                required
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2 text-left">
                            <label className="text-sm font-medium text-slate-400">Target Certification</label>
                            <Input
                                placeholder="ISO 27001, SOC 2, etc."
                                className="bg-white/5 border-white/10 text-white placeholder:text-slate-500 h-12"
                                value={certification}
                                onChange={(e) => setCertification(e.target.value)}
                                required
                            />
                        </div>
                        <div className="space-y-2 text-left">
                            <label className="text-sm font-medium text-slate-400">Organization Size</label>
                            <select
                                className="w-full bg-white/5 border border-white/10 rounded-md text-white px-3 h-12 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 appearance-none"
                                value={orgSize}
                                onChange={(e) => setOrgSize(e.target.value)}
                                required
                            >
                                <option value="" disabled className="bg-[#001e2b]">Select size...</option>
                                <option value="1-10" className="bg-[#001e2b]">1-10 employees</option>
                                <option value="11-50" className="bg-[#001e2b]">11-50 employees</option>
                                <option value="51-200" className="bg-[#001e2b]">51-200 employees</option>
                                <option value="201-500" className="bg-[#001e2b]">201-500 employees</option>
                                <option value="501+" className="bg-[#001e2b]">501+ employees</option>
                            </select>
                        </div>
                    </div>

                    <div className="space-y-2 text-left">
                        <label className="text-sm font-medium text-slate-400">Industry</label>
                        <Input
                            placeholder="Fintech, Healthtech, SaaS, etc."
                            className="bg-white/5 border-white/10 text-white placeholder:text-slate-500 h-12"
                            value={industry}
                            onChange={(e) => setIndustry(e.target.value)}
                            required
                        />
                    </div>

                    <Button
                        type="submit"
                        disabled={loading}
                        className="w-full h-14 bg-emerald-500 hover:bg-emerald-600 text-white font-semibold text-lg border-none shadow-xl shadow-emerald-500/20 transition-all mt-6"
                    >
                        {loading ? 'Joining...' : 'Secure Your Spot'}
                    </Button>
                </form>
            </div>
            <p className="mt-6 text-sm text-slate-400 flex items-center justify-center gap-2">
                <Lock className="h-3 w-3" />
                <span>Limited spots available for Q1 2026. Data is encrypted.</span>
            </p>
        </div>
    );
}
