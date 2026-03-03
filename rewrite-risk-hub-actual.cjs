const fs = require('fs');
const path = require('path');

const filePath = path.join(process.cwd(), 'packages', 'core', 'src', 'pages', 'risk', 'RiskRegisterPage.tsx');
let content = fs.readFileSync(filePath, 'utf8');

content = content.replace(
    `import { Shield, Plus, ChevronRight, Home, Download, ChevronLeft, Wand2, RefreshCcw, FileText } from 'lucide-react';`,
    `import { Shield, Plus, ChevronRight, Home, Download, ChevronLeft, Wand2, RefreshCcw, FileText, Radar, Zap } from 'lucide-react';`
);

content = content.replace(
    `    const content = (
        <div className="space-y-6">`,
    `    const content = (
        <div className="relative min-h-[calc(100vh-3.5rem)] -mx-4 -my-8 px-4 py-8 md:-mx-20 md:-mt-8 md:pl-20 md:pr-28 bg-slate-50/50 text-slate-900 overflow-hidden page-transition">
            {/* Ambient Light Mode Background Glows */}
            <div className="absolute inset-0 z-0 pointer-events-none">
                <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[50%] rounded-full bg-blue-500/10 blur-[100px]" />
                <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] rounded-full bg-rose-500/5 blur-[100px]" />
            </div>
            <div className="relative z-10 space-y-6 max-w-7xl mx-auto">`
);

content = content.replace(
    `            <div className="flex items-center justify-between">
                <div>
                    <div className="mb-2">
                        <Link href={\`/clients/\${clientId}/risks\`}>
                            <Button variant="ghost" size="sm" className="pl-0 gap-1 text-muted-foreground hover:text-foreground">
                                <ChevronLeft className="w-4 h-4" />
                                Back to Dashboard
                            </Button>
                        </Link>
                    </div>
                    <h1 className="text-3xl font-bold text-slate-950">Risk Register</h1>
                    <p className="text-slate-900 mt-1 font-medium">Manage and track all identified risks for this client.</p>
                </div>
                <div className="flex items-center gap-2">`,
    `            {/* AI Threat Intel Banner */}
            <div className="bg-gradient-to-r from-blue-900 via-indigo-900 to-slate-900 p-1 rounded-2xl shadow-xl mb-2 mt-4">
                <div className="bg-slate-900/40 backdrop-blur-xl rounded-xl p-4 flex flex-col md:flex-row items-center justify-between gap-4 border border-white/10">
                    <div className="flex items-center gap-4">
                        <div className="relative flex items-center justify-center w-12 h-12 rounded-full bg-blue-500/20 text-blue-400">
                            <Radar className="w-6 h-6 animate-[spin_4s_linear_infinite]" />
                            <div className="absolute inset-0 rounded-full animate-ping bg-blue-500/20 duration-1000"></div>
                        </div>
                        <div>
                            <div className="flex items-center gap-2">
                                <h3 className="text-white font-bold text-sm tracking-wide">AI THREAT INTELLIGENCE</h3>
                                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-rose-500/20 text-rose-400 border border-rose-500/30">ACTIVE</span>
                            </div>
                            <p className="text-slate-300 text-sm mt-0.5">Monitoring global CISA alerts. <span className="text-white font-semibold flex items-center gap-1">2 new critical CVEs</span> identified matching your tech stack.</p>
                        </div>
                    </div>
                    <button className="px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-lg text-sm font-bold transition-colors border border-white/10 flex items-center gap-2 whitespace-nowrap">
                        <Zap className="w-4 h-4 text-amber-400" />
                        Analyze Assets
                    </button>
                </div>
            </div>

            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white/60 backdrop-blur-xl p-6 rounded-3xl border border-white/40 shadow-premium">
                <div className="flex items-center gap-4">
                    <div className="mb-2 md:hidden">
                        <Link href={\`/clients/\${clientId}/risks\`}>
                            <Button variant="ghost" size="sm" className="pl-0 gap-1 text-slate-500 hover:text-slate-900">
                                <ChevronLeft className="w-4 h-4" />
                                Back to Dashboard
                            </Button>
                        </Link>
                    </div>
                    <div className="h-14 w-14 rounded-2xl bg-gradient-to-br from-[#3ABEF9] to-blue-600 flex items-center justify-center shadow-lg shadow-blue-500/20">
                        <Shield className="h-7 w-7 text-white" />
                    </div>
                    <div>
                        <h1 className="text-3xl font-black text-slate-900 tracking-tight">Risk Register</h1>
                        <p className="text-slate-500 font-medium mt-1">Manage and track all identified risks for this client.</p>
                    </div>
                </div>
                <div className="flex items-center gap-2">`
);

content = content.replace(
    `            </EnhancedDialog>
        </div>`,
    `            </EnhancedDialog>
                </div>
            </div>
        </div>`
);

fs.writeFileSync(filePath, content, 'utf8');
console.log('✅ RiskRegisterPage.tsx updated successfully');
