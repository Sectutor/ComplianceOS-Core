
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@complianceos/ui/ui/card';
import { Button } from '@complianceos/ui/ui/button';
import DashboardLayout from "@/components/DashboardLayout";

interface ImplementationResourcesProps {
  clientId: number;
  planId?: number;
}

export default function ImplementationResources({ clientId, planId }: ImplementationResourcesProps) {
  const [resources, setResources] = useState([
    {
      id: 1,
      name: 'Security Engineers',
      capacity: 3,
      skills: ['Network Security', 'Cloud Security', 'Penetration Testing'],
      availableFrom: '2025-01-01',
      hourlyRate: 150
    },
    {
      id: 2,
      name: 'Compliance Officer',
      capacity: 1,
      skills: ['Policy Management', 'Risk Assessment', 'Audit Preparation'],
      availableFrom: '2025-01-15',
      hourlyRate: 120
    },
    {
      id: 3,
      name: 'IT Support',
      capacity: 2,
      skills: ['System Administration', 'Technical Documentation', 'User Training'],
      availableFrom: '2025-01-01',
      hourlyRate: 100
    }
  ]);

  const [selectedResource, setSelectedResource] = useState<number | null>(null);

  return (
    <DashboardLayout>
      <div className="space-y-6 max-w-4xl mx-auto p-6">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Resource Allocation</h1>
          <p className="text-gray-600 mb-6">
            Manage team members, skills, and availability for implementation plans.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Team Members */}
          <Card>
            <CardHeader>
              <CardTitle>Team Members</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {resources.map((resource) => (
                  <div key={resource.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex-1">
                      <div className="font-medium">{resource.name}</div>
                      <div className="text-sm text-gray-600">
                        {resource.skills.join(' • ')} • {resource.capacity} people • ${resource.availableFrom}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm text-green-600">${resource.hourlyRate}/hr/hr</div>
                    </div>
                  </div>
                ))}
              </div>

              <Button
                onClick={() => window.location.href = `/implementation/resources?clientId=${clientId}`}
                className="w-full"
              >
                Manage Resources
              </Button>
            </CardContent>
          </Card>

          {/* Resource Utilization */}
          <Card>
            <CardHeader>
              <CardTitle>Resource Utilization</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {/* Placeholder for resource utilization */}
                <div className="text-center py-8">
                  <div className="text-gray-500 mb-4">
                    <div className="text-lg">📊</div>
                    <div className="text-sm">Resource utilization dashboard coming soon</div>
                  </div>
                  <div className="text-xs text-gray-600">
                    Track resource allocation, budget vs actual costs, and capacity utilization across all implementation plans.
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
}