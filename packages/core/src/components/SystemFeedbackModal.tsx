import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@complianceos/ui/ui/dialog";
import { Button } from "@complianceos/ui/ui/button";
import { Input } from "@complianceos/ui/ui/input";
import { Textarea } from "@complianceos/ui/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@complianceos/ui/ui/select";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@complianceos/ui/ui/form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { trpc } from "@/lib/trpc";
import { MessageSquarePlus } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useClientContext } from "@/contexts/ClientContext";
import { toast } from "sonner";
import { useLocation } from "wouter";

const formSchema = z.object({
    type: z.enum(['bug', 'feature', 'improvement']),
    title: z.string().min(1, "Title is required").max(255),
    description: z.string().min(10, "Please provide more details"),
});

export function SystemFeedbackModal() {
    const { session } = useAuth();
    const { selectedClientId } = useClientContext();
    const [location] = useLocation();
    const [open, setOpen] = useState(false);

    const form = useForm<z.infer<typeof formSchema>>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            type: 'bug',
            title: "",
            description: "",
        },
    });

    const submitMutation = trpc.feedback.submit.useMutation({
        onSuccess: () => {
            toast.success("Feedback submitted successfully. Thank you!");
            setOpen(false);
            form.reset();
        },
        onError: (e) => {
            toast.error(`Failed to submit: ${e.message}`);
        }
    });

    if (!session) return null;

    const onSubmit = (values: z.infer<typeof formSchema>) => {
        submitMutation.mutate({
            ...values,
            url: window.location.href,
            clientId: selectedClientId || undefined,
        });
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button
                    variant="default"
                    size="icon"
                    className="fixed bottom-4 right-4 h-12 w-12 rounded-full shadow-lg z-50 transition-transform hover:scale-105"
                >
                    <MessageSquarePlus className="h-6 w-6" />
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                    <DialogTitle>Submit Feedback or Report Bug</DialogTitle>
                </DialogHeader>
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 pt-4">
                        <FormField
                            control={form.control}
                            name="type"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Feedback Type</FormLabel>
                                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                                        <FormControl>
                                            <SelectTrigger>
                                                <SelectValue placeholder="Select type" />
                                            </SelectTrigger>
                                        </FormControl>
                                        <SelectContent>
                                            <SelectItem value="bug">Report a Bug</SelectItem>
                                            <SelectItem value="feature">Request a Feature</SelectItem>
                                            <SelectItem value="improvement">Suggest an Improvement</SelectItem>
                                        </SelectContent>
                                    </Select>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <FormField
                            control={form.control}
                            name="title"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Title</FormLabel>
                                    <FormControl>
                                        <Input placeholder="Brief summary..." {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <FormField
                            control={form.control}
                            name="description"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Description</FormLabel>
                                    <FormControl>
                                        <Textarea
                                            placeholder="Please provide details about the bug or your feature request..."
                                            className="min-h-[120px]"
                                            {...field}
                                        />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <div className="flex justify-end pt-4 gap-2">
                            <Button type="button" variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
                            <Button type="submit" disabled={submitMutation.isPending}>
                                {submitMutation.isPending ? "Submitting..." : "Submit"}
                            </Button>
                        </div>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    );
}
