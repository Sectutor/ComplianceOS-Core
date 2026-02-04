import { useState, useEffect, useRef, useMemo } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@complianceos/ui/ui/button";
import { ScrollArea } from "@complianceos/ui/ui/scroll-area";
import { Badge } from "@complianceos/ui/ui/badge";
import {
    Video,
    FileText,
    CheckCircle2,
    Circle,
    ChevronRight,
    Play,
    Check,
    AlertTriangle,
    Clock,
    ChevronLeft,
    RotateCcw,
    Maximize2,
    Volume2,
    Sparkles,
    Trophy
} from "lucide-react";
import { marked } from "marked";
import { toast } from "sonner";
import ReactPlayer from "react-player";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";

interface TrainingModuleViewerProps {
    clientId: number;
    employeeId: number;
    initialModuleId?: number | null;
}

export function TrainingModuleViewer({ clientId, employeeId, initialModuleId }: TrainingModuleViewerProps) {
    const [activeModuleId, setActiveModuleId] = useState<number | null>(initialModuleId || null);
    const playerRef = useRef<ReactPlayer>(null);
    const [isPlaying, setIsPlaying] = useState(false);
    const [playbackRate, setPlaybackRate] = useState(1);
    const [played, setPlayed] = useState(0); // Progress from 0 to 1
    const [duration, setDuration] = useState(0);
    const [isBuffering, setIsBuffering] = useState(false);
    const [hasError, setHasError] = useState(false);

    // Video Tracking State
    const [isVideoCompleted, setIsVideoCompleted] = useState(false);

    const { data: modules, isLoading, refetch: refetchModules } = trpc.training.list.useQuery(
        { clientId, employeeId },
        { enabled: clientId > 0 && !!employeeId }
    );

    const { data: moduleData, isLoading: isLoadingModule, refetch: refetchModule } = trpc.training.get.useQuery(
        { clientId, moduleId: activeModuleId as number, employeeId },
        { enabled: !!activeModuleId }
    );

    const completeMutation = trpc.training.complete.useMutation({
        onSuccess: () => {
            toast.custom((t) => (
                <div className="bg-white dark:bg-slate-900 border-2 border-green-500 rounded-lg p-4 shadow-2xl flex items-center gap-4 animate-in fade-in slide-in-from-bottom-5">
                    <div className="bg-green-100 dark:bg-green-900/30 p-2 rounded-full">
                        <Trophy className="h-6 w-6 text-green-600" />
                    </div>
                    <div>
                        <h4 className="font-bold text-slate-900 dark:text-white">Module Completed!</h4>
                        <p className="text-sm text-slate-500">You're one step closer to compliance mastery.</p>
                    </div>
                </div>
            ), { duration: 4000 });
            refetchModules();
            refetchModule();
        }
    });

    useEffect(() => {
        if (modules && modules.length > 0 && !activeModuleId) {
            setActiveModuleId(modules[0].id);
        }
    }, [modules, activeModuleId]);

    // Reset tracking when module changes
    useEffect(() => {
        setIsVideoCompleted(false);
        setIsPlaying(false);
        setPlayed(0);
        setHasError(false);
    }, [activeModuleId]);

    const handleVideoEnded = () => {
        setIsVideoCompleted(true);
        setIsPlaying(false);
    };

    const handleComplete = () => {
        if (activeModuleId) {
            completeMutation.mutate({
                clientId,
                employeeId,
                moduleId: activeModuleId
            });
        }
    };

    const handleNextModule = () => {
        if (!modules || !activeModuleId) return;
        const currentIndex = modules.findIndex(m => m.id === activeModuleId);
        if (currentIndex < modules.length - 1) {
            setActiveModuleId(modules[currentIndex + 1].id);
        }
    };

    const handlePrevModule = () => {
        if (!modules || !activeModuleId) return;
        const currentIndex = modules.findIndex(m => m.id === activeModuleId);
        if (currentIndex > 0) {
            setActiveModuleId(modules[currentIndex - 1].id);
        }
    };

    if (isLoading) {
        return (
            <div className="flex flex-col items-center justify-center h-[700px] bg-slate-50/50 rounded-xl border-2 border-dashed">
                <div className="relative">
                    <div className="h-12 w-12 rounded-full border-4 border-primary/20 border-t-primary animate-spin" />
                    <Sparkles className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-4 w-4 text-primary" />
                </div>
                <p className="mt-4 text-sm font-medium text-slate-600">Preparing your training environment...</p>
            </div>
        );
    }

    if (!modules || modules.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center h-[700px] p-12 text-center bg-white rounded-xl border">
                <div className="bg-slate-100 p-6 rounded-full mb-6">
                    <Video className="h-12 w-12 text-slate-400" />
                </div>
                <h3 className="text-xl font-bold text-slate-900">No training modules assigned</h3>
                <p className="text-slate-500 max-w-sm mt-2">
                    It looks like you don't have any training sessions scheduled at the moment.
                </p>
                <Button variant="outline" className="mt-8" onClick={() => refetchModules()}>
                    <RotateCcw className="mr-2 h-4 w-4" /> Refresh
                </Button>
            </div>
        );
    }

    const currentModule = modules.find(m => m.id === activeModuleId);
    const currentIndex = modules.findIndex(m => m.id === activeModuleId);
    const isLastModule = currentIndex === modules.length - 1;
    const isFirstModule = currentIndex === 0;

    return (
        <div className="flex h-full bg-white rounded-2xl overflow-hidden shadow-2xl border border-slate-200">
            {/* Sidebar - Course Content */}
            <div className="w-80 border-r flex flex-col bg-slate-50">
                <div className="p-6 border-b bg-white">
                    <div className="flex items-center gap-2 mb-1">
                        <div className="p-1.5 bg-indigo-100 rounded-lg text-indigo-600">
                            <Sparkles className="h-4 w-4" />
                        </div>
                        <h3 className="font-bold text-slate-900 uppercase tracking-tight text-sm">Course Navigator</h3>
                    </div>
                    <div className="flex items-center justify-between">
                        <p className="text-xs text-slate-500">{modules.length} specialized modules</p>
                        <Badge variant="secondary" className="text-[10px] font-bold bg-indigo-50 text-indigo-700 hover:bg-indigo-50">
                            PRO TRAINING
                        </Badge>
                    </div>
                </div>
                <ScrollArea className="flex-1">
                    <div className="p-3 space-y-2">
                        {modules.map((module, idx) => {
                            const isActive = module.id === activeModuleId;
                            // Note: In a real production scenario, we'd want to have the completion status for all modules in the 'modules' query.
                            // For now, we use the active module's data if it matches, or fall back to pending.
                            const isCompleted = module.id === activeModuleId ? moduleData?.assignment?.status === 'completed' : false;

                            return (
                                <button
                                    key={module.id}
                                    onClick={() => setActiveModuleId(module.id)}
                                    className={cn(
                                        "w-full text-left p-3.5 rounded-xl transition-all duration-300 flex items-start gap-3 group relative",
                                        isActive
                                            ? "bg-white shadow-md border-l-4 border-indigo-600 ring-1 ring-slate-200"
                                            : "hover:bg-white/50 text-slate-600 border-l-4 border-transparent"
                                    )}
                                >
                                    <div className={cn(
                                        "mt-1 p-1.5 rounded-lg transition-colors relative",
                                        isActive ? "bg-indigo-600 text-white" : "bg-slate-200 text-slate-500 group-hover:bg-slate-300"
                                    )}>
                                        {module.type === 'video' ? <Video className="h-3.5 w-3.5" /> : <FileText className="h-3.5 w-3.5" />}
                                        {isCompleted && (
                                            <div className="absolute -top-1 -right-1 bg-green-500 rounded-full border-2 border-white">
                                                <Check className="h-2 w-2 text-white stroke-[4px]" />
                                            </div>
                                        )}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className={cn(
                                            "text-[10px] font-bold uppercase tracking-wider mb-0.5",
                                            isActive ? "text-indigo-600" : "text-slate-400"
                                        )}>
                                            Module {String(idx + 1).padStart(2, '0')}
                                        </div>
                                        <div className={cn(
                                            "text-sm font-semibold leading-tight line-clamp-2",
                                            isActive ? "text-slate-900" : "text-slate-600"
                                        )}>
                                            {module.title}
                                        </div>
                                        <div className="flex items-center gap-3 mt-1.5">
                                            <div className="flex items-center gap-1 text-[10px] text-slate-400 font-medium">
                                                <Clock className="h-2.5 w-2.5" /> {module.durationMinutes}m
                                            </div>
                                            {isCompleted && (
                                                <div className="flex items-center gap-1 text-[10px] text-green-600 font-bold uppercase tracking-tighter">
                                                    Completed
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                    {isActive && (
                                        <motion.div
                                            layoutId="active-indicator"
                                            className="absolute right-3 top-1/2 -translate-y-1/2 h-1.5 w-1.5 rounded-full bg-indigo-600"
                                        />
                                    )}
                                </button>
                            );
                        })}
                    </div>
                </ScrollArea>
                <div className="p-4 border-t bg-indigo-600 text-white">
                    <div className="flex items-center justify-between text-[10px] uppercase font-bold tracking-widest mb-2 opacity-80">
                        <span>Course Progress</span>
                        <span>{Math.round((modules.filter(m => false).length / modules.length) * 100)}%</span>
                    </div>
                    <div className="h-1.5 bg-white/20 rounded-full overflow-hidden">
                        <div
                            className="h-full bg-white transition-all duration-1000"
                            style={{ width: `${Math.round((modules.filter(m => false).length / modules.length) * 100)}%` }}
                        />
                    </div>
                </div>
            </div>

            {/* Main Area - Video/Content Player */}
            <div className="flex-1 flex flex-col bg-slate-50 relative">
                <AnimatePresence mode="wait">
                    <motion.div
                        key={activeModuleId}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        transition={{ duration: 0.3 }}
                        className="flex-1 flex flex-col h-full overflow-hidden"
                    >
                        {/* Header Bar */}
                        <div className="h-16 bg-white border-b px-8 flex items-center justify-between shrink-0">
                            <div className="flex items-center gap-4">
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={handlePrevModule}
                                    disabled={isFirstModule}
                                    className="text-slate-400"
                                >
                                    <ChevronLeft className="h-4 w-4" />
                                </Button>
                                <div className="h-4 w-px bg-slate-200" />
                                <span className="text-sm font-bold text-slate-900 line-clamp-1">{currentModule?.title}</span>
                                <div className="h-4 w-px bg-slate-200" />
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={handleNextModule}
                                    disabled={isLastModule}
                                    className="text-slate-400"
                                >
                                    <ChevronRight className="h-4 w-4" />
                                </Button>
                            </div>
                            <div className="flex items-center gap-3">
                                {moduleData?.assignment?.status === 'completed' ? (
                                    <Badge className="bg-green-100 text-green-700 hover:bg-green-100 border-none px-3 py-1 font-bold">
                                        <Check className="h-3 w-3 mr-1.5 stroke-[3px]" /> COMPLETED
                                    </Badge>
                                ) : (
                                    <Button
                                        size="sm"
                                        onClick={handleComplete}
                                        disabled={completeMutation.isPending}
                                        className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold px-6"
                                    >
                                        Mark as Finished
                                    </Button>
                                )}
                            </div>
                        </div>

                        <div className="flex-1 overflow-auto bg-slate-50">
                            {/* Player Section */}
                            <div className="p-8 max-w-5xl mx-auto space-y-8">
                                <div className="aspect-video bg-slate-900 rounded-3xl overflow-hidden shadow-2xl relative group ring-8 ring-white">
                                    {currentModule?.type === 'video' && currentModule.videoUrl ? (
                                        <div className="w-full h-full bg-black">
                                            {currentModule.videoUrl.includes('youtube.com') || currentModule.videoUrl.includes('youtu.be') ? (
                                                <iframe
                                                    src={currentModule.videoUrl.replace('watch?v=', 'embed/').replace('youtu.be/', 'youtube.com/embed/')}
                                                    className="w-full h-full border-0"
                                                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                                                    allowFullScreen
                                                />
                                            ) : (
                                                <video
                                                    src={currentModule.videoUrl}
                                                    controls
                                                    className="w-full h-full"
                                                />
                                            )}
                                        </div>
                                    ) : (
                                        <div className="h-full flex flex-col items-center justify-center bg-gradient-to-br from-indigo-900 to-slate-900 p-12 text-center text-white">
                                            <div className="p-6 bg-white/10 rounded-3xl backdrop-blur-xl border border-white/20 mb-6">
                                                <FileText className="h-16 w-16 text-indigo-300" />
                                            </div>
                                            <h2 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-slate-400">
                                                {currentModule?.title}
                                            </h2>
                                            <p className="text-indigo-200 max-w-sm mt-4 text-lg">
                                                This module focuses on essential documentation and reading materials.
                                            </p>
                                            <div className="inline-flex items-center gap-2 mt-8 px-6 py-3 bg-white/5 rounded-full border border-white/10 text-sm font-medium">
                                                <Clock className="h-4 w-4" /> Estimated reading: {currentModule?.durationMinutes || 5} minutes
                                            </div>
                                        </div>
                                    )}
                                </div>

                                {/* Content Details */}
                                <div className="bg-white rounded-3xl p-10 shadow-sm border border-slate-100">
                                    <div className="flex flex-col md:flex-row md:items-start justify-between gap-6 mb-10 pb-10 border-b border-slate-100">
                                        <div className="space-y-2">
                                            <div className="flex items-center gap-2">
                                                <Badge className="bg-indigo-50 text-indigo-600 hover:bg-indigo-50 border-none font-bold text-[10px] tracking-widest px-2">
                                                    {currentModule?.type === 'video' ? 'VIDEO TRAINING' : 'READING MATERIAL'}
                                                </Badge>
                                                {isVideoCompleted && (
                                                    <Badge className="bg-emerald-50 text-emerald-600 border-none font-bold text-[10px]">VERIFIED</Badge>
                                                )}
                                            </div>
                                            <h1 className="text-4xl font-extrabold text-slate-900 tracking-tight leading-tight">
                                                {currentModule?.title}
                                            </h1>
                                            {currentModule?.description && (
                                                <p className="text-lg text-slate-500 max-w-2xl leading-relaxed mt-4">
                                                    {currentModule.description}
                                                </p>
                                            )}
                                        </div>
                                    </div>

                                    {/* Detailed Content Container */}
                                    <div className="prose prose-slate max-w-none dark:prose-invert">
                                        {currentModule?.content ? (
                                            <div
                                                className="[&_h1]:text-3xl [&_h1]:font-black [&_h1]:mb-8 [&_h1]:text-slate-900 [&_h2]:text-2xl [&_h2]:font-bold [&_h2]:mt-12 [&_h2]:mb-6 [&_h2]:text-slate-800 [&_h2]:border-l-4 [&_h2]:border-indigo-500 [&_h2]:pl-4 [&_h3]:text-xl [&_h3]:font-semibold [&_h3]:mt-10 [&_h3]:mb-4 [&_h3]:text-slate-800 [&_p]:text-lg [&_p]:mb-6 [&_p]:leading-relaxed [&_p]:text-slate-600 [&_ul]:list-disc [&_ul]:pl-6 [&_ul]:mb-8 [&_li]:mb-3 [&_li]:text-lg [&_li]:text-slate-600 [&_strong]:text-slate-900 [&_blockquote]:italic [&_blockquote]:border-l-4 [&_blockquote]:border-slate-200 [&_blockquote]:pl-6 [&_blockquote]:my-8 [&_blockquote]:text-slate-500 whitespace-normal"
                                                dangerouslySetInnerHTML={{ __html: marked.parse(currentModule.content) }}
                                            />
                                        ) : (
                                            <div className="flex flex-col items-center justify-center py-20 bg-slate-50/50 rounded-3xl border border-dashed border-slate-200">
                                                <Sparkles className="h-12 w-12 text-slate-300 mb-4" />
                                                <p className="text-slate-400 font-medium">Use the player above to complete this session.</p>
                                            </div>
                                        )}
                                    </div>

                                    {/* Bottom Navigation */}
                                    <div className="mt-20 pt-10 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-6">
                                        <div className="flex items-center gap-4 text-sm font-medium text-slate-500">
                                            <div className="h-10 w-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-400">
                                                {currentIndex + 1}
                                            </div>
                                            <span>Module {currentIndex + 1} of {modules.length}</span>
                                        </div>
                                        <div className="flex items-center gap-3 w-full sm:w-auto">
                                            <Button
                                                variant="outline"
                                                size="lg"
                                                onClick={handlePrevModule}
                                                disabled={isFirstModule}
                                                className="flex-1 sm:flex-none h-14 px-8 rounded-2xl border-slate-200 text-slate-600 font-bold hover:bg-slate-50"
                                            >
                                                <ChevronLeft className="mr-2 h-5 w-5" /> Previous
                                            </Button>
                                            <Button
                                                variant="default"
                                                size="lg"
                                                onClick={isLastModule ? handleComplete : handleNextModule}
                                                className="flex-1 sm:flex-none h-14 px-10 rounded-2xl bg-slate-900 hover:bg-black text-white font-bold shadow-xl shadow-slate-200 transition-all hover:scale-[1.02] active:scale-[0.98]"
                                            >
                                                {isLastModule ? 'Finish Training' : 'Continue'} <ChevronRight className="ml-2 h-5 w-5" />
                                            </Button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </motion.div>
                </AnimatePresence>
            </div>
        </div>
    );
}

