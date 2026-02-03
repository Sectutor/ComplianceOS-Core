import { Badge } from "@complianceos/ui/ui/badge";
import { Popover, PopoverContent, PopoverTrigger } from "@complianceos/ui/ui/popover";
import { trpc } from "@/lib/trpc";
import { Lightbulb, FileText, Cloud, Upload } from "lucide-react";

interface EvidenceSuggestionsPopoverProps {
    controlId: string;
    controlName: string;
    framework?: string;
    category?: string;
    children: React.ReactNode;
}

export function EvidenceSuggestionsPopover({
    controlId,
    controlName,
    framework,
    category,
    children
}: EvidenceSuggestionsPopoverProps) {
    const { data: suggestions = [], isLoading } = trpc.evidenceSuggestions.getSuggestions.useQuery(
        { controlId, controlName, framework, category },
        { staleTime: 60000 }
    );

    if (isLoading || suggestions.length === 0) {
        return <>{children}</>;
    }

    const integrationIcon = (type: string | null) => {
        switch (type) {
            case 'api': return <Cloud className="h-3 w-3 text-blue-500" />;
            case 'file': return <Upload className="h-3 w-3 text-green-500" />;
            default: return <FileText className="h-3 w-3 text-gray-500" />;
        }
    };

    return (
        <Popover>
            <PopoverTrigger asChild>
                <div className="cursor-pointer inline-flex items-center gap-1.5">
                    {children}
                    <Badge
                        variant="outline"
                        className="text-[10px] px-1.5 py-0 bg-amber-50 border-amber-200 text-amber-700 hover:bg-amber-100 gap-0.5"
                    >
                        <Lightbulb className="h-2.5 w-2.5" />
                        {suggestions.length}
                    </Badge>
                </div>
            </PopoverTrigger>
            <PopoverContent className="w-80" align="start">
                <div className="space-y-3">
                    <div className="flex items-center gap-2 text-sm font-medium text-amber-700">
                        <Lightbulb className="h-4 w-4" />
                        Evidence Suggestions
                    </div>

                    <div className="space-y-2">
                        {suggestions.slice(0, 3).map((s: any) => (
                            <div key={s.id} className="border rounded-md p-2 bg-muted/30 space-y-1.5">
                                <div className="flex items-center gap-1.5 text-xs font-medium">
                                    {integrationIcon(s.integrationType)}
                                    {s.name}
                                </div>

                                {s.suggestedSources?.length > 0 && (
                                    <div className="flex flex-wrap gap-1">
                                        {s.suggestedSources.slice(0, 3).map((source: string, i: number) => (
                                            <Badge key={i} variant="secondary" className="text-[10px] px-1.5 py-0">
                                                {source}
                                            </Badge>
                                        ))}
                                    </div>
                                )}

                                {s.sampleDescription && (
                                    <p className="text-[10px] text-muted-foreground line-clamp-2">
                                        {s.sampleDescription}
                                    </p>
                                )}
                            </div>
                        ))}
                    </div>

                    {suggestions.length > 3 && (
                        <p className="text-[10px] text-muted-foreground text-center">
                            +{suggestions.length - 3} more suggestions
                        </p>
                    )}
                </div>
            </PopoverContent>
        </Popover>
    );
}
