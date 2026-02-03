import { Badge } from "@complianceos/ui/ui/badge";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@complianceos/ui/ui/tooltip";
import { trpc } from "@/lib/trpc";
import { Link2 } from "lucide-react";

interface EquivalentsBadgeProps {
    controlId: number;
}

export function EquivalentsBadge({ controlId }: EquivalentsBadgeProps) {
    const { data: equivalents = [], isLoading } = trpc.compliance.frameworkMappings.listEquivalents.useQuery(
        { controlId },
        { staleTime: 60000 }
    );

    if (isLoading || equivalents.length === 0) return null;

    return (
        <TooltipProvider>
            <Tooltip>
                <TooltipTrigger asChild>
                    <Badge
                        variant="outline"
                        className="text-xs bg-blue-50 border-blue-200 text-blue-700 hover:bg-blue-100 cursor-help gap-1"
                    >
                        <Link2 className="h-3 w-3" />
                        Also Satisfies {equivalents.length}
                    </Badge>
                </TooltipTrigger>
                <TooltipContent className="max-w-[300px]">
                    <div className="text-xs space-y-1">
                        <p className="font-semibold">Equivalent Controls:</p>
                        <ul className="space-y-0.5">
                            {equivalents.map((eq: any) => (
                                <li key={eq.id} className="flex items-center gap-1.5">
                                    <span className="font-mono bg-muted px-1 rounded">{eq.controlId}</span>
                                    <span className="text-muted-foreground">({eq.framework})</span>
                                    {eq.mappingType === 'partial' && (
                                        <span className="text-yellow-600 text-[10px]">Partial</span>
                                    )}
                                </li>
                            ))}
                        </ul>
                    </div>
                </TooltipContent>
            </Tooltip>
        </TooltipProvider>
    );
}
