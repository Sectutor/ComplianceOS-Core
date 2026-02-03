import React, { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../../components/ui/tabs";
import { KanbanBoard } from "./KanbanBoard";
import { ProjectListView } from "./ProjectListView";

interface ProjectManagementProps {
    clientId: number;
}

export function ProjectManagement({ clientId }: ProjectManagementProps) {
    const [view, setView] = useState("kanban");

    return (
        <Tabs value={view} onValueChange={setView} className="w-full h-full flex flex-col">
            <div className="flex items-center justify-between mb-4">
                <TabsList>
                    <TabsTrigger value="kanban">Kanban Board</TabsTrigger>
                    <TabsTrigger value="list">List View</TabsTrigger>
                </TabsList>
            </div>

            <TabsContent value="kanban" className="flex-1 min-h-0 mt-0">
                <KanbanBoard clientId={clientId} />
            </TabsContent>

            <TabsContent value="list" className="flex-1 min-h-0 mt-0">
                <ProjectListView clientId={clientId} />
            </TabsContent>
        </Tabs>
    );
}
