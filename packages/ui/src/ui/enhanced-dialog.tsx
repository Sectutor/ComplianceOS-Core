
import * as React from "react"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogFooter,
    DialogTrigger,
} from "./dialog"
import { cn } from "../lib/utils"

interface EnhancedDialogProps extends React.ComponentProps<typeof Dialog> {
    trigger?: React.ReactNode
    title: React.ReactNode
    description?: string
    children: React.ReactNode
    footer?: React.ReactNode
    className?: string
    size?: "sm" | "md" | "lg" | "xl" | "full"
}

const sizeClasses = {
    sm: "sm:max-w-[425px]",
    md: "sm:max-w-[600px]",
    lg: "sm:max-w-[800px]",
    xl: "sm:max-w-[1000px]",
    full: "w-[95vw] h-[95vh] max-w-none"
}

export function EnhancedDialog({
    open,
    onOpenChange,
    trigger,
    title,
    description,
    children,
    footer,
    className,
    size = "md",
    ...props
}: EnhancedDialogProps) {
    return (
        <Dialog open={open} onOpenChange={onOpenChange} {...props}>
            {trigger && <DialogTrigger asChild>{trigger}</DialogTrigger>}
            <DialogContent className={cn(
                "p-0 gap-0 overflow-hidden flex flex-col h-[92vh]",
                sizeClasses[size],
                className
            )}>
                <DialogHeader className="p-6 pb-4 border-b bg-blue-50/50 border-blue-100">
                    <DialogTitle className="text-xl font-semibold tracking-tight text-blue-950">
                        {title}
                    </DialogTitle>
                    {description && (
                        <DialogDescription className="text-blue-900/60 mt-1">
                            {description}
                        </DialogDescription>
                    )}
                </DialogHeader>

                <div className="p-6 bg-white overflow-y-auto flex-1 min-h-0">
                    {children}
                </div>

                {footer && (
                    <DialogFooter className="p-6 pt-4 bg-slate-50 border-t border-slate-100">
                        {footer}
                    </DialogFooter>
                )}
            </DialogContent>
        </Dialog>
    )
}

