export interface Framework {
    id: string;
    name: string;
    description: string;
    type: 'Security' | 'Privacy' | 'Quality' | 'Business Continuity' | 'AI & Data' | 'Other';
    logo?: string;
    // We can add more specific fields later like 'domains', 'controlsCount' etc.
}
