export interface RegulationSubArticle {
    id: string;
    title: string;
    description: string;
}

export interface RegulationArticle {
    id: string;
    numericId: string;
    title: string;
    description: string; // The legal text or summary
    subArticles?: RegulationSubArticle[];
    mappedControls?: string[] | Record<string, string[]>; // IDs of controls (legacy array) or Map of Framework -> Control IDs
}

export interface WizardQuestion {
    id: string;
    text: string;
    type: 'boolean' | 'select' | 'scale';
    options?: string[]; // For select type
    relatedArticles?: string[]; // IDs of articles this question impacts
    failureGuidance?: string; // Recommendation if answer is negative/low
}

export interface Regulation {
    id: string;
    name: string;
    description: string;
    type: 'Privacy' | 'Security' | 'Financial' | 'Operational';
    logo?: string;
    articles: RegulationArticle[];
    questions?: WizardQuestion[]; // Readiness wizard questions
}
