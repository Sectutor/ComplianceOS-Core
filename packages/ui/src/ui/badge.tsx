import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "../lib/utils"

const badgeVariants = cva(
    "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
    {
        variants: {
            variant: {
                default:
                    "border-transparent bg-primary text-primary-foreground hover:bg-primary/80",
                secondary:
                    "border-transparent bg-secondary text-secondary-foreground hover:bg-secondary/80",
                destructive:
                    "border-transparent bg-destructive text-destructive-foreground hover:bg-destructive/80",
                outline: "text-foreground",
                success: "bg-[var(--success-bg)] text-[var(--success-foreground)] border-[var(--success-foreground)]/20",
                warning: "bg-[var(--warning-bg)] text-[var(--warning-foreground)] border-[var(--warning-foreground)]/20",
                error: "bg-[var(--error-bg)] text-[var(--error-foreground)] border-[var(--error-foreground)]/20",
                info: "bg-[var(--info-bg)] text-[var(--info-foreground)] border-[var(--info-foreground)]/20",
                evaluation: "bg-[var(--evaluation-bg)] text-[var(--evaluation-foreground)] border-[var(--evaluation-foreground)]/20",
                remediation: "bg-[var(--remediation-bg)] text-[var(--remediation-foreground)] border-[var(--remediation-foreground)]/20",
            },
        },
        defaultVariants: {
            variant: "default",
        },
    }
)

export interface BadgeProps
    extends React.HTMLAttributes<HTMLSpanElement>,
    VariantProps<typeof badgeVariants> { }

const Badge = React.forwardRef<HTMLSpanElement, BadgeProps>(
    ({ className, variant, ...props }, ref) => {
        return (
            <span
                ref={ref}
                className={cn(badgeVariants({ variant }), className)}
                {...props}
            />
        )
    }
)
Badge.displayName = "Badge"

export { Badge, badgeVariants }

