import { useParams } from 'wouter';
import { trpc } from '@/lib/trpc';
import DashboardLayout from '@/components/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@complianceos/ui/ui/card';
import { Badge } from '@complianceos/ui/ui/badge';
import { Loader2, ArrowLeft, Mail, Briefcase, Building2, Users } from 'lucide-react';
import { Button } from '@complianceos/ui/ui/button';
import { Link } from 'wouter';
import { Breadcrumb } from '@/components/Breadcrumb';

const RACI_COLORS: Record<string, { bg: string; text: string; label: string }> = {
    'R': { bg: 'bg-red-100', text: 'text-red-800', label: 'Responsible' },
    'A': { bg: 'bg-blue-100', text: 'text-blue-800', label: 'Accountable' },
    'C': { bg: 'bg-green-100', text: 'text-green-800', label: 'Consulted' },
    'I': { bg: 'bg-yellow-100', text: 'text-yellow-800', label: 'Informed' },
};

export default function EmployeeDetails() {
    const { id: clientId, employeeId } = useParams<{ id: string; employeeId: string }>();
    const cId = parseInt(clientId || '0', 10);
    const eId = parseInt(employeeId || '0', 10);

    const { data: client } = trpc.clients.get.useQuery({ id: cId }, { enabled: cId > 0 });
    const { data: employee } = trpc.employees.get.useQuery({ id: eId, clientId: cId }, { enabled: eId > 0 && cId > 0 });
    const { data: orgRole } = trpc.orgRoles.get.useQuery({ id: employee?.orgRoleId || 0 }, { enabled: !!employee?.orgRoleId });
    const { data: raciMatrix, isLoading } = trpc.employees.getRACIMatrix.useQuery({ clientId: cId }, { enabled: cId > 0 });

    // Filter matrix for this specific employee
    const employeeData = raciMatrix?.find((e: any) => e.employeeId === eId);

    if (isLoading) {
        return (
            <DashboardLayout>
                <div className="flex items-center justify-center h-96">
                    <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
                </div>
            </DashboardLayout>
        );
    }

    if (!employee) {
        return (
            <DashboardLayout>
                <div className="p-8 text-center text-gray-500">Employee not found</div>
            </DashboardLayout>
        );
    }

    return (
        <DashboardLayout>
            <div className="space-y-6">
                <Breadcrumb
                    items={[
                        { label: "Clients", href: "/clients" },
                        { label: client?.name || "Client", href: `/clients/${cId}` },
                        { label: "People", href: `/clients/${cId}/people` },
                        { label: `${employee.firstName} ${employee.lastName}` },
                    ]}
                />

                <div className="flex items-center gap-4">
                    <Link href={`/clients/${cId}/people`}>
                        <Button variant="ghost" size="icon">
                            <ArrowLeft className="w-4 h-4" />
                        </Button>
                    </Link>
                    <div>
                        <h1 className="text-3xl font-bold">{employee.firstName} {employee.lastName}</h1>
                        <p className="text-gray-600 mt-1">Employee Profile & Assignments</p>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {/* Profile Card */}
                    <Card className="md:col-span-1 h-fit">
                        <CardHeader>
                            <CardTitle>Profile</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="flex items-center gap-3 text-gray-700">
                                <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 font-bold text-lg">
                                    {employee.firstName[0]}{employee.lastName[0]}
                                </div>
                                <div>
                                    <div className="font-medium">{employee.firstName} {employee.lastName}</div>
                                    <div className="text-xs text-gray-500">{employee.orgRoleTitle || employee.jobTitle || 'No Title'}</div>
                                </div>
                            </div>

                            <div className="space-y-3 pt-4 border-t">
                                {employee.email && (
                                    <div className="flex items-center gap-2 text-sm">
                                        <Mail className="w-4 h-4 text-gray-400" />
                                        <span className="truncate">{employee.email}</span>
                                    </div>
                                )}
                                {employee.department && (
                                    <div className="flex items-center gap-2 text-sm">
                                        <Building2 className="w-4 h-4 text-gray-400" />
                                        <span>{employee.department}</span>
                                    </div>
                                )}
                                {(employee.orgRoleTitle || employee.role) && (
                                    <div className="flex items-center gap-2 text-sm">
                                        <Briefcase className="w-4 h-4 text-gray-400" />
                                        <Badge variant="outline" className="font-normal text-wrap text-left h-auto py-1">
                                            {employee.orgRoleTitle || employee.role}
                                        </Badge>
                                    </div>
                                )}
                                {employee.managerName && (
                                    <div className="flex items-center gap-2 text-sm">
                                        <Users className="w-4 h-4 text-gray-400" />
                                        <span className="text-muted-foreground">Manager: </span>
                                        <span>{employee.managerName}</span>
                                    </div>
                                )}
                            </div>

                            <div className="pt-4 border-t">
                                <div className="text-sm font-medium mb-2">Assignment Stats</div>
                                <div className="grid grid-cols-2 gap-2">
                                    <div className="bg-gray-50 p-2 rounded text-center">
                                        <div className="text-xl font-bold">{employeeData?.totalAssignments || 0}</div>
                                        <div className="text-xs text-gray-500">Total</div>
                                    </div>
                                    {Object.keys(RACI_COLORS).map(role => {
                                        const count = employeeData?.assignments.filter((a: any) =>
                                            (a.role === role) || (a.raciRole && a.raciRole[0].toUpperCase() === role)
                                        ).length || 0;
                                        if (!count) return null;
                                        return (
                                            <div key={role} className={`p-2 rounded text-center ${RACI_COLORS[role].bg} ${RACI_COLORS[role].text}`}>
                                                <div className="text-xl font-bold">{count}</div>
                                                <div className="text-xs opacity-80">{role}</div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <div className="md:col-span-2 space-y-6">
                        {/* Org Role Card (if linked) */}
                        {orgRole && (
                            <Card>
                                <CardHeader>
                                    <CardTitle>Organizational Role: {orgRole.title}</CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    {orgRole.description && (
                                        <div>
                                            <h4 className="text-sm font-semibold mb-1">Description</h4>
                                            <p className="text-sm text-gray-600">{orgRole.description}</p>
                                        </div>
                                    )}
                                    {orgRole.responsibilities && (
                                        <div>
                                            <h4 className="text-sm font-semibold mb-1">Responsibilities</h4>
                                            <div className="text-sm text-gray-600 whitespace-pre-wrap rounded-md bg-gray-50 p-3">
                                                {orgRole.responsibilities}
                                            </div>
                                        </div>
                                    )}
                                </CardContent>
                            </Card>
                        )}

                        {/* Assignments List */}
                        <Card>
                            <CardHeader>
                                <CardTitle>Assigned Responsibilities</CardTitle>
                            </CardHeader>
                            <CardContent>
                                {!employeeData?.assignments?.length ? (
                                    <div className="text-center py-12 text-gray-500">
                                        No assignments found for this employee.
                                    </div>
                                ) : (
                                    <div className="space-y-4">
                                        {employeeData.assignments.map((assignment: any) => {
                                            // Normalize role for color lookup
                                            const roleKey = assignment.role || (assignment.raciRole ? assignment.raciRole[0].toUpperCase() : 'R');
                                            const colors = RACI_COLORS[roleKey] || RACI_COLORS['R'];

                                            return (
                                                <div key={assignment.assignmentId} className="flex items-start gap-4 p-4 border rounded-lg bg-gray-50/50 hover:bg-gray-50 transition-colors">
                                                    <div className={`mt-1 w-8 h-8 rounded flex items-center justify-center font-bold text-sm ${colors.bg} ${colors.text} flex-shrink-0`}>
                                                        {roleKey}
                                                    </div>
                                                    <div className="flex-1 min-w-0">
                                                        <div className="flex items-center gap-2 mb-1">
                                                            <Badge variant="outline" className="text-xs uppercase tracking-wider">
                                                                {assignment.taskType}
                                                            </Badge>
                                                            {assignment.taskIdentifier && (
                                                                <span className="text-xs font-mono text-gray-500">{assignment.taskIdentifier}</span>
                                                            )}
                                                        </div>
                                                        <h3 className="font-medium text-gray-900 truncate">{assignment.taskName}</h3>
                                                        <div className="flex items-center gap-4 mt-2 text-xs text-gray-500">
                                                            <span className="capitalize flex items-center gap-1">
                                                                <div className={`w-2 h-2 rounded-full ${assignment.taskStatus === 'implemented' || assignment.taskStatus === 'approved' ? 'bg-green-500' : 'bg-gray-400'}`} />
                                                                {assignment.taskStatus?.replace('_', ' ')}
                                                            </span>
                                                            {assignment.dueDate && (
                                                                <span>Due: {new Date(assignment.dueDate).toLocaleDateString()}</span>
                                                            )}
                                                        </div>
                                                    </div>
                                                    <Button variant="ghost" size="sm" asChild>
                                                        <Link href={assignment.taskType === 'policy'
                                                            ? `/clients/${cId}/policies/${assignment.id}?from=employee-details&employeeId=${eId}`
                                                            : `/clients/${cId}/controls`}>
                                                            View
                                                        </Link>
                                                    </Button>
                                                </div>
                                            );
                                        })}
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </div>
        </DashboardLayout>
    );
}
