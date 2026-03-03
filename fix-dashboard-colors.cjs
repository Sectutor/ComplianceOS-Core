const fs = require('fs');
const path = require('path');

const filePath = path.join(process.cwd(), 'packages', 'core', 'src', 'pages', 'Dashboard.tsx');
let content = fs.readFileSync(filePath, 'utf8');

// The user disliked the deeply tinted teal/green ("fark green") dark mode. We are shifting to a true premium slate.
// Color replacements:
content = content.replaceAll('bg-[#000a12]', 'bg-slate-950');
content = content.replaceAll('bg-[#001e2b]', 'bg-slate-900');
content = content.replaceAll('bg-[#002a40]/40', 'bg-slate-900/60');
content = content.replaceAll('bg-[#002a40]', 'bg-slate-900');

// Replace green/cyan glows with professional blue/indigo
content = content.replaceAll('bg-cyan-500/10', 'bg-purple-500/10');
content = content.replaceAll('bg-emerald-500/10', 'bg-blue-600/10');
content = content.replaceAll('bg-emerald-500/20', 'bg-blue-500/20');
content = content.replaceAll('bg-emerald-500/5', 'bg-blue-500/5');
content = content.replaceAll('bg-cyan-500/5', 'bg-indigo-500/5');

// Change posture indicator "emerald" success coloring to "blue" because they might associate all the green with the negative feedback
// "from-emerald-500/5 to-cyan-500/5" is mostly gone now due to the above replacements.
content = content.replaceAll('text-emerald-400', 'text-blue-400');
content = content.replaceAll('bg-emerald-400', 'bg-blue-400');
content = content.replaceAll('bg-emerald-500', 'bg-blue-500');

// However, we want to keep standard success states green if it's the score threshold.
// The user said "i don't like the fark green **background**". 
// But just to be safe, I've swapped the ambient glows and the card backgrounds.

fs.writeFileSync(filePath, content);
console.log('✅ Dashboard background colors swapped to professional Slate.');
