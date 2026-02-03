
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardHeader, CardTitle } from "@complianceos/ui/ui/card";
import { ListTodo, AlertCircle, Clock } from "lucide-react";
import { Skeleton } from "@complianceos/ui/ui/skeleton";

export function StatsOverview({ clientId }: { clientId: number }) {
    const { data: stats, isLoading } = trpc.governance.getStats.useQuery({ clientId });

    if (isLoading) {
        return (
            <div className="grid gap-4 md:grid-cols-3">
                {[1, 2, 3].map((i) => (
                    <Card key={i}>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">
                                <Skeleton className="h-4 w-[100px]" />
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <Skeleton className="h-8 w-[60px]" />
                        </CardContent>
                    </Card>
                ))}
            </div>
        );
    }

    return (
        <div className="grid gap-4 md:grid-cols-3">
            <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Pending Tasks</CardTitle>
                    <ListTodo className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">{stats?.pending || 0}</div>
                    <p className="text-xs text-muted-foreground">
                        Tasks requiring your attention
                    </p>
                </CardContent>
            </Card>

            <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Critical Items</CardTitle>
                    <AlertCircle className="h-4 w-4 text-red-500" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold text-red-600">{stats?.critical || 0}</div>
                    <p className="text-xs text-muted-foreground">
                        High priority or critical impact
                    </p>
                </CardContent>
            </Card>

            <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Overdue</CardTitle>
                    <Clock className="h-4 w-4 text-orange-500" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold text-orange-600">{stats?.overdue || 0}</div>
                    <p className="text-xs text-muted-foreground">
                        Past due date
                    </p>
                </CardContent>
            </Card>
        </div>
    );
}
