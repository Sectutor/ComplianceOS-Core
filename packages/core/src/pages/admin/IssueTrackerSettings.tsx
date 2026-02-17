import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@complianceos/ui/ui/card";

export default function IssueTrackerSettings() {
    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            <div>
                <h1 className="text-3xl font-bold tracking-tight">Issue Tracker Integration</h1>
                <p className="text-muted-foreground mt-1">
                    Configure external issue trackers (Jira, GitHub, Azure DevOps).
                </p>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Connected Providers</CardTitle>
                    <CardDescription>Manage your connections to external issue tracking systems.</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="text-sm text-muted-foreground italic">
                        No providers configured yet. This module is under development.
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
