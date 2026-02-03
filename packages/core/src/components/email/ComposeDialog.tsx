
import React, { useState, useRef, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { Dialog, DialogContent, DialogOverlay, DialogTitle, DialogDescription } from "@complianceos/ui/ui/dialog"; // Using raw Dialog parts to override default styles if needed, or just DialogContent
import { Input } from "@complianceos/ui/ui/input";
import { Button } from "@complianceos/ui/ui/button";
import { trpc } from '../../lib/trpc';
import { Badge } from "@complianceos/ui/ui/badge";
import { Command, CommandEmpty, CommandGroup, CommandItem, CommandList } from "@complianceos/ui/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@complianceos/ui/ui/popover";
import { X, Bold, Italic, Underline, List, ListOrdered, Link as LinkIcon, X as CloseIcon } from 'lucide-react';
import { cn } from '../../lib/utils';
import DOMPurify from 'dompurify';

interface ComposeDialogProps {
    clientId: number;
    isOpen: boolean;
    onClose: () => void;
}

interface Recipient {
    name: string;
    email: string;
    type: 'user' | 'employee' | 'contact';
}

export function ComposeDialog({ clientId, isOpen, onClose }: ComposeDialogProps) {
    const { register, handleSubmit, reset, setValue, watch, formState: { errors } } = useForm();
    const utils = trpc.useUtils();
    const editorRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);

    // Recipient Selection State
    const [selectedRecipients, setSelectedRecipients] = useState<Recipient[]>([]);
    const [recipientQuery, setRecipientQuery] = useState("");
    const [openCombobox, setOpenCombobox] = useState(false);

    // Fetch Suggestions
    const { data: suggestions = [] } = trpc.communication.searchRecipients.useQuery(
        { clientId, query: recipientQuery },
        { enabled: openCombobox }
    );

    const createDraft = trpc.email.createDraft.useMutation();
    const sendEmail = trpc.email.send.useMutation({
        onSuccess: () => {
            utils.email.list.invalidate();
            handleClose();
        }
    });

    // Formatting Logic
    const formatText = (command: string, value: string | undefined = undefined) => {
        document.execCommand(command, false, value);
        if (editorRef.current) {
            editorRef.current.focus();
            setValue('body', editorRef.current.innerHTML);
        }
    };

    const insertLink = () => {
        const url = prompt("Enter the URL:", "https://");
        if (url && url !== "https://") {
            formatText('createLink', url);
        }
    };

    const handleClose = () => {
        onClose();
        setTimeout(() => {
            setSelectedRecipients([]);
            reset();
            setRecipientQuery("");
            if (editorRef.current) editorRef.current.innerHTML = '';
        }, 200);
    };

    const onSubmit = async (data: any) => {
        const emailList = selectedRecipients.map(r => r.email);
        if (recipientQuery && recipientQuery.includes('@') && !emailList.includes(recipientQuery)) {
            emailList.push(recipientQuery);
        }

        if (emailList.length === 0) {
            alert("Please select at least one recipient");
            return;
        }

        const bodyContent = editorRef.current?.innerHTML || "";

        const draft = await createDraft.mutateAsync({
            clientId,
            subject: data.subject,
            to: emailList,
            body: bodyContent
        });

        if (draft) {
            await sendEmail.mutateAsync({ clientId, id: draft.id });
        }
    };

    const addRecipient = (recipient: Recipient) => {
        if (!selectedRecipients.find(r => r.email === recipient.email)) {
            setSelectedRecipients([...selectedRecipients, recipient]);
        }
        setRecipientQuery("");
        setOpenCombobox(false);
    };

    const removeRecipient = (email: string) => {
        setSelectedRecipients(selectedRecipients.filter(r => r.email !== email));
    };

    return (
        <Dialog open={isOpen} onOpenChange={(open) => !open && handleClose()}>
            {/* Custom Content Wrapper to match design exactly */}
            <DialogContent className="max-w-2xl bg-white p-0 gap-0 rounded-[10px] shadow-2xl border-none overflow-hidden font-sans [&>button]:hidden">
                <DialogTitle className="sr-only">New Message</DialogTitle>
                <DialogDescription className="sr-only">Compose a new email message to internal users, employees, or contacts.</DialogDescription>

                {/* Header */}
                <div className="px-6 py-4.5 bg-slate-50 border-b border-slate-200 flex justify-between items-center h-16">
                    <h2 className="text-lg font-semibold text-slate-900 m-0">New Message</h2>
                    <button
                        onClick={handleClose}
                        className="text-slate-500 hover:bg-slate-200 hover:text-slate-800 p-1.5 rounded transition-colors"
                        aria-label="Close"
                    >
                        <CloseIcon size={20} />
                    </button>
                </div>

                {/* Body */}
                <div className="p-6">
                    <form onSubmit={handleSubmit(onSubmit)}>

                        {/* To Field */}
                        <div className="mb-5 relative z-20">
                            <label className="block text-sm font-semibold text-slate-700 mb-1.5">To:</label>

                            {/* Custom Container mimicking input but holding chips */}
                            <div
                                className="w-full min-h-[42px] px-3 py-2 border border-slate-300 rounded-md bg-white focus-within:ring-2 focus-within:ring-blue-500/20 focus-within:border-blue-500 transition-colors flex flex-wrap gap-2 items-center shadow-sm cursor-text"
                                onClick={() => inputRef.current?.focus()}
                            >
                                {selectedRecipients.map(recipient => (
                                    <Badge key={recipient.email} variant="secondary" className="pl-2 pr-1 h-6 flex items-center gap-1 bg-slate-100 text-slate-700 border-slate-200 hover:bg-slate-200">
                                        <span>{recipient.name}</span>
                                        <button
                                            type="button"
                                            onClick={(e) => {
                                                e.stopPropagation(); // Prevent container click
                                                removeRecipient(recipient.email);
                                            }}
                                            className="ml-0.5 hover:bg-slate-300 rounded-full p-0.5"
                                        >
                                            <X className="h-3 w-3" />
                                        </button>
                                    </Badge>
                                ))}

                                <Popover open={openCombobox} onOpenChange={setOpenCombobox}>
                                    <PopoverTrigger asChild>
                                        <input
                                            ref={inputRef}
                                            className="flex-1 bg-transparent min-w-[120px] outline-none text-sm text-slate-800 placeholder:text-slate-400"
                                            placeholder={selectedRecipients.length === 0 ? "Search users or teams..." : ""}
                                            value={recipientQuery}
                                            onChange={(e) => {
                                                setRecipientQuery(e.target.value);
                                                setOpenCombobox(true);
                                            }}
                                            onFocus={() => {
                                                if (recipientQuery.length > 0 || suggestions.length > 0) setOpenCombobox(true);
                                            }}
                                            onKeyDown={(e) => {
                                                if (e.key === 'Enter' && recipientQuery) {
                                                    e.preventDefault();
                                                    if (recipientQuery.includes('@')) {
                                                        addRecipient({ name: recipientQuery, email: recipientQuery, type: 'contact' });
                                                    }
                                                }
                                                if (e.key === 'Backspace' && !recipientQuery && selectedRecipients.length > 0) {
                                                    removeRecipient(selectedRecipients[selectedRecipients.length - 1].email);
                                                }
                                            }}
                                            autoComplete="off"
                                        />
                                    </PopoverTrigger>
                                    <PopoverContent
                                        className="p-0 w-[400px] z-50 max-h-[300px] overflow-auto shadow-xl border-slate-200"
                                        align="start"
                                        onOpenAutoFocus={(e) => e.preventDefault()}
                                    >
                                        <Command shouldFilter={false}>
                                            <CommandList>
                                                {suggestions.length === 0 && recipientQuery.length > 0 ? (
                                                    <CommandEmpty className="py-3 px-4 text-sm text-slate-500 text-center">
                                                        No results found. Press Enter to add "{recipientQuery}"
                                                    </CommandEmpty>
                                                ) : null}

                                                {suggestions.length > 0 && (
                                                    <CommandGroup heading="Suggestions">
                                                        {suggestions.map((suggestion) => (
                                                            <CommandItem
                                                                key={suggestion.email}
                                                                onSelect={() => addRecipient({
                                                                    name: suggestion.name,
                                                                    email: suggestion.email,
                                                                    type: suggestion.type as any
                                                                })}
                                                                className="flex flex-col items-start gap-1 py-2 px-3 cursor-pointer aria-selected:bg-blue-50"
                                                            >
                                                                <div className="flex items-center gap-2">
                                                                    <span className="font-medium text-slate-900">{suggestion.name}</span>
                                                                    <Badge variant="outline" className="text-[10px] h-4 px-1 rounded bg-slate-50 text-slate-500 border-slate-200">{suggestion.type}</Badge>
                                                                </div>
                                                                <span className="text-xs text-slate-500">{suggestion.email}</span>
                                                            </CommandItem>
                                                        ))}
                                                    </CommandGroup>
                                                )}
                                            </CommandList>
                                        </Command>
                                    </PopoverContent>
                                </Popover>
                            </div>
                            <div className="text-xs text-slate-500 mt-1.5 ml-1">Type to search internal contacts</div>
                        </div>

                        {/* Subject Field */}
                        <div className="mb-5">
                            <label className="block text-sm font-semibold text-slate-700 mb-1.5">Subject:</label>
                            <input
                                className="w-full px-3 py-2.5 border border-slate-300 rounded-md text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all duration-200"
                                placeholder="Enter subject"
                                {...register('subject', { required: true })}
                            />
                        </div>

                        {/* Rich Text Editor */}
                        <div className="mb-6">
                            <label className="block text-sm font-semibold text-slate-700 mb-1.5">Message:</label>
                            <div className="border border-slate-300 rounded-md overflow-hidden bg-white focus-within:border-blue-500 focus-within:ring-2 focus-within:ring-blue-500/20 transition-all duration-200">
                                {/* Toolbar */}
                                <div className="bg-slate-50 px-2.5 py-1.5 border-b border-slate-200 flex gap-1">
                                    <ToolbarButton onClick={() => formatText('bold')} icon={<Bold size={14} />} title="Bold" />
                                    <ToolbarButton onClick={() => formatText('italic')} icon={<Italic size={14} />} title="Italic" />
                                    <ToolbarButton onClick={() => formatText('underline')} icon={<Underline size={14} />} title="Underline" />
                                    <div className="w-px h-5 bg-slate-300 mx-1 self-center" />
                                    <ToolbarButton onClick={() => formatText('insertUnorderedList')} icon={<List size={14} />} title="Bullet List" />
                                    <ToolbarButton onClick={() => formatText('insertOrderedList')} icon={<ListOrdered size={14} />} title="Numbered List" />
                                    <ToolbarButton onClick={() => insertLink()} icon={<LinkIcon size={14} />} title="Link" />
                                </div>

                                {/* Content Editable Area */}
                                <div
                                    ref={editorRef}
                                    contentEditable
                                    className="min-h-[180px] p-3 text-sm text-slate-800 focus:outline-none leading-relaxed prose prose-sm max-w-none"
                                    onInput={(e) => setValue('body', e.currentTarget.innerHTML)}
                                // Placeholder logic via CSS or simple empty check
                                />
                            </div>
                        </div>

                        {/* Actions */}
                        <div className="flex justify-end gap-3 mt-5">
                            <button
                                type="button"
                                onClick={handleClose}
                                className="px-4.5 py-2.5 rounded-md text-sm font-medium text-slate-600 bg-slate-100 hover:bg-slate-200 transition-colors"
                            >
                                Discard
                            </button>
                            <button
                                type="submit"
                                className="px-6 py-2.5 rounded-md text-sm font-semibold text-white bg-slate-900 hover:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-slate-900 shadow-md transition-all flex items-center gap-2"
                            >
                                Send Message
                            </button>
                        </div>

                    </form>
                </div>
            </DialogContent>
        </Dialog>
    );
}

function ToolbarButton({ onClick, icon, title }: { onClick: () => void, icon: React.ReactNode, title: string }) {
    return (
        <button
            type="button"
            onClick={(e) => { e.preventDefault(); onClick(); }}
            title={title}
            className="w-8 h-8 flex items-center justify-center rounded bg-white border border-slate-200 text-slate-600 hover:bg-slate-100 hover:text-slate-900 hover:border-slate-300 transition-all active:scale-95"
        >
            {icon}
        </button>
    );
}
