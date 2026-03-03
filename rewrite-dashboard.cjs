const fs = require('fs');
const path = require('path');

const filePath = path.join(process.cwd(), 'packages', 'core', 'src', 'pages', 'Dashboard.tsx');
let content = fs.readFileSync(filePath, 'utf8');

// 1. imports
content = content.replace(
    `import { EmptyState } from "@complianceos/ui/ui/EmptyState";\nimport { useLocation } from "wouter";`,
    `import { EmptyState } from "@complianceos/ui/ui/EmptyState";\nimport { useLocation } from "wouter";\nimport { Badge } from "@complianceos/ui/ui/badge";\nimport { motion, AnimatePresence } from "framer-motion";\nimport { CircularProgress } from "@complianceos/ui/ui/circular-progress";\nimport { BrainCircuit, ChevronDown } from "lucide-react";`
);

// 2. Wrap main container
content = content.replace(
    `<div className="space-y-8 page-transition">`,
    `<div className="relative min-h-[calc(100vh-3.5rem)] -mx-4 -my-8 px-4 py-8 md:-mx-20 md:-mt-8 md:pl-20 md:pr-8 bg-[#000a12] text-white overflow-hidden page-transition">
      {/* Ambient Dark Mode Background Glows */}
      <div className="absolute inset-0 z-0 pointer-events-none">
        <div className="absolute top-[-20%] left-[-10%] w-[60%] h-[60%] rounded-full bg-blue-500/10 blur-[120px]" />
        <div className="absolute top-[20%] right-[-10%] w-[50%] h-[60%] rounded-full bg-cyan-500/10 blur-[120px]" />
        <div className="absolute bottom-[-20%] left-[20%] w-[60%] h-[50%] rounded-full bg-indigo-500/10 blur-[120px]" />
        <div className="absolute inset-0 opacity-20 mix-blend-overlay pointer-events-none"></div>
      </div>
      <div className="relative z-10 space-y-8">`
);

// 3. Close the new wrapper div at the end before EnhancedDialog
content = content.replace(
    `{/* Target Score Dialog */}`,
    `</div>\n      {/* Target Score Dialog */}`
);

// 4. Replace Welcome Section with Command Center Header
const welcomeRegex = /\{\/\* Welcome Section \*\/\}.*?\{\/\* Onboarding Banner \(Short version for active dashboard\) \*\/\}/s;
content = content.replace(welcomeRegex, `
        {/* Animated Welcome & AI Command Center */}
        <div className="flex flex-col lg:flex-row gap-8 items-start justify-between relative z-10 w-full pt-4">
          <div className="flex-1 w-full space-y-6">
            <motion.div 
               initial={{ opacity: 0, y: 20 }}
               animate={{ opacity: 1, y: 0 }}
               transition={{ duration: 0.5 }}
            >
              <h1 className="text-3xl lg:text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-white via-blue-100 to-slate-400 tracking-tight">
                Good {new Date().getHours() < 12 ? 'Morning' : new Date().getHours() < 18 ? 'Afternoon' : 'Evening'}, {user?.user_metadata?.full_name?.split(' ')[0] || user?.email?.split('@')[0] || 'Commander'}.
              </h1>
              <p className="text-blue-200/80 font-medium mt-2 text-lg">
                Your compliance posture is active and scanning. Here is your daily briefing.
              </p>
            </motion.div>

            {/* AI Action Briefing */}
            <motion.div 
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="bg-[#001e2b]/60 backdrop-blur-2xl border border-white/10 rounded-3xl p-6 shadow-2xl relative overflow-hidden group"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-blue-500/10 to-transparent group-hover:from-blue-500/20 transition-all duration-700 pointer-events-none" />
              <div className="flex items-center justify-between mb-4 relative z-10">
                 <div className="flex items-center gap-3">
                   <div className="p-2.5 rounded-xl bg-blue-500/20 border border-blue-500/30 text-blue-400 shadow-[0_0_15px_rgba(59,130,246,0.3)]">
                     <BrainCircuit className="h-5 w-5" />
                   </div>
                   <h3 className="text-xl font-extrabold text-white tracking-tight">AI Posture Insights</h3>
                 </div>
                 <Badge variant="outline" className="border-blue-500/30 text-blue-400 bg-blue-500/10">Scanning Live</Badge>
              </div>

              <div className="space-y-4 relative z-10 mt-6">
                {insights.length > 0 ? insights.slice(0, 3).map((insight: any) => (
                  <div key={insight.id} className="flex gap-4 p-4 rounded-2xl bg-white/5 border border-white/5 hover:bg-white/10 hover:border-white/20 transition-all group/item">
                    <div className="mt-0.5">
                      {insight.type === 'critical' ? <AlertCircle className="h-5 w-5 text-red-400" /> :
                       insight.type === 'warning' ? <Clock className="h-5 w-5 text-amber-400" /> :
                       insight.type === 'success' ? <CheckCircle2 className="h-5 w-5 text-emerald-400" /> :
                       <Sparkles className="h-5 w-5 text-blue-400" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="text-white font-bold text-sm truncate">{insight.title}</h4>
                      <p className="text-slate-400 text-xs mt-1 leading-relaxed truncate">{insight.description}</p>
                    </div>
                    <Button variant="ghost" size="sm" className="h-8 text-[10px] uppercase tracking-wider font-bold text-white/70 hover:text-white bg-white/5 hover:bg-white/20 ml-2" onClick={() => setLocation(insight.link)}>
                      {insight.action} <ArrowRight className="h-3 w-3 ml-2 opacity-50 group-hover/item:opacity-100 group-hover/item:translate-x-1 transition-all" />
                    </Button>
                  </div>
                )) : (
                  <div className="text-center py-6 text-slate-400">
                    <CheckCircle2 className="h-10 w-10 mx-auto text-emerald-500 mb-3 opacity-50" />
                    <p>No critical actions required today. You are fully aligned.</p>
                  </div>
                )}
              </div>
            </motion.div>
          </div>

          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6, type: "spring" }}
            className="w-full lg:w-96 shrink-0"
          >
            {/* Real-time Posture Score */}
            <div className="bg-[#002a40]/40 backdrop-blur-xl border border-white/10 rounded-3xl p-8 relative overflow-hidden group shadow-2xl h-full flex flex-col items-center justify-center text-center">
               <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/5 to-cyan-500/5 opacity-0 group-hover:opacity-100 transition-duration-500 pointer-events-none" />
               <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/20 rounded-full blur-[80px] pointer-events-none" />
               
               <h3 className="text-sm font-extrabold text-slate-400 uppercase tracking-widest mb-6 relative z-10">Live Posture Score</h3>
               
               <div className="relative z-10">
                  <CircularProgress 
                    value={overallComplianceRate} 
                    size={220} 
                    strokeWidth={16} 
                    showValue={true} 
                    color={overallComplianceRate >= 80 ? '#10b981' : overallComplianceRate >= 50 ? '#f59e0b' : '#ef4444'} 
                  />
                  <div className="mt-8 flex items-center justify-center gap-2">
                     <span className="flex h-2 w-2 relative">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                     </span>
                     <span className="text-xs font-bold text-emerald-400 tracking-wider">SYSTEM OPTIMAL</span>
                  </div>
               </div>
            </div>
          </motion.div>
        </div>

        {/* Filters & Actions Header */}
        <div className="flex items-center flex-wrap justify-between mt-8 relative z-10 pb-4 border-b border-white/10">
          <h2 className="text-xl font-bold text-white tracking-tight mb-4 md:mb-0">Command Interface</h2>
          <div className="flex gap-4 items-center">
            {/* Dark Client Selector */}
            {clients && clients.length > 0 && (
              <div className="flex items-center gap-3 bg-[#001e2b]/80 backdrop-blur-md border border-white/10 rounded-xl px-4 py-2 shadow-sm transition-all hover:bg-white/5 focus-within:ring-2 focus-within:ring-blue-500/50 group">
                <span className="text-slate-400 font-semibold text-xs tracking-wider uppercase">Context:</span>
                <select
                  className="bg-transparent border-none focus:ring-0 cursor-pointer pr-8 font-bold text-white focus:text-blue-400 max-w-[150px] truncate outline-none appearance-none transition-colors"
                  value={clientId || ""}
                  onChange={(e) => setClientId(e.target.value || undefined)}
                >
                  <option value="" className="bg-[#001e2b]">Global Fleet</option>
                  {clients.map((client) => (
                    <option key={client.id} value={client.id} className="bg-[#001e2b] text-white">
                      {client.name}
                    </option>
                  ))}
                </select>
                <div className="ml-[-1.5rem] pointer-events-none text-slate-400 group-hover:text-white transition-colors">
                  <ChevronDown className="w-4 h-4" />
                </div>
              </div>
            )}

            {/* Dark Standard Selector */}
            <div className="flex items-center gap-3 bg-[#001e2b]/80 backdrop-blur-md border border-white/10 rounded-xl px-4 py-2 shadow-sm transition-all hover:bg-white/5 focus-within:ring-2 focus-within:ring-purple-500/50 group">
              <span className="text-slate-400 font-semibold text-xs tracking-wider uppercase">Protocol:</span>
              <select
                className="bg-transparent border-none focus:ring-0 cursor-pointer pr-8 font-bold text-white focus:text-purple-400 outline-none appearance-none transition-colors"
                value={framework || ""}
                onChange={(e) => setFramework(e.target.value || undefined)}
              >
                <option value="" className="bg-[#001e2b]">All Protocols</option>
                <option value="ISO 27001" className="bg-[#001e2b] text-white">ISO 27001</option>
                <option value="SOC 2" className="bg-[#001e2b] text-white">SOC 2</option>
              </select>
              <div className="ml-[-1.5rem] pointer-events-none text-slate-400 group-hover:text-white transition-colors">
                <ChevronDown className="w-4 h-4" />
              </div>
            </div>
            
            {(user?.role === 'admin' || user?.role === 'super_admin' || user?.role === 'owner') && (
              <Button onClick={() => setLocation('/clients')} className="bg-white hover:bg-blue-50 text-slate-900 shadow-xl shadow-white/10 h-10 px-5 rounded-xl font-bold transition-all hover:scale-105 active:scale-95">
                <Plus className="mr-2 h-4 w-4" />
                Deploy Node
              </Button>
            )}
          </div>
        </div>

        {/* Onboarding Banner (Short version for active dashboard) */}
`);

// 5. Remove the old AI Insights Section
const oldAiInsightsRegex = /\{\/\* AI Insights Section \*\/\}.*?\{\/\* Key Metrics - Enhanced with Animations \*\/\}/s;
content = content.replace(oldAiInsightsRegex, `{/* Key Metrics - Enhanced with Animations */}`);

// 6. Convert light mode cards to dark mode glass cards globally in this file
// bg-white/60 -> bg-[#002a40]/40
// border-white/40 -> border-white/10  (and some border-white/60 to border-white/10)
// text-slate-900 -> text-white
// text-slate-800 -> text-slate-200
// bg-white/50 -> bg-white/5

content = content.replaceAll('bg-white/60 backdrop-blur-xl', 'bg-[#002a40]/40 backdrop-blur-xl');
content = content.replaceAll('border border-white/40', 'border border-white/10');
content = content.replaceAll('text-slate-900', 'text-white');
content = content.replaceAll('text-slate-800', 'text-slate-200');
content = content.replaceAll('bg-white/50', 'bg-white/5');
content = content.replaceAll('border border-white/60', 'border border-white/10');
content = content.replaceAll('border border-border', 'border border-white/10');
content = content.replaceAll('bg-white shadow-sm', 'bg-[#001e2b] border border-white/10 shadow-lg');
content = content.replaceAll('bg-accent', 'bg-white/10');
content = content.replaceAll('bg-slate-50/50', 'bg-white/5');

// Make line charts tooltip dark theme
content = content.replace(
    `contentStyle={{ backgroundColor: '#fff', border: '1px solid #e2e8f0', borderRadius: '12px', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}`,
    `contentStyle={{ backgroundColor: '#001e2b', border: '1px solid rgba(255,255,255,0.1)', color: 'white', borderRadius: '12px', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.5)' }}`
);
content = content.replace(
    `labelStyle={{ fontWeight: 'bold', color: '#1e293b' }}`,
    `labelStyle={{ fontWeight: 'bold', color: 'white' }}`
);

fs.writeFileSync(filePath, content);
console.log('✅ Re-written Dashboard.tsx for Command Center overhaul.');
