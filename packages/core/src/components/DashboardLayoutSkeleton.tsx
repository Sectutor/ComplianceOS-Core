import { Skeleton } from "@complianceos/ui/ui/skeleton";

export function DashboardLayoutSkeleton() {
    return (
        <div className="flex h-screen w-full">
            <div className="w-[280px] h-full border-r p-4 space-y-4">
                <Skeleton className="h-8 w-3/4" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-full" />
            </div>
            <div className="flex-1 p-8 space-y-4">
                <Skeleton className="h-12 w-1/3" />
                <Skeleton className="h-64 w-full" />
            </div>
        </div>
    );
}
