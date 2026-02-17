const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'packages', 'core', 'src', 'pages', 'risk', 'RiskAssetsPage.tsx');
let content = fs.readFileSync(filePath, 'utf8');

// 1. Update matching logic
const oldMatching = `    const getAssetThreats = (asset: any) => {
        if (!securityFeeds?.items) return [];
        const assetStr = ((asset.name || '') + ' ' + (asset.type || '') + ' ' + (asset.description || '')).toLowerCase();

        return securityFeeds.items.filter(item => {
            if (!item.techStack) return false;
            return item.techStack.some((tech: string) => assetStr.includes(tech.toLowerCase()));
        });
    };`;

const newMatching = `    const getAssetThreats = (asset: any) => {
        if (!securityFeeds?.items) return [];
        const techTerms = [
            asset.name,
            asset.vendor,
            asset.productName,
            asset.type,
            ...(asset.technologies || [])
        ].filter(Boolean).map(t => t.toLowerCase());

        return securityFeeds.items.filter(item => {
            if (!item.techStack) return false;
            return item.techStack.some((threatTech: string) => {
                const lowerThreatTech = threatTech.toLowerCase();
                return techTerms.some(term => term.includes(lowerThreatTech) || lowerThreatTech.includes(term));
            });
        });
    };`;

// 2. Update Sorting
const oldSorting = `                // Special handling for Associated Risks
                else if (sortConfig.key === 'riskCount') {
                    aValue = a.riskCount || 0;
                    bValue = b.riskCount || 0;
                }`;

const newSorting = `                // Special handling for Associated Risks
                else if (sortConfig.key === 'riskCount') {
                    aValue = a.riskCount || 0;
                    bValue = b.riskCount || 0;
                }
                else if (sortConfig.key === 'vulnerabilityCount') {
                    aValue = a.vulnerabilityCount || 0;
                    bValue = b.vulnerabilityCount || 0;
                }
                else if (sortConfig.key === 'suggestionCount') {
                    aValue = a.suggestionCount || 0;
                    bValue = b.suggestionCount || 0;
                }`;

// 3. Update Table Headers
const oldHeaders = `                            <SortableHeader label="Associated Risks" sortKey="riskCount" />
                            <SortableHeader label="Active Threats" sortKey="activeThreats" />
                            <SortableHeader label="CIA Valuation" sortKey="ciaValuation" />`;

const newHeaders = `                            <SortableHeader label="Risks" sortKey="riskCount" />
                            <SortableHeader label="Vulnerabilities" sortKey="vulnerabilityCount" />
                            <SortableHeader label="Suggestions" sortKey="suggestionCount" />
                            <SortableHeader label="Active Threats" sortKey="activeThreats" />
                            <SortableHeader label="CIA" sortKey="ciaValuation" />`;

// 4. Update Table Cells
const oldCells = `                                <td className="px-6 py-4 text-sm">
                                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-50 text-blue-700 border border-blue-200">
                                        {asset.riskCount || 0} Risks
                                    </span>
                                </td>`;

const newCells = `                                <td className="px-6 py-4 text-sm">
                                    <span className={\`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border \${asset.riskCount > 0 ? 'bg-orange-50 text-orange-700 border-orange-200' : 'bg-blue-50 text-blue-700 border-blue-200'}\`}>
                                        {asset.riskCount || 0} Risks
                                    </span>
                                </td>
                                <td className="px-6 py-4 text-sm">
                                    <span className={\`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border \${asset.vulnerabilityCount > 0 ? 'bg-red-50 text-red-700 border-red-200' : 'bg-gray-50 text-gray-400 border-gray-100'}\`}>
                                        {asset.vulnerabilityCount || 0} Vulns
                                    </span>
                                </td>
                                <td className="px-6 py-4 text-sm">
                                    {asset.suggestionCount > 0 ? (
                                        <div 
                                            className="px-2 py-1 bg-amber-50 text-amber-700 border border-amber-200 rounded-lg text-xs font-medium hover:bg-amber-100 cursor-pointer w-fit"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                window.location.href = \`/clients/\${asset.clientId}/risks/vulnerabilities\`;
                                            }}
                                        >
                                            {asset.suggestionCount} New
                                        </div>
                                    ) : (
                                        <span className="text-gray-300 text-xs">-</span>
                                    )}
                                </td>`;

// Apply replacements with robustness for line endings
const apply = (oldTxt, newTxt) => {
    // Try literal match
    if (content.includes(oldTxt)) {
        content = content.replace(oldTxt, newTxt);
    } else {
        // Try with normalized line endings
        const normalizedOld = oldTxt.replace(/\r\n/g, '\n');
        const normalizedContent = content.replace(/\r\n/g, '\n');
        if (normalizedContent.includes(normalizedOld)) {
            content = normalizedContent.replace(normalizedOld, newTxt.replace(/\r\n/g, '\n'));
        } else {
            console.error('Failed to match section:', oldTxt.substring(0, 50));
        }
    }
};

apply(oldMatching, newMatching);
apply(oldSorting, newSorting);
apply(oldHeaders, newHeaders);
apply(oldCells, newCells);

fs.writeFileSync(filePath, content);
console.log('Successfully updated RiskAssetsPage.tsx');
