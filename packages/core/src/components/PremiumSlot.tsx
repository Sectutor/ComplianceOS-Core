import React from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@complianceos/ui';
import { Button } from '@complianceos/ui';
import { Lock } from 'lucide-react';

interface PremiumSlotProps {
    featureId: string;
    title: string;
    description: string;
    children?: React.ReactNode;
    isPremiumEnabled?: boolean;
}

export const PremiumSlot: React.FC<PremiumSlotProps> = ({
    featureId,
    title,
    description,
    children,
    isPremiumEnabled = false,
}) => {
    if (isPremiumEnabled && children) {
        return <>{children}</>;
    }

    return (
        <Card className="border-dashed border-2 bg-muted/50">
            <CardHeader className="text-center">
                <div className="mx-auto bg-primary/10 p-3 rounded-full w-fit mb-4">
                    <Lock className="w-6 h-6 text-primary" />
                </div>
                <CardTitle>{title}</CardTitle>
                <CardDescription>{description}</CardDescription>
            </CardHeader>
            <CardContent className="flex justify-center pb-6">
                <Button onClick={() => window.open('/settings/billing', '_blank')}>
                    Upgrade to Premium
                </Button>
            </CardContent>
        </Card>
    );
};
