
import React from "react";
import { Check, ChevronsUpDown } from "lucide-react";
import { Button } from "./button";
import {
    Command,
    CommandEmpty,
    CommandGroup,
    CommandInput,
    CommandItem,
    CommandList,
} from "./command";
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "./popover";
import { cn } from "../lib/utils";

interface SearchableSelectProps {
    options: { label: string; value: string }[];
    value: string;
    onSelect: (val: string) => void;
    placeholder: string;
    emptyText?: string;
    className?: string;
}

export function SearchableSelect({
    options,
    value,
    onSelect,
    placeholder,
    emptyText = "No items found.",
    className
}: SearchableSelectProps) {
    const [open, setOpen] = React.useState(false);

    return (
        <Popover open={open} onOpenChange={setOpen} modal={true}>
            <PopoverTrigger asChild>
                <Button
                    variant="outline"
                    role="combobox"
                    aria-expanded={open}
                    className={cn("w-full justify-between font-normal text-slate-700", !value && "text-muted-foreground", className)}
                >
                    <span className="truncate">
                        {value
                            ? options.find((option) => option.value === value)?.label || value
                            : placeholder}
                    </span>
                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                </Button>
            </PopoverTrigger>
            <PopoverContent
                className="w-[400px] p-0 z-[100]"
                align="start"
                onOpenAutoFocus={(e) => e.preventDefault()}
            >
                <Command>
                    <CommandInput placeholder={`Search ${placeholder.toLowerCase()}...`} />
                    <CommandList className="max-h-[300px]">
                        <CommandEmpty>{emptyText}</CommandEmpty>
                        <CommandGroup>
                            {options.map((option, index) => (
                                <CommandItem
                                    key={`${option.value}-${index}`}
                                    value={option.label}
                                    onSelect={() => {
                                        onSelect(option.value);
                                        setOpen(false);
                                    }}
                                    onPointerDown={(e) => {
                                        e.preventDefault();
                                        e.stopPropagation();
                                    }}
                                    className="cursor-pointer"
                                >
                                    <Check
                                        className={cn(
                                            "mr-2 h-4 w-4 text-blue-600",
                                            value === option.value ? "opacity-100" : "opacity-0"
                                        )}
                                    />
                                    {option.label}
                                </CommandItem>
                            ))}
                        </CommandGroup>
                    </CommandList>
                </Command>
            </PopoverContent>
        </Popover>
    );
}

