import { useState } from "react";
import { useRoute, useLocation } from "wouter";
import { PageGuide } from "@/components/PageGuide";
import DashboardLayout from "@/components/DashboardLayout";
import { Button } from "@complianceos/ui/ui/button";
import { Breadcrumb } from "@/components/Breadcrumb";
import { EnhancedDialog } from "@complianceos/ui/ui/enhanced-dialog";
import { Input } from "@complianceos/ui/ui/input";
import { Label } from "@complianceos/ui/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@complianceos/ui/ui/table";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@complianceos/ui/ui/card";
import { Badge } from "@complianceos/ui/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@complianceos/ui/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@complianceos/ui/ui/select";
import { Textarea } from "@complianceos/ui/ui/textarea";
import { Trash2, Edit2, Plus, Users, Network, GitGraph, RotateCw, HelpCircle, Search, GraduationCap, FileCheck, CheckCircle2, AlertCircle, Clock, Laptop } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { OrgChart } from "@/components/OrgChart";
import { AssetAssignmentDialog } from "@/components/AssetAssignmentDialog";
import { Alert, AlertDescription, AlertTitle } from "@complianceos/ui/ui/alert";
import { Progress } from "@complianceos/ui/ui/progress";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@complianceos/ui/ui/alert-dialog";

interface EmployeeFormData {
  firstName: string;
  lastName: string;
  email: string;
  department?: string;
  jobTitle?: string;
  phone?: string;
  orgRoleId?: string; // stored as string for Select, parsed to int
  managerId?: string; // stored as string for Select, parsed to int
  employmentStatus?: string;
}

interface RoleFormData {
  title: string;
  description: string;
  responsibilities: string;
  department: string;
  reportingRoleId?: string;
}

export function PeoplePage() {
  const [, params] = useRoute("/clients/:clientId/people");
  const clientId = params?.clientId ? parseInt(params.clientId) : 0;
  const { data: client } = trpc.clients.get.useQuery(
    { id: clientId },
    { enabled: clientId > 0 }
  );

  // -- State: Employees --
  const [searchQuery, setSearchQuery] = useState("");
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState<any>(null);
  const [formData, setFormData] = useState<EmployeeFormData>({
    firstName: "",
    lastName: "",
    email: "",
    department: "",
    jobTitle: "",
    phone: "",
    orgRoleId: "",
    managerId: "",
    employmentStatus: "active"
  });

  // -- State: Org Roles --
  const [isRoleAddOpen, setIsRoleAddOpen] = useState(false);
  const [isRoleEditOpen, setIsRoleEditOpen] = useState(false);
  const [selectedRole, setSelectedRole] = useState<any>(null);
  const [roleFormData, setRoleFormData] = useState<RoleFormData>({
    title: "",
    description: "",
    responsibilities: "",
    department: "",
    reportingRoleId: ""
  });

  const [employeeToDelete, setEmployeeToDelete] = useState<any>(null);
  const [roleToDelete, setRoleToDelete] = useState<any>(null);
  const [isAssetAssignmentOpen, setIsAssetAssignmentOpen] = useState(false);
  const [assetAssignmentEmployee, setAssetAssignmentEmployee] = useState<any>(null);

  // -- Queries --
  const { data: employees = [], isLoading, refetch } = trpc.employees.list.useQuery({ clientId });

  const cleanSearchQuery = searchQuery.toLowerCase().trim();
  const filteredEmployees = employees.filter((employee: any) => {
    if (!cleanSearchQuery) return true;
    const searchString = `${employee.firstName} ${employee.lastName} ${employee.email} ${employee.jobTitle || ""} ${employee.orgRoleTitle || ""} ${employee.department || ""}`.toLowerCase();
    return searchString.includes(cleanSearchQuery);
  });
  const { data: orgRoles = [], refetch: refetchRoles } = trpc.orgRoles.list.useQuery({ clientId });

  // Fetch bulk onboarding/compliance status for all employees
  const { data: onboardingStatuses = [] } = (trpc.onboarding as any).getCompanyOnboardingStatus?.useQuery(
    { clientId },
    { enabled: clientId > 0 }
  ) || { data: [] };

  // Create a map for quick lookup
  const complianceMap = new Map(
    onboardingStatuses.map((emp: any) => [emp.employeeId, emp])
  );

  // -- Mutations: Employees --
  const createMutation = trpc.employees.create.useMutation({
    onSuccess: () => {
      toast.success("Employee added successfully");
      setIsAddOpen(false);
      resetEmployeeForm();
      refetch();
    },
    onError: (error) => toast.error(error.message),
  });

  const updateMutation = trpc.employees.update.useMutation({
    onSuccess: () => {
      toast.success("Employee updated successfully");
      setIsEditOpen(false);
      setSelectedEmployee(null);
      refetch();
    },
    onError: (error) => toast.error(error.message),
  });

  const deleteMutation = trpc.employees.delete.useMutation({
    onSuccess: () => {
      toast.success("Employee deleted successfully");
      refetch();
    },
    onError: (error) => toast.error(error.message),
  });

  // -- Mutations: Org Roles --
  const createRoleMutation = trpc.orgRoles.create.useMutation({
    onSuccess: () => {
      toast.success("Role created successfully");
      setIsRoleAddOpen(false);
      resetRoleForm();
      refetchRoles();
      // Also refetch employees if role titles are used there
      refetch();
    },
    onError: (error) => toast.error(error.message),
  });

  const updateRoleMutation = trpc.orgRoles.update.useMutation({
    onSuccess: () => {
      toast.success("Role updated successfully");
      setIsRoleEditOpen(false);
      setSelectedRole(null);
      refetchRoles();
      refetch();
    },
    onError: (error) => toast.error(error.message),
  });

  const deleteRoleMutation = trpc.orgRoles.delete.useMutation({
    onSuccess: () => {
      toast.success("Role deleted successfully");
      refetchRoles();
      refetch();
    },
    onError: (error) => toast.error(error.message),
  });

  // -- Handlers: Employees --
  const resetEmployeeForm = () => {
    setFormData({
      firstName: "", lastName: "", email: "", department: "",
      jobTitle: "", phone: "", orgRoleId: "", managerId: "", employmentStatus: "active"
    });
  };

  const handleAddEmployee = async () => {
    if (!formData.firstName || !formData.lastName || !formData.email) {
      toast.error("Please fill in all required fields");
      return;
    }

    await createMutation.mutateAsync({
      clientId,
      ...formData,
      orgRoleId: formData.orgRoleId ? parseInt(formData.orgRoleId) : undefined,
      managerId: formData.managerId ? parseInt(formData.managerId) : undefined,
    });
  };

  const handleEditEmployee = async () => {
    if (!selectedEmployee) return;

    await updateMutation.mutateAsync({
      id: selectedEmployee.id,
      ...formData,
      orgRoleId: formData.orgRoleId ? parseInt(formData.orgRoleId) : undefined,
      managerId: formData.managerId ? parseInt(formData.managerId) : undefined,
    });
  };

  const handleDeleteEmployee = (employee: any) => {
    setEmployeeToDelete(employee);
  };

  const confirmDeleteEmployee = async () => {
    if (employeeToDelete) {
      await deleteMutation.mutateAsync({ id: employeeToDelete.id });
      setEmployeeToDelete(null);
    }
  };

  const handleOpenEdit = (employee: any) => {
    setSelectedEmployee(employee);
    setFormData({
      firstName: employee.firstName,
      lastName: employee.lastName,
      email: employee.email,
      department: employee.department || "",
      jobTitle: employee.jobTitle || "",
      phone: employee.phone || "",
      orgRoleId: employee.orgRoleId ? employee.orgRoleId.toString() : "",
      managerId: employee.managerId ? employee.managerId.toString() : "",
      employmentStatus: employee.employmentStatus || "active",
    });
    setIsEditOpen(true);
  };

  const handleOpenAdd = () => {
    resetEmployeeForm();
    setIsAddOpen(true);
  };

  const handleOpenAssetAssignment = (employee: any) => {
    setAssetAssignmentEmployee(employee);
    setIsAssetAssignmentOpen(true);
  };

  // -- Handlers: Org Roles --
  const resetRoleForm = () => {
    setRoleFormData({
      title: "", description: "", responsibilities: "", department: "", reportingRoleId: ""
    });
  };

  const handleAddRole = async () => {
    if (!roleFormData.title) {
      toast.error("Role title is required");
      return;
    }

    await createRoleMutation.mutateAsync({
      clientId,
      ...roleFormData,
      reportingRoleId: roleFormData.reportingRoleId ? parseInt(roleFormData.reportingRoleId) : undefined,
    });
  };

  const handleEditRole = async () => {
    if (!selectedRole) return;

    await updateRoleMutation.mutateAsync({
      id: selectedRole.id,
      ...roleFormData,
      reportingRoleId: roleFormData.reportingRoleId ? parseInt(roleFormData.reportingRoleId) : undefined,
    });
  };

  const handleDeleteRole = (role: any) => {
    setRoleToDelete(role);
  };

  const confirmDeleteRole = async () => {
    if (roleToDelete) {
      await deleteRoleMutation.mutateAsync({ id: roleToDelete.id });
      setRoleToDelete(null);
    }
  };

  const handleOpenEditRole = (role: any) => {
    setSelectedRole(role);
    setRoleFormData({
      title: role.title,
      description: role.description || "",
      responsibilities: role.responsibilities || "",
      department: role.department || "",
      reportingRoleId: role.reportingRoleId ? role.reportingRoleId.toString() : "",
    });
    setIsRoleEditOpen(true);
  };

  const handleOpenAddRole = () => {
    resetRoleForm();
    setIsRoleAddOpen(true);
  };

  const [isHelpOpen, setIsHelpOpen] = useState(false);

  return (
    <DashboardLayout>
      {assetAssignmentEmployee && (
        <AssetAssignmentDialog
          open={isAssetAssignmentOpen}
          onOpenChange={(open) => {
            setIsAssetAssignmentOpen(open);
            if (!open) setAssetAssignmentEmployee(null);
          }}
          employeeId={assetAssignmentEmployee.id}
          clientId={clientId}
          employeeName={`${assetAssignmentEmployee.firstName} ${assetAssignmentEmployee.lastName}`}
        />
      )}
      <div className="space-y-6">
        {/* Breadcrumb */}
        <Breadcrumb
          items={[
            { label: "Clients", href: "/clients" },
            { label: client?.name || "Client", href: `/clients/${clientId}` },
            { label: "People & Org" },
          ]}
        />

        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">People & Organization</h1>
            <p className="text-muted-foreground mt-1">Manage team members, roles, and responsibilities</p>
          </div>
          <div className="flex items-center gap-3">
            <div className="relative w-72">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search people..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-8"
              />
            </div>
            <Button variant="ghost" size="sm" onClick={() => setIsHelpOpen(!isHelpOpen)} className="gap-2">
              <HelpCircle className="w-4 h-4" />
              {isHelpOpen ? "Hide Help" : "What's the difference?"}
            </Button>
            <PageGuide
              title="People & Organization Management"
              description="Manage your team structure, roles, and employee records."
              rationale="Compliance requires clear lines of authority and responsibility. This module separates 'Who works here' (Employees) from 'What they do' (Roles) to ensure continuity even when staff changes."
              howToUse={[
                { step: "Define Structure", description: "Use the 'Org Structure' tab to create standard roles (e.g. 'CISO') and reporting lines." },
                { step: "Add Team", description: "Add employees in the 'Team Members' tab and assign them to the roles you defined." },
                { step: "Visualize", description: "View the 'Visual Chart' to audit your reporting hierarchy and identify gaps." },
                { step: "Assign Assets", description: "Use the laptop icon to assign devices to employees." }
              ]}
              integrations={[
                { name: "Access Control", description: "Roles defined here determine access levels in connected systems." },
                { name: "Training", description: "Training assignments are linked to specific job roles." },
                { name: "Offboarding", description: "Terminating an employee here triggers the offboarding workflow." }
              ]}
            />
          </div>
        </div>

        {isHelpOpen && (
          <Alert className="bg-blue-50 border-blue-200">
            <HelpCircle className="h-4 w-4 text-blue-600" />
            <AlertTitle className="text-blue-800 font-semibold mb-2">Understanding Org Structure vs. Team Members</AlertTitle>
            <AlertDescription className="text-blue-700">
              <div className="grid md:grid-cols-2 gap-6 mt-2">
                <div>
                  <h4 className="font-bold flex items-center gap-2 mb-1">
                    <Network className="w-4 h-4" />
                    Org Structure (The Blueprint)
                  </h4>
                  <p className="text-sm mb-2">
                    This defines the <strong>Roles</strong> available in your organization (e.g., "CISO", "Security Analyst"), regardless of who fills them.
                  </p>
                  <ul className="list-disc list-inside text-sm space-y-1 ml-1 opacity-90">
                    <li>Defines standardized job titles & responsibilities</li>
                    <li>Sets reporting lines (who reports to whom)</li>
                    <li>Required for compliance governance (ISO 27001/SOC 2)</li>
                  </ul>
                </div>
                <div>
                  <h4 className="font-bold flex items-center gap-2 mb-1">
                    <Users className="w-4 h-4" />
                    Team Members (The People)
                  </h4>
                  <p className="text-sm mb-2">
                    This is the roster of actual <strong>Individuals</strong> working at the company right now.
                  </p>
                  <ul className="list-disc list-inside text-sm space-y-1 ml-1 opacity-90">
                    <li>Real employees with contact info & status</li>
                    <li>Assigned to "Org Roles" to give them responsibilities</li>
                    <li>Used for tracking training, tasks, and evidence ownership</li>
                  </ul>
                </div>
              </div>
            </AlertDescription>
          </Alert>
        )}

        <Tabs defaultValue="roles" className="w-full">
          <TabsList className="grid w-full max-w-[600px] grid-cols-3">
            <TabsTrigger value="roles" className="flex items-center gap-2">
              <Network className="w-4 h-4" />
              Org Structure
            </TabsTrigger>
            <TabsTrigger value="employees" className="flex items-center gap-2">
              <Users className="w-4 h-4" />
              Team Members
            </TabsTrigger>
            <TabsTrigger value="chart" className="flex items-center gap-2">
              <GitGraph className="w-4 h-4" />
              Visual Chart
            </TabsTrigger>
          </TabsList>

          {/* EMPLOYEES TAB */}
          <TabsContent value="employees" className="mt-6">
            <div className="flex justify-end mb-4">
              <Button onClick={handleOpenAdd} className="gap-2">
                <Plus className="w-4 h-4" />
                Add Employee
              </Button>
            </div>
            <Card>
              <CardHeader>
                <CardTitle>Team Members ({filteredEmployees.length})</CardTitle>
                <CardDescription>
                  View and manage employees, assign structured roles and reporting lines.
                </CardDescription>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <div className="text-center py-8 text-muted-foreground">Loading employees...</div>
                ) : employees.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <p>No employees added yet</p>
                    <Button variant="outline" onClick={handleOpenAdd} className="mt-4">
                      Add First Employee
                    </Button>
                  </div>
                ) : (
                  <div className="rounded-xl border border-slate-200 shadow-lg overflow-hidden bg-white">
                    <Table>
                      <TableHeader>
                        <TableRow className="bg-[#1C4D8D] hover:bg-[#1C4D8D] border-none">
                          <TableHead className="text-white font-semibold py-4">Name</TableHead>
                          <TableHead className="text-white font-semibold py-4">Email</TableHead>
                          <TableHead className="text-white font-semibold py-4">Role / Title</TableHead>
                          <TableHead className="text-white font-semibold py-4">Department</TableHead>
                          <TableHead className="text-white font-semibold py-4">Manager</TableHead>
                          <TableHead className="text-white font-semibold py-4">Status</TableHead>
                          <TableHead className="text-white font-semibold py-4">Training</TableHead>
                          <TableHead className="text-white font-semibold py-4">Policies</TableHead>
                          <TableHead className="text-white font-semibold py-4">Compliance</TableHead>
                          <TableHead className="w-20 text-white font-semibold py-4">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {filteredEmployees.map((employee: any) => (
                          <TableRow key={employee.id} className="bg-white border-b border-slate-200 transition-all duration-200 hover:bg-slate-50 hover:shadow-sm group">
                            <TableCell className="font-medium text-black py-4">
                              {employee.firstName} {employee.lastName}
                            </TableCell>
                            <TableCell className="text-gray-600 py-4">{employee.email}</TableCell>
                            <TableCell className="py-4">
                              {employee.orgRoleTitle ? (
                                <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                                  {employee.orgRoleTitle}
                                </Badge>
                              ) : (
                                <span className="text-gray-500">{employee.jobTitle || employee.role || "-"}</span>
                              )}
                            </TableCell>
                            <TableCell className="text-gray-600 py-4">{employee.department || "-"}</TableCell>
                            <TableCell className="text-gray-600 py-4">{employee.managerName || "-"}</TableCell>
                            <TableCell className="py-4">
                              <Badge variant={employee.employmentStatus === 'active' ? "default" : "secondary"}>
                                {employee.employmentStatus || "Active"}
                              </Badge>
                            </TableCell>
                            <TableCell className="py-4">
                              {(() => {
                                const compliance = complianceMap.get(employee.id);
                                if (!compliance) return <span className="text-gray-400 text-sm">-</span>;
                                const pct = compliance.trainingCompletion || 0;
                                return (
                                  <div className="flex items-center gap-2">
                                    <GraduationCap className="h-4 w-4 text-blue-600" />
                                    <span className="text-sm font-medium">{pct}%</span>
                                  </div>
                                );
                              })()}
                            </TableCell>
                            <TableCell className="py-4">
                              {(() => {
                                const compliance = complianceMap.get(employee.id);
                                if (!compliance) return <span className="text-gray-400 text-sm">-</span>;
                                const attested = compliance.policiesAttested || 0;
                                const total = compliance.totalPolicies || 0;
                                return (
                                  <div className="flex items-center gap-2">
                                    <FileCheck className="h-4 w-4 text-green-600" />
                                    <span className="text-sm font-medium">{attested}/{total}</span>
                                  </div>
                                );
                              })()}
                            </TableCell>
                            <TableCell className="py-4">
                              {(() => {
                                const status = complianceMap.get(employee.id);
                                if (!status) {
                                  return (
                                    <Badge variant="secondary" className="gap-1">
                                      <Clock className="h-3 w-3" />
                                      Not Started
                                    </Badge>
                                  );
                                }
                                const pct = status.percentage || 0;
                                return (
                                  <div className="flex flex-col gap-1 w-24">
                                    <div className="flex justify-between text-xs text-muted-foreground">
                                      <span>{pct}%</span>
                                      {pct >= 100 && <CheckCircle2 className="h-3 w-3 text-green-600" />}
                                    </div>
                                    <Progress value={pct} className="h-2" />
                                  </div>
                                );
                              })()}
                            </TableCell>
                            <TableCell className="py-4">
                              <div className="flex gap-2 opacity-70 group-hover:opacity-100 transition-opacity duration-200">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleOpenEdit(employee)}
                                  className="h-8 w-8 p-0 hover:bg-[#1C4D8D]/10 hover:text-[#1C4D8D] transition-colors duration-200"
                                >
                                  <Edit2 className="w-4 h-4" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleOpenAssetAssignment(employee)}
                                  className="h-8 w-8 p-0 hover:bg-[#1C4D8D]/10 hover:text-[#1C4D8D] transition-colors duration-200"
                                  title="Assign Assets"
                                >
                                  <Laptop className="w-4 h-4" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleDeleteEmployee(employee.id)}
                                  className="h-8 w-8 p-0 text-red-500 hover:text-red-600 hover:bg-red-50 transition-colors duration-200"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* ORG ROLES TAB */}
          <TabsContent value="roles" className="mt-6">
            <div className="flex justify-end mb-4">
              <Button onClick={handleOpenAddRole} className="gap-2">
                <Plus className="w-4 h-4" />
                Create Role
              </Button>
            </div>
            <Card>
              <CardHeader>
                <CardTitle>Organizational Roles ({orgRoles.length})</CardTitle>
                <CardDescription>
                  Define standard roles and associated responsibilities for the organization.
                </CardDescription>
              </CardHeader>
              <CardContent>
                {orgRoles.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <p>No roles defined yet</p>
                    <Button variant="outline" onClick={handleOpenAddRole} className="mt-4">
                      Create First Role
                    </Button>
                  </div>
                ) : (
                  <div className="rounded-xl border border-slate-200 shadow-lg overflow-hidden bg-white">
                    <Table>
                      <TableHeader>
                        <TableRow className="bg-[#1C4D8D] hover:bg-[#1C4D8D] border-none">
                          <TableHead className="text-white font-semibold py-4">Role Title</TableHead>
                          <TableHead className="text-white font-semibold py-4">Department</TableHead>
                          <TableHead className="text-white font-semibold py-4">Reporting To</TableHead>
                          <TableHead className="w-[40%] text-white font-semibold py-4">Responsibilities</TableHead>
                          <TableHead className="w-20 text-white font-semibold py-4">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {orgRoles.map((role: any) => {
                          const reportingRole = orgRoles.find((r: any) => r.id === role.reportingRoleId);
                          return (
                            <TableRow key={role.id} className="bg-white border-b border-slate-200 transition-all duration-200 hover:bg-slate-50 hover:shadow-sm group">
                              <TableCell className="font-medium text-black py-4">{role.title}</TableCell>
                              <TableCell className="text-gray-600 py-4">{role.department || "-"}</TableCell>
                              <TableCell className="py-4">
                                {reportingRole ? (
                                  <Badge variant="secondary">{reportingRole.title}</Badge>
                                ) : (
                                  "-"
                                )}
                              </TableCell>
                              <TableCell className="truncate max-w-[300px] text-gray-600 py-4" title={role.responsibilities}>
                                {role.responsibilities ? role.responsibilities.substring(0, 100) + (role.responsibilities.length > 100 ? "..." : "") : "-"}
                              </TableCell>
                              <TableCell className="py-4">
                                <div className="flex gap-2 opacity-70 group-hover:opacity-100 transition-opacity duration-200">
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => handleOpenEditRole(role)}
                                    className="h-8 w-8 p-0 hover:bg-[#1C4D8D]/10 hover:text-[#1C4D8D] transition-colors duration-200"
                                  >
                                    <Edit2 className="w-4 h-4" />
                                  </Button>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => handleDeleteRole(role)}
                                    className="h-8 w-8 p-0 text-red-500 hover:text-red-600 hover:bg-red-50 transition-colors duration-200"
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </Button>
                                </div>
                              </TableCell>
                            </TableRow>
                          );
                        })}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* ORG CHART TAB */}
          <TabsContent value="chart" className="mt-6">
            <div className="flex justify-end mb-4">
              <Button variant="outline" onClick={() => refetch()} className="gap-2">
                <RotateCw className="w-4 h-4" />
                Refresh Chart
              </Button>
            </div>
            <Card>
              <CardHeader>
                <CardTitle>Organization Chart</CardTitle>
                <CardDescription>
                  Visual hierarchy of the organization based on reporting lines.
                </CardDescription>
              </CardHeader>
              <CardContent className="overflow-x-auto min-h-[600px] flex items-start justify-center bg-slate-50/50 p-6">
                {isLoading ? (
                  <div className="text-center py-8 text-muted-foreground">Loading chart...</div>
                ) : (
                  <OrgChart employees={filteredEmployees} />
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* --- DIALOGS --- */}

        {/* Add Employee Dialog */}
        <EnhancedDialog
          open={isAddOpen}
          onOpenChange={setIsAddOpen}
          title="Add Employee"
          footer={
            <div className="flex justify-end gap-2 w-full">
              <Button variant="outline" onClick={() => setIsAddOpen(false)}>Cancel</Button>
              <Button onClick={handleAddEmployee} disabled={createMutation.isPending}>
                {createMutation.isPending ? "Adding..." : "Add Employee"}
              </Button>
            </div>
          }
        >
          <div className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>First Name *</Label>
                <Input value={formData.firstName} onChange={(e) => setFormData({ ...formData, firstName: e.target.value })} placeholder="John" />
              </div>
              <div>
                <Label>Last Name *</Label>
                <Input value={formData.lastName} onChange={(e) => setFormData({ ...formData, lastName: e.target.value })} placeholder="Doe" />
              </div>
            </div>
            <div>
              <Label>Email *</Label>
              <Input type="email" value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} placeholder="john@example.com" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Department</Label>
                <Input value={formData.department} onChange={(e) => setFormData({ ...formData, department: e.target.value })} placeholder="IT" />
              </div>
              <div />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Org Role</Label>
                <Select value={formData.orgRoleId} onValueChange={(val) => setFormData({ ...formData, orgRoleId: val })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select Role" />
                  </SelectTrigger>
                  <SelectContent>
                    {orgRoles.map((r: any) => (
                      <SelectItem key={r.id} value={r.id.toString()}>{r.title}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Reporting Manager</Label>
                <Select value={formData.managerId} onValueChange={(val) => setFormData({ ...formData, managerId: val })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select Manager" />
                  </SelectTrigger>
                  <SelectContent>
                    {employees.map((e: any) => (
                      <SelectItem key={e.id} value={e.id.toString()}>{e.firstName} {e.lastName}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <Label>Phone</Label>
              <Input value={formData.phone} onChange={(e) => setFormData({ ...formData, phone: e.target.value })} />
            </div>
          </div>
        </EnhancedDialog>

        {/* Edit Employee Dialog */}
        <EnhancedDialog
          open={isEditOpen}
          onOpenChange={setIsEditOpen}
          title="Edit Employee"
          footer={
            <div className="flex justify-end gap-2 w-full">
              <Button variant="outline" onClick={() => setIsEditOpen(false)}>Cancel</Button>
              <Button onClick={handleEditEmployee} disabled={updateMutation.isPending}>
                {updateMutation.isPending ? "Updating..." : "Update Employee"}
              </Button>
            </div>
          }
        >
          <div className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>First Name *</Label>
                <Input value={formData.firstName} onChange={(e) => setFormData({ ...formData, firstName: e.target.value })} />
              </div>
              <div>
                <Label>Last Name *</Label>
                <Input value={formData.lastName} onChange={(e) => setFormData({ ...formData, lastName: e.target.value })} />
              </div>
            </div>
            <div>
              <Label>Email *</Label>
              <Input type="email" value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Department</Label>
                <Input value={formData.department || ""} onChange={(e) => setFormData({ ...formData, department: e.target.value })} />
              </div>
              <div />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Org Role</Label>
                <Select value={formData.orgRoleId || ""} onValueChange={(val) => setFormData({ ...formData, orgRoleId: val })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select Role" />
                  </SelectTrigger>
                  <SelectContent>
                    {orgRoles.map((r: any) => (
                      <SelectItem key={r.id} value={r.id.toString()}>{r.title}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Reporting Manager</Label>
                <Select value={formData.managerId || ""} onValueChange={(val) => setFormData({ ...formData, managerId: val })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select Manager" />
                  </SelectTrigger>
                  <SelectContent>
                    {employees.filter((e: any) => e.id !== selectedEmployee?.id).map((e: any) => (
                      <SelectItem key={e.id} value={e.id.toString()}>{e.firstName} {e.lastName}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Phone</Label>
                <Input value={formData.phone || ""} onChange={(e) => setFormData({ ...formData, phone: e.target.value })} />
              </div>
              <div>
                <Label>Status</Label>
                <Select value={formData.employmentStatus || "active"} onValueChange={(val) => setFormData({ ...formData, employmentStatus: val })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="inactive">Inactive</SelectItem>
                    <SelectItem value="contractor">Contractor</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
        </EnhancedDialog>

        {/* Add Role Dialog */}
        <EnhancedDialog
          open={isRoleAddOpen}
          onOpenChange={setIsRoleAddOpen}
          title="Create Organizational Role"
          footer={
            <div className="flex justify-end gap-2 w-full">
              <Button variant="outline" onClick={() => setIsRoleAddOpen(false)}>Cancel</Button>
              <Button onClick={handleAddRole} disabled={createRoleMutation.isPending}>
                {createRoleMutation.isPending ? "Creating..." : "Create Role"}
              </Button>
            </div>
          }
        >
          <div className="space-y-4 py-4">
            <div>
              <Label>Role Title *</Label>
              <Input value={roleFormData.title} onChange={(e) => setRoleFormData({ ...roleFormData, title: e.target.value })} placeholder="e.g. Senior Security Analyst" />
            </div>
            <div>
              <Label>Department</Label>
              <Input value={roleFormData.department} onChange={(e) => setRoleFormData({ ...roleFormData, department: e.target.value })} placeholder="e.g. Information Security" />
            </div>
            <div>
              <Label>Description</Label>
              <Input value={roleFormData.description} onChange={(e) => setRoleFormData({ ...roleFormData, description: e.target.value })} placeholder="Brief summary of the role" />
            </div>
            <div>
              <Label>Responsibilities (Detailed)</Label>
              <Textarea
                value={roleFormData.responsibilities}
                onChange={(e) => setRoleFormData({ ...roleFormData, responsibilities: e.target.value })}
                placeholder="List key responsibilities..."
                className="min-h-[100px]"
              />
            </div>
            <div>
              <Label>Reports To (Role)</Label>
              <Select value={roleFormData.reportingRoleId} onValueChange={(val) => setRoleFormData({ ...roleFormData, reportingRoleId: val })}>
                <SelectTrigger>
                  <SelectValue placeholder="Select Reporting Role" />
                </SelectTrigger>
                <SelectContent>
                  {orgRoles.map((r: any) => (
                    <SelectItem key={r.id} value={r.id.toString()}>{r.title}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </EnhancedDialog>

        {/* Edit Role Dialog */}
        <EnhancedDialog
          open={isRoleEditOpen}
          onOpenChange={setIsRoleEditOpen}
          title="Edit Organizational Role"
          footer={
            <div className="flex justify-end gap-2 w-full">
              <Button variant="outline" onClick={() => setIsRoleEditOpen(false)}>Cancel</Button>
              <Button onClick={handleEditRole} disabled={updateRoleMutation.isPending}>
                {updateRoleMutation.isPending ? "Updating..." : "Update Role"}
              </Button>
            </div>
          }
        >
          <div className="space-y-4 py-4">
            <div>
              <Label>Role Title *</Label>
              <Input value={roleFormData.title} onChange={(e) => setRoleFormData({ ...roleFormData, title: e.target.value })} />
            </div>
            <div>
              <Label>Department</Label>
              <Input value={roleFormData.department} onChange={(e) => setRoleFormData({ ...roleFormData, department: e.target.value })} />
            </div>
            <div>
              <Label>Description</Label>
              <Input value={roleFormData.description} onChange={(e) => setRoleFormData({ ...roleFormData, description: e.target.value })} />
            </div>
            <div>
              <Label>Responsibilities (Detailed)</Label>
              <Textarea
                value={roleFormData.responsibilities}
                onChange={(e) => setRoleFormData({ ...roleFormData, responsibilities: e.target.value })}
                className="min-h-[100px]"
              />
            </div>
            <div>
              <Label>Reports To (Role)</Label>
              <Select value={roleFormData.reportingRoleId || ""} onValueChange={(val) => setRoleFormData({ ...roleFormData, reportingRoleId: val })}>
                <SelectTrigger>
                  <SelectValue placeholder="Select Reporting Role" />
                </SelectTrigger>
                <SelectContent>
                  {orgRoles.filter((r: any) => r.id !== selectedRole?.id).map((r: any) => (
                    <SelectItem key={r.id} value={r.id.toString()}>{r.title}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </EnhancedDialog>

        {/* Delete Confirmations */}
        <AlertDialog open={!!employeeToDelete} onOpenChange={(open) => !open && setEmployeeToDelete(null)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete Employee?</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to delete <b>{employeeToDelete?.firstName} {employeeToDelete?.lastName}</b>? This action cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction
                className="bg-red-600 hover:bg-red-700"
                onClick={(e) => {
                  e.preventDefault();
                  confirmDeleteEmployee();
                }}
              >
                Delete Member
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        <AlertDialog open={!!roleToDelete} onOpenChange={(open) => !open && setRoleToDelete(null)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete Role?</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to delete the <b>{roleToDelete?.title}</b> role? This may affect employees assigned to this role.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction
                className="bg-red-600 hover:bg-red-700"
                onClick={(e) => {
                  e.preventDefault();
                  confirmDeleteRole();
                }}
              >
                Delete Role
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </DashboardLayout>
  );
}
