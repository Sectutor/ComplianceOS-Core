const fs = require('fs');
const path = require('path');

const filePath = path.join(process.cwd(), 'packages', 'core', 'src', 'pages', 'Dashboard.tsx');
let content = fs.readFileSync(filePath, 'utf8');

// More thorough light theme conversion since this was originally built explicitly dark mode
content = content.replaceAll('text-transparent bg-clip-text bg-gradient-to-r from-white via-blue-100 to-slate-400', 'text-slate-900');
content = content.replaceAll('text-blue-200/80', 'text-slate-600');
content = content.replaceAll('text-slate-400', 'text-slate-500');

content = content.replaceAll('bg-white/60 backdrop-blur-2xl border border-white/40', 'bg-white/60 backdrop-blur-xl border border-white/40 shadow-sm');
content = content.replaceAll('bg-white/60 backdrop-blur-xl border border-white/40 border-white/40 shadow-sm', 'bg-white/60 backdrop-blur-xl border border-slate-200 shadow-sm');
content = content.replaceAll('bg-white/60 backdrop-blur-xl border border-white/40', 'bg-white/60 backdrop-blur-xl border border-slate-200 shadow-sm');

// Fix action briefing box
content = content.replace(/className="bg-white\/60 backdrop-blur-2xl border border-white\/40 rounded-3xl p-6 shadow-2xl relative overflow-hidden group"/, 'className="bg-white/60 backdrop-blur-2xl border border-slate-200 rounded-3xl p-6 shadow-sm relative overflow-hidden group"');
content = content.replace(/<h3 className="text-xl font-extrabold text-slate-900 tracking-tight">AI Posture Insights<\/h3>/, '<h3 className="text-xl font-extrabold text-slate-900 tracking-tight">AI Posture Insights</h3>');
content = content.replace(/className="bg-gradient-to-r from-blue-500\/10 to-transparent group-hover:from-blue-500\/20 transition-all duration-700 pointer-events-none"/, 'className="absolute inset-0 bg-gradient-to-r from-blue-50 to-transparent opacity-0 group-hover:opacity-100 transition-all duration-700 pointer-events-none"');

// Fix inner list items
content = content.replaceAll('bg-white/50 border border-white/60 hover:bg-white/50 hover:border-white/40 text-slate-900', 'bg-white border border-slate-100 hover:border-slate-300 hover:shadow-md');
content = content.replaceAll('bg-white/50 hover:bg-white/60 ml-2', 'bg-slate-100 hover:bg-slate-200 text-slate-700 ml-2');

// Fix posture score card
content = content.replace(/className="bg-white\/60 backdrop-blur-xl border border-white\/40 rounded-3xl p-8 relative overflow-hidden group shadow-2xl h-full flex flex-col items-center justify-center text-center"/, 'className="bg-white/60 backdrop-blur-xl border border-slate-200 rounded-3xl p-8 relative overflow-hidden group shadow-sm h-full flex flex-col items-center justify-center text-center"');

// Fix standard metrics cards
content = content.replaceAll('hover:-translate-y-1 transition-all duration-300', 'hover:-translate-y-1 transition-all duration-300 shadow-sm border-slate-200');
content = content.replaceAll('border border-white/40 shadow-premium bg-white/60', 'bg-white/60');
content = content.replaceAll('bg-white/50', 'bg-slate-100');
content = content.replaceAll('bg-white/5 inline-block', 'bg-slate-100 inline-block text-slate-600');
content = content.replaceAll('text-slate-900 tracking-tighter', 'text-slate-900 tracking-tighter');

// Chart styling overrides
content = content.replaceAll('text-white text-xs', 'text-slate-600 text-xs');
// Replace dark tooltips back to light
content = content.replace(
    `contentStyle={{ backgroundColor: '#fff', border: '1px solid #e2e8f0', borderRadius: '12px', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}`,
    `contentStyle={{ backgroundColor: '#ffffff', border: '1px solid #e2e8f0', color: '#1e293b', borderRadius: '12px', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}`
);

fs.writeFileSync(filePath, content);
console.log('✅ Polished Dashboard light mode conversion.');
