const fs = require('fs');
const path = require('path');

const filePath = path.join(process.cwd(), 'packages', 'core', 'src', 'pages', 'Dashboard.tsx');
let content = fs.readFileSync(filePath, 'utf8');

// The bottom half charts and lists still have some dark mode artifacts. We'll do a final sweep here.
content = content.replace(/CardTitle className="[^"]*text-white/g, match => match.replace('text-white', 'text-slate-900'));
content = content.replace(/CardTitle className="[^"]*text-slate-200/g, match => match.replace('text-slate-200', 'text-slate-800'));

content = content.replaceAll('bg-slate-900/60', 'bg-white/60');
content = content.replaceAll('bg-slate-900/40', 'bg-white/40');
content = content.replaceAll('bg-[#002a40]', 'bg-white');

content = content.replaceAll('border-white/40', 'border-slate-200');
content = content.replaceAll('border-white/10', 'border-slate-100');

// Fix inner list text colors for the bottom tables
content = content.replaceAll('text-slate-200 group-hover:text-white', 'text-slate-700 group-hover:text-slate-900');
content = content.replaceAll('text-slate-300', 'text-slate-600');
content = content.replaceAll('text-slate-400', 'text-slate-500');

// Fix standard buttons and structural colors
content = content.replaceAll('bg-slate-800', 'bg-slate-100');
content = content.replaceAll('bg-slate-900', 'bg-white');
content = content.replaceAll('hover:bg-slate-700', 'hover:bg-slate-200');

content = content.replaceAll('text-white', 'text-slate-900');

// Now, restore text-white specifically for elements that need it
content = content.replace(/text-slate-900 shadow-lg/g, 'text-white shadow-lg');
content = content.replace(/text-slate-900 shadow-sm shadow/g, 'text-white shadow-sm shadow');
content = content.replace(/className="w-6 h-6 text-slate-900"/g, 'className="w-6 h-6 text-white"');
// The "Deploy Node" button shouldn't be white on white. Let's make it brand color
content = content.replace(/className="bg-white hover:bg-slate-100 text-slate-900 shadow-xl/g, 'className="bg-blue-600 hover:bg-blue-700 text-white shadow-xl');

// And re-run some fixups for chart labels
content = content.replace(
    `stroke="#94a3b8"`,
    `stroke="#64748b"`
);
content = content.replace(
    `stroke="#cbd5e1"`,
    `stroke="#94a3b8"`
);

// We changed all `text-white` to `text-slate-900`, but some colored badges and buttons might have been broken. 
// Specifically the glowing icon wrappers: 
content = content.replaceAll('bg-gradient-to-br from-blue-500 to-indigo-600 text-slate-900', 'bg-gradient-to-br from-blue-500 to-indigo-600 text-white');
content = content.replaceAll('bg-gradient-to-br from-purple-500 to-fuchsia-600 text-slate-900', 'bg-gradient-to-br from-purple-500 to-fuchsia-600 text-white');
content = content.replaceAll('bg-gradient-to-br from-amber-400 to-orange-500 text-slate-900', 'bg-gradient-to-br from-amber-400 to-orange-500 text-white');
content = content.replaceAll('bg-gradient-to-br from-red-500 to-rose-600 text-slate-900', 'bg-gradient-to-br from-red-500 to-rose-600 text-white');
content = content.replaceAll('bg-gradient-to-br from-emerald-400 to-teal-500 text-slate-900', 'bg-gradient-to-br from-emerald-400 to-teal-500 text-white');


// The dark background for the onboarding checklist needs to adapt:
content = content.replaceAll('bg-slate-900/60 backdrop-blur-xl border-white/10', 'bg-white/80 backdrop-blur-xl border-slate-200');

fs.writeFileSync(filePath, content);
console.log('✅ Final sweep of light mode text colors applied.');
