const fs = require('fs');
const path = require('path');

const filePath = path.join(process.cwd(), 'packages', 'core', 'src', 'pages', 'Dashboard.tsx');
let content = fs.readFileSync(filePath, 'utf8');

// Reverting from professional slate back to a true light theme based on the user request.
// "make page light background"
// Let's strip out the slate-950, slate-900, text-white inversions that we just added.

content = content.replaceAll('bg-slate-950', 'bg-slate-50/50');
content = content.replaceAll('bg-slate-900/60', 'bg-white/60');
content = content.replaceAll('bg-slate-900/80', 'bg-white/60');
content = content.replaceAll('bg-slate-900', 'bg-white/80');

// Reset base text colors
content = content.replace(/text-white(?! \w|[\w-])/g, 'text-slate-900');
content = content.replaceAll('text-slate-200', 'text-slate-800');

// Fix specific sections where `text-white` actually is needed inside the `bg-gradient-to-br` icons/accents.
// It's easier to find these by context after applying the broad replace.
// E.g. `<Activity className="h-6 w-6 text-slate-900" />` inside the blue gradient box
content = content.replace(/className="([^\"]*bg-gradient-to[^\"]*)text-slate-900"/g, 'className="$1text-white"');
// and for icons explicitly colored:
content = content.replace(/className="h-6 w-6 text-slate-900"/g, 'className="h-6 w-6 text-white"');
content = content.replace(/className="w-6 h-6 text-slate-900"/g, 'className="w-6 h-6 text-white"');
content = content.replace(/className="([^\"]+) text-slate-900 shadow-lg/g, 'className="$1 text-white shadow-lg');

// Border colors
content = content.replaceAll('border-white/10', 'border-white/40');
content = content.replaceAll('border-white/5', 'border-white/60');

// Specific backgrounds
content = content.replaceAll('bg-white/5', 'bg-white/50');
content = content.replace(/<option value="" className="bg-slate-50\/50">/g, '<option value="">');
content = content.replace(/<option([^>]+)className="bg-slate-50\/50 text-slate-900"/g, '<option$1');

// Tooltip background back to light layout
content = content.replace(
    `contentStyle={{ backgroundColor: '#001e2b', border: '1px solid rgba(255,255,255,0.1)', color: 'white', borderRadius: '12px', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.5)' }}`,
    `contentStyle={{ backgroundColor: '#fff', border: '1px solid #e2e8f0', borderRadius: '12px', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}`
);
content = content.replace(
    `labelStyle={{ fontWeight: 'bold', color: 'white' }}`,
    `labelStyle={{ fontWeight: 'bold', color: '#1e293b' }}`
);

fs.writeFileSync(filePath, content);
console.log('✅ Reverted Dashboard to light background.');
