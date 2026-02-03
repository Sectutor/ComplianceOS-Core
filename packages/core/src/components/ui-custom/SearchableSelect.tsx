import * as React from "react"
import { Check, ChevronsUpDown, Plus } from "lucide-react"

import { cn } from "@/lib/utils"
import { Button } from "@complianceos/ui/ui/button"
import {
    Command,
    CommandEmpty,
    CommandGroup,
    CommandInput,
    CommandItem,
    CommandList,
} from "@complianceos/ui/ui/command"
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@complianceos/ui/ui/popover"

export interface SearchableSelectItem {
    label: string
    value: string | number
    description?: string
}

interface SearchableSelectProps {
    items: SearchableSelectItem[]
    value?: string | number | null
    onChange: (value: string | number | null) => void
    onCreate?: (inputValue: string) => Promise<void>
    placeholder?: string
    searchPlaceholder?: string
    className?: string
    isLoading?: boolean
}

export function SearchableSelect({
    items,
    value,
    onChange,
    onCreate,
    placeholder = "Select item...",
    searchPlaceholder = "Search...",
    className,
    isLoading,
}: SearchableSelectProps) {
    const [open, setOpen] = React.useState(false)
    const [inputValue, setInputValue] = React.useState("")

    const selectedItem = items.find((item) => item.value === value)

    const handleCreate = async () => {
        if (onCreate && inputValue) {
            await onCreate(inputValue)
            setOpen(false)
            setInputValue("")
        }
    }

    return (
        <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
                <Button
                    variant="outline"
                    role="combobox"
                    aria-expanded={open}
                    className={cn("w-full justify-between h-auto min-h-[2.5rem] py-2", className)}
                >
                    {selectedItem ? (
                        <div className="flex flex-col items-start text-left">
                            <span className="font-medium">{selectedItem.label}</span>
                            {selectedItem.description && (
                                <span className="text-xs text-muted-foreground truncate max-w-[300px]">{selectedItem.description}</span>
                            )}
                        </div>
                    ) : (
                        <span className="text-muted-foreground">{placeholder}</span>
                    )}
                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                </Button>
            </PopoverTrigger>
            <PopoverContent className="w-[--radix-popover-trigger-width] p-0">
                <Command>
                    <CommandInput
                        placeholder={searchPlaceholder}
                        value={inputValue}
                        onValueChange={setInputValue}
                    />
                    <CommandList>
                        <CommandEmpty className="py-2 px-2">
                            <p className="text-sm text-muted-foreground mb-2">No results found.</p>
                            {onCreate && inputValue && (
                                <Button
                                    variant="secondary"
                                    size="sm"
                                    className="w-full justify-start"
                                    onClick={handleCreate}
                                >
                                    <Plus className="mr-2 h-4 w-4" />
                                    Create "{inputValue}"
                                </Button>
                            )}
                        </CommandEmpty>
                        <CommandGroup>
                            {items.map((item) => (
                                <CommandItem
                                    key={item.value}
                                    value={item.label}
                                    keywords={[item.label, ...(item.description ? [item.description] : [])]}
                                    onSelect={() => {
                                        onChange(item.value === value ? null : item.value)
                                        // Use setTimeout to ensure the click event propagates fully before closing
                                        setTimeout(() => setOpen(false), 0)
                                    }}
                                    className="cursor-pointer"
                                >
                                    <Check
                                        className={cn(
                                            "mr-2 h-4 w-4",
                                            value === item.value ? "opacity-100" : "opacity-0"
                                        )}
                                    />
                                    <div className="flex flex-col">
                                        <span>{item.label}</span>
                                        {item.description && (
                                            <span className="text-xs text-muted-foreground">{item.description}</span>
                                        )}
                                    </div>
                                </CommandItem>
                            ))}
                        </CommandGroup>
                    </CommandList>
                </Command>
            </PopoverContent>
        </Popover>
    )
}
