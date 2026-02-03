
import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@complianceos/ui/ui/dialog';
import { Button } from '@complianceos/ui/ui/button';
import { Input } from '@complianceos/ui/ui/input';
import { Label } from '@complianceos/ui/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@complianceos/ui/ui/select';
import { trpc } from '@/lib/trpc';
import { toast } from 'sonner';
import { Loader2, Plus } from 'lucide-react';

const createDealSchema = z.object({
    title: z.string().min(1, "Title is required"),
    value: z.coerce.number().min(0, "Value must be positive"),
    stageId: z.string().min(1, "Stage is required"), // Select returns string
    expectedCloseDate: z.string().optional(),
});

type CreateDealForm = z.infer<typeof createDealSchema>;

interface CreateDealDialogProps {
    trigger?: React.ReactNode;
    onSuccess?: () => void;
}

export function CreateDealDialog({ trigger, onSuccess }: CreateDealDialogProps) {
    const [open, setOpen] = useState(false);
    const utils = trpc.useContext();
    
    // Fetch stages for the dropdown
    // @ts-ignore
    const { data: stages } = trpc.sales.getStages.useQuery();

    // @ts-ignore
    const createDeal = trpc.sales.createDeal.useMutation({
        onSuccess: () => {
            toast.success("Deal created successfully");
            setOpen(false);
            form.reset();
            // @ts-ignore
            utils.sales.getDeals.invalidate();
            onSuccess?.();
        },
        onError: (err) => {
            toast.error(`Failed to create deal: ${err.message}`);
        }
    });

    const form = useForm<CreateDealForm>({
        resolver: zodResolver(createDealSchema),
        defaultValues: {
            title: '',
            value: 0,
            stageId: '',
        }
    });

    const onSubmit = (data: CreateDealForm) => {
        createDeal.mutate({
            title: data.title,
            value: data.value,
            stageId: parseInt(data.stageId),
            expectedCloseDate: data.expectedCloseDate || undefined
        });
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                {trigger || (
                    <Button>
                        <Plus className="w-4 h-4 mr-2" />
                        New Deal
                    </Button>
                )}
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>Create New Deal</DialogTitle>
                    <DialogDescription>
                        Add a new opportunity to your sales pipeline.
                    </DialogDescription>
                </DialogHeader>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 py-4">
                    <div className="space-y-2">
                        <Label htmlFor="title">Deal Title</Label>
                        <Input 
                            id="title" 
                            placeholder="e.g. Enterprise License - Acme Corp" 
                            {...form.register('title')} 
                        />
                        {form.formState.errors.title && (
                            <p className="text-sm text-red-500">{form.formState.errors.title.message}</p>
                        )}
                    </div>
                    
                    <div className="space-y-2">
                        <Label htmlFor="value">Value (USD)</Label>
                        <div className="relative">
                            <span className="absolute left-3 top-2.5 text-gray-500">$</span>
                            <Input 
                                id="value" 
                                type="number" 
                                className="pl-7"
                                {...form.register('value')} 
                            />
                        </div>
                        {form.formState.errors.value && (
                            <p className="text-sm text-red-500">{form.formState.errors.value.message}</p>
                        )}
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="stage">Stage</Label>
                        <Select 
                            onValueChange={(val) => form.setValue('stageId', val)}
                            defaultValue={form.getValues('stageId')}
                        >
                            <SelectTrigger>
                                <SelectValue placeholder="Select a stage" />
                            </SelectTrigger>
                            <SelectContent>
                                {stages?.map((stage: any) => (
                                    <SelectItem key={stage.id} value={stage.id.toString()}>
                                        {stage.name}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                        {form.formState.errors.stageId && (
                            <p className="text-sm text-red-500">{form.formState.errors.stageId.message}</p>
                        )}
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="date">Expected Close Date</Label>
                        <Input 
                            id="date" 
                            type="date"
                            {...form.register('expectedCloseDate')} 
                        />
                    </div>

                    <DialogFooter>
                        <Button type="button" variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
                        <Button type="submit" disabled={createDeal.isLoading}>
                            {createDeal.isLoading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                            Create Deal
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
