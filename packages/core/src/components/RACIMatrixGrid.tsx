import React, { useMemo, useState } from 'react';
import { Link, useLocation } from 'wouter';
import { Input } from '@complianceos/ui/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@complianceos/ui/ui/select';
import { Badge } from '@complianceos/ui/ui/badge';
import { Button } from '@complianceos/ui/ui/button';
import { Download, AlertCircle, ChevronDown, ChevronUp } from 'lucide-react';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@complianceos/ui/ui/tooltip';

const RACI_COLORS: Record<string, { bg: string; text: string; border: string; label: string }> = {
  'R': { bg: 'bg-red-50', text: 'text-red-700', border: 'border-red-200', label: 'Responsible' },
  'A': { bg: 'bg-blue-50', text: 'text-blue-700', border: 'border-blue-200', label: 'Accountable' },
  'C': { bg: 'bg-green-50', text: 'text-green-700', border: 'border-green-200', label: 'Consulted' },
  'I': { bg: 'bg-yellow-50', text: 'text-yellow-700', border: 'border-yellow-200', label: 'Informed' },
};

interface RACIMatrixGridProps {
  employees: Array<{
    employeeId: number;
    employeeName: string;
    department?: string;
    jobTitle?: string;
  }>;
  items: Array<{
    id: number;
    name: string;
    type: 'control' | 'policy' | 'evidence';
    category?: string;
  }>;
  assignments: Array<{
    employeeId: number;
    taskId: number;
    taskType?: string; // Add taskType support
    raciRole: 'R' | 'A' | 'C' | 'I';
  }>;
  unassignedItems?: Array<{
    id: number;
    name: string;
    type: string;
  }>;
  onExport?: () => void;
  clientId: number;
}

export function RACIMatrixGrid({
  employees,
  items,
  assignments,
  unassignedItems = [],
  onExport,
  clientId,
}: RACIMatrixGridProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterDepartment, setFilterDepartment] = useState<string>('all');
  const [filterType, setFilterType] = useState<string>('all');
  const [expandedEmployee, setExpandedEmployee] = useState<number | null>(null);
  const [, setLocation] = useLocation();

  // Get unique departments
  const departments = useMemo(() => {
    const deptSet = new Set(employees.map(emp => emp.department).filter(Boolean));
    return Array.from(deptSet).sort();
  }, [employees]);

  // Get unique item types
  const itemTypes = useMemo(() => {
    const typeSet = new Set(items.map(item => item.type));
    return Array.from(typeSet).sort();
  }, [items]);

  // Filter employees
  const filteredEmployees = useMemo(() => {
    return employees.filter(emp => {
      const matchesSearch = emp.employeeName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        emp.department?.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesDepartment = filterDepartment === 'all' || emp.department === filterDepartment;
      return matchesSearch && matchesDepartment;
    });
  }, [employees, searchTerm, filterDepartment]);

  // Filter items
  const filteredItems = useMemo(() => {
    return items.filter(item => filterType === 'all' || item.type === filterType);
  }, [items, filterType]);

  // Get RACI role for employee-item pair
  const getRACIRole = (employeeId: number, itemId: number, itemType: string) => {
    const assignment = assignments.find(a =>
      a.employeeId === employeeId &&
      a.taskId === itemId &&
      (a.taskType ? a.taskType === itemType : true) // Match type if present
    );
    return assignment?.raciRole;
  };

  // Calculate coverage metrics
  const coverageMetrics = useMemo(() => {
    const totalCells = filteredEmployees.length * filteredItems.length;
    const assignedCells = assignments.filter(a =>
      filteredEmployees.some(e => e.employeeId === a.employeeId) &&
      filteredItems.some(i => i.id === a.taskId && (a.taskType ? a.taskType === i.type : true)) // Match type
    ).length;
    const unassignedCells = totalCells - assignedCells;
    const coveragePercent = totalCells > 0 ? Math.round((assignedCells / totalCells) * 100) : 0;

    return { totalCells, assignedCells, unassignedCells, coveragePercent };
  }, [filteredEmployees, filteredItems, assignments]);

  // Identify gaps (items with no assignments)
  const itemsWithoutAssignments = useMemo(() => {
    return filteredItems.filter(item =>
      !assignments.some(a => a.taskId === item.id)
    );
  }, [filteredItems, assignments]);

  const employeesWithoutAssignments = useMemo(() => {
    return filteredEmployees.filter(emp =>
      !assignments.some(a => a.employeeId === emp.employeeId)
    );
  }, [filteredEmployees, assignments]);

  // Responsive grid - show scrollable table on smaller screens
  const isLargeGrid = filteredEmployees.length > 0 && filteredItems.length > 0;

  return (
    <div className="space-y-6">
      {/* Coverage Summary */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-lg border">
          <p className="text-sm text-gray-600 font-medium">Total Assignments</p>
          <p className="text-2xl font-bold mt-1">{coverageMetrics.assignedCells}</p>
          <p className="text-xs text-gray-500 mt-1">of {coverageMetrics.totalCells} cells</p>
        </div>
        <div className="bg-white p-4 rounded-lg border">
          <p className="text-sm text-gray-600 font-medium">Coverage</p>
          <p className="text-2xl font-bold mt-1">{coverageMetrics.coveragePercent}%</p>
          <p className="text-xs text-gray-500 mt-1">{coverageMetrics.unassignedCells} gaps</p>
        </div>
        <Link href={`/clients/${clientId}/raci-matrix/unassigned`}>
          <div className="bg-white p-4 rounded-lg border hover:bg-gray-50 cursor-pointer transition-all hover:shadow-md h-full relative z-10">
            <p className="text-sm text-gray-600 font-medium">Unassigned Items</p>
            <p className="text-2xl font-bold mt-1 text-orange-600">{itemsWithoutAssignments.length}</p>
            <p className="text-xs text-gray-500 mt-1">{filteredItems.length} total items</p>
          </div>
        </Link>
        <div className="bg-white p-4 rounded-lg border">
          <p className="text-sm text-gray-600 font-medium">Unassigned Employees</p>
          <p className="text-2xl font-bold mt-1">{employeesWithoutAssignments.length}</p>
          <p className="text-xs text-gray-500 mt-1">{filteredEmployees.length} total employees</p>
        </div>
      </div>

      {/* Gap Alerts */}
      {(itemsWithoutAssignments.length > 0 || employeesWithoutAssignments.length > 0) && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <div className="flex gap-3">
            <AlertCircle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
            <div>
              <h3 className="font-medium text-yellow-900">Coverage Gaps Detected</h3>
              <p className="text-sm text-yellow-800 mt-1">
                {itemsWithoutAssignments.length > 0 && (
                  <span>{itemsWithoutAssignments.length} item{itemsWithoutAssignments.length !== 1 ? 's' : ''} without assignments. </span>
                )}
                {employeesWithoutAssignments.length > 0 && (
                  <span>{employeesWithoutAssignments.length} employee{employeesWithoutAssignments.length !== 1 ? 's' : ''} without assignments.</span>
                )}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="bg-white p-4 rounded-lg border space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="font-medium">Matrix Filters</h3>
          {onExport && (
            <Button variant="outline" size="sm" onClick={onExport} className="gap-2">
              <Download className="w-4 h-4" />
              Export
            </Button>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="text-sm font-medium text-gray-700 block mb-2">Search</label>
            <Input
              placeholder="Search employees..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          <div>
            <label className="text-sm font-medium text-gray-700 block mb-2">Department</label>
            <Select value={filterDepartment} onValueChange={setFilterDepartment}>
              <SelectTrigger>
                <SelectValue placeholder="All Departments" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Departments</SelectItem>
                {departments.map((dept) => (
                  <SelectItem key={dept} value={dept || ''}>{dept}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <label className="text-sm font-medium text-gray-700 block mb-2">Item Type</label>
            <Select value={filterType} onValueChange={setFilterType}>
              <SelectTrigger>
                <SelectValue placeholder="All Types" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                {itemTypes.map((type) => (
                  <SelectItem key={type} value={type}>
                    {type.charAt(0).toUpperCase() + type.slice(1)}s
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      {/* RACI Matrix Grid */}
      {isLargeGrid ? (
        <div className="bg-white shadow-sm overflow-hidden rounded-xl border-none">
          <div className="overflow-x-auto">
            <div className="inline-block min-w-full">
              <table className="w-full text-sm border-separate border-spacing-1">
                <thead>
                  <tr>
                    <th className="sticky left-0 z-20 bg-white p-2 text-left font-bold text-slate-800 text-sm border-b-2 border-slate-100 min-w-48">
                      RACI CHART
                    </th>
                    {filteredEmployees.map((employee) => (
                      <th
                        key={employee.employeeId}
                        className="p-2 text-center bg-slate-600 text-white font-medium min-w-20 rounded-lg shadow-sm"
                        title={employee.department || ''}
                      >
                        <div className="text-xs font-semibold truncate max-w-[80px] mx-auto">{employee.employeeName}</div>
                        <div className="text-[9px] uppercase tracking-wider opacity-80 mt-0.5 truncate max-w-[80px] mx-auto">{employee.jobTitle || 'Team Member'}</div>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="space-y-0.5">
                  {filteredItems.map((item, idx) => (
                    <tr key={item.id} className="group">
                      <td className="sticky left-0 z-10 p-2 font-medium text-slate-700 bg-indigo-50/50 border-r border-indigo-100 rounded-lg group-hover:bg-indigo-100 transition-colors">
                        <div className="font-semibold text-xs truncate max-w-[200px]" title={item.name}>{item.name}</div>
                        <div className="text-[10px] text-slate-500 mt-0.5 uppercase tracking-wide flex items-center gap-1">
                          <span className={`w-1.5 h-1.5 rounded-full ${item.type === 'control' ? 'bg-blue-400' :
                              item.type === 'policy' ? 'bg-purple-400' : 'bg-emerald-400'
                            }`}></span>
                          {item.type}
                        </div>
                      </td>
                      {filteredEmployees.map((employee) => {
                        const role = getRACIRole(employee.employeeId, item.id, item.type);

                        // New vibrant colors
                        let bgClass = "bg-slate-50";

                        if (role === 'R') bgClass = "bg-red-300"; // Pinkish Red
                        if (role === 'A') bgClass = "bg-indigo-300"; // Accountable Purple
                        if (role === 'C') bgClass = "bg-teal-300"; // Consulted Teal
                        if (role === 'I') bgClass = "bg-amber-300"; // Informed Yellow

                        return (
                          <td
                            key={`${item.id}-${employee.employeeId}`}
                            className={`p-0.5 text-center align-middle transition-all duration-200 h-10`}
                          >
                            <div
                              className={`w-full h-full flex items-center justify-center rounded-md ${bgClass} transition-transform hover:scale-[1.02] cursor-default`}
                              title={role ? `${employee.employeeName} is ${role === 'R' ? 'Responsible' : role === 'A' ? 'Accountable' : role === 'C' ? 'Consulted' : 'Informed'}` : 'No assignment'}
                            >
                              {role && (
                                <span className="w-6 h-6 flex items-center justify-center bg-white rounded-full font-bold text-slate-800 shadow-sm text-xs">
                                  {role}
                                </span>
                              )}
                            </div>
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      ) : (
        <div className="bg-white rounded-lg border p-8 text-center">
          <p className="text-gray-500">No data to display. Adjust filters to see the matrix.</p>
        </div>
      )}

      {/* RACI Legend */}
      <div className="bg-slate-50 rounded-xl p-4 flex flex-wrap justify-center gap-6">
        {[
          { role: 'R', label: 'Responsible', color: 'bg-red-300' },
          { role: 'A', label: 'Accountable', color: 'bg-indigo-300' },
          { role: 'C', label: 'Consulted', color: 'bg-teal-300' },
          { role: 'I', label: 'Informed', color: 'bg-amber-300' }
        ].map((item) => (
          <div key={item.role} className="flex items-center gap-2">
            <div className={`w-8 h-8 ${item.color} rounded-lg flex items-center justify-center shadow-sm`}>
              <span className="w-5 h-5 bg-white rounded-full flex items-center justify-center font-bold text-[10px]">
                {item.role}
              </span>
            </div>
            <span className="font-medium text-slate-700 text-sm">{item.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
