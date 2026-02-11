import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@complianceos/ui/ui/card';
import { Button } from '@complianceos/ui/ui/button';
import { Input } from '@complianceos/ui/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@complianceos/ui/ui/select';
import { Badge } from '@complianceos/ui/ui/badge';
import { trpc } from '@/lib/trpc';
import { useParams, Link, useLocation } from 'wouter';
import { Loader2, Download, AlertCircle, BarChart3, Shield, FileText, CheckCircle } from 'lucide-react';
import DashboardLayout from '@/components/DashboardLayout';
import { useAuth } from '@/_core/hooks/useAuth';
import { Breadcrumb } from '@/components/Breadcrumb';
import { useState, useMemo } from 'react';
import { RACIMatrixGrid } from '@/components/RACIMatrixGrid';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@complianceos/ui/ui/tabs';
import { PageGuide } from "@/components/PageGuide";

const RACI_COLORS: Record<string, { bg: string; text: string; label: string }> = {
  'R': { bg: 'bg-red-100', text: 'text-red-800', label: 'Responsible' },
  'A': { bg: 'bg-blue-100', text: 'text-blue-800', label: 'Accountable' },
  'C': { bg: 'bg-green-100', text: 'text-green-800', label: 'Consulted' },
  'I': { bg: 'bg-yellow-100', text: 'text-yellow-800', label: 'Informed' },
};

export default function RACIMatrix() {
  const { id: clientId } = useParams<{ id: string }>();
  const id = parseInt(clientId || '0', 10);
  const [viewMode, setViewMode] = useState<'table' | 'grid'>('table');
  const [, setLocation] = useLocation();

  const { data: client } = trpc.clients.get.useQuery(
    { id },
    { enabled: id > 0 }
  );

  const [searchTerm, setSearchTerm] = useState('');
  const [filterDepartment, setFilterDepartment] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'name' | 'department' | 'assignments'>('name');

  const { data: raciMatrix, isLoading: isLoadingMatrix, error: matrixError } = trpc.employees.getRACIMatrix.useQuery({ clientId: id }, { enabled: id > 0 });
  const { data: gapAnalysis, isLoading: isLoadingGaps } = trpc.employees.getRACIGapAnalysis.useQuery({ clientId: id }, { enabled: id > 0 });



  const departments = useMemo(() => {
    if (!raciMatrix) return [];
    const deptSet = new Set(raciMatrix.map((emp: any) => emp.department).filter(Boolean));
    return Array.from(deptSet);
  }, [raciMatrix]);

  const filteredAndSortedMatrix = useMemo(() => {
    if (!raciMatrix) return [];

    let filtered = raciMatrix.filter((emp: any) => {
      const matchesSearch = (emp.employeeName || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (emp.department || '').toLowerCase().includes(searchTerm.toLowerCase());
      const matchesDepartment = filterDepartment === 'all' || emp.department === filterDepartment;
      return matchesSearch && matchesDepartment;
    });

    // Sort
    filtered.sort((a: any, b: any) => {
      if (sortBy === 'name') {
        return (a.employeeName || '').localeCompare(b.employeeName || '');
      } else if (sortBy === 'department') {
        return (a.department || '').localeCompare(b.department || '');
      } else {
        return b.totalAssignments - a.totalAssignments;
      }
    });

    return filtered;
  }, [raciMatrix, searchTerm, filterDepartment, sortBy]);

  const totalCoverage = useMemo(() => {
    if (!gapAnalysis) return { controls: 0, policies: 0, evidence: 0 };
    return {
      controls: gapAnalysis.totalControls > 0 ? Math.round((gapAnalysis.assignedControls / gapAnalysis.totalControls) * 100) : 0,
      policies: gapAnalysis.totalPolicies > 0 ? Math.round((gapAnalysis.assignedPolicies / gapAnalysis.totalPolicies) * 100) : 0,
      evidence: gapAnalysis.totalEvidence > 0 ? Math.round((gapAnalysis.assignedEvidence / gapAnalysis.totalEvidence) * 100) : 0,
    };
  }, [gapAnalysis]);

  const isLoading = isLoadingMatrix || isLoadingGaps;

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-96">
          <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Breadcrumb */}
        <Breadcrumb
          items={[
            { label: "Clients", href: "/clients" },
            { label: client?.name || "Client", href: `/clients/${id}` },
            { label: "RACI Matrix" },
          ]}
        />

        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">RACI Matrix</h1>
            <p className="text-gray-600 mt-1">Visualize employee roles and responsibilities across compliance tasks</p>
          </div>
          <div className="flex gap-2">
            <Tabs value={viewMode} onValueChange={(value: any) => setViewMode(value)} className="w-auto">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="table">Table View</TabsTrigger>
                <TabsTrigger value="grid">Grid View</TabsTrigger>
              </TabsList>
            </Tabs>
            <Button variant="outline" className="gap-2">
              <Download className="w-4 h-4" />
              Export
            </Button>
            <PageGuide
              title="RACI Matrix"
              description="Visualize and manage role responsibilities across your compliance program."
              rationale="A clear RACI matrix prevents ambiguity about who is doing what. It ensures that for every critical control or policy, there is someone Responsible for doing the work and someone Accountable for ensuring it gets done."
              howToUse={[
                { step: "Analyze Gaps", description: "Use the top cards to identify unassigned Controls, Policies, or Evidence tasks." },
                { step: "Switch Views", description: "Toggle between 'Table View' for a list of employees and 'Grid View' for a classic matrix layout." },
                { step: "Assign Roles", description: "Click on intersection points in the Grid View to toggle R, A, C, or I roles." },
                { step: "Filter", description: "Use department and search filters to focus on specific teams or individuals." }
              ]}
              integrations={[
                { name: "Task Management", description: "Assigning 'Responsible' will automatically create tasks for the user." },
                { name: "Notifications", description: "'Informed' users receive updates when item status changes." },
                { name: "Audit Trail", description: "Auditors use this matrix to verify organizational oversight." }
              ]}
            />
          </div>
        </div>

        {/* Coverage Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="p-4 rounded-xl border-none shadow-lg shadow-blue-200 dark:shadow-none bg-blue-600 text-white flex items-center justify-between">
            <div>
              <p className="text-sm text-white/80 font-medium">Control Coverage</p>
              <p className="text-3xl font-bold mt-1 text-white">{totalCoverage.controls}%</p>
              <p className="text-xs text-white/60 mt-1">
                {gapAnalysis?.assignedControls}/{gapAnalysis?.totalControls} assigned
              </p>
            </div>
            <div className="p-3 rounded-lg bg-white/20 backdrop-blur-md">
              <Shield className="w-6 h-6 text-white" />
            </div>
          </div>

          <div className="p-4 rounded-xl border-none shadow-lg shadow-indigo-200 dark:shadow-none bg-indigo-600 text-white flex items-center justify-between">
            <div>
              <p className="text-sm text-white/80 font-medium">Policy Coverage</p>
              <p className="text-3xl font-bold mt-1 text-white">{totalCoverage.policies}%</p>
              <p className="text-xs text-white/60 mt-1">
                {gapAnalysis?.assignedPolicies}/{gapAnalysis?.totalPolicies} assigned
              </p>
            </div>
            <div className="p-3 rounded-lg bg-white/20 backdrop-blur-md">
              <FileText className="w-6 h-6 text-white" />
            </div>
          </div>

          <div className="p-4 rounded-xl border-none shadow-lg shadow-emerald-200 dark:shadow-none bg-emerald-600 text-white flex items-center justify-between">
            <div>
              <p className="text-sm text-white/80 font-medium">Evidence Coverage</p>
              <p className="text-3xl font-bold mt-1 text-white">{totalCoverage.evidence}%</p>
              <p className="text-xs text-white/60 mt-1">
                {gapAnalysis?.assignedEvidence}/{gapAnalysis?.totalEvidence} assigned
              </p>
            </div>
            <div className="p-3 rounded-lg bg-white/20 backdrop-blur-md">
              <CheckCircle className="w-6 h-6 text-white" />
            </div>
          </div>
        </div>

        {/* Unassigned Items Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="p-4 rounded-xl border border-yellow-200 bg-yellow-50 flex items-center justify-between">
            <div>
              <p className="text-sm text-yellow-800 font-medium">Unassigned Controls</p>
              <p className="text-3xl font-bold mt-1 text-yellow-900">{gapAnalysis?.unassignedControls?.length || 0}</p>
              <p className="text-xs text-yellow-600 mt-1">Require owner assignment</p>
            </div>
            <div className="p-3 rounded-lg bg-yellow-100">
              <AlertCircle className="w-6 h-6 text-yellow-700" />
            </div>
          </div>

          <div className="p-4 rounded-xl border border-orange-200 bg-orange-50 flex items-center justify-between">
            <div>
              <p className="text-sm text-orange-800 font-medium">Unassigned Policies</p>
              <p className="text-3xl font-bold mt-1 text-orange-900">{gapAnalysis?.unassignedPolicies?.length || 0}</p>
              <p className="text-xs text-orange-600 mt-1">Require owner assignment</p>
            </div>
            <div className="p-3 rounded-lg bg-orange-100">
              <AlertCircle className="w-6 h-6 text-orange-700" />
            </div>
          </div>

          <div className="p-4 rounded-xl border border-rose-200 bg-rose-50 flex items-center justify-between">
            <div>
              <p className="text-sm text-rose-800 font-medium">Unassigned Evidence</p>
              <p className="text-3xl font-bold mt-1 text-rose-900">{gapAnalysis?.unassignedEvidence?.length || 0}</p>
              <p className="text-xs text-rose-600 mt-1">Require owner assignment</p>
            </div>
            <div className="p-3 rounded-lg bg-rose-100">
              <AlertCircle className="w-6 h-6 text-rose-700" />
            </div>
          </div>
        </div>

        {/* View Mode Content */}
        {viewMode === 'grid' ? (
          <RACIMatrixGrid
            employees={filteredAndSortedMatrix.map(emp => ({
              employeeId: emp.employeeId,
              employeeName: emp.employeeName,
              department: emp.department,
              jobTitle: emp.jobTitle,
            }))}
            items={(() => {
              if (!raciMatrix) return [];
              const uniqueItems = new Map();
              raciMatrix.forEach((emp: any) => {
                emp.assignments.forEach((a: any) => {
                  const key = `${a.taskType}-${a.id}`;
                  if (!uniqueItems.has(key)) {
                    uniqueItems.set(key, {
                      id: a.id,
                      name: a.taskName,
                      identifier: a.taskIdentifier,
                      type: a.taskType,
                      status: a.taskStatus
                    });
                  }
                });
              });

              // 2. From Gap Analysis (Unassigned)
              if (gapAnalysis) {
                gapAnalysis.unassignedControls?.forEach((i: any) => {
                  const key = `control-${i.id}`;
                  if (!uniqueItems.has(key)) {
                    uniqueItems.set(key, { id: i.id, name: i.name, type: 'control', identifier: i.identifier || i.id });
                  }
                });
                gapAnalysis.unassignedPolicies?.forEach((i: any) => {
                  const key = `policy-${i.id}`;
                  if (!uniqueItems.has(key)) {
                    uniqueItems.set(key, { id: i.id, name: i.name, type: 'policy', identifier: i.identifier || i.id });
                  }
                });
                gapAnalysis.unassignedEvidence?.forEach((i: any) => {
                  const key = `evidence-${i.id}`;
                  if (!uniqueItems.has(key)) {
                    uniqueItems.set(key, { id: i.id, name: i.name, type: 'evidence', identifier: i.identifier || i.id });
                  }
                });
              }

              return Array.from(uniqueItems.values());
            })()}
            assignments={(() => {
              if (!raciMatrix) return [];
              const flatAssignments: any[] = [];
              raciMatrix.forEach((emp: any) => {
                emp.assignments.forEach((a: any) => {
                  flatAssignments.push({
                    employeeId: emp.employeeId,
                    itemId: a.id,
                    itemType: a.taskType,
                    role: a.raciRole // 'responsible', 'accountable', etc.
                  });
                });
              });
              return flatAssignments;
            })()}
            unassignedItems={[
              ...(gapAnalysis?.unassignedControls || []),
              ...(gapAnalysis?.unassignedPolicies || [])
            ]}
            clientId={id}
          />
        ) : (
          <>
            {/* Filters */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Employee Assignments</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex gap-4 flex-wrap">
                  <div className="flex-1 min-w-64">
                    <Input
                      placeholder="Search by name or department..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                    />
                  </div>

                  <Select value={filterDepartment} onValueChange={setFilterDepartment}>
                    <SelectTrigger className="w-48">
                      <SelectValue placeholder="All Departments" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Departments</SelectItem>
                      {departments.map((dept: string) => (
                        <SelectItem key={dept} value={dept}>{dept}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  <Select value={sortBy} onValueChange={(value: any) => setSortBy(value)}>
                    <SelectTrigger className="w-48">
                      <SelectValue placeholder="Sort by..." />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="name">Sort by Name</SelectItem>
                      <SelectItem value="department">Sort by Department</SelectItem>
                      <SelectItem value="assignments">Sort by Assignments</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Employee Table */}
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left py-3 px-4 font-medium">Employee</th>
                        <th className="text-left py-3 px-4 font-medium">Department</th>
                        <th className="text-center py-3 px-4 font-medium">Assignments</th>
                        <th className="text-left py-3 px-4 font-medium">Task Details</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredAndSortedMatrix.length === 0 ? (
                        <tr>
                          <td colSpan={4} className="text-center py-8 text-gray-500">
                            No employees found
                          </td>
                        </tr>
                      ) : (
                        filteredAndSortedMatrix.map((emp: any) => (
                          <tr key={emp.employeeId} className="border-b hover:bg-gray-50">
                            <td className="py-3 px-4">
                              <Link href={`/clients/${id}/employees/${emp.employeeId}`} className="hover:underline cursor-pointer">
                                <div className="font-medium text-blue-600">{emp.employeeName}</div>
                              </Link>
                              <div className="text-xs text-gray-500">{emp.jobTitle || '-'}</div>
                            </td>
                            <td className="py-3 px-4 text-gray-600">{emp.department || '-'}</td>
                            <td className="py-3 px-4 text-center">
                              <Badge variant="secondary">{emp.totalAssignments}</Badge>
                            </td>
                            <td className="py-3 px-4">
                              {emp.assignments.length === 0 ? (
                                <span className="text-gray-400 text-xs">No assignments</span>
                              ) : (
                                <div className="space-y-2 max-h-40 overflow-y-auto">
                                  {emp.assignments.map((assignment: any) => (
                                    <div
                                      key={`${assignment.assignmentId || assignment.id}-${assignment.role}`}
                                      className="flex items-center gap-2 text-xs border rounded p-2 bg-gray-50"
                                    >
                                      <div
                                        className={`px-2 py-1 rounded font-bold cursor-pointer ${RACI_COLORS[assignment.role]?.bg} ${RACI_COLORS[assignment.role]?.text}`}
                                        title={`${RACI_COLORS[assignment.role]?.label} (Double-click to view mappings)`}
                                        onDoubleClick={() => setLocation(`/clients/${id}/mappings`)}
                                      >
                                        {assignment.role}
                                      </div>
                                      <div className="flex-1 min-w-0">
                                        <div className="font-medium truncate" title={assignment.taskName}>
                                          {assignment.taskIdentifier && <span className="text-gray-400 mr-1">{assignment.taskIdentifier}</span>}
                                          {assignment.taskName}
                                        </div>
                                        <div className="flex items-center gap-2 text-gray-500">
                                          <span className="capitalize">{assignment.taskType}</span>
                                          <span>•</span>
                                          <Badge variant="outline" className="text-[10px] h-4">
                                            {assignment.taskStatus?.replace('_', ' ')}
                                          </Badge>
                                          {assignment.dueDate && (
                                            <>
                                              <span>•</span>
                                              <span className={new Date(assignment.dueDate) < new Date() ? 'text-red-600' : ''}>
                                                Due: {new Date(assignment.dueDate).toLocaleDateString()}
                                              </span>
                                            </>
                                          )}
                                        </div>
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              )}
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>

                {/* RACI Legend */}
                <div className="mt-6 pt-4 border-t">
                  <p className="text-sm font-medium mb-3">RACI Legend</p>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    {Object.entries(RACI_COLORS).map(([role, colors]) => (
                      <div key={role} className="flex items-center gap-2">
                        <div className={`w-6 h-6 rounded ${colors.bg} ${colors.text} flex items-center justify-center text-xs font-bold`}>
                          {role}
                        </div>
                        <span className="text-sm">{colors.label}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          </>
        )}
      </div>
    </DashboardLayout>
  );
}
