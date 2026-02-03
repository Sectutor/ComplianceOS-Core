import React, { useMemo } from "react";
import { Card, CardContent } from "@complianceos/ui/ui/card";
import { Badge } from "@complianceos/ui/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@complianceos/ui/ui/avatar";
import { cn } from "@/lib/utils";

interface Employee {
  id: number;
  firstName: string;
  lastName: string;
  jobTitle?: string;
  orgRoleTitle?: string;
  managerId?: number | string | null;
  department?: string;
  email?: string;
  employmentStatus?: string;
}

interface OrgChartProps {
  employees: Employee[];
}

interface TreeNode extends Employee {
  children: TreeNode[];
}

const EmployeeCard = ({ employee }: { employee: Employee }) => {
  const initials = `${employee.firstName?.[0] || ""}${employee.lastName?.[0] || ""}`;
  const role = employee.orgRoleTitle || employee.jobTitle || "No Title";

  // Deterministic color based on department or role
  const getDepartmentColor = (dept?: string) => {
    if (!dept) return "bg-slate-100 border-slate-200 text-slate-700";
    const colors = [
      "bg-blue-100 border-blue-200 text-blue-700",
      "bg-emerald-100 border-emerald-200 text-emerald-700",
      "bg-violet-100 border-violet-200 text-violet-700",
      "bg-amber-100 border-amber-200 text-amber-700",
      "bg-rose-100 border-rose-200 text-rose-700",
      "bg-cyan-100 border-cyan-200 text-cyan-700",
    ];
    let hash = 0;
    for (let i = 0; i < dept.length; i++) {
      hash = dept.charCodeAt(i) + ((hash << 5) - hash);
    }
    return colors[Math.abs(hash) % colors.length];
  };

  const deptColorClass = getDepartmentColor(employee.department);

  return (
    <Card className={cn(
      "w-[180px] shadow-sm hover:shadow-md transition-all duration-300 cursor-pointer mx-auto relative z-10 border-l-4",
      "border-t border-r border-b border-slate-200",
      employee.department ? deptColorClass.replace('bg-', 'border-').replace('text-', '') : 'border-slate-300'
    )}>
      <CardContent className="p-3 flex flex-col items-center text-center gap-2">
        <div className={cn(
          "h-12 w-12 rounded-full flex items-center justify-center text-base font-bold border-4 border-white shadow-sm -mt-8",
          deptColorClass
        )}>
          {initials}
        </div>

        <div className="w-full">
          <h3 className="font-bold text-slate-900 truncate w-full text-sm">
            {employee.firstName} {employee.lastName}
          </h3>
          <p className="text-[10px] font-medium text-slate-600 truncate mb-1">
            {role}
          </p>
          {employee.department && (
            <Badge variant="secondary" className={cn("text-[9px] px-1.5 h-4 font-semibold", deptColorClass)}>
              {employee.department}
            </Badge>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

const OrgTreeNode = ({ node }: { node: TreeNode }) => {
  return (
    <div className="flex flex-col items-center">
      <div className="pt-6"> {/* Add top padding to accommodate the negative margin of avatar */}
        <EmployeeCard employee={node} />
      </div>

      {node.children.length > 0 && (
        <>
          {/* Vertical line from parent down to horizontal connector */}
          <div className="w-px h-6 bg-slate-300"></div>

          <div className="flex relative">
            {/* Horizontal connecting line - handled by children wrappers */}

            {node.children.map((child, index) => {
              const isFirst = index === 0;
              const isLast = index === node.children.length - 1;
              const isOnly = node.children.length === 1;

              return (
                <div key={child.id} className="flex flex-col items-center px-2 relative">
                  {/* Top vertical connector for child */}
                  <div className="w-px h-6 bg-slate-300 absolute top-0 left-1/2 -translate-x-1/2"></div>

                  {/* Horizontal connector lines */}
                  {!isOnly && (
                    <>
                      {/* Left half connector (if not first) */}
                      {!isFirst && (
                        <div className="absolute top-0 left-0 w-1/2 h-px bg-slate-300"></div>
                      )}
                      {/* Right half connector (if not last) */}
                      {!isLast && (
                        <div className="absolute top-0 right-0 w-1/2 h-px bg-slate-300"></div>
                      )}
                    </>
                  )}

                  {/* Spacer to push content down below connectors */}
                  <div className="mt-6">
                    <OrgTreeNode node={child} />
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
};

export function OrgChart({ employees }: OrgChartProps) {
  const tree = useMemo(() => {
    const employeeMap = new Map<number, TreeNode>();
    const roots: TreeNode[] = [];

    // First pass: create nodes
    employees.forEach((emp) => {
      employeeMap.set(emp.id, { ...emp, children: [] });
    });

    // Second pass: build hierarchy
    employees.forEach((emp) => {
      const node = employeeMap.get(emp.id)!;
      const managerId = emp.managerId ? Number(emp.managerId) : null;

      if (managerId && employeeMap.has(managerId)) {
        const manager = employeeMap.get(managerId)!;
        manager.children.push(node);
      } else {
        roots.push(node);
      }
    });

    return roots;
  }, [employees]);

  if (employees.length === 0) {
    return (
      <div className="text-center py-12 text-slate-500">
        No employees found to generate chart.
      </div>
    );
  }

  return (
    <div className="w-full overflow-x-auto p-8 bg-slate-50/50 rounded-xl min-h-[500px] flex justify-center items-start">
      <div className="flex gap-8">
        {tree.map((root) => (
          <OrgTreeNode key={root.id} node={root} />
        ))}
      </div>
    </div>
  );
}
