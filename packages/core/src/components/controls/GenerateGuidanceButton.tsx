import { Button } from "@complianceos/ui/ui/button";
import { Sparkles } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";

interface GenerateGuidanceButtonProps {
    controlId: string;
    name: string;
    description: string;
    framework: string;
    onGenerate: (text: string) => void;
}

export default function GenerateGuidanceButton({ 
    controlId, 
    name, 
    description, 
    framework, 
    onGenerate 
}: GenerateGuidanceButtonProps) {
    const generateGuidanceMutation = trpc.controls.generateGuidance.useMutation({
        onSuccess: (data) => {
            toast.success("Guidance generated successfully");
            onGenerate(data.text);
        },
        onError: (error) => toast.error("Failed to generate: " + error.message),
    });

    const handleGenerate = () => {
        if (!controlId || !name) {
            toast.error("Control ID and Name are required for AI generation");
            return;
        }

        generateGuidanceMutation.mutate({
            controlId,
            name,
            description,
            framework,
        });
    };

    return (
        <Button
            type="button"
            variant="ghost"
            size="sm"
            className="h-6 text-xs gap-1 text-purple-600 hover:text-purple-700 hover:bg-purple-50"
            onClick={handleGenerate}
            disabled={generateGuidanceMutation.isPending}
        >
            <Sparkles className="h-3 w-3" />
            {generateGuidanceMutation.isPending ? 'Generating...' : 'Generate with AI'}
        </Button>
    );
}
