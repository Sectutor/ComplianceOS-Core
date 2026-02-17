import React from "react";
import { ISOLayout } from "./ISOLayout";
import { useParams } from "wouter";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@complianceos/ui/ui/card";
import { PackageOpen } from "lucide-react";

export default function ISOPlaceholder({ title, description }: { title: string, description: string }) {
    const { id } = useParams<{ id: string }>();
    const clientId = parseInt(id || "0");

    return (
        <ISOLayout clientId={clientId}>
            <div className="p-8">
                <Card className="border-dashed border-2 bg-slate-50/50">
                    <CardContent className="flex flex-col items-center justify-center py-20 text-center space-y-4">
                        <div className="p-4 bg-white rounded-2xl shadow-sm border border-slate-100">
                            <PackageOpen className="h-12 w-12 text-slate-300" />
                        </div>
                        <div className="space-y-1">
                            <h2 className="text-2xl font-bold text-slate-900">{title}</h2>
                            <p className="text-slate-500 max-w-md">{description}</p>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </ISOLayout>
    );
}
